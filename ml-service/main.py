from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import random

app = FastAPI(
    title="GeoControl ML Service",
    description="AI/ML predictions for sensor anomaly detection and calibration forecasting",
    version="1.0.0",
)

# --- Models ---

class CalibrationPrediction(BaseModel):
    sensor_id: int
    predicted_date: datetime
    confidence: float = Field(ge=0, le=1)
    days_until_due: int
    recommendation: str

class AnomalyDetectionResult(BaseModel):
    sensor_id: int
    is_anomaly: bool
    anomaly_score: float = Field(ge=0, le=1)
    anomaly_type: Optional[str] = None
    details: Dict[str, Any] = {}

class RiskScorePrediction(BaseModel):
    sensor_id: int
    risk_score: float = Field(ge=0, le=100)
    risk_level: str  # low, medium, high, critical
    factors: Dict[str, float]
    recommendations: List[str]

class ModelConfigUpdate(BaseModel):
    feature_weights: Optional[Dict[str, float]] = None
    alert_thresholds: Optional[Dict[str, float]] = None

class FeedbackRequest(BaseModel):
    prediction_id: Optional[int] = None
    entity_type: str
    entity_id: int
    is_correct: bool
    comment: Optional[str] = None

# --- In-memory storage (replace with DB in production) ---
predictions_store: Dict[int, Any] = {}
model_configs = {
    "calibration_forecast": {
        "feature_weights": {
            "days_since_last_calibration": 0.35,
            "usage_hours": 0.25,
            "temperature_variance": 0.20,
            "movement_count": 0.20,
        },
        "alert_thresholds": {
            "days_warning": 90,
            "confidence_min": 0.7,
        }
    },
    "risk_scorer": {
        "feature_weights": {
            "days_since_calibration": 0.30,
            "anomaly_history": 0.25,
            "movement_frequency": 0.20,
            "environment_severity": 0.25,
        },
        "alert_thresholds": {
            "low": 25,
            "medium": 50,
            "high": 75,
            "critical": 90,
        }
    },
    "anomaly_detector": {
        "feature_weights": {
            "position_deviation": 0.40,
            "unexpected_movement": 0.35,
            "timing_anomaly": 0.25,
        },
        "alert_thresholds": {
            "anomaly_score_threshold": 0.7,
        }
    }
}

# --- Helper functions ---

def get_risk_level(score: float) -> str:
    thresholds = model_configs["risk_scorer"]["alert_thresholds"]
    if score >= thresholds["critical"]:
        return "critical"
    elif score >= thresholds["high"]:
        return "high"
    elif score >= thresholds["medium"]:
        return "medium"
    else:
        return "low"

def simulate_calibration_prediction(sensor_id: int) -> CalibrationPrediction:
    """Simulate calibration date prediction using historical patterns"""
    # In production: load actual model and predict
    base_days = random.randint(280, 400)
    variance = random.randint(-30, 30)
    days_until = base_days + variance
    
    predicted_date = datetime.now() + timedelta(days=days_until)
    confidence = random.uniform(0.75, 0.95)
    
    if days_until <= 30:
        recommendation = "URGENT: Schedule calibration immediately"
    elif days_until <= 90:
        recommendation = "WARNING: Plan calibration within 90 days"
    else:
        recommendation = "OK: No immediate action required"
    
    return CalibrationPrediction(
        sensor_id=sensor_id,
        predicted_date=predicted_date,
        confidence=confidence,
        days_until_due=days_until,
        recommendation=recommendation
    )

def simulate_anomaly_detection(sensor_id: int, movements: List[Dict]) -> AnomalyDetectionResult:
    """Detect anomalies in sensor movement patterns"""
    # In production: use trained ML model
    anomaly_score = random.uniform(0, 1)
    is_anomaly = anomaly_score > model_configs["anomaly_detector"]["alert_thresholds"]["anomaly_score_threshold"]
    
    anomaly_type = None
    details = {}
    
    if is_anomaly:
        anomaly_types = ["unexpected_location", "unusual_timing", "frequent_movement", "position_drift"]
        anomaly_type = random.choice(anomaly_types)
        details = {
            "detected_at": datetime.now().isoformat(),
            "severity": "high" if anomaly_score > 0.85 else "medium",
        }
    
    return AnomalyDetectionResult(
        sensor_id=sensor_id,
        is_anomaly=is_anomaly,
        anomaly_score=anomaly_score,
        anomaly_type=anomaly_type,
        details=details
    )

def calculate_risk_score(sensor_id: int, sensor_data: Dict) -> RiskScorePrediction:
    """Calculate comprehensive risk score for a sensor"""
    # In production: use ensemble of models
    weights = model_configs["risk_scorer"]["feature_weights"]
    
    # Simulate feature calculation
    features = {
        "days_since_calibration": random.uniform(0, 1),
        "anomaly_history": random.uniform(0, 1),
        "movement_frequency": random.uniform(0, 1),
        "environment_severity": random.uniform(0, 1),
    }
    
    # Weighted sum
    risk_score = sum(features[k] * weights.get(k, 0.25) for k in features) * 100
    
    risk_level = get_risk_level(risk_score)
    
    recommendations = []
    if risk_level in ["high", "critical"]:
        recommendations.append("Schedule immediate inspection")
        recommendations.append("Review recent movement history")
    if risk_level == "critical":
        recommendations.append("Consider temporary deactivation")
    elif risk_level == "low":
        recommendations.append("Continue normal monitoring")
    
    return RiskScorePrediction(
        sensor_id=sensor_id,
        risk_score=risk_score,
        risk_level=risk_level,
        factors=features,
        recommendations=recommendations
    )

# --- Endpoints ---

@app.get("/")
async def root():
    return {"message": "GeoControl ML Service is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/predict/calibration/{sensor_id}", response_model=CalibrationPrediction)
async def predict_calibration(sensor_id: int):
    """Predict next calibration date for a sensor"""
    prediction = simulate_calibration_prediction(sensor_id)
    
    # Store prediction
    pred_id = len(predictions_store) + 1
    predictions_store[pred_id] = {
        "type": "calibration",
        "sensor_id": sensor_id,
        "prediction": prediction.dict(),
        "created_at": datetime.now().isoformat()
    }
    
    return prediction

@app.post("/detect/anomaly/{sensor_id}", response_model=AnomalyDetectionResult)
async def detect_anomaly(sensor_id: int, movements: Optional[List[Dict]] = None):
    """Detect anomalies in sensor movement patterns"""
    movements = movements or []
    result = simulate_anomaly_detection(sensor_id, movements)
    
    # Store prediction
    pred_id = len(predictions_store) + 1
    predictions_store[pred_id] = {
        "type": "anomaly",
        "sensor_id": sensor_id,
        "prediction": result.dict(),
        "created_at": datetime.now().isoformat()
    }
    
    return result

@app.get("/sensors/{sensor_id}/risk", response_model=RiskScorePrediction)
async def get_risk_score(sensor_id: int, sensor_data: Optional[Dict] = None):
    """Get comprehensive risk score for a sensor"""
    sensor_data = sensor_data or {}
    prediction = calculate_risk_score(sensor_id, sensor_data)
    
    return prediction

@app.get("/ai/models/{model_name}/config")
async def get_model_config(model_name: str):
    """Get configuration for a specific ML model"""
    if model_name not in model_configs:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")
    
    return {
        "model_name": model_name,
        "config": model_configs[model_name]
    }

@app.put("/ai/models/{model_name}/config")
async def update_model_config(model_name: str, config_update: ModelConfigUpdate):
    """Update model configuration (admin only)"""
    if model_name not in model_configs:
        raise HTTPException(status_code=404, detail=f"Model '{model_name}' not found")
    
    if config_update.feature_weights:
        model_configs[model_name]["feature_weights"].update(config_update.feature_weights)
    
    if config_update.alert_thresholds:
        model_configs[model_name]["alert_thresholds"].update(config_update.alert_thresholds)
    
    return {
        "message": f"Configuration updated for model '{model_name}'",
        "config": model_configs[model_name],
        "updated_at": datetime.now().isoformat()
    }

@app.post("/ai/feedback")
async def submit_feedback(feedback: FeedbackRequest):
    """Submit feedback on AI predictions for model improvement"""
    feedback_id = len(predictions_store) + 1000  # Separate ID space
    
    # Store feedback for later model retraining
    predictions_store[feedback_id] = {
        "type": "feedback",
        **feedback.dict(),
        "created_at": datetime.now().isoformat()
    }
    
    return {
        "message": "Feedback recorded successfully",
        "feedback_id": feedback_id
    }

@app.get("/ai/alerts/pending")
async def get_pending_alerts():
    """Get list of sensors requiring attention (calibration due soon, high risk, etc.)"""
    # Simulate alerts - in production, query from DB/cache
    alerts = []
    
    # Simulate some alerts
    for i in range(random.randint(0, 5)):
        sensor_id = random.randint(1, 100)
        alert_type = random.choice(["calibration_soon", "high_risk", "anomaly_detected"])
        
        if alert_type == "calibration_soon":
            alerts.append({
                "sensor_id": sensor_id,
                "type": "calibration_soon",
                "severity": "warning",
                "message": f"Sensor {sensor_id} calibration due within 90 days",
                "action_required": "Create calibration task"
            })
        elif alert_type == "high_risk":
            alerts.append({
                "sensor_id": sensor_id,
                "type": "high_risk",
                "severity": "high",
                "message": f"Sensor {sensor_id} has elevated risk score",
                "action_required": "Review and inspect"
            })
        else:
            alerts.append({
                "sensor_id": sensor_id,
                "type": "anomaly_detected",
                "severity": "critical",
                "message": f"Anomalous movement detected for sensor {sensor_id}",
                "action_required": "Investigate immediately"
            })
    
    return {"alerts": alerts, "count": len(alerts)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
