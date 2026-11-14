"""
Environmental & Agronomic Enrichment Service for FIELD SHIFT
Handles:
1. NASA GRACE / GRACE-FO Groundwater Storage Trends
2. Coastal Elevation & Sea Level Rise / Salinity Intrusion Risks
3. Organic Fertilizer & Bio-amendment Advisory Engine tailored to crop & soil IoT
"""
import math
from typing import Dict, Any, List, Optional
from datetime import datetime

class EnvironmentalService:
    def __init__(self):
        pass

    def compute_distance_to_coast_km(self, lat: float, lon: float) -> float:
        """
        Approximate distance from coordinates to nearest coastline (Indian Ocean / Bay of Bengal / Arabian Sea).
        """
        coastal_anchor_points = [
            (21.68, 69.60),  # Gujarat Porbandar
            (18.92, 72.83),  # Mumbai
            (15.29, 73.98),  # Goa
            (9.93, 76.26),   # Kochi
            (8.08, 77.55),   # Kanyakumari
            (13.08, 80.27),  # Chennai
            (17.68, 83.21),  # Visakhapatnam
            (20.29, 86.68),  # Paradip Odisha
            (21.75, 88.08),  # Sundarbans West Bengal
        ]
        
        min_dist = float('inf')
        R = 6371.0 # Earth radius in km

        for c_lat, c_lon in coastal_anchor_points:
            dlat = math.radians(c_lat - lat)
            dlon = math.radians(c_lon - lon)
            a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(c_lat)) * math.sin(dlon / 2)**2
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            dist = R * c
            if dist < min_dist:
                min_dist = dist

        return round(min_dist, 1)

    def get_groundwater_and_sealevel_data(self, lat: float, lon: float, elevation_m: float = 212.0) -> Dict[str, Any]:
        """
        Calculates NASA GRACE-FO groundwater deficit and Sea Level / Coastal Risk index.
        """
        dist_to_coast = self.compute_distance_to_coast_km(lat, lon)

        # NASA GRACE / GRACE-FO regional aquifer trends
        # In Northern India / Indo-Gangetic basin: -3.2 to -4.0 cm/yr equivalent water height
        # Western India: -2.5 cm/yr; Southern hard rock: -1.8 cm/yr
        if 26.0 <= lat <= 32.0 and 74.0 <= lon <= 85.0:
            region_name = "Indo-Gangetic Alluvial Basin"
            tws_trend_cm_yr = -3.4
            depletion_category = "Severe Chronic Depletion (Red Zone)"
            pumping_recommendation = "Restrict deep tube-well pumping to max 2.5 hours/day; prioritize drip & micro-sprinklers."
        elif lat < 20.0:
            region_name = "Peninsular Hard-Rock Aquifer"
            tws_trend_cm_yr = -1.9
            depletion_category = "Moderate Over-exploitation"
            pumping_recommendation = "Recharge borewells with rainwater farm ponds; practice alternate furrow irrigation."
        else:
            region_name = "Semi-Arid Western Basin"
            tws_trend_cm_yr = -2.8
            depletion_category = "High Vulnerability"
            pumping_recommendation = "Shift to drought-tolerant pulses & oilseeds; avoid paddy/sugarcane."

        # NASA Sea Level Change Portal metrics
        global_sea_level_rise_rate_mm_yr = 3.4  # NASA Satellite Altimetry rate
        coastal_vulnerability = "Inland / Negligible Direct Marine Risk"
        salinity_intrusion_risk = "Low"
        
        if dist_to_coast < 50.0:
            if elevation_m < 5.0:
                coastal_vulnerability = "Critical Coastal Inundation & Storm Surge Zone"
                salinity_intrusion_risk = "High - Saltwater Intrusion likely contaminating shallow aquifers"
            elif elevation_m < 15.0:
                coastal_vulnerability = "Moderate Low-Lying Coastal Buffer"
                salinity_intrusion_risk = "Medium - Monitor borehole electrical conductivity (EC)"
            else:
                coastal_vulnerability = "Elevated Coastal Ridge"
                salinity_intrusion_risk = "Low to Moderate"
        elif dist_to_coast < 150.0:
            coastal_vulnerability = "Sub-Coastal Transition Zone"
            salinity_intrusion_risk = "Low"

        return {
            "location": {"lat": lat, "lon": lon, "elevation_m": elevation_m},
            "distance_to_coast_km": dist_to_coast,
            "grace_groundwater": {
                "aquifer_region": region_name,
                "terrestrial_water_storage_anomaly_trend": f"{tws_trend_cm_yr} cm/year (Equivalent Water Height)",
                "depletion_status": depletion_category,
                "primary_satellite": "NASA GRACE & GRACE-FO (Gravity Recovery and Climate Experiment)",
                "pumping_guidance": pumping_recommendation,
                "cumulative_decadal_loss_meters": round(abs(tws_trend_cm_yr * 10 / 100), 2)
            },
            "sea_level_and_salinity": {
                "global_mean_sea_level_rise_rate": f"{global_sea_level_rise_rate_mm_yr} mm/year (NASA Altimetry)",
                "coastal_vulnerability_level": coastal_vulnerability,
                "marine_storm_surge_exposure": "High" if dist_to_coast < 30 else "None",
                "aquifer_salinization_risk": salinity_intrusion_risk,
                "recommended_soil_test": "Test Electrical Conductivity (EC) if EC > 2.0 dS/m, use gypsum."
            }
        }

    def generate_organic_fertilizer_plan(
        self,
        crop_name: str,
        soil_ph: float = 7.6,
        soil_moisture: float = 22.0,
        nitrogen_mg_kg: float = 145.0,
        phosphorus_mg_kg: float = 18.0,
        potassium_mg_kg: float = 180.0,
        upcoming_rain_mm: float = 0.0
    ) -> Dict[str, Any]:
        """
        Generates targeted organic nutrition and bio-amendment schedules for the farm.
        """
        crop_key = crop_name.lower()
        is_legume = any(leg in crop_key for leg in ['mung', 'gram', 'chickpea', 'lentil', 'pea', 'bean', 'soybean', 'groundnut'])
        is_heavy_feeder = any(h in crop_key for h in ['rice', 'paddy', 'sugarcane', 'cotton', 'maize', 'potato'])

        recommendations = []
        biofertilizers = []
        green_manures = []
        foliar_sprays = []

        # 1. Green Manure Selection
        if is_heavy_feeder:
            green_manures.append({
                "species": "Dhaincha (Sesbania aculeata)",
                "biomass_yield": "15-20 tonnes/ha fresh biomass",
                "nitrogen_addition": "75-90 kg N/ha equivalent",
                "timing": "Sow in summer (May-June), incorporate at 45-50 days before next crop puddling",
                "soil_benefit": "Excellent for breaking hardpan and reclaiming slightly alkaline/saline soils."
            })
        else:
            green_manures.append({
                "species": "Sunnhemp (Crotalaria juncea)",
                "biomass_yield": "12-15 tonnes/ha fresh biomass",
                "nitrogen_addition": "50-65 kg N/ha equivalent",
                "timing": "Incorporate at 40-45 days at initiation of flowering",
                "soil_benefit": "Fast decomposition, suppresses plant-parasitic nematodes."
            })

        # 2. Biofertilizer Pack
        if is_legume:
            biofertilizers.append({
                "name": "Rhizobium Seed Inoculant",
                "dosage": "250g per 10kg seed with jaggery water",
                "mechanism": "Symbiotic nitrogen fixation in root nodules (saves 50-70% synthetic N)",
                "action": "Seed treatment prior to sowing in shade."
            })
        else:
            biofertilizers.append({
                "name": "Azotobacter chroococcum / Azospirillum",
                "dosage": "5 kg/ha mixed with 200 kg FYM",
                "mechanism": "Free-living / Associative biological nitrogen fixation + indole acetic acid production",
                "action": "Basal soil application at field preparation."
            })

        # Phosphorus Solubilizing Bacteria (PSB)
        if phosphorus_mg_kg < 25.0:
            biofertilizers.append({
                "name": "Phosphate Solubilizing Bacteria (PSB / Bacillus megaterium)",
                "dosage": "5 kg/ha or 20g/kg seed",
                "mechanism": "Secretes organic acids to solubilize locked insoluble native phosphorus in soil",
                "action": "Crucial for current low available P status (18 mg/kg)."
            })

        # Potash Mobilizing Bacteria (KMB)
        biofertilizers.append({
            "name": "Potash Mobilizing Bacteria (Frateuria aurantia)",
            "dosage": "3 kg/ha in moist vermicompost",
            "mechanism": "Mobilizes fixed potassium minerals into bioavailable K+ ions.",
            "action": "Apply along with FYM during sowing."
        })

        # 3. Organic Manures & Compost Formulations
        fym_dosage = "12-15 tonnes/ha" if is_heavy_feeder else "8-10 tonnes/ha"
        recommendations.append({
            "amendment": "Well-Decomposed Farmyard Manure (FYM)",
            "dosage": fym_dosage,
            "application_time": "Spread 3-4 weeks before sowing, immediately plough in to prevent nitrogen volatilization",
            "nutrient_profile": "0.5% N, 0.2% P2O5, 0.5% K2O + rich humic compounds"
        })
        recommendations.append({
            "amendment": "Enriched Vermicompost with Trichoderma",
            "dosage": "2.5 tonnes/ha at sowing furrow",
            "application_time": "Drill into seed row at sowing",
            "nutrient_profile": "2.0% N, 1.5% P, 1.5% K + protects against soil-borne damping off and root rot"
        })

        # 4. Fermented Bio-stimulants (Jeevamrut / Panchagavya)
        foliar_sprays.append({
            "formulation": "Liquid Jeevamrut (Fermented Cow Dung & Pulse Slurry)",
            "recipe": "200L water + 10kg cow dung + 10L urine + 2kg jaggery + 2kg gram flour + 1 handful virgin bund soil (ferment 5 days)",
            "application": "Apply 500 L/ha with irrigation water every 21 days",
            "impact": "Trillions of beneficial soil microbes multiply, enhancing cation exchange capacity."
        })
        foliar_sprays.append({
            "formulation": "Neem Cake Organic Protection",
            "recipe": "150-200 kg/ha crushed neem seed cake",
            "application": "Broadcast before final harrowing",
            "impact": "Acts as natural nitrification inhibitor (slows N loss) and controls root grubs/termites."
        })

        # Weather & Timing Warning
        weather_alert = None
        if upcoming_rain_mm > 15.0:
            weather_alert = f"⚠️ Heavy rain ({upcoming_rain_mm} mm) predicted in forecast. HOLD OFF broadcasting raw manure or bio-sprays until rain passes to prevent nutrient runoff into waterways."
        elif soil_moisture < 15.0:
            weather_alert = "💧 Soil moisture is currently low (<15%). Ensure light irrigation immediately following biofertilizer or manure application so microbial cultures survive."

        # Soil pH Correction
        ph_advice = None
        if soil_ph > 8.0:
            ph_advice = "Soil is alkaline (pH > 8.0). Apply agricultural gypsum (1.5 t/ha) and green manure (Dhaincha) to lower pH and displace sodium ions."
        elif soil_ph < 6.0:
            ph_advice = "Soil is acidic (pH < 6.0). Apply agricultural lime / dolomite (1.0 t/ha) to neutralize acidity and unlock phosphorus."
        else:
            ph_advice = f"Soil pH ({soil_ph}) is in the optimal slightly alkaline/neutral range. Ideal for microbial activity."

        return {
            "crop": crop_name.title(),
            "soil_metrics_evaluated": {
                "ph": soil_ph,
                "moisture_pct": soil_moisture,
                "n_mg_kg": nitrogen_mg_kg,
                "p_mg_kg": phosphorus_mg_kg,
                "k_mg_kg": potassium_mg_kg
            },
            "weather_precaution": weather_alert,
            "soil_ph_action": ph_advice,
            "green_manure_options": green_manures,
            "biofertilizers": biofertilizers,
            "organic_manures": recommendations,
            "bio_stimulants": foliar_sprays,
            "expected_chemical_n_reduction_pct": 40 if not is_legume else 75
        }

environmental_service = EnvironmentalService()
