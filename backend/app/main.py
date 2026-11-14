import os
import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import Optional, List

from .config import settings
from .models.schemas import (
    SoilReading, SoilReadingCreate, NasaObservation,
    RotationStrategy, ForecastDay, ChatRequest, ChatResponse
)
from .services.soil_iot_service import soil_iot_service
from .services.nasa_service import nasa_service
from .services.rotation_engine import rotation_engine
from .services.predictive_models import predictive_service
from .services.nemotron_ai_service import nemotron_ai_service

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend API combining NASA Earth Observations with Ground-Truth 8-in-1 IoT Soil Telemetry for Climate-Resilient Crop Rotations.",
    version="1.0.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api")
@app.get("/api/info")
def root():
    return {
        "system": settings.APP_NAME,
        "challenge": "NASA Space Apps 2026: Field Shift - Adapting Farms with NASA Data",
        "status": "operational",
        "documentation": "/docs",
        "default_location": {
            "name": settings.LOCATION_NAME,
            "lat": settings.DEFAULT_LAT,
            "lon": settings.DEFAULT_LON
        }
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "field-shift-backend"}

@app.get("/api/location/ip")
def get_ip_location():
    """Fallback IP geolocation endpoint to detect computer coordinates if browser GPS is blocked."""
    import requests
    try:
        r = requests.get("http://ip-api.com/json", timeout=5)
        if r.status_code == 200:
            return r.json()
    except Exception as e:
        print(f"[IP Geolocation Warning] {e}")
    return {"status": "fallback", "lat": settings.DEFAULT_LAT, "lon": settings.DEFAULT_LON, "city": "Delhi"}

@app.get("/api/nasa/current", response_model=NasaObservation)
def get_nasa_observations(
    lat: float = Query(settings.DEFAULT_LAT, description="Latitude"),
    lon: float = Query(settings.DEFAULT_LON, description="Longitude")
):
    return nasa_service.fetch_observations(lat, lon)

@app.get("/api/nasa/gibs")
def get_nasa_gibs_layers():
    return nasa_service.get_gibs_layers()

@app.get("/api/sensor/current", response_model=SoilReading)
def get_current_soil_telemetry():
    return soil_iot_service.get_latest()

@app.get("/api/sensor/history", response_model=List[SoilReading])
def get_soil_history(limit: int = Query(50, ge=1, le=200)):
    return soil_iot_service.get_history(limit)

@app.post("/api/sensor/data", response_model=SoilReading)
def ingest_esp32_sensor_data(reading: SoilReadingCreate):
    """Endpoint called by the physical ESP32 edge node to ingest real 8-in-1 RS485 Modbus readings."""
    return soil_iot_service.ingest_hardware_reading(reading)

@app.get("/api/rotations/compare", response_model=List[RotationStrategy])
def compare_crop_rotations(
    lat: float = Query(settings.DEFAULT_LAT),
    lon: float = Query(settings.DEFAULT_LON),
    farmer_priority: str = Query("water_conservation", description="Farmer primary goal"),
    water_constraint: str = Query("moderate_tubewell", description="Water access constraint"),
    machinery_access: str = Query("zero_till_happy_seeder", description="Machinery available")
):
    soil = soil_iot_service.get_latest()
    nasa = nasa_service.fetch_observations(lat, lon)
    return rotation_engine.evaluate_strategies(
        soil=soil,
        nasa=nasa,
        farmer_priority=farmer_priority,
        water_constraint=water_constraint,
        machinery_access=machinery_access
    )

@app.get("/api/scientific/water-balance")
def get_scientific_water_balance(
    lat: float = Query(settings.DEFAULT_LAT),
    lon: float = Query(settings.DEFAULT_LON)
):
    from .services.agrometeorology_engine import scientific_agronomy_engine
    nasa = nasa_service.fetch_observations(lat, lon)
    et0 = scientific_agronomy_engine.compute_fao56_et0(
        t_mean=nasa.temp_2m,
        t_max=nasa.temp_max,
        t_min=nasa.temp_min,
        rh_mean=nasa.relative_humidity,
        solar_rad_mj=nasa.solar_radiation_mj,
        wind_speed_2m=nasa.wind_speed
    )
    balance = scientific_agronomy_engine.compute_daily_water_balance(
        precipitation_mm=nasa.precipitation_mm,
        et0_mm=et0,
        kc=1.0
    )
    return {
        "location": {"lat": lat, "lon": lon},
        "timestamp": nasa.timestamp,
        "fao56_penman_monteith": {
            "et0_mm_day": et0,
            "formula": "ET0 = [0.408*Delta*(Rn - G) + gamma*(900/(T+273))*u2*(es - ea)] / [Delta + gamma*(1 + 0.34*u2)]",
            "solar_radiation_mj": nasa.solar_radiation_mj,
            "wind_speed_m_s": nasa.wind_speed,
            "ambient_temp_c": nasa.temp_2m
        },
        "soil_water_balance": balance,
        "nasa_grace_groundwater_trend": {
            "trend_cm_year_equivalent_water_height": -3.2,
            "status": "Severe Chronic Depletion across Indo-Gangetic Aquifer",
            "sensor": "NASA GRACE / GRACE Follow-On (GRACE-FO)"
        },
        "spatial_harmonization_grid": {
            "target_resolution": "1 km Unified Agro-Ecological Grid Cell",
            "sensors": [
                {"name": "NASA SMAP", "native_resolution": "9 km - 36 km", "harmonization": "Bilinear Spatial Downsampling with Topographic Wetness Index"},
                {"name": "NASA GPM IMERG", "native_resolution": "10 km (0.1 deg)", "harmonization": "Areal Weighted Aggregation to 1 km"},
                {"name": "NASA MODIS / Landsat", "native_resolution": "250 m / 30 m", "harmonization": "Block Averaging to 1 km Analysis Cell"},
                {"name": "NASA ECOSTRESS", "native_resolution": "70 m", "harmonization": "Thermal Median Filtering"},
                {"name": "Edge 8-in-1 IoT Node", "native_resolution": "Point Root-Zone In-Situ", "harmonization": "Kalman Ground-Truth Calibration"}
            ]
        }
    }

@app.get("/api/predictions/forecast", response_model=List[ForecastDay])
def get_30_day_forecast(
    lat: float = Query(settings.DEFAULT_LAT),
    lon: float = Query(settings.DEFAULT_LON)
):
    soil = soil_iot_service.get_latest()
    nasa = nasa_service.fetch_observations(lat, lon)
    return predictive_service.generate_30_day_forecast(nasa, soil)

@app.post("/api/chat", response_model=ChatResponse)
def chat_with_nemotron_agronomist(
    request: ChatRequest,
    x_nvidia_api_key: Optional[str] = Header(None, alias="X-NVIDIA-API-KEY")
):
    """
    NVIDIA Nemotron / Agronomy AI Advisor.
    Supports user queries regarding crop suitability, 8-in-1 soil status, NASA forecasts,
    natural soil enrichment (green manure, biochar, compost), and intercropping strategies.
    """
    soil = soil_iot_service.get_latest()
    nasa = nasa_service.fetch_observations(settings.DEFAULT_LAT, settings.DEFAULT_LON)
    api_key = request.api_key or x_nvidia_api_key or settings.NVIDIA_API_KEY
    return nemotron_ai_service.generate_advice(request.message, soil, nasa, user_key=api_key)

@app.websocket("/ws/telemetry")
async def websocket_telemetry_stream(websocket: WebSocket):
    """Streams live 8-in-1 soil telemetry and NASA updates to connected web dashboard clients."""
    await websocket.accept()
    try:
        while True:
            soil = soil_iot_service.get_latest()
            payload = {
                "type": "telemetry_tick",
                "soil": soil.model_dump(),
                "sensor_mode": soil_iot_service.sensor_mode
            }
            await websocket.send_text(json.dumps(payload))
            await asyncio.sleep(settings.SENSOR_SIMULATION_INTERVAL)
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[WebSocket Error] {e}")

# Mount static frontend build if it exists
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist"))
if os.path.exists(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")

    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(frontend_dist, "index.html"))

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("ws"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

