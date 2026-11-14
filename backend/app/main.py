import os
import asyncio
import json
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException, Header, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from typing import Optional, List, Dict, Any

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
from .services.online_learning_service import online_learning_service
from .services.crop_profile_service import crop_profile_service
from .services.hazard_alert_service import hazard_alert_service
from .services.multi_window_forecaster import multi_window_forecaster
from .services.environmental_service import environmental_service
from pydantic import BaseModel

class CropSetRequest(BaseModel):
    crop: str
    sow_date: Optional[str] = None
    lat: Optional[float] = None
    lon: Optional[float] = None

class StageUpdateRequest(BaseModel):
    stage: str

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

@app.get("/api/ml/online-status")
def get_online_learning_status():
    """Returns diagnostics and weights from the online adaptive learning engine (SGDRegressor partial_fit)."""
    return online_learning_service.get_status()

# ── Crop Profiling & Threshold Alerts ──────────────────────────────────────
@app.post("/api/crop/set")
def set_farmer_crop(req: CropSetRequest):
    """Set the farmer's current crop by querying NVIDIA NIM LLM to establish variable ranges, alert thresholds, and lifecycle dates."""
    lat = req.lat if req.lat is not None else settings.DEFAULT_LAT
    lon = req.lon if req.lon is not None else settings.DEFAULT_LON
    return crop_profile_service.set_crop(req.crop, req.sow_date, lat=lat, lon=lon)

@app.post("/api/crop/stage")
def update_crop_growth_stage(req: StageUpdateRequest):
    """Manually update or confirm the crop's current growth stage."""
    return crop_profile_service.set_growth_stage(req.stage)

@app.get("/api/crop/history")
def get_crop_rotation_history():
    """Retrieve full crop rotation history including previous crops and residual soil legacies."""
    return {
        "current_crop": crop_profile_service.get_full_profile().get("name", "Wheat"),
        "active_stage": crop_profile_service.get_active_stage(),
        "rotation_history": crop_profile_service.get_history()
    }

@app.get("/api/crop/profile")
def get_farmer_crop_profile():
    """Retrieve active crop parameters, threshold ranges, and lifecycle calendar."""
    prof = crop_profile_service.get_full_profile()
    if prof.get("status") == "no_crop_set":
        # Default to wheat as initial baseline
        return crop_profile_service.set_crop("Wheat")
    return prof

@app.get("/api/crop/alerts")
def get_crop_threshold_alerts(
    lat: float = Query(settings.DEFAULT_LAT),
    lon: float = Query(settings.DEFAULT_LON)
):
    """Evaluate current NASA satellite and ground IoT telemetry against crop tolerance thresholds."""
    soil = soil_iot_service.get_latest()
    nasa = nasa_service.fetch_observations(lat, lon)
    return {
        "crop": crop_profile_service.get_full_profile().get("name", "Wheat"),
        "alerts": crop_profile_service.evaluate_alerts(
            soil_moisture=soil.soil_moisture,
            temp=nasa.temp_2m,
            tmax=nasa.temp_max,
            rain_24h=nasa.precipitation_mm,
            ph=soil.ph
        )
    }

# ── Multi-Hazard Real-Time Monitoring ─────────────────────────────────────
@app.get("/api/hazards/active")
def get_active_hazards(
    lat: float = Query(settings.DEFAULT_LAT),
    lon: float = Query(settings.DEFAULT_LON)
):
    """Returns live weather alerts, tropical cyclone tracking, and NASA FIRMS fire hotspots with geo-markers."""
    return hazard_alert_service.get_active_hazards(lat, lon)

# ── Multi-Window Time-Series Forecasting ──────────────────────────────────
@app.get("/api/forecast/window")
def get_multi_window_forecast(
    window: str = Query("1_month", description="Options: 7_days, 1_month, 2_months, 5_months, 1_year"),
    crop: Optional[str] = Query(None, description="Crop name to align lifecycle with"),
    lat: float = Query(settings.DEFAULT_LAT),
    lon: float = Query(settings.DEFAULT_LON)
):
    """
    Multi-window time-series forecast trained on 20-year NASA POWER daily observations.
    Projects temperature, precipitation, soil moisture, and water deficit for 1, 2, 5 months or 1 year.
    """
    nasa = nasa_service.fetch_observations(lat, lon)
    crop_name = crop or crop_profile_service.get_full_profile().get("name", "Wheat")
    return multi_window_forecaster.forecast(
        window=window,
        current_nasa=nasa.model_dump(),
        crop_name=crop_name
    )

# ── Environmental, Groundwater & Sea Level ─────────────────────────────────
@app.get("/api/environmental/groundwater-sealevel")
def get_groundwater_and_sealevel(
    lat: float = Query(settings.DEFAULT_LAT),
    lon: float = Query(settings.DEFAULT_LON),
    elevation_m: float = Query(212.0)
):
    """Provides NASA GRACE-FO regional aquifer trends and coastal sea level / salinization vulnerability."""
    return environmental_service.get_groundwater_and_sealevel_data(lat, lon, elevation_m)

# ── Organic Fertilizer & Soil Nutrition Advisory ──────────────────────────
@app.get("/api/advisory/organic-fertilizer")
def get_organic_fertilizer_advisory(
    crop: Optional[str] = Query(None),
    lat: float = Query(settings.DEFAULT_LAT),
    lon: float = Query(settings.DEFAULT_LON)
):
    """Tailored organic nutrition plan (green manure, biofertilizer pack, Jeevamrut) factoring upcoming weather."""
    soil = soil_iot_service.get_latest()
    nasa = nasa_service.fetch_observations(lat, lon)
    crop_name = crop or crop_profile_service.get_full_profile().get("name", "Wheat")
    return environmental_service.generate_organic_fertilizer_plan(
        crop_name=crop_name,
        soil_ph=soil.ph,
        soil_moisture=soil.soil_moisture,
        nitrogen_mg_kg=soil.nitrogen,
        phosphorus_mg_kg=soil.phosphorus,
        potassium_mg_kg=soil.potassium,
        upcoming_rain_mm=nasa.precipitation_mm
    )

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

@app.get("/api/search")
def search_agricultural_web(q: str = Query(..., description="Query for agricultural research, market prices, or ICAR data")):
    """
    Live agricultural web search grounding using simulated browser headers (zero API keys).
    Retrieves latest research publications, crop pest advisories, and price trends.
    """
    from .services.nemotron_ai_service import search_live_web
    hits = search_live_web(q, max_results=6)
    return {
        "query": q,
        "results_count": len(hits),
        "results": hits,
        "source": "Live Web / Agricultural Research Grounding"
    }

@app.get("/api/isro/profile")
def get_isro_profile(lat: float = Query(28.7195), lon: float = Query(77.1025)):
    """
    ISRO & NRSC Bhuvan Earth Observation & Agro-Thematic Profile.
    Returns NRSC LULC classification, Agro-Climatic Sub-Region, EOS-04 SAR soil moisture,
    and INSAT-3DR solar insolation for the farm location.
    """
    from .services.isro_service import get_isro_agro_profile
    return get_isro_agro_profile(lat, lon)

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
        response = FileResponse(os.path.join(frontend_dist, "index.html"))
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith("api/") or full_path.startswith("ws"):
            raise HTTPException(status_code=404, detail="API route not found")
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        response = FileResponse(os.path.join(frontend_dist, "index.html"))
        response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate, max-age=0"
        response.headers["Pragma"] = "no-cache"
        response.headers["Expires"] = "0"
        return response

