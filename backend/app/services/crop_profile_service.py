"""
Crop Profile Service — LLM-generated per-crop parameter ranges,
alert thresholds, lifecycle stages, fertilizer suggestions.
"""
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

# ─── Static crop knowledge base (augmented by LLM if available) ──────────────
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
    },
    "mung_bean": {
        "name": "Mung Bean / Green Gram (Vigna radiata)",
        "emoji": "🫘",
        "season": "Zaid / Kharif (Mar–Jun)",
        "duration_days": 70,
        "stages": [
            {"name": "Sowing",        "days": 5,  "month_offset": 0},
            {"name": "Vegetative",    "days": 25, "month_offset": 0},
            {"name": "Flowering",     "days": 15, "month_offset": 1},
            {"name": "Pod Setting",   "days": 15, "month_offset": 2},
            {"name": "Harvest",       "days": 10, "month_offset": 2},
        ],
        "thresholds": {
            "soil_moisture_min": 14,
            "soil_moisture_max": 26,
            "soil_moisture_critical_low": 10,
            "temp_min_c": 20,
            "temp_max_c": 38,
            "heat_stress_c": 42,
            "frost_risk_c": 5,
            "rainfall_min_season_mm": 150,
            "rainfall_max_24h_mm": 50,
            "ph_min": 6.2,
            "ph_max": 7.2,
            "ndvi_healthy_min": 0.35,
        },
        "water_need_mm_season": 350,
        "nitrogen_kg_ha": 20,  # nitrogen-fixing
        "organic_fertilizers": [
            "Rhizobium japonicum seed inoculation (fixes 50–60 kg N/ha FREE)",
            "PSB (Phosphate Solubilising Bacteria) seed treatment",
            "FYM 5 t/ha — low dose as it fixes own nitrogen",
            "Zinc sulphate 25 kg/ha for micronutrient support",
        ],
        "hazard_warnings": {
            "yellow_mosaic": "Whitefly-transmitted virus — scout weekly",
            "pod_borer": "Spray Bt at pod formation",
            "waterlogging": "Cannot tolerate waterlogging. Raised beds help.",
        },
        "market_notes": "Short duration. Great nitrogen-fixer for rotation. Good dal market.",
    },
    "cotton": {
        "name": "Cotton (Gossypium hirsutum)",
        "emoji": "🌸",
        "season": "Kharif (Apr–Nov)",
        "duration_days": 180,
        "stages": [
            {"name": "Sowing",        "days": 7,   "month_offset": 0},
            {"name": "Seedling",      "days": 25,  "month_offset": 0},
            {"name": "Squaring",      "days": 30,  "month_offset": 1},
            {"name": "Flowering",     "days": 30,  "month_offset": 2},
            {"name": "Boll Setting",  "days": 40,  "month_offset": 3},
            {"name": "Boll Opening",  "days": 30,  "month_offset": 4},
            {"name": "Harvest",       "days": 20,  "month_offset": 5},
        ],
        "thresholds": {
            "soil_moisture_min": 20,
            "soil_moisture_max": 35,
            "soil_moisture_critical_low": 15,
            "temp_min_c": 20,
            "temp_max_c": 40,
            "heat_stress_c": 42,
            "frost_risk_c": 10,
            "rainfall_min_season_mm": 500,
            "rainfall_max_24h_mm": 80,
            "ph_min": 5.8,
            "ph_max": 8.0,
            "ndvi_healthy_min": 0.45,
        },
        "water_need_mm_season": 700,
        "nitrogen_kg_ha": 150,
        "organic_fertilizers": [
            "FYM 12.5 t/ha before sowing for black soil",
            "Trichoderma viride seed treatment vs. wilt",
            "Neem cake 150 kg/ha for nematode control",
            "Vermicompost 2.5 t/ha at sowing",
        ],
        "hazard_warnings": {
            "bollworm": "Pink bollworm critical Aug–Oct; use pheromone traps",
            "whitefly": "Spray systemic insecticide if >5 adults/leaf",
            "leaf_curl_virus": "Whitefly-transmitted; use resistant varieties",
        },
        "market_notes": "High input cost but good MSP. BT varieties dominant.",
    },
    "sugarcane": {
        "name": "Sugarcane (Saccharum officinarum)",
        "emoji": "🎋",
        "season": "Annual/Ratoon",
        "duration_days": 365,
        "stages": [
            {"name": "Germination",   "days": 30,  "month_offset": 0},
            {"name": "Tillering",     "days": 60,  "month_offset": 1},
            {"name": "Grand Growth",  "days": 150, "month_offset": 3},
            {"name": "Maturation",    "days": 90,  "month_offset": 8},
            {"name": "Harvest",       "days": 30,  "month_offset": 11},
        ],
        "thresholds": {
            "soil_moisture_min": 25,
            "soil_moisture_max": 45,
            "soil_moisture_critical_low": 18,
            "temp_min_c": 20,
            "temp_max_c": 38,
            "heat_stress_c": 42,
            "frost_risk_c": 5,
            "rainfall_min_season_mm": 1200,
            "rainfall_max_24h_mm": 100,
            "ph_min": 6.0,
            "ph_max": 7.5,
            "ndvi_healthy_min": 0.65,
        },
        "water_need_mm_season": 2000,
        "nitrogen_kg_ha": 250,
        "organic_fertilizers": [
            "Press mud / filter cake 10 t/ha — excellent organic fertilizer",
            "Trash mulching to retain moisture between rows",
            "Azospirillum + PSB biofertilizer mix",
            "Green manure: Sunhemp incorporated before planting",
        ],
        "hazard_warnings": {
            "top_shoot_borer": "Major pest Jun–Sep",
            "red_rot": "Fungal disease; use resistant varieties",
            "waterlogging": "Cannot tolerate >3 days waterlogging",
        },
        "market_notes": "Guaranteed price from sugar mills. Long duration = high water use.",
    },
    "sorghum": {
        "name": "Sorghum / Jowar (Sorghum bicolor)",
        "emoji": "🌽",
        "season": "Kharif (Jun–Sep) or Rabi (Oct–Jan)",
        "duration_days": 110,
        "stages": [
            {"name": "Germination",  "days": 7,  "month_offset": 0},
            {"name": "Vegetative",   "days": 40, "month_offset": 0},
            {"name": "Boot/Head",    "days": 25, "month_offset": 1},
            {"name": "Grain Fill",   "days": 25, "month_offset": 2},
            {"name": "Harvest",      "days": 10, "month_offset": 3},
        ],
        "thresholds": {
            "soil_moisture_min": 12,
            "soil_moisture_max": 30,
            "soil_moisture_critical_low": 8,
            "temp_min_c": 15,
            "temp_max_c": 40,
            "heat_stress_c": 42,
            "frost_risk_c": 5,
            "rainfall_min_season_mm": 300,
            "rainfall_max_24h_mm": 70,
            "ph_min": 5.5,
            "ph_max": 8.5,
            "ndvi_healthy_min": 0.40,
        },
        "water_need_mm_season": 400,
        "nitrogen_kg_ha": 80,
        "organic_fertilizers": [
            "FYM 5–8 t/ha incorporated at sowing",
            "Azospirillum biofertilizer seed treatment",
            "Neem cake 2 t/ha for soil health",
        ],
        "hazard_warnings": {
            "shoot_fly": "Major pest in seedling stage",
            "grain_mold": "In humid conditions at maturity",
            "drought_escape": "One of most drought-tolerant cereals",
        },
        "market_notes": "Excellent for dryland farming. Good fodder value. Lower MSP than wheat.",
    },
    "tomato": {
        "name": "Tomato (Solanum lycopersicum)",
        "emoji": "🍅",
        "season": "Winter (Oct–Feb) or Summer",
        "duration_days": 120,
        "stages": [
            {"name": "Nursery",       "days": 30, "month_offset": 0},
            {"name": "Transplanting", "days": 7,  "month_offset": 1},
            {"name": "Vegetative",    "days": 25, "month_offset": 1},
            {"name": "Flowering",     "days": 20, "month_offset": 2},
            {"name": "Fruiting",      "days": 30, "month_offset": 3},
            {"name": "Harvest",       "days": 20, "month_offset": 3},
        ],
        "thresholds": {
            "soil_moisture_min": 22,
            "soil_moisture_max": 38,
            "soil_moisture_critical_low": 15,
            "temp_min_c": 10,
            "temp_max_c": 32,
            "heat_stress_c": 35,
            "frost_risk_c": 2,
            "rainfall_max_24h_mm": 30,
            "ph_min": 6.0,
            "ph_max": 7.0,
            "ndvi_healthy_min": 0.45,
        },
        "water_need_mm_season": 500,
        "nitrogen_kg_ha": 100,
        "organic_fertilizers": [
            "Vermicompost 5 t/ha before transplanting",
            "Panchagavya foliar spray (3%) every 15 days",
            "Neem oil spray (3ml/L) for pest management",
            "Trichoderma @ 2.5 kg/ha for root health",
        ],
        "hazard_warnings": {
            "early_blight": "Alternaria — spray copper fungicide",
            "fruit_borer": "Critical at fruiting; use Spinosad",
            "blossom_drop": "If temp >35°C at night",
        },
        "market_notes": "Highly perishable. Price volatile. Good for local markets.",
    },
}

# Default for unknown crops
DEFAULT_THRESHOLDS = {
    "soil_moisture_min": 15,
    "soil_moisture_max": 35,
    "soil_moisture_critical_low": 10,
    "temp_max_c": 38,
    "heat_stress_c": 40,
    "frost_risk_c": 2,
    "rainfall_max_24h_mm": 60,
    "ph_min": 6.0,
    "ph_max": 7.5,
    "ndvi_healthy_min": 0.40,
}


class CropProfileService:
    def __init__(self):
        self._current_crop: Optional[str] = None
        self._crop_profile: Optional[Dict] = None
        self._sow_date: Optional[datetime] = None

    def set_crop(self, crop_name: str, sow_date: Optional[str] = None) -> Dict:
        """Set the farmer's current crop and return full profile."""
        key = crop_name.lower().replace(" ", "_").replace("-", "_")

        # Try direct match
        profile = CROP_DATABASE.get(key)
        if not profile:
            # Fuzzy match
            for k, v in CROP_DATABASE.items():
                if k in key or key in k:
                    profile = v
                    key = k
                    break

        if not profile:
            # Generic fallback
            profile = {
                "name": crop_name.title(),
                "emoji": "🌱",
                "season": "Variable",
                "duration_days": 120,
                "stages": [
                    {"name": "Sowing",    "days": 10, "month_offset": 0},
                    {"name": "Growth",    "days": 60, "month_offset": 0},
                    {"name": "Maturity",  "days": 30, "month_offset": 2},
                    {"name": "Harvest",   "days": 20, "month_offset": 3},
                ],
                "thresholds": DEFAULT_THRESHOLDS,
                "water_need_mm_season": 500,
                "nitrogen_kg_ha": 80,
                "organic_fertilizers": [
                    "FYM 8–10 t/ha before sowing",
                    "Biofertilizer seed treatment",
                ],
                "hazard_warnings": {},
                "market_notes": "Consult local agricultural extension office for best practices.",
            }

        self._current_crop = crop_name
        self._crop_profile = profile
        self._sow_date = datetime.fromisoformat(sow_date) if sow_date else datetime.now()

        return self.get_full_profile()

    def get_full_profile(self) -> Dict:
        if not self._crop_profile:
            return {"status": "no_crop_set", "message": "No crop set. Use POST /api/crop/set"}

        profile = self._crop_profile.copy()
        # Compute lifecycle dates
        if self._sow_date:
            stages_with_dates = []
            current_date = self._sow_date
            for stage in profile.get("stages", []):
                stages_with_dates.append({
                    **stage,
                    "start_date": current_date.strftime("%Y-%m-%d"),
                    "end_date": (current_date + timedelta(days=stage["days"])).strftime("%Y-%m-%d"),
                    "is_active": current_date <= datetime.now() <= current_date + timedelta(days=stage["days"]),
                })
                current_date += timedelta(days=stage["days"])
            profile["lifecycle_calendar"] = stages_with_dates
            profile["expected_harvest"] = current_date.strftime("%Y-%m-%d")
            profile["days_remaining"] = max(0, (current_date - datetime.now()).days)

        profile["sow_date"] = self._sow_date.strftime("%Y-%m-%d") if self._sow_date else None
        profile["crop_key"] = self._current_crop
        return profile

    def get_active_stage(self) -> Optional[Dict]:
        """Return the current growth stage."""
        profile = self.get_full_profile()
        for stage in profile.get("lifecycle_calendar", []):
            if stage.get("is_active"):
                return stage
        return None

    def evaluate_alerts(self, soil_moisture: float, temp: float, tmax: float, rain_24h: float, ph: float) -> list:
        """Compare current NASA/sensor readings against crop thresholds → produce alerts."""
        if not self._crop_profile:
            return []

        t = self._crop_profile["thresholds"]
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
                "message": f"Soil moisture {soil_moisture:.1f}% below optimal ({t.get('soil_moisture_min', 15)}–{t.get('soil_moisture_max', 35)}%) for {self._crop_profile['name']}. Plan irrigation within 2 days.",
                "parameter": "soil_moisture",
                "value": soil_moisture,
                "threshold": t.get("soil_moisture_min", 15),
            })

        if tmax >= t.get("heat_stress_c", 40):
            alerts.append({
                "level": "🔴 Warning",
                "type": "heat_stress",
                "message": f"Heat stress alert! Temperature {tmax}°C exceeds heat stress threshold ({t.get('heat_stress_c', 40)}°C) for {self._crop_profile['name']}. Irrigate early morning to cool soil.",
                "parameter": "temperature",
                "value": tmax,
                "threshold": t.get("heat_stress_c", 40),
            })

        if temp <= t.get("frost_risk_c", 2):
            alerts.append({
                "level": "🔴 Warning",
                "type": "frost_risk",
                "message": f"Frost risk! Temperature {temp}°C is at/below frost threshold ({t.get('frost_risk_c', 2)}°C). Cover young plants or use smoke screens overnight.",
                "parameter": "temperature",
                "value": temp,
                "threshold": t.get("frost_risk_c", 2),
            })

        if rain_24h > t.get("rainfall_max_24h_mm", 60):
            alerts.append({
                "level": "🟡 Watch",
                "type": "heavy_rainfall",
                "message": f"Heavy rainfall {rain_24h:.0f}mm in 24h detected. Check field drainage. {self._crop_profile['name']} may face waterlogging risk.",
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
                "message": f"All conditions are within safe range for {self._crop_profile['name']} during {stage_name} stage. Continue normal management.",
                "parameter": "all",
                "value": None,
                "threshold": None,
            })

        return alerts


# Singleton
crop_profile_service = CropProfileService()
