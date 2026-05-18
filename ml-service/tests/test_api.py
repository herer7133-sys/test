"""
Tests for ML Service
"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta


class TestHealthEndpoints:
    """Test health and root endpoints"""
    
    def test_root(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["version"] == "1.0.0"
    
    def test_health_check(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data


class TestCalibrationPrediction:
    """Test calibration prediction endpoints"""
    
    def test_predict_calibration(self, client):
        sensor_id = 123
        response = client.post(f"/predict/calibration/{sensor_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["sensor_id"] == sensor_id
        assert "predicted_date" in data
        assert "confidence" in data
        assert 0 <= data["confidence"] <= 1
        assert "days_until_due" in data
        assert "recommendation" in data


class TestAnomalyDetection:
    """Test anomaly detection endpoints"""
    
    def test_detect_anomaly_no_movements(self, client):
        sensor_id = 456
        response = client.post(f"/detect/anomaly/{sensor_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["sensor_id"] == sensor_id
        assert "is_anomaly" in data
        assert "anomaly_score" in data
        assert 0 <= data["anomaly_score"] <= 1
    
    def test_detect_anomaly_with_movements(self, client):
        sensor_id = 789
        movements = [
            {"timestamp": "2024-01-01T10:00:00", "location_id": 1},
            {"timestamp": "2024-01-01T11:00:00", "location_id": 2},
        ]
        response = client.post(
            f"/detect/anomaly/{sensor_id}",
            json={"movements": movements}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["sensor_id"] == sensor_id


class TestRiskScore:
    """Test risk score endpoints"""
    
    def test_get_risk_score(self, client):
        sensor_id = 999
        response = client.get(f"/sensors/{sensor_id}/risk")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["sensor_id"] == sensor_id
        assert "risk_score" in data
        assert 0 <= data["risk_score"] <= 100
        assert "risk_level" in data
        assert data["risk_level"] in ["low", "medium", "high", "critical"]
        assert "factors" in data
        assert "recommendations" in data


class TestModelConfig:
    """Test model configuration endpoints"""
    
    def test_get_model_config_valid(self, client):
        model_name = "risk_scorer"
        response = client.get(f"/ai/models/{model_name}/config")
        
        assert response.status_code == 200
        data = response.json()
        assert data["model_name"] == model_name
        assert "config" in data
    
    def test_get_model_config_invalid(self, client):
        model_name = "nonexistent_model"
        response = client.get(f"/ai/models/{model_name}/config")
        
        assert response.status_code == 404
    
    def test_update_model_config_weights(self, client):
        model_name = "risk_scorer"
        update_data = {
            "feature_weights": {
                "new_feature": 0.5
            }
        }
        response = client.put(
            f"/ai/models/{model_name}/config",
            json=update_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "config" in data
        assert "updated_at" in data
    
    def test_update_model_config_thresholds(self, client):
        model_name = "anomaly_detector"
        update_data = {
            "alert_thresholds": {
                "anomaly_score_threshold": 0.8
            }
        }
        response = client.put(
            f"/ai/models/{model_name}/config",
            json=update_data
        )
        
        assert response.status_code == 200


class TestFeedback:
    """Test feedback endpoints"""
    
    def test_submit_feedback(self, client):
        feedback_data = {
            "entity_type": "sensor",
            "entity_id": 123,
            "is_correct": True,
            "comment": "Prediction was accurate"
        }
        response = client.post("/ai/feedback", json=feedback_data)
        
        assert response.status_code == 200
        data = response.json()
        assert "feedback_id" in data
        assert data["message"] == "Feedback recorded successfully"


class TestAlerts:
    """Test alerts endpoints"""
    
    def test_get_pending_alerts(self, client):
        response = client.get("/ai/alerts/pending")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "alerts" in data
        assert "count" in data
        assert isinstance(data["alerts"], list)
        assert data["count"] == len(data["alerts"])
        
        # Check alert structure if any exist
        if data["count"] > 0:
            alert = data["alerts"][0]
            assert "sensor_id" in alert
            assert "type" in alert
            assert "severity" in alert
            assert "message" in alert
            assert "action_required" in alert


@pytest.fixture
def client():
    """Create test client"""
    from main import app
    with TestClient(app) as c:
        yield c
