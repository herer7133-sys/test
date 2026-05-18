"""
Configuration settings for ML Service
"""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """ML Service configuration"""
    
    # Application
    app_name: str = "GeoControl ML Service"
    debug: bool = False
    log_level: str = "INFO"
    
    # Redis
    redis_host: str = "redis"
    redis_port: int = 6379
    redis_password: Optional[str] = None
    
    # Model paths
    model_path: str = "/app/models"
    
    # Thresholds
    anomaly_threshold: float = 0.7
    risk_alert_threshold: float = 75.0
    calibration_warning_days: int = 90
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
