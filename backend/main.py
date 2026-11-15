import os
import io
import re
import json
import pickle
import sqlite3
import requests
import httpx
import numpy as np
import pytesseract
from PIL import Image
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware

try:
    import cv2
except ImportError:
    cv2 = None

from voice_rag_engine import build_grouped_clinical_report

# Configure Windows Tesseract OCR executable path if present
if os.path.exists(r"C:\Program Files\Tesseract-OCR\tesseract.exe"):
    pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# 1. Initialize FastAPI App FIRST
app = FastAPI(title="OmniHealth Unified Enterprise Backend", version="40.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

OPENFDA_API_URL = "https://api.fda.gov/drug/label.json"
DB_FILE = os.path.join(os.path.dirname(__file__), "omnihealth_prescriptions.db")
MODEL_CACHE_FILE = os.path.join(os.path.dirname(__file__), "prescription_learning_cache.pkl")


def init_db():
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS learned_prescriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            raw_keyword TEXT UNIQUE,
            drug_name TEXT,
            dosage TEXT,
            frequency TEXT,
            purpose TEXT,
            warnings TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


init_db()


def load_pkl_model() -> dict:
    if os.path.exists(MODEL_CACHE_FILE):
        try:
            with open(MODEL_CACHE_FILE, "rb") as f:
                return pickle.load(f)
        except Exception:
            return {}
    return {}


def save_pkl_model(cache: dict):
    try:
        with open(MODEL_CACHE_FILE, "wb") as f:
            pickle.dump(cache, f)
    except Exception:
        pass


@app.get("/")
def health_check():
    return {"status": "OmniHealth Unified Clinical Backend Active", "port": 8000}


# =====================================================================
# MODULE 1: Voice Triage & Physician HPI Clinical Utility
# =====================================================================
from fastapi import Body, HTTPException
from voice_rag_engine import build_grouped_clinical_report

@app.post("/api/caregiver-agent")
async def caregiver_agent(payload: dict = Body(...)):
    spoken_text = payload.get("transcript", "").strip()
    previous_history = payload.get("history", [])
    screening_answers = payload.get("screeningAnswers", {})
    pain_score = payload.get("painScore")

    if not spoken_text and not previous_history and not pain_score:
        raise HTTPException(status_code=400, detail="Patient input is required.")

    full_narrative_context = " . ".join(
        [h.get("text", "") for h in previous_history if isinstance(h, dict) and h.get("text")]
        + ([spoken_text] if spoken_text else [])
    ).strip()

    structured_report = build_grouped_clinical_report(
        full_narrative=full_narrative_context,
        screening_answers=screening_answers,
        pain_score=pain_score,
    )

    return {
        "success": True,
        "patientSpoken": spoken_text,
        "cumulativeNarrative": full_narrative_context,
        "caregiverResponse": structured_report,
    }

# =====================================================================
# MODULE 2: Prescription Scanner & OpenFDA RAG Pipeline
# =====================================================================
from typing import Optional
from fastapi import FastAPI, UploadFile, File, Form, Body, HTTPException
from prescription_rag_engine import analyze_prescription_slip, register_handwriting_correction


@app.post("/api/parse-prescription-rag")
async def parse_prescription_rag(
    file: Optional[UploadFile] = File(None),
    manual_text: str = Form(""),
):
    """
    Module 2: Zero-Hallucination Prescription Handwriting Classifier (.joblib) + OpenFDA & PubMed RAG
    """
    try:
        image_bytes = await file.read() if file else None
        if not image_bytes and not manual_text.strip():
            raise HTTPException(status_code=400, detail="Please upload a prescription image or enter prescription text.")

        result = await analyze_prescription_slip(
            image_bytes=image_bytes,
            manual_text=manual_text,
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prescription RAG Pipeline Error: {str(e)}")


@app.post("/api/prescription-feedback")
async def prescription_feedback(payload: dict = Body(...)):
    """
    Active Learning Endpoint: Saves user-verified handwriting corrections to SQLite
    and retrains models/prescription_handwriting_model.joblib immediately.
    """
    ocr_pattern = payload.get("ocrPattern", "").strip()
    corrected_drug = payload.get("correctedDrug", "").strip()

    if not ocr_pattern or not corrected_drug:
        raise HTTPException(status_code=400, detail="Both ocrPattern and correctedDrug are required.")

    learned = register_handwriting_correction(ocr_pattern, corrected_drug)
    return {
        "success": True,
        "message": f"Learned handwriting pattern '{learned['learnedPattern']}' → '{learned['mappedDrug']}' and retrained model.",
        "learned": learned,
    }

# =====================================================================
# MODULE 3: Clinical Hydration & Renal Safety Calculator
# =====================================================================
from hydration_engine import (
    compute_clinical_hydration_plan,
    get_today_hydration_status,
    log_fluid_intake,
    undo_last_fluid_log,
    reset_today_fluid_logs,
)


@app.post("/api/calculate-hydration")
async def calculate_hydration(payload: dict = Body(...)):
    """
    Module 3: Evidence-Based Hydration & Renal Safety Engine
    Syncs with Module 2 verified prescriptions in SQLite, live Open-Meteo weather, and PubMed.
    """
    try:
        return await compute_clinical_hydration_plan(
            weight_kg=float(payload.get("weightKg", 70)),
            activity_level=str(payload.get("activityLevel", "moderate")),
            has_fever=bool(payload.get("hasFever", False)),
            has_gi_loss=bool(payload.get("hasGiLoss", False)),
            custom_meds=payload.get("customMeds", []),
            lat=float(payload.get("lat", 12.9716)),
            lon=float(payload.get("lon", 77.5946)),
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hydration Calculation Error: {str(e)}")


@app.get("/api/hydration/status")
async def hydration_status():
    return {"success": True, **get_today_hydration_status()}


@app.post("/api/hydration/log")
async def hydration_log(payload: dict = Body(...)):
    amount_ml = int(payload.get("amountMl", 250))
    beverage_type = str(payload.get("beverageType", "Plain Water"))
    return {"success": True, **log_fluid_intake(amount_ml, beverage_type)}


@app.post("/api/hydration/undo")
async def hydration_undo():
    return {"success": True, **undo_last_fluid_log()}


@app.post("/api/hydration/reset")
async def hydration_reset():
    return {"success": True, **reset_today_fluid_logs()}


# =====================================================================
# MODULE 4: 3D Kinematic Posture & Ergonomic Screener
# =====================================================================
from posture_engine import save_posture_record


@app.post("/api/posture/analyze-kinematics")
async def analyze_posture_kinematics(payload: dict = Body(...)):
    """
    Module 4: Saves 3D MediaPipe ergonomic screening metrics to SQLite and returns
    matched Yoga Asana prescriptions for sedentary workers.
    """
    try:
        return save_posture_record(payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Posture Kinematics Error: {str(e)}")

# =====================================================================
# MODULE 5: Stress Playground & Calming Hub
# =====================================================================
from stress_companion import generate_care_companion_response, get_random_wellness_joke


@app.get("/api/stress-playground/joke")
async def get_wellness_joke():
    """Module 5: Returns lighthearted clinical and wellness humor."""
    return get_random_wellness_joke()


@app.post("/api/stress-playground/affirmation")
async def get_soothing_affirmation(payload: dict = Body(...)):
    """Module 5: Backward-compatible soothing affirmation endpoint."""
    return generate_care_companion_response(payload)


@app.post("/api/stress-playground/care-companion")
async def care_companion_checkin(payload: dict = Body(...)):
    """Module 5: Empathetic patient care companion & worry-release validation."""
    return generate_care_companion_response(payload)