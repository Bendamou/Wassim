export type AIStatus = "CALIBRATING" | "NORMAL" | "CRITICAL_ANOMALY";

export interface MonitorPayload {
  user_id: string;
  heart_rate: number;
  is_moving: boolean;
}

export interface AnalysisResult {
  status: AIStatus;
  alert: boolean;
  message?: string;
  deviation?: number;
}

export interface MonitorResponse {
  timestamp: string;
  user_id: string;
  input_hr: number;
  analysis: AnalysisResult;
}

const API_BASE = '/pulseguard-api';

export async function checkHealth() {
  const res = await fetch(`${API_BASE}/`);
  if (!res.ok) throw new Error("API is offline");
  return res.json();
}

export async function sendReading(payload: MonitorPayload): Promise<MonitorResponse> {
  const res = await fetch(`${API_BASE}/monitor`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to send reading");
  return res.json();
}
