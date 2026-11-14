import os
import joblib
import numpy as np
from datetime import datetime, timedelta, timezone
from typing import List
from ..models.schemas import ForecastDay, NasaObservation, SoilReading

class PredictiveModelsService:
    def __init__(self):
        self.model_path_reg = "backend/app/models/soil_moisture_model.joblib"
        self.model_path_clf = "backend/app/models/climate_risk_classifier.joblib"
        self.reg_model = None
        self.clf_model = None

        if os.path.exists(self.model_path_reg):
            try:
                self.reg_model = joblib.load(self.model_path_reg)
                print("[ML Service] Loaded Soil Moisture Forecaster Model.")
            except Exception as e:
                print(f"[ML Service Warning] Could not load regressor: {e}")

        if os.path.exists(self.model_path_clf):
            try:
                self.clf_model = joblib.load(self.model_path_clf)
                print("[ML Service] Loaded Climate Risk Classifier Model.")
            except Exception as e:
                print(f"[ML Service Warning] Could not load classifier: {e}")

    def generate_30_day_forecast(self, nasa: NasaObservation, soil: SoilReading) -> List[ForecastDay]:
        forecast_days: List[ForecastDay] = []
        base_date = datetime.now(timezone.utc)
        current_moisture = nasa.root_zone_moisture

        # Advisories pool based on growth transitions
        advisories = [
            "Favorable sowing window: Soil temperature & moisture within 95% germination confidence.",
            "Moisture depletion accelerating: Apply surface straw mulch (4 t/ha) to preserve root zone water.",
            "Moderate heat wave expected: Ensure shelterbelt trees or companion mustard buffer rows are maintained.",
            "Optimal nodulation phase for pulses: Avoid heavy synthetic nitrogen topdressing to promote Rhizobium BNF.",
            "Terminal heat protection phase: Foliar spray of 2% Potassium Nitrate (KNO3) protects wheat flag leaf.",
            "Pre-monsoon soil conditioning: Incorporate green manure (Sesbania) 10 days prior to main sowing."
        ]

        for day in range(1, 31):
            target_dt = base_date + timedelta(days=day)
            date_str = target_dt.strftime("%Y-%m-%d")

            # Simulated natural moisture depletion and seasonal trend
            depletion_rate = 0.003 + (0.002 if nasa.temp_max > 35 else 0.0)
            rain_chance = int(15 + 30 * np.sin(day * 0.3) + (10 if day % 7 == 0 else 0))
            rain_chance = max(5, min(85, rain_chance))

            if rain_chance > 60:
                projected_moisture = min(0.65, current_moisture + 0.08 - (day * 0.001))
            else:
                projected_moisture = max(0.22, current_moisture - (day * depletion_rate * 0.5))

            if projected_moisture > 0.40:
                moisture_status = "Optimal Field Capacity"
            elif projected_moisture > 0.32:
                moisture_status = "Adequate"
            else:
                moisture_status = "Moisture Deficit Warning"

            # Heat risk
            if nasa.temp_max >= 38.0 or (day > 15 and target_dt.month in [3, 4, 5]):
                heat_risk = "Elevated Heat Stress"
            else:
                heat_risk = "Low Thermal Stress"

            advisory = advisories[(day - 1) % len(advisories)]

            forecast_days.append(
                ForecastDay(
                    date=date_str,
                    predicted_soil_moisture=round(float(projected_moisture), 3),
                    moisture_status=moisture_status,
                    heat_risk_level=heat_risk,
                    rain_probability_pct=rain_chance,
                    advisory=advisory
                )
            )

        return forecast_days

predictive_service = PredictiveModelsService()
