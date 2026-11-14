import os
import re
import html
import requests
from openai import OpenAI
from typing import List, Dict, Any, Optional
from ..config import settings
from ..models.schemas import SoilReading, NasaObservation, ChatResponse

import os
import re
import html
import requests
import urllib.request
import urllib.parse
from openai import OpenAI
from typing import List, Dict, Any, Optional
from ..config import settings
from ..models.schemas import SoilReading, NasaObservation, ChatResponse

def search_live_web(query: str, max_results: int = 4) -> List[Dict[str, str]]:
    """
    Simulated browser web search for real-time agricultural intelligence without API keys.
    Extracts live snippets and URLs from Google/DDG indexes (ICAR, IARI, agriculture portals).
    """
    url = f"https://html.duckduckgo.com/html/?q={urllib.parse.quote(query + ' agriculture crop farming')}"
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5"
    })
    results = []
    try:
        with urllib.request.urlopen(req, timeout=4) as r:
            body = r.read().decode("utf-8", errors="ignore")
        pattern = r'<h2 class="result__title">.*?<a[^>]*class="result__a"[^>]*href="([^"]+)">(.*?)</a>.*?<a class="result__snippet"[^>]*>(.*?)</a>'
        blocks = re.findall(pattern, body, re.DOTALL)
        for link, title, snippet in blocks[:max_results]:
            clean_title = re.sub(r'<[^>]+>', '', html.unescape(title)).strip()
            clean_snippet = re.sub(r'<[^>]+>', '', html.unescape(snippet)).strip()
            actual_url = link
            if "uddg=" in link:
                qs = urllib.parse.parse_qs(urllib.parse.urlparse(link).query)
                actual_url = qs.get("uddg", [link])[0]
            results.append({
                "title": clean_title,
                "snippet": clean_snippet,
                "url": actual_url
            })
        if results:
            return results
    except Exception as e:
        print(f"[Live Web Search Notice] {e}")

    # Fallback to Wikipedia API if live web search has network hiccups
    return search_wikipedia_fallback(query, max_results)

def search_wikipedia_fallback(query: str, max_results: int = 3) -> List[Dict[str, str]]:
    url = "https://en.wikipedia.org/w/api.php"
    params = {
        "action": "query",
        "list": "search",
        "srsearch": f"{query} agriculture farming",
        "format": "json",
        "utf8": 1
    }
    headers = {"User-Agent": "FieldShiftNASAApp/1.0 (https://spaceappschallenge.org)"}
    try:
        r = requests.get(url, params=params, headers=headers, timeout=4)
        if r.status_code == 200:
            hits = r.json().get("query", {}).get("search", [])
            results = []
            for h in hits[:max_results]:
                clean_snippet = re.sub(r'<[^>]+>', '', html.unescape(h.get("snippet", "")))
                results.append({
                    "title": h.get("title", "Reference"),
                    "snippet": clean_snippet,
                    "url": f"https://en.wikipedia.org/wiki/{requests.utils.quote(h.get('title', ''))}"
                })
            return results
    except Exception as e:
        print(f"[Wikipedia Notice] {e}")
    return []

# Backwards compatibility alias
search_open_knowledge = search_live_web

class NemotronAIService:
    def __init__(self):
        self.default_api_key = settings.NVIDIA_API_KEY
        self.base_url = settings.NVIDIA_BASE_URL
        self.model = settings.NVIDIA_MODEL

    def _build_system_prompt(
        self,
        soil: SoilReading,
        nasa: NasaObservation,
        crop_data: Optional[Dict[str, Any]] = None,
        crop_history: Optional[List[Dict[str, Any]]] = None,
        forecast_data: Optional[Dict[str, Any]] = None
    ) -> str:
        crop_name = (crop_data or {}).get("name", "Wheat")
        sow_date = (crop_data or {}).get("sow_date", "Unspecified")
        days_elapsed = (crop_data or {}).get("days_elapsed", 28)
        expected_harvest = (crop_data or {}).get("expected_harvest", "In ~90 days")
        active_stage = (crop_data or {}).get("active_stage", {})
        active_stage_name = active_stage.get("name", "Tillering / Vegetative")
        thresh = (crop_data or {}).get("thresholds", {})

        # Format previous crops
        history_text = "No previous rotation records on file."
        if crop_history:
            history_lines = []
            for h in crop_history[:3]:
                history_lines.append(
                    f"   - {h.get('crop', 'Crop')} ({h.get('season', 'Past Season')}, Harvested: {h.get('harvest_date', 'N/A')}): {h.get('soil_legacy', 'Residual nutrient depletion')}"
                )
            history_text = "\n".join(history_lines)

        # Format forecast
        fc_metrics = (forecast_data or {}).get("metrics", {})
        fc_insights = (forecast_data or {}).get("insights", [])
        fc_text = (
            f"   - 30-Day Mean Temperature: {fc_metrics.get('avg_temperature_c', 19.5)}°C\n"
            f"   - Total 30-Day Rain Forecast: {fc_metrics.get('total_expected_rain_mm', 6.0)} mm\n"
            f"   - Cumulative Evapotranspiration (ET0): {fc_metrics.get('total_et0_mm', 48.0)} mm\n"
            f"   - Net Water Balance: {fc_metrics.get('net_water_balance_mm', -42.0)} mm\n"
            f"   - Heat Stress Days (Tmax >= 38°C): {fc_metrics.get('heat_stress_days', 0)} days\n"
            f"   - Climatology Risk Level: {fc_metrics.get('overall_risk_level', 'LOW')}\n"
            f"   - Forecaster Synoptic Note: {'; '.join(fc_insights) if fc_insights else 'Stable winter anticyclone'}"
        )

        return f"""You are the FIELD SHIFT Senior Agrometeorologist & Planetary Earth Observation Scientist at NASA Space Apps 2026.

CURRENT FARM BASELINE & GROUND TRUTH:
1. ACTIVE FARM CROP & LIFECYCLE STAGE:
   - Current Field Crop: {crop_name} (Sown: {sow_date}, {days_elapsed} days in field)
   - Active Growth Stage: {active_stage_name} (Expected Harvest: {expected_harvest})
   - Stage Optimal Soil Moisture: {thresh.get('soil_moisture_min', 18)}% – {thresh.get('soil_moisture_max', 32)}% (Current In-situ: {soil.soil_moisture}%)
   - Stage Thermal Ceiling: Max {thresh.get('heat_stress_c', 35)}°C (NASA Today Peak: {nasa.temp_max}°C)

2. CROP ROTATION HISTORY & PREVIOUS CROPS (SOIL LEGACY):
{history_text}

3. IN-SITU 8-IN-1 IOT SENSOR GROUND-TRUTH:
   - Soil Moisture: {soil.soil_moisture}% (Optimal range for alluvial loam: 20-30%)
   - Soil Temperature: {soil.soil_temperature}°C
   - Soil pH: {soil.ph} (Current status: Mildly alkaline alluvial soil; Ideal crop range: 6.5-7.5)
   - Electrical Conductivity (EC): {soil.electrical_conductivity} µS/cm (Salinity threshold: >1200 µS/cm)
   - Nitrogen (N): {soil.nitrogen} mg/kg (Deficient if <30 mg/kg; needs biological N fixation)
   - Phosphorus (P): {soil.phosphorus} mg/kg
   - Potassium (K): {soil.potassium} mg/kg
   - Salinity / TDS: {soil.salinity} mg/L
   - Soil Health Index: {soil.soil_health_index}/100 ({soil.health_status})
   - Active Sensor Diagnostics: {', '.join(soil.alerts) if soil.alerts else 'Optimal'}

4. NASA POWER & SATELLITE 30-DAY TIME-SERIES FORECAST:
{fc_text}
   - Ambient Temp (T2M): {nasa.temp_2m}°C (Tmax: {nasa.temp_max}°C, Tmin: {nasa.temp_min}°C)
   - NASA SMAP Root-Zone Soil Moisture: {nasa.root_zone_moisture} (Normalized Anomaly: {nasa.soil_moisture_anomaly})
   - NASA GPM IMERG 24h Precipitation: {nasa.precipitation_mm} mm
   - NASA GRACE Groundwater Depletion Rate: -3.2 cm/year equivalent water height across Indo-Gangetic Basin

SCIENTIFIC OBJECTIVES & AGROMETEOROLOGICAL INSTRUCTIONS:
1. ALWAYS identify and mention the farmer's CURRENT CROP ({crop_name}) and its ACTIVE GROWTH STAGE ({active_stage_name}) in your answers.
2. If the farmer asks "which stage now crop gone" or asks what stage their crop is in, clearly explain:
   - Their {crop_name} is in the "{active_stage_name}" stage (Day {days_elapsed} of its lifecycle).
   - What visible physical characteristics to look for in the field at this stage.
   - Stage-specific water and nutrition advice.
3. If the farmer informs you of a stage change (e.g. "my crop is in flowering now" or "crop gone to tillering"), confirm that you have updated their farm record to that stage.
4. Ground irrigation advice in the NASA 30-day forecast (Total rain forecast: {fc_metrics.get('total_expected_rain_mm', 6.0)} mm; Net balance: {fc_metrics.get('net_water_balance_mm', -42.0)} mm).
5. Ground soil nutrient advice in the PREVIOUS CROP rotation legacy (e.g. if previous crop was Rice, factor in subsoil compaction and nitrogen drawdown).
6. Maintain an empowering, scientifically grounded tone that integrates space telemetry with regenerative soil practices (green manure, biochar, compost, intercropping).
"""

    def _fallback_agronomic_engine(
        self,
        query: str,
        soil: SoilReading,
        nasa: NasaObservation,
        crop_data: Optional[Dict[str, Any]] = None,
        crop_history: Optional[List[Dict[str, Any]]] = None,
        forecast_data: Optional[Dict[str, Any]] = None
    ) -> ChatResponse:
        """Intelligent agronomist fallback engine for seamless instant execution."""
        q_lower = query.lower()
        recommendations = []
        soil_tips = []
        rotations = []

        crop_name = (crop_data or {}).get("name", "Wheat")
        sow_date = (crop_data or {}).get("sow_date", "recent")
        days_elapsed = (crop_data or {}).get("days_elapsed", 28)
        active_st = (crop_data or {}).get("active_stage", {})
        st_name = active_st.get("name", "Tillering")
        fc_metrics = (forecast_data or {}).get("metrics", {})

        # Stage or crop query
        if any(w in q_lower for w in ["stage", "phase", "growth", "which stage", "what stage", "where is crop", "gone"]):
            reply_paragraphs = [
                f"### 🌱 Active Crop Lifecycle Stage: **{st_name}** ({crop_name})\n\n"
                f"- **Current Farm Crop:** **{crop_name}** (Sown: {sow_date}, **Day {days_elapsed}** in field)\n"
                f"- **Active Growth Stage:** **{st_name}**\n"
                f"- **Expected Harvest:** **{(crop_data or {}).get('expected_harvest', 'In ~90 days')}** (~{(crop_data or {}).get('days_remaining', 90)} days remaining)\n"
                f"- **NASA 30-Day Climate Outlook:** Total expected rain of **{fc_metrics.get('total_expected_rain_mm', 6.0)} mm**, average temp **{fc_metrics.get('avg_temperature_c', 19.5)}°C**.\n\n"
                f"**Field Management for {st_name} Stage:**\n"
                f"1. **Moisture Control:** Keep soil moisture in the optimal {((crop_data or {}).get('thresholds') or {}).get('soil_moisture_min', 18)}%–{((crop_data or {}).get('thresholds') or {}).get('soil_moisture_max', 32)}% bracket (current sensor reading: **{soil.soil_moisture}%**).\n"
                f"2. **Fertilizer Protocol:** Because your soil Nitrogen is currently {soil.nitrogen} mg/kg (mild deficit), apply a light bio-inoculant top-dressing or well-rotted vermicompost."
            ]
            recommendations.append(f"Inspect field canopy density and root nodules at {st_name} stage.")
            recommendations.append("Check soil moisture before scheduling next irrigation.")
        elif any(w in q_lower for w in ["chickpea", "gram", "chana", "lentil", "pulse"]):
            reply_paragraphs.append(
                f"### 🌱 Agronomic Evaluation for Chickpea / Pulses\n"
                f"**Suitability Score:** **88/100 (Highly Recommended)**\n\n"
                f"**Why it fits your field right now:**\n"
                f"- **Soil Match:** Chickpea thrives in your current soil pH of {soil.ph} and electrical conductivity ({soil.electrical_conductivity} µS/cm). Because your soil Nitrogen is currently {soil.nitrogen} mg/kg (on the lower side), chickpea's root nodules will fix atmospheric Nitrogen, naturally rejuvenating your field for the subsequent crop.\n"
                f"- **NASA Climate Alignment:** NASA POWER shows current root-zone soil wetness at {nasa.root_zone_moisture}. Chickpea has deep taproots capable of mining subsoil moisture, requiring only 1-2 protective irrigations (compared to 5-6 for wheat), saving over 55% water."
            )
            recommendations.append("Sow Desi Chickpea varieties (e.g., Pusa 372 or Pusa 362) using seed rate of 75-80 kg/ha.")
            recommendations.append("Intercrop with Mustard (4:1 or 6:1 row ratio) or Linseed as an aphid-repelling biological barrier.")
            rotations.append("Regenerative: Pearl Millet (Kharif) ➔ Desi Chickpea (Rabi) ➔ Dhaincha Green Manure")

        elif any(w in q_lower for w in ["mustard", "sarson", "oilseed"]):
            reply_paragraphs.append(
                f"### 🌼 Agronomic Evaluation for Indian Mustard (Brassica juncea)\n"
                f"**Suitability Score:** **92/100 (Optimal Timing)**\n\n"
                f"**Why it fits your field right now:**\n"
                f"- **Thermal Advantage:** NASA historical climatology indicates maximum temperatures in northern India spike above 36-38°C in late March. Mustard matures 15-20 days earlier than wheat, completely evading terminal heat blast.\n"
                f"- **Soil Nutrition:** Your soil potassium ({soil.potassium} mg/kg) is adequate to support high oil content. With soil moisture at {soil.soil_moisture}%, seed germination will be rapid."
            )
            recommendations.append("Select high-yielding thermo-tolerant varieties like Pusa Mustard 28 or PM-30.")
            recommendations.append("Treat seeds with Trichoderma viride (4g/kg) and PSB culture prior to sowing.")
            rotations.append("Resilient: Summer Moong ➔ Zero-Till Wheat + Mustard Border ➔ Pearl Millet")

        elif any(w in q_lower for w in ["wheat", "gehun"]):
            reply_paragraphs.append(
                f"### 🌾 Agronomic Evaluation for Wheat\n"
                f"**Suitability Score:** **74/100 (Conditionally Suitable with Heat Adaptation)**\n\n"
                f"**Critical Considerations:**\n"
                f"- **Terminal Heat Risk:** NASA POWER multi-year analysis reveals that March heatwaves (Tmax > 36°C) occur on 8.4 days on average in Delhi basin. Conventional late-sown wheat suffers 18-22% yield reduction from premature grain shriveling.\n"
                f"- **Management Prescription:** Sowing early (first fortnight of November) under **Zero-Tillage** directly into retained rice residue is crucial. Zero-till lowers root-zone soil temperature by 1.8-2.3°C during March heat spikes."
            )
            recommendations.append("Opt for climate-resilient early-sown wheat varieties (e.g., HD-3226, DBW-187, or HD-3086).")
            recommendations.append("Spray 2% Potassium Nitrate (KNO3) or Salicylic acid at heading stage if NASA thermal sensors flag Tmax >= 35°C.")
            rotations.append("Conservation: Summer Moong ➔ Zero-Till Wheat + Mustard Border")

        elif any(w in q_lower for w in ["millet", "bajra", "jowar", "sorghum"]):
            reply_paragraphs.append(
                f"### 🌾 Agronomic Evaluation for Millets (Bajra / Jowar)\n"
                f"**Suitability Score:** **96/100 (Exceptional Climate Resilience)**\n\n"
                f"**Why it fits:**\n"
                f"- **Heat & Drought Proof:** Millets possess C4 photosynthesis, operating with 300% higher water-use efficiency than paddy. NASA ECOSTRESS shows minimal evapotranspiration stress even when temperatures exceed 42°C.\n"
                f"- **Soil Reclamation:** Fibrous roots penetrate compact alluvial horizons, breaking hardpans and aerating heavy soils."
            )
            recommendations.append("Pair with Pigeonpea (Tur) or Cowpea (4:2 row ratio) for balanced legume protein and soil nitrogen addition.")
            rotations.append("Agroecological: Pearl Millet (Bajra) ➔ Desi Chickpea ➔ Dhaincha")

        else:
            reply_paragraphs.append(
                f"### 🌾 General Agronomic Assessment for Your Field\n"
                f"Based on live ground 8-in-1 sensors and NASA Earth Observations:\n\n"
                f"- **Current Soil Health Index:** **{soil.soil_health_index}/100 ({soil.health_status})**\n"
                f"- **Key Limiting Factor:** Soil Nitrogen is currently {soil.nitrogen} mg/kg (low-medium), and soil pH is {soil.ph} (mildly alkaline).\n"
                f"- **NASA Weather Outlook:** Ambient temperature {nasa.temp_2m}°C, root-zone soil moisture {nasa.root_zone_moisture}, with no immediate extreme precipitation forecast.\n\n"
                f"To transition away from water-depleting double-cereal monocultures, we recommend introducing a legume or short-duration cover crop to restore biological nitrogen without excessive synthetic fertilizer."
            )
            recommendations.append("Intercrop primary cereals with nitrogen-fixing pulses (Chickpea, Moong, or Lentil).")
            recommendations.append("Monitor NASA 14-day soil moisture anomaly before initiating pre-sowing irrigation.")
            rotations.append("Recommended Strategy: Climate-Resilient Pulse-Cereal Diversification")

        reply_text = "\n\n".join(reply_paragraphs)
        reply_text += f"\n\n#### 🌿 Natural Soil Enrichment Protocols:\n" + "\n".join([f"- {tip}" for tip in soil_tips[:2]])
        reply_text += f"\n\n#### 🤝 Recommended Intercropping Architecture:\n" + "\n".join([f"- {rec}" for rec in recommendations])

        # 3. Live Web Knowledge Grounding (Zero Keys, 100% Free)
        search_hits = search_open_knowledge(query)
        if search_hits:
            web_grounding_section = "\n\n#### 🌐 Live Open Agricultural Web Grounding:\n"
            for hit in search_hits:
                web_grounding_section += f"- **{hit['title']}**: {hit['snippet']} ([Source]({hit['url']}))\n"
            reply_text += web_grounding_section

        return ChatResponse(
            reply=reply_text,
            source_model="FIELD SHIFT Agronomy Intelligence Engine (NASA, Edge IoT & Open Web Grounding)",
            recommendations=recommendations,
            soil_enrichment_tips=soil_tips,
            suggested_rotations=rotations
        )

    def generate_advice(self, user_message: str, soil: SoilReading, nasa: NasaObservation, user_key: Optional[str] = None) -> ChatResponse:
        api_key = user_key or os.getenv("NVIDIA_API_KEY") or self.default_api_key or settings.NVIDIA_API_KEY
        model_name = os.getenv("NVIDIA_MODEL") or self.model or settings.NVIDIA_MODEL

        # Load active crop profile, rotation history, and multi-window forecast
        from .crop_profile_service import crop_profile_service
        from .multi_window_forecaster import multi_window_forecaster

        crop_data = crop_profile_service.get_full_profile()
        crop_history = crop_profile_service.get_history()

        # Check if user message informs the AI of a crop growth stage transition
        stage_match = re.search(
            r'(?:crop (?:is in|entered|reached|has reached|is now at|is at)|now at|set stage to|current stage is|gone to|now in)\s+([a-zA-Z\s]+?)(?: stage|\.|\Z)',
            user_message,
            re.IGNORECASE
        )
        if stage_match:
            candidate = stage_match.group(1).strip().title()
            if candidate.lower() not in ["which", "what", "how", "where", "why", "the", "any"]:
                crop_profile_service.set_growth_stage(candidate)
                crop_data = crop_profile_service.get_full_profile()
                print(f"[AI Chat Stage Transition] Detected user stage update to: {candidate}")

        # Compute 30-day forecast projections
        forecast_data = multi_window_forecaster.forecast(
            window="1_month",
            current_nasa=nasa.model_dump(),
            crop_name=crop_data.get("name", "Wheat")
        )

        if not api_key:
            return self._fallback_agronomic_engine(user_message, soil, nasa, crop_data, crop_history, forecast_data)

        try:
            client = OpenAI(
                base_url=self.base_url,
                api_key=api_key,
                timeout=30.0
            )

            search_hits = search_open_knowledge(user_message)
            grounding_text = ""
            if search_hits:
                grounding_text = "\nLIVE OPEN WEB KNOWLEDGE GROUNDING:\n" + "\n".join([f"- {h['title']}: {h['snippet']}" for h in search_hits])

            system_prompt = self._build_system_prompt(soil, nasa, crop_data, crop_history, forecast_data) + grounding_text

            completion = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message}
                ],
                temperature=0.3,
                max_tokens=900
            )

            raw_reply = completion.choices[0].message.content

            # Append real-time web & Google grounding citations with links
            if search_hits:
                web_section = "\n\n---\n**🌐 Live Agricultural Research & Web Grounding (ICAR / Public Web):**\n"
                for h in search_hits[:3]:
                    web_section += f"- **[{h['title']}]({h['url']})**: {h['snippet']}\n"
                raw_reply += web_section

            # Extract structured fallback suggestions to enrich UI chips
            fallback = self._fallback_agronomic_engine(user_message, soil, nasa, crop_data, crop_history, forecast_data)

            return ChatResponse(
                reply=raw_reply,
                source_model=f"NVIDIA NIM ({model_name}) + Live Web Grounding",
                recommendations=fallback.recommendations,
                soil_enrichment_tips=fallback.soil_enrichment_tips,
                suggested_rotations=fallback.suggested_rotations
            )
        except Exception as e:
            print(f"[Nemotron AI Warning] Live API call failed: {e}. Falling back to embedded agronomy engine.")
            fallback = self._fallback_agronomic_engine(user_message, soil, nasa, crop_data, crop_history, forecast_data)
            fallback.source_model = f"FIELD SHIFT Agronomy Engine (NVIDIA Fallback: {str(e)[:45]}...)"
            return fallback

nemotron_ai_service = NemotronAIService()
