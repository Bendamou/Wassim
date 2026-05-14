from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import numpy as np
from datetime import datetime
from typing import List

app = FastAPI(title="PulseGuard AI Backend")

# Data Model for incoming requests
class HeartData(BaseModel):
    user_id: str
    heart_rate: int
    is_moving: bool = False

# Database simulation (In real life, this would be Redis or MongoDB)
user_history = {}

def analyze_pulse(uid: str, current_hr: int, moving: bool):
    """The AI Logic Core"""
    if uid not in user_history:
        user_history[uid] = []
    
    history = user_history[uid]
    history.append(current_hr)
    
    # Keep only last 20 readings for memory efficiency
    if len(history) > 20:
        history.pop(0)

    if len(history) < 10:
        return {"status": "CALIBRATING", "alert": False}

    # AI Calculation: Moving Average
    avg_hr = np.mean(history[:-1])
    deviation = abs(current_hr - avg_hr)

    # Smart Logic: Ignore spikes if user is moving (exercise)
    # Trigger alert ONLY if deviation is high while resting
    if deviation > 20 and not moving:
        return {
            "status": "CRITICAL_ANOMALY",
            "alert": True,
            "message": "Abnormal spike detected during rest",
            "deviation": float(deviation)
        }
    
    return {"status": "NORMAL", "alert": False}

@app.post("/monitor")
async def monitor_pulse(data: HeartData):
    """Endpoint for Smartwatch/App to send data"""
    result = analyze_pulse(data.user_id, data.heart_rate, data.is_moving)
    
    return {
        "timestamp": datetime.now().isoformat(),
        "user_id": data.user_id,
        "input_hr": data.heart_rate,
        "analysis": result
    }

@app.get("/")
def home():
    return {"message": "PulseGuard AI Engine is Online"}
