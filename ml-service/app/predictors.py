"""
ML Service prediction engines
"""
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional

from .models import (
    CalibrationPrediction,
    AnomalyDetectionResult,
    RiskScorePrediction,
)
from .config import settings


class CalibrationPredictor:
    """Predicts next calibration date for sensors"""
    
    def __init__(self):
        self.default_days = settings.calibration_warning_days * 4
    
    def predict(self, sensor_id: int, history: Optional[List[Dict]] = None) -> CalibrationPrediction:
        """
        Predict calibration date based on historical data
        
        In production: use Prophet or similar time-series model
        """
        # Simulate prediction with historical patterns
        base_days = random.randint(280, 400)
        variance = random.randint(-30, 30)
        days_until = max(0, base_days + variance)
        
        predicted_date = datetime.now() + timedelta(days=days_until)
        confidence = random.uniform(0.75, 0.95)
        
        if days_until <= 30:
            recommendation = "URGENT: Schedule calibration immediately"
        elif days_until <= settings.calibration_warning_days:
            recommendation = f"WARNING: Plan calibration within {settings.calibration_warning_days} days"
        else:
            recommendation = "OK: No immediate action required"
        
        return CalibrationPrediction(
            sensor_id=sensor_id,
            predicted_date=predicted_date,
            confidence=confidence,
            days_until_due=days_until,
            recommendation=recommendation
        )


class AnomalyDetector:
    """Detects anomalies in sensor movement patterns"""
    
    def __init__(self):
        self.threshold = settings.anomaly_threshold
    
    def detect(
        self, 
        sensor_id: int, 
        movements: Optional[List[Dict]] = None
    ) -> AnomalyDetectionResult:
        """
        Detect anomalies in movement patterns
        
        In production: use trained ML model (Isolation Forest, Autoencoder, etc.)
        """
        anomaly_score = random.uniform(0, 1)
        is_anomaly = anomaly_score > self.threshold
        
        anomaly_type = None
        details = {}
        
        if is_anomaly:
            anomaly_types = [
                "unexpected_location",
                "unusual_timing", 
                "frequent_movement",
                "position_drift"
            ]
            anomaly_type = random.choice(anomaly_types)
            details = {
                "detected_at": datetime.now().isoformat(),
                "severity": "high" if anomaly_score > 0.85 else "medium",
                "movement_count": len(movements) if movements else 0,
            }
        
        return AnomalyDetectionResult(
            sensor_id=sensor_id,
            is_anomaly=is_anomaly,
            anomaly_score=anomaly_score,
            anomaly_type=anomaly_type,
            details=details
        )


class RiskScorer:
    """Calculates comprehensive risk scores for sensors"""
    
    def __init__(self):
        self.feature_weights = {
            "days_since_calibration": 0.30,
            "anomaly_history": 0.25,
            "movement_frequency": 0.20,
            "environment_severity": 0.25,
        }
        self.thresholds = {
            "low": 25,
            "medium": 50,
            "high": 75,
            "critical": 90,
        }
    
    def update_weights(self, weights: Dict[str, float]):
        """Update feature weights"""
        self.feature_weights.update(weights)
    
    def update_thresholds(self, thresholds: Dict[str, float]):
        """Update risk level thresholds"""
        self.thresholds.update(thresholds)
    
    def _get_risk_level(self, score: float) -> str:
        """Determine risk level from score"""
        if score >= self.thresholds["critical"]:
            return "critical"
        elif score >= self.thresholds["high"]:
            return "high"
        elif score >= self.thresholds["medium"]:
            return "medium"
        else:
            return "low"
    
    def calculate(
        self, 
        sensor_id: int, 
        sensor_data: Optional[Dict] = None
    ) -> RiskScorePrediction:
        """
        Calculate comprehensive risk score
        
        In production: use ensemble of models
        """
        # Simulate feature calculation
        features = {
            "days_since_calibration": random.uniform(0, 1),
            "anomaly_history": random.uniform(0, 1),
            "movement_frequency": random.uniform(0, 1),
            "environment_severity": random.uniform(0, 1),
        }
        
        # Weighted sum
        risk_score = sum(
            features[k] * self.feature_weights.get(k, 0.25) 
            for k in features
        ) * 100
        
        risk_level = self._get_risk_level(risk_score)
        
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


# Singleton instances
calibration_predictor = CalibrationPredictor()
anomaly_detector = AnomalyDetector()
risk_scorer = RiskScorer()
