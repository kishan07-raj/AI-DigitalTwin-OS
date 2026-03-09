"""
AI Engine FastAPI Service
Main entry point for all AI services
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

# Import module routes
from digital_twin.model import create_digital_twin_routes
from adaptive_ui.engine import create_adaptive_ui_routes
from self_healing.anomaly_detector import create_self_healing_routes
from self_evolution.meta_learner import create_self_evolution_routes
from cross_domain.modules import create_cross_domain_routes
from insights.prediction_engine import create_prediction_routes

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    logging.info("AI Engine starting up...")
    yield
    # Shutdown
    logging.info("AI Engine shutting down...")

# Create FastAPI app
app = FastAPI(
    title="AI-DigitalTwin Engine",
    description="AI services for Digital Twin OS",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check
@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ai-engine"}

@app.get("/")
async def root():
    return {
        "service": "AI-DigitalTwin Engine",
        "version": "1.0.0",
        "docs": "/docs"
    }

# Include routers
app.include_router(create_digital_twin_routes(app), prefix="/digital-twin", tags=["Digital Twin"])
app.include_router(create_adaptive_ui_routes(app), prefix="/adaptive-ui", tags=["Adaptive UI"])
app.include_router(create_self_healing_routes(app), prefix="/self-healing", tags=["Self-Healing"])
app.include_router(create_self_evolution_routes(app), prefix="/self-evolution", tags=["Self-Evolution"])
app.include_router(create_cross_domain_routes(app), prefix="/cross-domain", tags=["Cross-Domain"])
app.include_router(create_prediction_routes(app), prefix="/prediction", tags=["Prediction Engine"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

