import os
import sqlite3
from datetime import datetime
from typing import Dict, List, Any
import numpy as np

DB_PATH = os.path.join(os.path.dirname(__file__), "omnihealth_prescriptions.db")


def init_posture_db() -> None:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS posture_assessments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reba_score INTEGER,
            risk_level TEXT,
            forward_head_deg REAL,
            lumbar_flexion_deg REAL,
            shoulder_asymmetry_cm REAL,
            hip_flexion_deg REAL,
            clinical_summary TEXT,
            recommended_asanas TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()


init_posture_db()


def calculate_angle_3d(a: List[float], b: List[float], c: List[float]) -> float:
    pa = np.array(a, dtype=np.float64)
    pb = np.array(b, dtype=np.float64)
    pc = np.array(c, dtype=np.float64)
    v1 = pa - pb
    v2 = pc - pb
    norm_v1 = np.linalg.norm(v1)
    norm_v2 = np.linalg.norm(v2)
    if norm_v1 == 0 or norm_v2 == 0:
        return 0.0
    cosine = np.clip(np.dot(v1, v2) / (norm_v1 * norm_v2), -1.0, 1.0)
    return round(float(np.degrees(np.arccos(cosine))), 1)


def calculate_vertical_inclination_3d(point_a: List[float], point_b: List[float]) -> float:
    pa = np.array(point_a, dtype=np.float64)
    pb = np.array(point_b, dtype=np.float64)
    body_vec = pa - pb
    vertical_vec = np.array([0.0, -1.0, 0.0], dtype=np.float64)
    norm_body = np.linalg.norm(body_vec)
    if norm_body == 0:
        return 0.0
    cosine = np.clip(np.dot(body_vec, vertical_vec) / norm_body, -1.0, 1.0)
    return round(float(np.degrees(np.arccos(cosine))), 1)


def get_targeted_yoga_asanas(
    forward_head_deg: float,
    lumbar_flexion_deg: float,
    shoulder_asymmetry_cm: float,
    proximity_warning: bool,
) -> List[Dict[str, Any]]:
    asanas: List[Dict[str, Any]] = []

    if forward_head_deg > 15:
        asanas.append({
            "id": "bhujangasana",
            "sanskritName": "Bhujangasana",
            "englishName": "Cobra Pose (Thoracic & Cervical Extension)",
            "targetArea": "Cervical Spine, Suboccipitals & Tight Pectorals",
            "triggerReason": f"Forward Head Angle elevated ({forward_head_deg}° > 15° threshold)",
            "durationSeconds": 30,
            "steps": [
                "Lie flat on your stomach with palms planted directly under your shoulders and elbows tucked close to your ribs.",
                "Press the tops of your feet and pubic bone gently into the mat to stabilize your lower back.",
                "Inhale and slowly peel your chest forward and upward, keeping your gaze slightly ahead—do not crunch the back of your neck.",
                "Roll your shoulders back and down away from your ears; hold for 5 slow breaths (30 seconds), then exhale down.",
            ],
            "deskModification": "Seated Desk Cobra: Clasp hands behind your lower back while seated, draw shoulder blades together, and lift your sternum for 20 seconds.",
        })
        asanas.append({
            "id": "greeva_sanchalana",
            "sanskritName": "Greeva Sanchalana & Chin Tucks",
            "englishName": "Axial Cervical Retraction & Neck Release",
            "targetArea": "Deep Cervical Flexors & Upper Trapezius",
            "triggerReason": "Counteracts forward screen-gaze shear strain",
            "durationSeconds": 30,
            "steps": [
                "Sit tall at the edge of your chair with feet flat on the floor and crown of the head lifting toward the ceiling.",
                "Gently glide your chin straight backward (creating a subtle double chin) without tilting your head up or down.",
                "Hold the retraction for 5 seconds, then slowly tilt your right ear toward your right shoulder to stretch the left trapezius.",
                "Repeat 3 times per side while breathing steadily through your nose.",
            ],
            "deskModification": "Can be performed directly at your desk every 45 minutes.",
        })

    if lumbar_flexion_deg > 15:
        asanas.append({
            "id": "marjaryasana_bitilasana",
            "sanskritName": "Marjaryasana–Bitilasana",
            "englishName": "Seated or Mat Cat-Cow Spinal Mobilization",
            "targetArea": "Lumbar Intervertebral Discs & Erector Spinae",
            "triggerReason": f"Trunk / Lumbar Flexion elevated ({lumbar_flexion_deg}° > 15° threshold)",
            "durationSeconds": 30,
            "steps": [
                "Sit forward on your chair with hands resting on your knees (or come onto hands and knees on a mat).",
                "Inhale (Cow Pose): Tilt your pelvis forward, gently arch your lower back, widen your collarbones, and lift your chest.",
                "Exhale (Cat Pose): Tuck your tailbone under, draw your navel toward your spine, and round your mid-back smoothly.",
                "Flow slowly between Cow and Cat for 5 full breath cycles to rehydrate lumbar discs.",
            ],
            "deskModification": "Seated Chair Cat-Cow requires zero floor space.",
        })
        asanas.append({
            "id": "ardha_matsyendrasana",
            "sanskritName": "Ardha Matsyendrasana (Chair Variant)",
            "englishName": "Seated Half Spinal Twist",
            "targetArea": "Thoracolumbar Fascia, Obliques & Lower Back",
            "triggerReason": "Relieves prolonged static sitting compression",
            "durationSeconds": 30,
            "steps": [
                "Sit sideways or upright on your chair with both feet grounded hip-width apart.",
                "Inhale and lengthen your spine upward so your ribs lift away from your pelvis.",
                "Exhale and gently rotate your torso to the right, placing your left hand on your outer right thigh and right hand on the chair back.",
                "Hold for 15 seconds per side, lengthening on every inhale and softening into the twist on every exhale.",
            ],
            "deskModification": "Ideal chair-based decompression stretch between meetings.",
        })

    if shoulder_asymmetry_cm > 1.5 or proximity_warning:
        asanas.append({
            "id": "gomukhasana_arms",
            "sanskritName": "Gomukhasana Arms + Tadasana",
            "englishName": "Cow-Face Shoulder Opener & Mountain Re-Centering",
            "targetArea": "Rhomboids, Rotator Cuff & Bilateral Shoulder Symmetry",
            "triggerReason": f"Shoulder asymmetry ({shoulder_asymmetry_cm} cm) or monitor lean detected",
            "durationSeconds": 30,
            "steps": [
                "Stand in Tadasana (Mountain Pose) with weight balanced evenly across both heels and balls of the feet.",
                "Reach your right arm straight up, bend the elbow, and place your palm between your shoulder blades.",
                "Sweep your left arm behind your lower back and reach up toward your right fingers (use a strap or towel if needed).",
                "Keep your ribs tucked in and hold for 15 seconds, then switch arms to equalize shoulder height.",
            ],
            "deskModification": "Perform standing beside your desk to reset bilateral balance.",
        })

    if not asanas:
        asanas.append({
            "id": "tadasana_preventive",
            "sanskritName": "Urdhva Hastasana in Tadasana",
            "englishName": "Upward Salute & Ergonomic Reset",
            "targetArea": "Full-Spine Axial Extension & Shoulder Decompression",
            "triggerReason": "Preventive maintenance for optimal sedentary posture",
            "durationSeconds": 30,
            "steps": [
                "Stand tall with feet hip-width apart and knees unlocked.",
                "Inhale and sweep both arms overhead with palms facing each other and shoulders relaxed away from ears.",
                "Reach upward through your fingertips while grounding firmly through your heels for 5 deep breaths.",
            ],
            "deskModification": "Perform once every hour to prevent postural fatigue.",
        })

    return asanas


def save_posture_record(payload: Dict[str, Any]) -> Dict[str, Any]:
    rula_score = int(payload.get("rulaScore", 1))
    risk_level = str(payload.get("riskLevel", "OPTIMAL ALIGNMENT"))
    fha = float(payload.get("forwardHeadAngle", 0))
    lfa = float(payload.get("lumbarFlexionAngle", 0))
    sac = float(payload.get("shoulderAsymmetryCm", 0))
    hfa = float(payload.get("hipFlexionAngle", 90))
    summary = str(payload.get("generatedSummary", ""))
    proximity = bool(payload.get("proximityWarning", False))

    asanas = get_targeted_yoga_asanas(fha, lfa, sac, proximity)
    asana_names = ", ".join(a["sanskritName"] for a in asanas)

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO posture_assessments
            (reba_score, risk_level, forward_head_deg, lumbar_flexion_deg, shoulder_asymmetry_cm, hip_flexion_deg, clinical_summary, recommended_asanas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (rula_score, risk_level, fha, lfa, sac, hfa, summary, asana_names),
        )
        conn.commit()
        conn.close()
    except Exception:
        pass

    return {
        "success": True,
        "timestamp": datetime.now().isoformat(),
        "recommendedAsanas": asanas,
    }