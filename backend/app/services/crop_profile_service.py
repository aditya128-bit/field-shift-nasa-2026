"""
Crop Profile Service — LLM-generated per-crop parameter ranges,
alert thresholds, lifecycle stages, and fertilizer suggestions.
Queries NVIDIA NIM LLM to dynamically generate scientifically grounded ranges for any crop.
"""
import os
import re
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
try:
    from openai import OpenAI
except ImportError:
    OpenAI = None
from ..config import settings

# ─── Static crop knowledge base as scientific baseline / fallback ─────────────
CROP_DATABASE: Dict[str, Dict[str, Any]] = {
    "wheat": {
        "name": "Wheat (Triticum aestivum)",
        "emoji": "🌾",
        "season": "Rabi (Oct–Mar)",
        "duration_days": 150,
        "stages": [
            {"name": "Sowing",        "days": 7,   "month_offset": 0},
            {"name": "Germination",   "days": 14,  "month_offset": 0},
            {"name": "Tillering",     "days": 30,  "month_offset": 1},
            {"name": "Jointing",      "days": 25,  "month_offset": 2},
            {"name": "Heading",       "days": 20,  "month_offset": 3},
            {"name": "Grain Filling", "days": 30,  "month_offset": 4},
            {"name": "Harvest",       "days": 10,  "month_offset": 5},
        ],
        "thresholds": {
            "soil_moisture_min": 18,
            "soil_moisture_max": 32,
            "soil_moisture_critical_low": 12,
            "temp_min_c": 5,
            "temp_max_c": 32,
            "heat_stress_c": 35,
            "frost_risk_c": 2,
            "rainfall_min_season_mm": 300,
            "rainfall_max_24h_mm": 60,
            "ph_min": 6.0,
            "ph_max": 7.5,
            "ndvi_healthy_min": 0.45,
        },
        "water_need_mm_season": 450,
        "nitrogen_kg_ha": 120,
        "organic_fertilizers": [
            "FYM (Farmyard Manure) 10–15 tonnes/ha before sowing",
            "Vermicompost 2.5 t/ha at sowing",
            "Azospirillum biofertilizer seed treatment",
            "Green manure: plough in Dhaincha/Sunhemp before sowing",
        ],
        "hazard_warnings": {
            "rust_risk": "High if humidity >70% and temp 15–22°C",
            "aphid_risk": "Watch Dec–Feb; spray neem oil",
            "waterlogging": "Wheat cannot tolerate waterlogging >48h",
        },
        "market_notes": "MSP-supported. High local demand. Stable price.",
        "llm_reasoning": "Standard Indo-Gangetic wheat profile calibrated for early-winter sowing and March terminal heat avoidance."
    },
    "rice": {
        "name": "Rice (Oryza sativa)",
        "emoji": "🌾",
        "season": "Kharif (Jun–Nov)",
        "duration_days": 150,
        "stages": [
            {"name": "Nursery",       "days": 25,  "month_offset": 0},
            {"name": "Transplanting", "days": 7,   "month_offset": 1},
            {"name": "Tillering",     "days": 30,  "month_offset": 1},
            {"name": "Panicle Init.", "days": 20,  "month_offset": 2},
            {"name": "Flowering",     "days": 15,  "month_offset": 3},
            {"name": "Grain Filling", "days": 30,  "month_offset": 4},
            {"name": "Harvest",       "days": 10,  "month_offset": 5},
        ],
        "thresholds": {
            "soil_moisture_min": 60,
            "soil_moisture_max": 100,
            "soil_moisture_critical_low": 40,
            "temp_min_c": 20,
            "temp_max_c": 35,
            "heat_stress_c": 38,
            "frost_risk_c": 10,
            "rainfall_min_season_mm": 1000,
            "rainfall_max_24h_mm": 100,
            "ph_min": 5.5,
            "ph_max": 7.0,
            "ndvi_healthy_min": 0.55,
        },
        "water_need_mm_season": 1200,
        "nitrogen_kg_ha": 100,
        "organic_fertilizers": [
            "Green manure (Sesbania): incorporate 25–30 DAS",
            "Blue-Green Algae (BGA) @ 10 kg/ha",
            "Azolla biofertilizer between rows",
            "Compost 5 t/ha before puddling",
        ],
        "hazard_warnings": {
            "blast_risk": "High if temp 24–28°C with humidity >90%",
            "bph_risk": "Brown Plant Hopper during Aug–Sep",
            "drought_risk": "Panicle stage most critical — maintain 5cm standing water",
        },
        "market_notes": "MSP-supported. Very high water consumption. Consider diversification.",
        "llm_reasoning": "High water footprint crop requiring anaerobic soil moisture and standing water during panicle initiation."
    },
    "mustard": {
        "name": "Mustard (Brassica juncea)",
        "emoji": "🌼",
        "season": "Rabi (Oct–Feb)",
        "duration_days": 110,
        "stages": [
            {"name": "Sowing",          "days": 5,  "month_offset": 0},
            {"name": "Germination",     "days": 10, "month_offset": 0},
            {"name": "Vegetative",      "days": 30, "month_offset": 1},
            {"name": "Flowering",       "days": 25, "month_offset": 2},
            {"name": "Pod Formation",   "days": 25, "month_offset": 3},
            {"name": "Maturity",        "days": 15, "month_offset": 3},
        ],
        "thresholds": {
            "soil_moisture_min": 15,
            "soil_moisture_max": 28,
            "soil_moisture_critical_low": 10,
            "temp_min_c": 8,
            "temp_max_c": 28,
            "heat_stress_c": 32,
            "frost_risk_c": 0,
            "rainfall_min_season_mm": 200,
            "rainfall_max_24h_mm": 40,
            "ph_min": 6.0,
            "ph_max": 7.5,
            "ndvi_healthy_min": 0.40,
        },
        "water_need_mm_season": 300,
        "nitrogen_kg_ha": 80,
        "organic_fertilizers": [
            "FYM 10 t/ha incorporated before sowing",
            "Sulphur (S) critical — use gypsum or sulphur dust",
            "Rhizobium inoculant for intercropped legumes",
            "Neem cake 2 t/ha for pest suppression",
        ],
        "hazard_warnings": {
            "aphid_risk": "Critical Jan–Feb; spray if >25 aphids/plant",
            "alternaria_risk": "Leaf blight in foggy conditions",
            "frost": "Young seedlings vulnerable to frost below 0°C",
        },
        "market_notes": "Good oil content. Edible oil demand rising. Niche premium market.",
        "llm_reasoning": "Short duration, low water consumption crop that escapes terminal March heat blast."
    }
}

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data"))
HISTORY_FILE = os.path.join(DATA_DIR, "crop_history.json")

DEFAULT_THRESHOLDS = {
    "soil_moisture_min": 16,
    "soil_moisture_max": 32,
    "soil_moisture_critical_low": 10,
    "temp_min_c": 10,
    "temp_max_c": 34,
    "heat_stress_c": 36,
    "frost_risk_c": 2,
    "rainfall_min_season_mm": 350,
    "rainfall_max_24h_mm": 50,
    "ph_min": 6.0,
    "ph_max": 7.8,
    "ndvi_healthy_min": 0.40,
}

class CropProfileService:
    def __init__(self):
        self._current_crop: str = "Wheat"
        self._crop_profile: Optional[Dict] = None
        self._sow_date: datetime = datetime.now() - timedelta(days=28)
        self._manual_stage: Optional[str] = "Tillering"
        self._rotation_history: list = [
            {
                "crop": "Rice (Basmati Paddy)",
                "season": "Kharif 2026",
                "sow_date": (datetime.now() - timedelta(days=145)).strftime("%Y-%m-%d"),
                "harvest_date": (datetime.now() - timedelta(days=32)).strftime("%Y-%m-%d"),
                "duration_days": 113,
                "soil_legacy": "Puddled anaerobic soil created subsoil compaction; depleted Nitrogen to 29 mg/kg; high water extraction"
            },
            {
                "crop": "Summer Moong (Green Gram)",
                "season": "Zaid 2026",
                "sow_date": (datetime.now() - timedelta(days=220)).strftime("%Y-%m-%d"),
                "harvest_date": (datetime.now() - timedelta(days=150)).strftime("%Y-%m-%d"),
                "duration_days": 70,
                "soil_legacy": "Leguminous pulse fixed biological Nitrogen (~30 kg N/ha); low water consumption"
            }
        ]
        self._load_state()

    def _load_state(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        if os.path.exists(HISTORY_FILE):
            try:
                with open(HISTORY_FILE, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self._current_crop = data.get("current_crop", self._current_crop)
                    if data.get("sow_date"):
                        try:
                            self._sow_date = datetime.fromisoformat(data["sow_date"])
                        except Exception:
                            pass
                    self._manual_stage = data.get("manual_stage", self._manual_stage)
                    self._crop_profile = data.get("crop_profile", self._crop_profile)
                    self._rotation_history = data.get("rotation_history", self._rotation_history)
                    print(f"[CropProfileService] Loaded persistent crop '{self._current_crop}' and {len(self._rotation_history)} previous crop history records.")
                    return
            except Exception as e:
                print(f"[CropProfileService Warning] Failed loading history file: {e}")

        # Initialize default profile if none loaded
        self.set_crop(self._current_crop, sow_date=self._sow_date.strftime("%Y-%m-%d"), persist=True)

    def _save_state(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        try:
            with open(HISTORY_FILE, "w", encoding="utf-8") as f:
                json.dump({
                    "current_crop": self._current_crop,
                    "sow_date": self._sow_date.strftime("%Y-%m-%d") if self._sow_date else None,
                    "manual_stage": self._manual_stage,
                    "crop_profile": self._crop_profile,
                    "rotation_history": self._rotation_history
                }, f, indent=2)
        except Exception as e:
            print(f"[CropProfileService Error] Failed saving state: {e}")

    def _query_llm_for_crop(self, crop_name: str, lat: float = 28.6139, lon: float = 77.2090, user_key: Optional[str] = None) -> Optional[Dict]:
        """
        Query NVIDIA NIM LLM to generate custom scientific thresholds and agrometeorological ranges for any crop.
        """
        api_key = user_key or os.getenv("NVIDIA_API_KEY") or settings.NVIDIA_API_KEY
        if not api_key or OpenAI is None:
            return None

        model_name = os.getenv("NVIDIA_MODEL") or settings.NVIDIA_MODEL or "google/gemma-4-31b-it"

        prompt = f"""You are the senior planetary agrometeorologist at NASA Space Apps 2026.
A farmer at coordinates ({lat:.4f}° N, {lon:.4f}° E) is cultivating: "{crop_name}".

Generate scientifically grounded agrometeorological parameter ranges and growth stages for this crop.
Respond with PURE JSON ONLY (no markdown fences, no text before or after):
{{
  "name": "{crop_name.title()}",
  "emoji": "appropriate single emoji",
  "season": "e.g. Rabi / Kharif / Zaid / Annual",
  "duration_days": 120,
  "thresholds": {{
    "soil_moisture_min": 18,
    "soil_moisture_max": 30,
    "soil_moisture_critical_low": 12,
    "temp_min_c": 8.0,
    "temp_max_c": 32.0,
    "heat_stress_c": 35.0,
    "frost_risk_c": 2.0,
    "rainfall_min_season_mm": 350,
    "rainfall_max_24h_mm": 50,
    "ph_min": 6.2,
    "ph_max": 7.6,
    "ndvi_healthy_min": 0.45
  }},
  "water_need_mm_season": 400,
  "nitrogen_kg_ha": 90,
  "stages": [
    {{"name": "Sowing & Germination", "days": 12, "month_offset": 0}},
    {{"name": "Vegetative Branching", "days": 35, "month_offset": 0}},
    {{"name": "Flowering & Fruit/Pod Set", "days": 30, "month_offset": 1}},
    {{"name": "Grain/Fruit Filling", "days": 30, "month_offset": 2}},
    {{"name": "Maturity & Harvest", "days": 13, "month_offset": 3}}
  ],
  "organic_fertilizers": [
    "Specific biofertilizer seed inoculant",
    "Targeted compost / vermicompost dosage",
    "Green manure companion option"
  ],
  "hazard_warnings": {{
    "heat_risk": "Vulnerability to high temperature at flowering",
    "moisture_risk": "Waterlogging or drought sensitivity",
    "pest_alert": "Primary climate-correlated pest/fungus"
  }},
  "market_notes": "Commercial viability, MSP status, or local crop demand",
  "llm_reasoning": "2-sentence agrometeorological rationale for chosen moisture and heat ceilings at these coordinates."
}}"""

        try:
            client = OpenAI(
                base_url=settings.NVIDIA_BASE_URL,
                api_key=api_key,
                timeout=12.0
            )
            response = client.chat.completions.create(
                model=model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
                max_tokens=650
            )

            raw = response.choices[0].message.content.strip()
            # Clean markdown codeblocks if present
            clean_json = re.sub(r'^```json\s*|^```\s*|```$', '', raw, flags=re.MULTILINE).strip()
            parsed = json.loads(clean_json)

            # Validate basic structure
            if "name" in parsed and "thresholds" in parsed and "soil_moisture_min" in parsed["thresholds"]:
                parsed["source"] = f"NVIDIA NIM ({model_name})"
                parsed["generated_by_llm"] = True
                print(f"[LLM Crop Profiler] Successfully generated custom profile for {crop_name} using {model_name}.")
                return parsed
        except Exception as e:
            print(f"[LLM Crop Profiler Warning] NVIDIA NIM query failed: {e}. Falling back to baseline.")

        return None

    def set_crop(
        self,
        crop_name: str,
        sow_date: Optional[str] = None,
        lat: float = 28.6139,
        lon: float = 77.2090,
        user_key: Optional[str] = None,
        persist: bool = True
    ) -> Dict:
        """
        Set the farmer's current crop. First queries NVIDIA NIM LLM.
        Falls back to scientific database if offline.
        Archives previous crop into rotation history.
        """
        key = crop_name.lower().replace(" ", "_").replace("-", "_")

        # Archive previous crop if changing crop
        if self._current_crop and self._current_crop.strip().lower() != crop_name.strip().lower():
            old_season = (self._crop_profile or {}).get("season", "Previous Season")
            old_sow = self._sow_date.strftime("%Y-%m-%d") if self._sow_date else (datetime.now() - timedelta(days=120)).strftime("%Y-%m-%d")
            self._rotation_history.insert(0, {
                "crop": self._current_crop.title(),
                "season": old_season,
                "sow_date": old_sow,
                "harvest_date": datetime.now().strftime("%Y-%m-%d"),
                "duration_days": (datetime.now() - (self._sow_date or datetime.now())).days if self._sow_date else 120,
                "soil_legacy": f"Preceding crop before rotation to {crop_name}. Residual nutrient drawdown and root biomass."
            })
            self._rotation_history = self._rotation_history[:6]

        # 1. First attempt: Query NVIDIA NIM LLM for live customized ranges
        llm_profile = self._query_llm_for_crop(crop_name, lat=lat, lon=lon, user_key=user_key)
        if llm_profile:
            profile = llm_profile
        else:
            # 2. Scientific Fallback Engine
            profile = CROP_DATABASE.get(key)
            if not profile:
                for k, v in CROP_DATABASE.items():
                    if k in key or key in k:
                        profile = v.copy()
                        key = k
                        break

            if not profile:
                profile = {
                    "name": crop_name.title(),
                    "emoji": "🌱",
                    "season": "Multi-Season",
                    "duration_days": 120,
                    "stages": [
                        {"name": "Sowing & Germination", "days": 12, "month_offset": 0},
                        {"name": "Vegetative Growth",    "days": 45, "month_offset": 0},
                        {"name": "Flowering & Setting",  "days": 35, "month_offset": 1},
                        {"name": "Harvest & Curing",     "days": 28, "month_offset": 2},
                    ],
                    "thresholds": DEFAULT_THRESHOLDS,
                    "water_need_mm_season": 450,
                    "nitrogen_kg_ha": 90,
                    "organic_fertilizers": [
                        "FYM 10 t/ha before sowing",
                        "Biofertilizer seed treatment with PSB and Azotobacter",
                        "Dhaincha green manure incorporation",
                    ],
                    "hazard_warnings": {
                        "heat_risk": "Avoid water deficit when temperature exceeds 35°C",
                        "moisture_risk": "Drain excess water within 24 hours of heavy rainfall"
                    },
                    "market_notes": "Local mandi distribution. Check extension center for recommended hybrid varieties.",
                    "llm_reasoning": "Derived from FAO agro-ecological zone default thresholds for sandy-clay alluvial soils."
                }
            profile["source"] = "FIELD SHIFT NASA Agronomy Engine (Scientific Baseline)"
            profile["generated_by_llm"] = False

        self._current_crop = crop_name
        self._crop_profile = profile
        self._sow_date = datetime.fromisoformat(sow_date) if sow_date else datetime.now()
        self._manual_stage = None

        if persist:
            self._save_state()

        return self.get_full_profile()

    def set_growth_stage(self, stage_name: str) -> Dict[str, Any]:
        """Manually sets/confirms the crop's active growth stage."""
        self._manual_stage = stage_name.strip()
        self._save_state()
        print(f"[CropProfileService] Stage updated to: {self._manual_stage}")
        return self.get_full_profile()

    def get_history(self) -> list:
        """Returns the farm's crop rotation history."""
        return self._rotation_history

    def get_full_profile(self) -> Dict:
        if not self._crop_profile:
            return {"status": "no_crop_set", "message": "No crop set. Use POST /api/crop/set"}

        profile = self._crop_profile.copy()
        
        # Compute lifecycle dates
        active_stage_found = None
        if self._sow_date:
            stages_with_dates = []
            current_date = self._sow_date
            now = datetime.now()
            
            for stage in profile.get("stages", []):
                stage_start = current_date
                stage_end = current_date + timedelta(days=stage["days"])
                
                # If manual override exists, check if name matches; otherwise check calendar dates
                if self._manual_stage:
                    is_active = (self._manual_stage.lower() in stage["name"].lower()) or (stage["name"].lower() in self._manual_stage.lower())
                else:
                    is_active = stage_start <= now <= stage_end

                stage_item = {
                    **stage,
                    "start_date": stage_start.strftime("%Y-%m-%d"),
                    "end_date": stage_end.strftime("%Y-%m-%d"),
                    "is_active": is_active,
                }
                stages_with_dates.append(stage_item)
                if is_active and not active_stage_found:
                    active_stage_found = stage_item
                current_date = stage_end

            # If no active stage found by date, default to the closest or last
            if not active_stage_found and stages_with_dates:
                if self._manual_stage:
                    active_stage_found = {"name": self._manual_stage, "days": 30, "is_active": True}
                elif now < self._sow_date:
                    stages_with_dates[0]["is_active"] = True
                    active_stage_found = stages_with_dates[0]
                else:
                    stages_with_dates[-1]["is_active"] = True
                    active_stage_found = stages_with_dates[-1]

            profile["lifecycle_calendar"] = stages_with_dates
            profile["expected_harvest"] = current_date.strftime("%Y-%m-%d")
            profile["days_remaining"] = max(0, (current_date - now).days)
            profile["days_elapsed"] = max(0, (now - self._sow_date).days)

        profile["active_stage"] = active_stage_found or {"name": self._manual_stage or "Vegetative", "is_active": True}
        profile["sow_date"] = self._sow_date.strftime("%Y-%m-%d") if self._sow_date else None
        profile["crop_key"] = self._current_crop
        profile["rotation_history"] = self._rotation_history
        return profile

    def get_active_stage(self) -> Optional[Dict]:
        """Return the current growth stage."""
        profile = self.get_full_profile()
        return profile.get("active_stage")
        return None

    def evaluate_alerts(self, soil_moisture: float, temp: float, tmax: float, rain_24h: float, ph: float) -> list:
        """Compare current NASA/sensor readings against crop thresholds → produce alerts."""
        if not self._crop_profile:
            return []

        t = self._crop_profile.get("thresholds", DEFAULT_THRESHOLDS)
        alerts = []

        if soil_moisture < t.get("soil_moisture_critical_low", 10):
            alerts.append({
                "level": "🆘 Emergency",
                "type": "drought_stress",
                "message": f"CRITICAL: Soil moisture {soil_moisture:.1f}% is dangerously low for {self._crop_profile['name']}. Minimum safe level is {t.get('soil_moisture_min', 15)}%. Irrigate immediately!",
                "parameter": "soil_moisture",
                "value": soil_moisture,
                "threshold": t.get("soil_moisture_min", 15),
            })
        elif soil_moisture < t.get("soil_moisture_min", 15):
            alerts.append({
                "level": "🔴 Warning",
                "type": "low_moisture",
                "message": f"Soil moisture {soil_moisture:.1f}% below optimal ({t.get('soil_moisture_min', 15)}–{t.get('soil_moisture_max', 35)}%) for {self._crop_profile['name']}. Plan light irrigation.",
                "parameter": "soil_moisture",
                "value": soil_moisture,
                "threshold": t.get("soil_moisture_min", 15),
            })

        if tmax >= t.get("heat_stress_c", 36):
            alerts.append({
                "level": "🔴 Warning",
                "type": "heat_stress",
                "message": f"Heat stress alert! Temperature {tmax}°C exceeds heat ceiling ({t.get('heat_stress_c', 36)}°C) for {self._crop_profile['name']}. Maintain soil cover.",
                "parameter": "temperature",
                "value": tmax,
                "threshold": t.get("heat_stress_c", 36),
            })

        if temp <= t.get("frost_risk_c", 2):
            alerts.append({
                "level": "🔴 Warning",
                "type": "frost_risk",
                "message": f"Frost risk! Temperature {temp}°C is at/below frost threshold ({t.get('frost_risk_c', 2)}°C). Cover young seedlings.",
                "parameter": "temperature",
                "value": temp,
                "threshold": t.get("frost_risk_c", 2),
            })

        if rain_24h > t.get("rainfall_max_24h_mm", 60):
            alerts.append({
                "level": "🟡 Watch",
                "type": "heavy_rainfall",
                "message": f"Heavy rainfall {rain_24h:.0f}mm in 24h detected. Check field drainage to avoid root rot.",
                "parameter": "rainfall",
                "value": rain_24h,
                "threshold": t.get("rainfall_max_24h_mm", 60),
            })

        if not alerts:
            active_stage = self.get_active_stage()
            stage_name = active_stage["name"] if active_stage else "growing"
            alerts.append({
                "level": "🟢 Good",
                "type": "all_clear",
                "message": f"All agro-climatic parameters are in safe range for {self._crop_profile['name']} during {stage_name} stage.",
                "parameter": "all",
                "value": None,
                "threshold": None,
            })

        return alerts

# Singleton
crop_profile_service = CropProfileService()
