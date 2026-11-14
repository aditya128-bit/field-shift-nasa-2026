"""
Multi-Window Time-Series Forecasting Service for FIELD SHIFT
Trains on 20-year daily NASA POWER dataset (2005-2024, 7,305 daily records)
Supports windows: 1-Month (30d), 2-Month (60d), 5-Month (150d / Season), 1-Year (365d)
Provides crop-lifecycle alignment, heat/drought stress detection, and water balance.
"""
import os
import math
import numpy as np
import pandas as pd
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional

from .online_learning_service import online_learning_service

DATA_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "../data/nasa_power_2005_2024.csv"))

class MultiWindowForecaster:
    def __init__(self):
        self.climatology: Dict[int, Dict[str, float]] = {}
        self.is_trained = False
        self._load_and_train()

    def _load_and_train(self):
        """Build daily climatology models from 20-year NASA POWER archive."""
        if not os.path.exists(DATA_FILE):
            print(f"[MultiWindowForecaster Warning] Data file {DATA_FILE} not found.")
            return

        try:
            df = pd.read_csv(DATA_FILE)
            df['date_dt'] = pd.to_datetime(df['date'].astype(str), format='%Y%m%d')
            df['day_of_year'] = df['date_dt'].dt.dayofyear

            # Filter out sentinel missing values (-999.0)
            numeric_cols = ['T2M', 'T2M_MAX', 'T2M_MIN', 'PRECTOTCORR', 'RH2M', 'GWETROOT', 'GWETTOP', 'ALLSKY_SFC_SW_DWN', 'WS2M']
            for col in numeric_cols:
                df[col] = df[col].replace(-999.0, np.nan)
                df[col] = df[col].ffill().bfill()

            # Group by day of year across 2005-2024
            grouped = df.groupby('day_of_year')
            for doy, group in grouped:
                self.climatology[doy] = {
                    't_mean': float(group['T2M'].mean()),
                    't_max': float(group['T2M_MAX'].mean()),
                    't_min': float(group['T2M_MIN'].mean()),
                    't_max_p90': float(group['T2M_MAX'].quantile(0.90)),
                    't_min_p10': float(group['T2M_MIN'].quantile(0.10)),
                    'precip_mean': float(group['PRECTOTCORR'].mean()),
                    'precip_p90': float(group['PRECTOTCORR'].quantile(0.90)),
                    'precip_prob': float((group['PRECTOTCORR'] > 1.0).mean() * 100),
                    'gwetroot_mean': float(group['GWETROOT'].mean()),
                    'gwetroot_min': float(group['GWETROOT'].min()),
                    'solar_mean': float(group['ALLSKY_SFC_SW_DWN'].mean()),
                    'wind_mean': float(group['WS2M'].mean()),
                    'rh_mean': float(group['RH2M'].mean())
                }

            self.is_trained = True
            print(f"[MultiWindowForecaster] Successfully fitted 20-year climatology model ({len(self.climatology)} day-of-year curves).")
        except Exception as e:
            print(f"[MultiWindowForecaster Error] Fitting failed: {e}")

    def forecast(
        self,
        window: str = "1_month",
        current_nasa: Optional[Dict] = None,
        crop_name: str = "wheat",
        crop_sow_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate time-series forecast for specified horizon:
        - 1_month: 30 days daily
        - 2_months: 60 days daily
        - 5_months: 150 days (full crop season)
        - 1_year: 365 days
        """
        window_days_map = {
            "7_days": 7,
            "1_month": 30,
            "2_months": 60,
            "5_months": 150,
            "1_year": 365
        }
        total_days = window_days_map.get(window, 30)
        start_date = datetime.now(timezone.utc)
        
        # Recent bias adjustment (Kalman-style anchor from real-time NASA reading)
        temp_bias = 0.0
        moist_bias = 0.0
        if current_nasa:
            current_doy = start_date.timetuple().tm_yday
            clim_now = self.climatology.get(current_doy, {})
            if 'temp_2m' in current_nasa and 't_mean' in clim_now:
                temp_bias = float(current_nasa['temp_2m']) - clim_now['t_mean']
            if 'root_zone_moisture' in current_nasa and 'gwetroot_mean' in clim_now:
                moist_bias = float(current_nasa['root_zone_moisture']) - clim_now['gwetroot_mean']

        # Decay bias over time (short-term persistence fades into long-term climatology)
        decay_half_life = 14.0  # days

        # Ingest multi-day projections from online incremental learning engine
        online_moist_preds = online_learning_service.predict_multi_day(total_days)

        points = []
        accumulated_rain = 0.0
        heat_stress_days = 0
        frost_risk_days = 0
        moisture_deficit_days = 0
        total_et0 = 0.0

        for day in range(total_days):
            target_dt = start_date + timedelta(days=day)
            doy = target_dt.timetuple().tm_yday
            clim = self.climatology.get(doy, self.climatology.get(1, {}))

            decay_factor = np.exp(-day / decay_half_life)
            adj_temp_mean = round(clim.get('t_mean', 24.0) + (temp_bias * decay_factor), 2)
            adj_temp_max = round(clim.get('t_max', 30.0) + (temp_bias * decay_factor), 2)
            adj_temp_min = round(clim.get('t_min', 18.0) + (temp_bias * decay_factor), 2)

            # Online learning blended moisture projection
            online_m = online_moist_preds[day] if day < len(online_moist_preds) else 0.28
            online_weight = float(np.clip(0.70 * np.exp(-day / 21.0), 0.25, 0.70))
            clim_m = clim.get('gwetroot_mean', 0.28) + (moist_bias * decay_factor)
            adj_gwetroot = round(float(np.clip(online_weight * online_m + (1.0 - online_weight) * clim_m, 0.08, 0.90)), 3)

            # Daily rain expectation and probability
            rain_val = clim.get('precip_mean', 0.5)
            # Add stochastic synoptic spell every few weeks
            if (day % 14 in [3, 4]) and clim.get('precip_prob', 10) > 20:
                rain_val = clim.get('precip_p90', 5.0)

            rain_val = round(rain_val, 2)
            accumulated_rain += rain_val

            # FAO-56 simplified ET0 estimate
            solar_mj = clim.get('solar_mean', 18.0)
            et0_est = round(max(1.2, 0.0023 * (adj_temp_mean + 17.8) * np.sqrt(max(1.0, adj_temp_max - adj_temp_min)) * (solar_mj * 0.408)), 2)
            total_et0 += et0_est

            # Alerts
            is_heat_stress = bool(adj_temp_max >= 38.0)
            is_frost = bool(adj_temp_min <= 3.0)
            is_deficit = bool(adj_gwetroot < 0.18)

            if is_heat_stress: heat_stress_days += 1
            if is_frost: frost_risk_days += 1
            if is_deficit: moisture_deficit_days += 1

            points.append({
                "day_index": int(day + 1),
                "date": str(target_dt.strftime("%Y-%m-%d")),
                "month_name": str(target_dt.strftime("%b")),
                "t_mean": float(adj_temp_mean),
                "t_max": float(adj_temp_max),
                "t_min": float(adj_temp_min),
                "soil_moisture": float(adj_gwetroot),
                "precipitation_mm": float(rain_val),
                "accumulated_rain_mm": float(round(accumulated_rain, 1)),
                "et0_mm": float(et0_est),
                "rain_prob_pct": int(clim.get('precip_prob', 15)),
                "solar_radiation_mj": float(round(solar_mj, 1)),
                "heat_stress": bool(is_heat_stress),
                "frost_risk": bool(is_frost)
            })

        # Downsample for larger windows if needed for chart clarity
        summary_points = points
        if total_days > 60:
            # Aggregate weekly for 5 months & 1 year
            step = 7
            summary_points = []
            for i in range(0, len(points), step):
                chunk = points[i:i+step]
                summary_points.append({
                    "day_index": int(i + 1),
                    "date": str(chunk[0]["date"]),
                    "month_name": str(chunk[0]["month_name"]),
                    "t_mean": float(round(float(np.mean([p["t_mean"] for p in chunk])), 1)),
                    "t_max": float(round(float(np.max([p["t_max"] for p in chunk])), 1)),
                    "t_min": float(round(float(np.min([p["t_min"] for p in chunk])), 1)),
                    "soil_moisture": float(round(float(np.mean([p["soil_moisture"] for p in chunk])), 3)),
                    "precipitation_mm": float(round(float(np.sum([p["precipitation_mm"] for p in chunk])), 1)),
                    "accumulated_rain_mm": float(chunk[-1]["accumulated_rain_mm"]),
                    "et0_mm": float(round(float(np.sum([p["et0_mm"] for p in chunk])), 1)),
                    "rain_prob_pct": int(np.mean([p["rain_prob_pct"] for p in chunk])),
                    "heat_stress": bool(any(p["heat_stress"] for p in chunk)),
                    "frost_risk": bool(any(p["frost_risk"] for p in chunk))
                })

        # Water balance surplus/deficit
        water_balance_net = round(accumulated_rain - total_et0, 1)

        # Build 7-day weekly actionable breakdown
        weekly_schedule = []
        step_days = 7
        num_weeks = int(np.ceil(total_days / float(step_days)))
        for w in range(num_weeks):
            w_start = w * step_days
            w_end = min(total_days, (w + 1) * step_days)
            w_points = points[w_start:w_end]
            if not w_points:
                continue
            w_rain = round(float(sum(p["precipitation_mm"] for p in w_points)), 1)
            w_et0 = round(float(sum(p["et0_mm"] for p in w_points)), 1)
            w_tmax = round(float(max(p["t_max"] for p in w_points)), 1)
            w_moist = round(float(np.mean([p["soil_moisture"] for p in w_points])) * 100.0, 1)
            w_deficit = round(w_rain - w_et0, 1)
            w_heat = sum(1 for p in w_points if p["heat_stress"])

            if w_deficit < -15 and w_moist < 22:
                rec = "🚨 Urgent irrigation needed: Severe water deficit & root-zone dry."
            elif w_deficit < -10:
                rec = "💧 Schedule 1 light irrigation (15-20 mm) mid-week."
            elif w_heat > 0:
                rec = "🔥 Evening light sprinkling to counter midday heat spikes."
            elif w_rain > 20:
                rec = "🌧️ High rain expected: Maintain field drainage & pause watering."
            else:
                rec = "🌿 Adequate soil moisture: Hold irrigation cycle."

            weekly_schedule.append({
                "week_num": w + 1,
                "label": f"Week {w + 1} ({w_points[0]['date']} to {w_points[-1]['date']})",
                "start_date": w_points[0]["date"],
                "end_date": w_points[-1]["date"],
                "total_rain_mm": w_rain,
                "total_et0_mm": w_et0,
                "net_water_balance_mm": w_deficit,
                "avg_soil_moisture_pct": w_moist,
                "peak_temp_c": w_tmax,
                "heat_stress_days": w_heat,
                "recommended_action": rec
            })

        # Risk level determination
        overall_risk = "LOW"
        if heat_stress_days > 10 or frost_risk_days > 3 or moisture_deficit_days > (total_days * 0.4):
            overall_risk = "HIGH"
        elif heat_stress_days > 3 or frost_risk_days > 0 or moisture_deficit_days > (total_days * 0.2):
            overall_risk = "MODERATE"

        # Key agrometeorological insights for LLM and farmer
        insights = []
        if heat_stress_days > 0:
            insights.append(f"⚠️ {heat_stress_days} days of elevated thermal stress (Tmax ≥ 38°C) detected across the forecast window.")
        if frost_risk_days > 0:
            insights.append(f"❄️ {frost_risk_days} days with frost vulnerability (Tmin ≤ 3°C). Prepare protective mulch or smoking.")
        if water_balance_net < -50:
            insights.append(f"💧 Cumulative water deficit of {abs(water_balance_net):.0f} mm (ET0 exceeds rain). Supplemental irrigation required.")
        else:
            insights.append(f"🌧️ Positive or balanced moisture regime (+{water_balance_net:.0f} mm net balance).")

        return {
            "window": window,
            "total_days": total_days,
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": (start_date + timedelta(days=total_days)).strftime("%Y-%m-%d"),
            "crop": crop_name.title(),
            "metrics": {
                "avg_temperature_c": round(float(np.mean([p["t_mean"] for p in points])), 1),
                "total_expected_rain_mm": round(accumulated_rain, 1),
                "total_et0_mm": round(total_et0, 1),
                "net_water_balance_mm": water_balance_net,
                "heat_stress_days": heat_stress_days,
                "frost_risk_days": frost_risk_days,
                "moisture_deficit_days": moisture_deficit_days,
                "overall_risk_level": overall_risk
            },
            "weekly_schedule": weekly_schedule,
            "online_learning": {
                "status": "Active (Streaming & Adapting)",
                "algorithm": "SGDRegressor with Decadal Transfer Learning",
                "baseline_dataset": "NASA POWER Decadal 2005-2024 (7,305 daily records)",
                "decadal_r2": online_learning_service.decadal_r2_score,
                "stream_ticks": online_learning_service.stream_ticks,
                "rolling_rmse": round(float(np.sqrt(online_learning_service.ema_mse)), 5),
                "update_cadence": "Weekly Automated Checkpoint + In-situ Stream"
            },
            "insights": insights,
            "chart_data": summary_points,
            "raw_daily_count": len(points)
        }

multi_window_forecaster = MultiWindowForecaster()
