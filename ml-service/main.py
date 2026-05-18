"""
GeoControl ML Service - AI/ML predictions for sensor monitoring
"""
from fastapi import FastAPI, HTTPException, Depends
from datetime import datetime
from typing import List, Dict, Any, Optional

from .config import settings
from .models import (
    CalibrationPrediction,
    AnomalyDetectionResult,
    RiskScorePrediction,
    ModelConfigUpdate,
    FeedbackRequest,
    HealthResponse,
)
from .predictors import (
    calibration_predictor,
    anomaly_detector,
    risk_scorer,
)

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="AI/ML predictions for sensor anomaly detection and calibration forecasting",
    version="1.0.0",
    debug=settings.debug,
)

# In-memory storage for predictions and feedback
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
            "days_warning": settings.calibration_warning_days,
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
            "anomaly_score_threshold": settings.anomaly_threshold,
        }
    }
}


@app.get("/", response_model=Dict[str, str])
async def root():
    """Root endpoint - service info"""
    return {
        "message": "GeoControl ML Service is running",
        "version": "1.0.0",
        "status": "healthy"
    }


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(),
        version="1.0.0"
    )


@app.post("/predict/calibration/{sensor_id}", response_model=CalibrationPrediction)
async def predict_calibration(sensor_id: int):
    """Predict next calibration date for a sensor"""
    prediction = calibration_predictor.predict(sensor_id)
    
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
async def detect_anomaly(
    sensor_id: int, 
    movements: Optional[List[Dict]] = None
):
    """Detect anomalies in sensor movement patterns"""
    movements = movements or []
    result = anomaly_detector.detect(sensor_id, movements)
    
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
async def get_risk_score(
    sensor_id: int, 
    sensor_data: Optional[Dict] = None
):
    """Get comprehensive risk score for a sensor"""
    sensor_data = sensor_data or {}
    prediction = risk_scorer.calculate(sensor_id, sensor_data)
    
    return prediction


@app.get("/ai/models/{model_name}/config")
async def get_model_config(model_name: str):
    """Get configuration for a specific ML model"""
    if model_name not in model_configs:
        raise HTTPException(
            status_code=404, 
            detail=f"Model '{model_name}' not found"
        )
    
    return {
        "model_name": model_name,
        "config": model_configs[model_name]
    }


@app.put("/ai/models/{model_name}/config")
async def update_model_config(
    model_name: str, 
    config_update: ModelConfigUpdate
):
    """Update model configuration (admin only)"""
    if model_name not in model_configs:
        raise HTTPException(
            status_code=404, 
            detail=f"Model '{model_name}' not found"
        )
    
    if config_update.feature_weights:
        model_configs[model_name]["feature_weights"].update(
            config_update.feature_weights
        )
    
    if config_update.alert_thresholds:
        model_configs[model_name]["alert_thresholds"].update(
            config_update.alert_thresholds
        )
    
    return {
        "message": f"Configuration updated for model '{model_name}'",
        "config": model_configs[model_name],
        "updated_at": datetime.now().isoformat()
    }


@app.post("/ai/feedback")
async def submit_feedback(feedback: FeedbackRequest):
    """Submit feedback on AI predictions for model improvement"""
    feedback_id = len(predictions_store) + 1000
    
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
    """Get list of sensors requiring attention"""
    import random
    
    alerts = []
    
    # Simulate some alerts
    for i in range(random.randint(0, 5)):
        sensor_id = random.randint(1, 100)
        alert_type = random.choice([
            "calibration_soon", 
            "high_risk", 
            "anomaly_detected"
        ])
        
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
