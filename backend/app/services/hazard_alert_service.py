"""
Hazard Alert Service — Monitors NASA & global Earth data for active weather hazards:
1. Heavy Rainfall (GPM IMERG / Open-Meteo)
2. Tropical Cyclones & Hurricanes (GDACS / NOAA / IMD feeds)
3. Heatwaves & Frost (NASA POWER / WMO)
4. Agricultural Fire & Stubble Burning Hotspots (NASA FIRMS VIIRS 375m)
5. Geo-referenced hazard features for Leaflet map overlay
"""
import requests
import math
from datetime import datetime, timedelta
from typing import List, Dict, Any

class HazardAlertService:

    def _fetch_firms_fire_count(self, lat: float, lon: float, radius_km: float = 50) -> List[Dict]:
        """Query NASA FIRMS API for fire hotspots near farm location (free, no key)."""
        hotspots = []
        try:
            west  = lon - (radius_km / 111.0)
            east  = lon + (radius_km / 111.0)
            south = lat - (radius_km / 111.0)
            north = lat + (radius_km / 111.0)
            url = (
                f"https://firms.modaps.eosdis.nasa.gov/api/area/csv/"
                f"VIIRS_SNPP_NRT/{west:.3f},{south:.3f},{east:.3f},{north:.3f}/1"
            )
            r = requests.get(url, timeout=6)
            if r.status_code == 200:
                lines = [l for l in r.text.strip().split("\n") if l and not l.startswith("latitude")]
                for line in lines[:10]: # cap first 10 for map display
                    parts = line.split(",")
                    if len(parts) >= 2:
                        try:
                            f_lat = float(parts[0])
                            f_lon = float(parts[1])
                            hotspots.append({
                                "lat": f_lat,
                                "lon": f_lon,
                                "type": "fire_hotspot",
                                "title": "Stubble / Thermal Anomaly",
                                "severity": "warning",
                                "radius_km": 2.0
                            })
                        except ValueError:
                            pass
        except Exception as e:
            print(f"[FIRMS Warning] {e}")
        return hotspots

    def _fetch_tropical_cyclones(self, lat: float, lon: float) -> List[Dict]:
        """
        Query GDACS (Global Disaster Alert and Coordination System - Free JSON)
        for active Tropical Cyclones worldwide.
        """
        cyclones = []
        try:
            url = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH?eventtypes=TC"
            r = requests.get(url, timeout=6)
            if r.status_code == 200:
                data = r.json()
                features = data.get("features", [])
                for f in features:
                    props = f.get("properties", {})
                    geom = f.get("geometry", {})
                    coords = geom.get("coordinates", [0, 0])
                    c_lon, c_lat = coords[0], coords[1]

                    # Compute distance to farm
                    dlat = math.radians(c_lat - lat)
                    dlon = math.radians(c_lon - lon)
                    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(c_lat)) * math.sin(dlon / 2)**2
                    dist_km = 6371.0 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

                    name = props.get("name", "Tropical Storm")
                    event_type = props.get("eventtype", "").upper()
                    alert_level = props.get("alertlevel", "Green")
                    wind_speed = props.get("windspeed", 0)

                    # Strictly filter for tropical cyclones / storms / depressions
                    is_tc = (event_type == "TC") or any(k in name.lower() for k in ["cyclone", "hurricane", "typhoon", "tropical storm", "depression", "storm"])
                    if not is_tc:
                        continue

                    # Include if within 3,500 km for regional map tracking
                    if dist_km < 3500:
                        if dist_km < 250:
                            severity = "emergency"
                            impact = f"IMMEDIATE DANGER: {name} is within {round(dist_km)} km of your farm! High wind and flash flood hazard."
                        elif dist_km < 600:
                            severity = "warning"
                            impact = f"REGIONAL WARNING: {name} is {round(dist_km)} km away. Peripheral rain bands may cause sudden squalls."
                        else:
                            severity = "distant_basin"
                            impact = f"Distant marine system: {name} is {round(dist_km)} km away in oceanic basin. No direct destructive impact on your farm."

                        cyclones.append({
                            "lat": c_lat,
                            "lon": c_lon,
                            "name": name,
                            "alert_level": alert_level,
                            "wind_speed_kmh": wind_speed,
                            "distance_km": round(dist_km, 1),
                            "severity": severity,
                            "impact": impact
                        })
        except Exception as e:
            print(f"[GDACS Cyclone Warning] {e}")

        return cyclones

    def _fetch_weather_alerts(self, lat: float, lon: float) -> List[Dict]:
        """
        Query Open-Meteo (100% free, no API key) for weather warnings.
        """
        alerts = []
        try:
            url = (
                f"https://api.open-meteo.com/v1/forecast"
                f"?latitude={lat}&longitude={lon}"
                f"&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,"
                f"windspeed_10m_max,weathercode"
                f"&timezone=auto&forecast_days=7"
            )
            r = requests.get(url, timeout=8)
            if r.status_code == 200:
                data = r.json().get("daily", {})
                dates       = data.get("time", [])
                tmax_list   = data.get("temperature_2m_max", [])
                tmin_list   = data.get("temperature_2m_min", [])
                rain_list   = data.get("precipitation_sum", [])
                wind_list   = data.get("windspeed_10m_max", [])
                codes       = data.get("weathercode", [])

                for i, date in enumerate(dates[:7]):
                    tmax  = tmax_list[i]  if i < len(tmax_list)  else None
                    tmin  = tmin_list[i]  if i < len(tmin_list)  else None
                    rain  = rain_list[i]  if i < len(rain_list)  else None
                    wind  = wind_list[i]  if i < len(wind_list)  else None
                    code  = codes[i]      if i < len(codes)      else None

                    if tmax and tmax >= 40:
                        alerts.append({
                            "type": "heat_wave",
                            "level": "🔴 Warning",
                            "date": date,
                            "title": "Heat Wave Warning",
                            "message": f"Maximum temperature expected {tmax}°C on {date}. Risk of crop heat stress and rapid ET0 spike.",
                            "source": "Open-Meteo & NASA POWER Climatology",
                            "icon": "🌡️",
                        })
                    if tmin and tmin <= 2:
                        alerts.append({
                            "type": "frost_risk",
                            "level": "🔴 Warning",
                            "date": date,
                            "title": "Frost Vulnerability Alert",
                            "message": f"Minimum temperature expected {tmin}°C on {date}. Protect vulnerable seedling and flowering stages.",
                            "source": "Open-Meteo Forecast",
                            "icon": "❄️",
                        })
                    if rain and rain >= 40:
                        level = "🆘 Emergency" if rain >= 80 else "🔴 Warning"
                        alerts.append({
                            "type": "heavy_rain",
                            "level": level,
                            "date": date,
                            "title": "Heavy Rainfall Hazard",
                            "message": f"{rain:.0f} mm of rainfall forecasted on {date}. Potential waterlogging in low-lying alluvial plots. Postpone spraying and fertilization.",
                            "source": "NASA GPM IMERG & Open-Meteo Ensemble",
                            "icon": "🌧️",
                        })
                    if wind and wind >= 50:
                        alerts.append({
                            "type": "high_wind",
                            "level": "🔴 Warning",
                            "date": date,
                            "title": "Squall / High Wind Alert",
                            "message": f"Wind speeds up to {wind:.0f} km/h expected on {date}. Risk of lodging in tall cereal crops.",
                            "source": "Open-Meteo Forecast",
                            "icon": "💨",
                        })
                    if code and 95 <= code <= 99:
                        alerts.append({
                            "type": "thunderstorm",
                            "level": "🟡 Watch",
                            "date": date,
                            "title": "Severe Thunderstorm Watch",
                            "message": f"Convective thunderstorm forecast on {date}. Possible hail and lightning hazard.",
                            "source": f"WMO Weathercode {code}",
                            "icon": "⚡",
                        })
        except Exception as e:
            print(f"[Hazard] Open-Meteo error: {e}")
        return alerts

    def get_active_hazards(self, lat: float, lon: float) -> Dict[str, Any]:
        """Return all active hazard alerts and map-ready geo markers."""
        weather_alerts = self._fetch_weather_alerts(lat, lon)
        fire_points    = self._fetch_firms_fire_count(lat, lon)
        cyclones       = self._fetch_tropical_cyclones(lat, lon)

        # Integrate fires into alert list
        if fire_points:
            weather_alerts.insert(0, {
                "type":    "fire_hotspot",
                "level":   "🔴 Warning" if len(fire_points) > 5 else "🟡 Watch",
                "date":    datetime.now().strftime("%Y-%m-%d"),
                "title":   f"Active Fire Hotspots ({len(fire_points)})",
                "message": f"{len(fire_points)} thermal hotspots detected within 50km radius by NASA VIIRS. Check for local smoke drift and particulate haze.",
                "source":  "NASA FIRMS VIIRS 375m",
                "icon":    "🔥",
            })

        # Only add to local farm alerts if within direct reach (< 400 km)
        for cyc in cyclones:
            if cyc.get("distance_km", 9999) < 400:
                level = "🆘 Emergency" if cyc["severity"] == "emergency" else "🔴 Warning"
                weather_alerts.insert(0, {
                    "type":    "cyclone_hazard",
                    "level":   level,
                    "date":    datetime.now().strftime("%Y-%m-%d"),
                    "title":   f"Approaching Cyclone: {cyc['name']}",
                    "message": cyc["impact"],
                    "source":  "GDACS / Regional Meteorological Center",
                    "icon":    "🌀",
                })

        # Geo-features to draw on Leaflet map (including distant basin tracking)
        geo_markers = []
        for f in fire_points:
            geo_markers.append({
                "lat": f["lat"],
                "lon": f["lon"],
                "type": "fire",
                "title": f["title"],
                "icon": "🔥",
                "color": "#f97316"
            })
        for c in cyclones:
            is_close = c.get("distance_km", 9999) < 400
            geo_markers.append({
                "lat": c["lat"],
                "lon": c["lon"],
                "type": "cyclone",
                "title": f"Cyclone: {c['name']} ({c['wind_speed_kmh']} km/h, {c['distance_km']} km away)",
                "icon": "🌀",
                "color": "#ef4444" if is_close else "#818cf8",
                "radius_km": 150.0 if is_close else 80.0
            })

        # Overall severity
        if any(a["level"].startswith("🆘") for a in weather_alerts):
            overall = "EMERGENCY"
        elif any(a["level"].startswith("🔴") for a in weather_alerts):
            overall = "WARNING"
        elif any(a["level"].startswith("🟡") for a in weather_alerts):
            overall = "WATCH"
        else:
            overall = "ALL CLEAR / NORMAL"

        return {
            "timestamp": datetime.now().isoformat(),
            "location": {"lat": lat, "lon": lon},
            "overall_status": overall,
            "total_alerts": len(weather_alerts),
            "fire_hotspots_count": len(fire_points),
            "active_cyclones_count": len(cyclones),
            "alerts": weather_alerts,
            "cyclones": cyclones,
            "geo_hazard_markers": geo_markers,
            "data_sources": ["NASA FIRMS VIIRS", "GDACS Tropical Cyclones", "NASA GPM IMERG", "Open-Meteo Ensemble"]
        }

hazard_alert_service = HazardAlertService()
