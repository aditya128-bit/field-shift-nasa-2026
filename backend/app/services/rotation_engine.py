from typing import List, Dict, Any, Optional
from ..models.schemas import RotationStrategy, SoilReading, NasaObservation
from .agrometeorology_engine import scientific_agronomy_engine

class RotationEngine:
    def __init__(self):
        pass

    def evaluate_strategies(
        self,
        soil: SoilReading,
        nasa: NasaObservation,
        farmer_priority: str = "water_conservation",
        water_constraint: str = "moderate_tubewell",
        machinery_access: str = "zero_till_happy_seeder"
    ) -> List[RotationStrategy]:
        
        raw_strategies = scientific_agronomy_engine.evaluate_rotations_with_farmer_constraints(
            farmer_priority=farmer_priority,
            water_constraint=water_constraint,
            machinery_access=machinery_access,
            soil_ph=soil.ph,
            soil_n=soil.nitrogen,
            soil_moisture=soil.soil_moisture,
            nasa_temp_max=nasa.temp_max,
            precipitation_mm=nasa.precipitation_mm
        )

        strategies = []
        for s in raw_strategies:
            strat = RotationStrategy(
                id=s["id"],
                name=s["name"],
                tagline=s["tagline"],
                recommended=s["recommended"],
                suitability_score=s.get("suitability_score", 85),
                crops=s["crops"],
                annual_water_demand_m3_ha=s["annual_water_demand_m3_ha"],
                water_savings_percent=s["water_savings_percent"],
                soil_nitrogen_balance_kg_ha=s["soil_nitrogen_balance_kg_ha"],
                bare_soil_days=s["bare_soil_days"],
                bare_soil_reduction_percent=s["bare_soil_reduction_percent"],
                erosion_risk=s["erosion_risk"],
                terminal_heat_resilience=s["terminal_heat_resilience"],
                soil_organic_carbon_rate=s["soil_organic_carbon_rate"],
                net_profit_index=s["net_profit_index"],
                agronomic_rationale=s["agronomic_rationale"],
                nasa_evidence=s["nasa_evidence"],
                information_gaps=s.get("information_gaps", "Local custom hiring center equipment rates; micro-topography variations."),
                local_risks_for_review=s["local_risks_for_review"]
            )
            strategies.append(strat)

        return strategies

rotation_engine = RotationEngine()
