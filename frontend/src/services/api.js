const API_BASE = "/api";

export async function fetchCurrentSoil() {
  const res = await fetch(`${API_BASE}/sensor/current`);
  if (!res.ok) throw new Error("Failed to fetch soil telemetry");
  return res.json();
}

export async function fetchSoilHistory(limit = 40) {
  const res = await fetch(`${API_BASE}/sensor/history?limit=${limit}`);
  if (!res.ok) throw new Error("Failed to fetch soil history");
  return res.json();
}

export async function fetchNasaObservations(lat = 28.6139, lon = 77.2090) {
  const res = await fetch(`${API_BASE}/nasa/current?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error("Failed to fetch NASA observations");
  return res.json();
}

export async function fetchNasaGibs() {
  const res = await fetch(`${API_BASE}/nasa/gibs`);
  if (!res.ok) throw new Error("Failed to fetch NASA GIBS layers");
  return res.json();
}

export async function fetchRotationStrategies(
  lat = 28.6139,
  lon = 77.2090,
  farmerPriority = "water_conservation",
  waterConstraint = "moderate_tubewell",
  machineryAccess = "zero_till_happy_seeder"
) {
  const params = new URLSearchParams({
    lat,
    lon,
    farmer_priority: farmerPriority,
    water_constraint: waterConstraint,
    machinery_access: machineryAccess
  });
  const res = await fetch(`${API_BASE}/rotations/compare?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch rotation strategies");
  return res.json();
}

export async function fetchScientificWaterBalance(lat = 28.6139, lon = 77.2090) {
  const res = await fetch(`${API_BASE}/scientific/water-balance?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error("Failed to fetch scientific water balance");
  return res.json();
}

export async function fetchForecast(lat = 28.6139, lon = 77.2090) {
  const res = await fetch(`${API_BASE}/predictions/forecast?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error("Failed to fetch predictions");
  return res.json();
}

export async function fetchOnlineLearningStatus() {
  const res = await fetch(`${API_BASE}/ml/online-status`);
  if (!res.ok) throw new Error("Failed to fetch online learning status");
  return res.json();
}

export async function fetchCropProfile() {
  const res = await fetch(`${API_BASE}/crop/profile`);
  if (!res.ok) throw new Error("Failed to fetch crop profile");
  return res.json();
}

export async function setFarmerCrop(crop, sowDate = null, lat = 28.6139, lon = 77.2090) {
  const res = await fetch(`${API_BASE}/crop/set`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ crop, sow_date: sowDate, lat, lon })
  });
  if (!res.ok) throw new Error("Failed to set crop");
  return res.json();
}

export async function updateCropStage(stage) {
  const res = await fetch(`${API_BASE}/crop/stage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage })
  });
  if (!res.ok) throw new Error("Failed to update crop stage");
  return res.json();
}

export async function fetchCropHistory() {
  const res = await fetch(`${API_BASE}/crop/history`);
  if (!res.ok) throw new Error("Failed to fetch crop history");
  return res.json();
}

export async function fetchCropAlerts(lat = 28.6139, lon = 77.2090) {
  const res = await fetch(`${API_BASE}/crop/alerts?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error("Failed to fetch crop threshold alerts");
  return res.json();
}

export async function fetchActiveHazards(lat = 28.6139, lon = 77.2090) {
  const res = await fetch(`${API_BASE}/hazards/active?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error("Failed to fetch active hazards");
  return res.json();
}

export async function fetchMultiWindowForecast(window = "1_month", crop = "Wheat", lat = 28.6139, lon = 77.2090) {
  const params = new URLSearchParams({ window, crop, lat, lon });
  const res = await fetch(`${API_BASE}/forecast/window?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch multi-window forecast");
  return res.json();
}

export async function fetchGroundwaterSeaLevel(lat = 28.6139, lon = 77.2090, elevation_m = 212.0) {
  const res = await fetch(`${API_BASE}/environmental/groundwater-sealevel?lat=${lat}&lon=${lon}&elevation_m=${elevation_m}`);
  if (!res.ok) throw new Error("Failed to fetch groundwater and sea level data");
  return res.json();
}

export async function fetchOrganicFertilizer(crop = "Wheat", lat = 28.6139, lon = 77.2090) {
  const params = new URLSearchParams({ crop, lat, lon });
  const res = await fetch(`${API_BASE}/advisory/organic-fertilizer?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch organic fertilizer advisory");
  return res.json();
}

export async function sendChatMessage(message, apiKey = null) {
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { "X-NVIDIA-API-KEY": apiKey } : {})
    },
    body: JSON.stringify({ message, api_key: apiKey })
  });
  if (!res.ok) throw new Error("Failed to get chat advice");
  return res.json();
}

export async function fetchIsroProfile(lat = 28.7195, lon = 77.1025) {
  const res = await fetch(`${API_BASE}/isro/profile?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error("Failed to fetch ISRO profile");
  return res.json();
}

export function createTelemetryWebSocket(onMessage, onError) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;
  const ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (err) {
      console.error("WS Parse error", err);
    }
  };

  ws.onerror = (err) => {
    if (onError) onError(err);
  };

  return ws;
}
