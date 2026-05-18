"""
ML Service models and schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime


class CalibrationPrediction(BaseModel):
    """Calibration date prediction result"""
    sensor_id: int
    predicted_date: datetime
    confidence: float = Field(ge=0, le=1)
    days_until_due: int
    recommendation: str


class AnomalyDetectionResult(BaseModel):
    """Anomaly detection result"""
    sensor_id: int
    is_anomaly: bool
    anomaly_score: float = Field(ge=0, le=1)
    anomaly_type: Optional[str] = None
    details: Dict[str, Any] = {}


class RiskScorePrediction(BaseModel):
    """Risk score prediction result"""
    sensor_id: int
    risk_score: float = Field(ge=0, le=100)
    risk_level: str  # low, medium, high, critical
    factors: Dict[str, float]
    recommendations: List[str]


class ModelConfigUpdate(BaseModel):
    """Model configuration update request"""
    feature_weights: Optional[Dict[str, float]] = None
    alert_thresholds: Optional[Dict[str, float]] = None


class FeedbackRequest(BaseModel):
    """Feedback submission for model improvement"""
    prediction_id: Optional[int] = None
    entity_type: str
    entity_id: int
    is_correct: bool
    comment: Optional[str] = None


class MovementData(BaseModel):
    """Movement data for anomaly detection"""
    timestamp: datetime
    location_id: int
    previous_location_id: Optional[int] = None
    movement_type: str = "transfer"


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: datetime
    version: str = "1.0.0"
