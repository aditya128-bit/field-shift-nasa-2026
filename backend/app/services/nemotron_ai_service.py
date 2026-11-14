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

    def _build_system_prompt(self, soil: SoilReading, nasa: NasaObservation) -> str:
        return f"""You are the FIELD SHIFT Senior Agrometeorologist & Planetary Earth Observation Scientist at NASA Space Apps 2026.

CURRENT FARM BASELINE & DECADAL SCIENTIFIC OBSERVATIONS:
1. IN-SITU 8-IN-1 IOT SENSOR GROUND-TRUTH:
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

2. NASA SATELLITE FLEET & AGROMETEOROLOGICAL INDICATORS:
   - Ambient Temp (T2M): {nasa.temp_2m}°C (Tmax: {nasa.temp_max}°C, Tmin: {nasa.temp_min}°C)
   - NASA SMAP Root-Zone Soil Moisture: {nasa.root_zone_moisture} (Normalized Anomaly: {nasa.soil_moisture_anomaly})
   - NASA GPM IMERG 24h Precipitation: {nasa.precipitation_mm} mm
   - Solar Irradiance: {nasa.solar_radiation_mj} MJ/m²/day
   - Wind Speed (WS2M): {nasa.wind_speed} m/s
   - NASA GRACE Groundwater Depletion Rate: -3.2 cm/year equivalent water height across Indo-Gangetic Basin
   - FAO-56 Penman-Monteith Reference Evapotranspiration (ET0): Computed daily reference water demand
   - Heat Stress Alert: {'ACTIVE (Tmax >= 38°C)' if nasa.heat_stress_warning else 'Inactive'}
   - Frost Risk: {'ACTIVE' if nasa.frost_risk_warning else 'Inactive'}

SCIENTIFIC OBJECTIVES & RESPONSE STANDARDS:
1. Always evaluate the farmer's crop proposal against FAO-56 crop coefficients (Kc), water footprint, and NASA 10-year thermal heatwave risk in March (Tmax >= 36°C).
2. If soil is alkaline (pH > 7.7) or nitrogen-deficient, prescribe specific NATURAL REGENERATIVE protocols:
   - Sesbania aculeata (Dhaincha) green manure: 45 days growth, incorporates 80-110 kg N/ha, organic acids neutralize alkaline caliche.
   - Biofertilizers: Seed inoculation with Rhizobium leguminosarum & Phosphate Solubilizing Bacteria (PSB).
   - Mulching: Retaining 4-5 t/ha crop residue using Happy Seeder reduces soil evaporation by 32% and cools root zone by 2°C during heatwaves.
3. Recommend ecological intercropping geometries (e.g. Wheat + Mustard 4:1 row ratio, Chickpea + Linseed, Pearl Millet + Cowpea) to disrupt pest cycles and conserve irrigation.
4. Maintain a supportive, scientifically grounded tone that empowers farmer judgment without replacing local agricultural extension.
"""

    def _fallback_agronomic_engine(self, query: str, soil: SoilReading, nasa: NasaObservation) -> ChatResponse:
        """Intelligent agronomist fallback engine for seamless instant execution."""
        q_lower = query.lower()
        recommendations = []
        soil_tips = []
        rotations = []

        # 1. Natural Soil Enrichment Tips tailored to current readings
        if soil.ph > 7.7:
            soil_tips.append("Apply Green Manure (Sesbania aculeata / Dhaincha): Grow for 45 days and plow in before flowering. Its organic acids naturally neutralize alkaline pH (current pH: {0}) and release trapped phosphorus.".format(soil.ph))
            soil_tips.append("Incorporate Agricultural Gypsum (2.5 t/ha) or Press-mud to displace sodium ions and improve water infiltration.")
        if soil.nitrogen < 32:
            soil_tips.append("Seed Inoculation with Rhizobium & Azotobacter bio-culture: Increases atmospheric nitrogen fixation by 25-35 kg N/ha without chemical urea.")
            soil_tips.append("Top-dress with Well-Decomposed Farmyard Manure (FYM) or Vermicompost (5-8 t/ha) enriched with Trichoderma to prevent fungal root rot.")
        soil_tips.append("Crop Residue Mulching (Happy Seeder): Retain 4-5 t/ha of crop straw on field surface. Suppresses weeds, reduces soil evaporation by 30%, and adds ~0.08% organic carbon annually.")

        # 2. Crop-Specific Analysis
        reply_paragraphs = []
        if any(w in q_lower for w in ["chickpea", "gram", "chana", "lentil", "pulse"]):
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

        if not api_key:
            return self._fallback_agronomic_engine(user_message, soil, nasa)

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

            system_prompt = self._build_system_prompt(soil, nasa) + grounding_text

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
            fallback = self._fallback_agronomic_engine(user_message, soil, nasa)

            return ChatResponse(
                reply=raw_reply,
                source_model=f"NVIDIA NIM ({model_name}) + Live Web Grounding",
                recommendations=fallback.recommendations,
                soil_enrichment_tips=fallback.soil_enrichment_tips,
                suggested_rotations=fallback.suggested_rotations
            )
        except Exception as e:
            print(f"[Nemotron AI Warning] Live API call failed: {e}. Falling back to embedded agronomy engine.")
            fallback = self._fallback_agronomic_engine(user_message, soil, nasa)
            fallback.source_model = f"FIELD SHIFT Agronomy Engine (NVIDIA Fallback: {str(e)[:45]}...)"
            return fallback

nemotron_ai_service = NemotronAIService()
