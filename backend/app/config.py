import os
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseModel):
    APP_NAME: str = "FIELD SHIFT: NASA Agricultural Decision Intelligence System"
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # NASA Coordinates - Default: Delhi Indo-Gangetic Basin
    DEFAULT_LAT: float = float(os.getenv("DEFAULT_LAT", "28.6139"))
    DEFAULT_LON: float = float(os.getenv("DEFAULT_LON", "77.2090"))
    LOCATION_NAME: str = os.getenv("LOCATION_NAME", "Delhi NCR (Indo-Gangetic Basin)")
    
    # NVIDIA NIM / Nemotron API configuration
    NVIDIA_API_KEY: str = os.getenv("NVIDIA_API_KEY", "")
    NVIDIA_BASE_URL: str = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
    NVIDIA_MODEL: str = os.getenv("NVIDIA_MODEL", "meta/llama-3.2-90b-vision-instruct")
    
    # Sensor simulation interval in seconds
    SENSOR_SIMULATION_INTERVAL: int = int(os.getenv("SENSOR_SIMULATION_INTERVAL", "5"))

settings = Settings()
