import time
import math
import random
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any
from ..models.schemas import SoilReading, SoilReadingCreate

class SoilIoTService:
    def __init__(self):
        self.device_id = "ESP32_DELHI_FIELD_NODE_01"
        self.location = "Delhi-Pusa-Agri-Basin"
        self.sensor_mode = "simulated_delhi"
        self.history: List[SoilReading] = []
        self.max_history = 200
        self.latest_reading: SoilReading = self._generate_simulated_reading()
        
        # Populate initial 24 historical points for immediate graphing
        now = datetime.now(timezone.utc)
        for i in range(24, 0, -1):
            past_time = now - timedelta(hours=i)
            reading = self._generate_simulated_reading(timestamp=past_time)
            self.history.append(reading)

    def _calculate_soil_health(self, moisture: float, temp: float, ec: int, ph: float, n: int, p: int, k: int) -> tuple[int, str, List[str]]:
        alerts = []
        score = 100

        # pH assessment (Optimal: 6.5 - 7.5; Delhi baseline: 7.4 - 8.2)
        if ph > 8.0:
            score -= 15
            alerts.append("Alkaline Soil (pH > 8.0): Reduced micronutrient availability (Fe, Zn). Consider green manuring.")
        elif ph < 6.0:
            score -= 15
            alerts.append("Acidic Soil (pH < 6.0): Requires agricultural lime amendment.")

        # Nitrogen (Deficient < 30 mg/kg, Optimal 40 - 75 mg/kg)
        if n < 30:
            score -= 20
            alerts.append("Nitrogen Deficient: Sowing legume cover crop (Moong/Dhaincha) recommended for biological nitrogen fixation.")
        elif n < 45:
            score -= 5

        # Phosphorus (Deficient < 15 mg/kg)
        if p < 15:
            score -= 10
            alerts.append("Low Available Phosphorus: Apply Phosphate Solubilizing Bacteria (PSB) or compost.")

        # Potassium (Low < 120 mg/kg)
        if k < 120:
            score -= 10
            alerts.append("Low Potassium: May lower crop drought and disease tolerance.")

        # Moisture (Dry < 15%, Optimal 20 - 32%, Waterlogged > 40%)
        if moisture < 16.0:
            score -= 20
            alerts.append("Moisture Stress: Soil water deficit detected. Mulch or light irrigation recommended.")
        elif moisture > 38.0:
            score -= 15
            alerts.append("Waterlogging Warning: High saturation risk. Ensure adequate field drainage.")

        # Electrical Conductivity (Saline > 1200 µS/cm)
        if ec > 1200:
            score -= 20
            alerts.append("Salinity Elevation (EC > 1200 µS/cm): Avoid brackish tubewell irrigation.")

        score = max(20, min(100, score))
        if score >= 80:
            status = "Optimal"
        elif score >= 60:
            status = "Fair / Moderate Attention"
        else:
            status = "Stressed / Action Required"

        return score, status, alerts

    def _generate_simulated_reading(self, timestamp: datetime = None) -> SoilReading:
        if timestamp is None:
            timestamp = datetime.now(timezone.utc)
        
        # Diurnal fluctuation based on hour of day
        hour = timestamp.hour + (timestamp.minute / 60.0)
        temp_cycle = math.sin((hour - 9) * math.pi / 12) # Peak around 15:00
        moisture_cycle = -0.5 * temp_cycle # Lower moisture at peak heat

        # Delhi alluvial calibrated baselines
        soil_temp = round(24.5 + (temp_cycle * 4.5) + random.uniform(-0.4, 0.4), 1)
        soil_moisture = round(22.0 + (moisture_cycle * 2.2) + random.uniform(-0.5, 0.5), 1)
        ph = round(7.8 + random.uniform(-0.15, 0.15), 2)
        ec = int(490 + (temp_cycle * 30) + random.randint(-15, 15))
        nitrogen = int(28 + random.randint(-2, 3))
        phosphorus = int(18 + random.randint(-1, 2))
        potassium = int(210 + random.randint(-8, 8))
        salinity = int(ec * 0.64 + random.randint(-10, 10))

        score, status, alerts = self._calculate_soil_health(
            soil_moisture, soil_temp, ec, ph, nitrogen, phosphorus, potassium
        )

        return SoilReading(
            timestamp=timestamp.isoformat(),
            device_id=self.device_id,
            location=self.location,
            soil_moisture=soil_moisture,
            soil_temperature=soil_temp,
            electrical_conductivity=ec,
            ph=ph,
            nitrogen=nitrogen,
            phosphorus=phosphorus,
            potassium=potassium,
            salinity=salinity,
            soil_health_index=score,
            health_status=status,
            sensor_mode=self.sensor_mode,
            alerts=alerts
        )

    def get_latest(self) -> SoilReading:
        if self.sensor_mode == "simulated_delhi":
            self.latest_reading = self._generate_simulated_reading()
            self.history.append(self.latest_reading)
            if len(self.history) > self.max_history:
                self.history.pop(0)
        return self.latest_reading

    def get_history(self, limit: int = 50) -> List[SoilReading]:
        return self.history[-limit:]

    def ingest_hardware_reading(self, data: SoilReadingCreate) -> SoilReading:
        now = datetime.now(timezone.utc)
        self.sensor_mode = data.sensor_mode or "hardware_rs485"
        self.device_id = data.device_id
        self.location = data.location

        score, status, alerts = self._calculate_soil_health(
            data.soil_moisture, data.soil_temperature, data.electrical_conductivity,
            data.ph, data.nitrogen, data.phosphorus, data.potassium
        )

        reading = SoilReading(
            timestamp=now.isoformat(),
            device_id=data.device_id,
            location=data.location,
            soil_moisture=data.soil_moisture,
            soil_temperature=data.soil_temperature,
            electrical_conductivity=data.electrical_conductivity,
            ph=data.ph,
            nitrogen=data.nitrogen,
            phosphorus=data.phosphorus,
            potassium=data.potassium,
            salinity=data.salinity,
            soil_health_index=score,
            health_status=status,
            sensor_mode=self.sensor_mode,
            alerts=alerts
        )

        self.latest_reading = reading
        self.history.append(reading)
        if len(self.history) > self.max_history:
            self.history.pop(0)

        return reading

soil_iot_service = SoilIoTService()
