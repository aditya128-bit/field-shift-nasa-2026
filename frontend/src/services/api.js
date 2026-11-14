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

export async function fetchRotationStrategies(lat = 28.6139, lon = 77.2090) {
  const res = await fetch(`${API_BASE}/rotations/compare?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error("Failed to fetch rotation strategies");
  return res.json();
}

export async function fetchForecast(lat = 28.6139, lon = 77.2090) {
  const res = await fetch(`${API_BASE}/predictions/forecast?lat=${lat}&lon=${lon}`);
  if (!res.ok) throw new Error("Failed to fetch predictions");
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
