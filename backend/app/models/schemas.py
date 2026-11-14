from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class SoilReading(BaseModel):
    timestamp: str
    device_id: str
    location: str
    soil_moisture: float = Field(..., description="Soil Moisture %")
    soil_temperature: float = Field(..., description="Soil Temperature °C")
    electrical_conductivity: int = Field(..., description="EC in µS/cm")
    ph: float = Field(..., description="pH value")
    nitrogen: int = Field(..., description="Nitrogen in mg/kg")
    phosphorus: int = Field(..., description="Phosphorus in mg/kg")
    potassium: int = Field(..., description="Potassium in mg/kg")
    salinity: int = Field(..., description="Salinity in mg/L")
    soil_health_index: int = Field(..., description="Calculated 0-100 score")
    health_status: str = Field(..., description="Optimal / Deficient / Warning")
    sensor_mode: str = Field("simulated_delhi", description="hardware_rs485 or simulated_delhi")
    alerts: List[str] = []

class SoilReadingCreate(BaseModel):
    device_id: str = "ESP32_DELHI_FIELD_NODE_01"
    location: str = "Delhi-Pusa-Agri-Basin"
    soil_moisture: float
    soil_temperature: float
    electrical_conductivity: int
    ph: float
    nitrogen: int
    phosphorus: int
    potassium: int
    salinity: int
    sensor_mode: Optional[str] = "hardware_rs485"

class NasaObservation(BaseModel):
    timestamp: str
    latitude: float
    longitude: float
    location_name: str
    temp_2m: float
    temp_max: float
    temp_min: float
    precipitation_mm: float
    root_zone_moisture: float # SMAP / MERRA proxy
    surface_moisture: float
    relative_humidity: float
    solar_radiation_mj: float
    wind_speed: float
    heat_stress_warning: bool
    frost_risk_warning: bool
    soil_moisture_anomaly: float

class RotationStrategy(BaseModel):
    id: str
    name: str
    tagline: str
    recommended: bool = False
    suitability_score: Optional[int] = 85
    crops: List[str]
    annual_water_demand_m3_ha: int
    water_savings_percent: int
    soil_nitrogen_balance_kg_ha: int
    bare_soil_days: int
    bare_soil_reduction_percent: int
    erosion_risk: str
    terminal_heat_resilience: str
    soil_organic_carbon_rate: str
    net_profit_index: int
    agronomic_rationale: str
    nasa_evidence: str
    information_gaps: Optional[str] = None
    local_risks_for_review: List[str]

class ForecastDay(BaseModel):
    date: str
    predicted_soil_moisture: float
    moisture_status: str
    heat_risk_level: str
    rain_probability_pct: int
    advisory: str

class ChatRequest(BaseModel):
    message: str
    api_key: Optional[str] = None
    conversation_history: Optional[List[Dict[str, str]]] = []

class ChatResponse(BaseModel):
    reply: str
    source_model: str
    recommendations: List[str]
    soil_enrichment_tips: List[str]
    suggested_rotations: List[str]
