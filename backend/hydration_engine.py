import sqlite3
from datetime import date, datetime
from typing import Dict, List, Any, Optional, Tuple

import httpx

from prescription_rag_engine import (
    DB_PATH,
    FORMULARY_KNOWLEDGE,
    _fetch_pubmed_extracts,
)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"


def init_hydration_db() -> None:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS hydration_daily_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            log_date TEXT NOT NULL,
            amount_ml INTEGER NOT NULL,
            beverage_type TEXT DEFAULT 'Plain Water',
            logged_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


init_hydration_db()


def get_latest_synced_medications() -> Tuple[List[Dict[str, Any]], Optional[int]]:
    """
    Reads the most recently verified prescription scan from SQLite (Module 2)
    and maps each drug to its canonical FORMULARY_KNOWLEDGE hydration profile.
    """
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute(
            "SELECT verified_drugs_json, daily_hydration_ml FROM verified_scan_history ORDER BY id DESC LIMIT 1"
        )
        row = cursor.fetchone()
        conn.close()
    except Exception:
        return [], None

    if not row or not row[0]:
        return [], None

    drug_names = [d.strip() for d in row[0].split(",") if d.strip()]
    synced_meds: List[Dict[str, Any]] = []

    for name in drug_names:
        kb = FORMULARY_KNOWLEDGE.get(name, {})
        synced_meds.append({
            "medicationName": name,
            "composition": kb.get("composition", name),
            "drugClass": kb.get("drugClass", "Verified Prescription Agent"),
            "extraHydrationMl": kb.get("extraHydrationMl", 250),
            "perDoseWaterMl": kb.get("perDoseWaterMl", 250),
            "hydrationRule": kb.get(
                "hydrationRule",
                "Take with 250 mL plain water and add +250 mL/day to support renal drug clearance.",
            ),
            "pubmedQuery": kb.get("pubmedQuery", f"{name} hydration renal clearance"),
        })

    return synced_meds, row[1]


def get_today_hydration_status() -> Dict[str, Any]:
    """
    Returns today's logged fluid entries, total consumed mL, and latest Module 2 prescriptions.
    """
    today_str = date.today().isoformat()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, amount_ml, beverage_type, logged_at FROM hydration_daily_logs WHERE log_date = ? ORDER BY id DESC",
        (today_str,),
    )
    rows = cursor.fetchall()
    conn.close()

    logs = [
        {
            "id": r[0],
            "amountMl": r[1],
            "beverageType": r[2],
            "loggedAt": r[3],
        }
        for r in rows
    ]
    total_consumed = sum(item["amountMl"] for item in logs)
    synced_meds, rx_goal = get_latest_synced_medications()

    return {
        "date": today_str,
        "consumedMl": total_consumed,
        "logs": logs,
        "syncedMedications": synced_meds,
        "lastPrescriptionGoalMl": rx_goal,
    }


def log_fluid_intake(amount_ml: int, beverage_type: str = "Plain Water") -> Dict[str, Any]:
    today_str = date.today().isoformat()
    time_str = datetime.now().strftime("%I:%M %p")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO hydration_daily_logs (log_date, amount_ml, beverage_type, logged_at) VALUES (?, ?, ?, ?)",
        (today_str, int(amount_ml), beverage_type, time_str),
    )
    conn.commit()
    conn.close()
    return get_today_hydration_status()


def undo_last_fluid_log() -> Dict[str, Any]:
    today_str = date.today().isoformat()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM hydration_daily_logs WHERE id = (SELECT id FROM hydration_daily_logs WHERE log_date = ? ORDER BY id DESC LIMIT 1)",
        (today_str,),
    )
    conn.commit()
    conn.close()
    return get_today_hydration_status()


def reset_today_fluid_logs() -> Dict[str, Any]:
    today_str = date.today().isoformat()
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM hydration_daily_logs WHERE log_date = ?", (today_str,))
    conn.commit()
    conn.close()
    return get_today_hydration_status()


async def _fetch_live_weather(lat: float = 12.9716, lon: float = 77.5946) -> Dict[str, Any]:
    """
    Fetches live ambient temperature and relative humidity via Open-Meteo (no API key).
    Defaults to Bengaluru (12.9716, 77.5946) if browser coordinates are not supplied.
    """
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": "temperature_2m,relative_humidity_2m",
    }
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(OPEN_METEO_URL, params=params, timeout=3.5)
            if resp.status_code == 200:
                current = resp.json().get("current", {})
                temp_c = float(current.get("temperature_2m", 26.5))
                humidity = int(current.get("relative_humidity_2m", 62))
                return {
                    "tempC": round(temp_c, 1),
                    "humidity": humidity,
                    "source": "Live Open-Meteo Telemetry",
                }
    except Exception:
        pass

    return {
        "tempC": 26.5,
        "humidity": 62,
        "source": "Regional Ambient Baseline (26.5°C)",
    }


def _build_hourly_pacing_schedule(target_ml: int, synced_meds: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """
    Distributes total fluid volume across waking hours with a gentle evening taper
    after 8:30 PM to prevent sleep disruption, aligned with Module 2 medication windows.
    """
    morning_meds = ", ".join(m["medicationName"] for m in synced_meds[:2]) if synced_meds else "Morning hydration"
    evening_meds = ", ".join(m["medicationName"] for m in synced_meds[-2:]) if synced_meds else "Evening dose"

    slots = [
        ("07:30 AM", 0.16, f"Wake-up rehydration + empty-stomach meds ({morning_meds})"),
        ("10:30 AM", 0.18, "Mid-morning steady intake (supports renal glomerular filtration)"),
        ("01:00 PM", 0.18, "Pre/post-lunch fluid intake"),
        ("04:00 PM", 0.20, "Afternoon peak evaporative replacement"),
        ("06:30 PM", 0.16, "Early evening hydration buffer"),
        ("08:30 PM", 0.12, f"Night medication glass ({evening_meds}) — taper fluids afterward"),
    ]

    schedule = []
    for time_label, ratio, note in slots:
        slot_ml = int(round((target_ml * ratio) / 25.0) * 25)
        schedule.append({
            "time": time_label,
            "volumeMl": slot_ml,
            "glasses": f"{round(slot_ml / 250, 1)} glass",
            "guidance": note,
        })
    return schedule


async def compute_clinical_hydration_plan(
    weight_kg: float = 70.0,
    activity_level: str = "moderate",
    has_fever: bool = False,
    has_gi_loss: bool = False,
    custom_meds: Optional[List[str]] = None,
    lat: float = 12.9716,
    lon: float = 77.5946,
) -> Dict[str, Any]:
    """
    Evidence-based clinical hydration calculator grounded in EFSA/IOM adult water
    requirements (32 mL/kg baseline), live ambient weather evaporative load,
    febrile/GI loss replacement, and Module 2 medication renal clearance buffers.
    """
    clamped_weight = max(25.0, min(200.0, float(weight_kg)))

    # 1. Physiological Baseline (32 mL/kg EFSA/IOM practical fluid reference)
    baseline_ml = round(clamped_weight * 32)

    # 2. Activity Sweat & Metabolic Output Adjustment
    activity_map = {
        "sedentary": (0, "Sedentary (Desk / Minimal Exertion)"),
        "moderate": (350, "Moderate (30–45 min Daily Walking / Light Activity)"),
        "active": (750, "High Output (60+ min Vigorous Exercise / Outdoor Labor)"),
    }
    activity_ml, activity_label = activity_map.get(activity_level.lower(), (350, "Moderate Activity"))

    # 3. Live Environmental Evaporative Load
    weather = await _fetch_live_weather(lat, lon)
    temp_c = weather["tempC"]
    humidity = weather["humidity"]

    if temp_c >= 35.0:
        climate_ml = 650
    elif temp_c >= 30.0:
        climate_ml = 400
    elif temp_c >= 24.0:
        climate_ml = 200
    else:
        climate_ml = 0

    if humidity >= 75 and temp_c >= 26.0:
        climate_ml += 100

    # 4. Acute Clinical Fluid Loss Modifiers
    illness_ml = 0
    illness_notes = []
    if has_fever:
        illness_ml += 400
        illness_notes.append("+400 mL febrile insensible sweat/respiratory replacement")
    if has_gi_loss:
        illness_ml += 500
        illness_notes.append("+500 mL gastrointestinal fluid & electrolyte replacement (prefer ORS)")

    # 5. Active Medication Renal & Absorption Buffer (Synced with Module 2 SQLite)
    synced_meds, _ = get_latest_synced_medications()
    if custom_meds:
        existing_names = {m["medicationName"].lower() for m in synced_meds}
        for cname in custom_meds:
            if cname.lower() not in existing_names:
                kb = FORMULARY_KNOWLEDGE.get(cname, {})
                synced_meds.append({
                    "medicationName": cname,
                    "composition": kb.get("composition", cname),
                    "drugClass": kb.get("drugClass", "Selected Medication"),
                    "extraHydrationMl": kb.get("extraHydrationMl", 250),
                    "perDoseWaterMl": kb.get("perDoseWaterMl", 250),
                    "hydrationRule": kb.get(
                        "hydrationRule",
                        "Take with 250 mL plain water and add +250 mL/day to support renal clearance.",
                    ),
                    "pubmedQuery": kb.get("pubmedQuery", f"{cname} hydration renal clearance"),
                })

    if synced_meds:
        buffers = [m["extraHydrationMl"] for m in synced_meds]
        # Primary highest-need drug buffer + 100 mL per co-prescribed drug (prevents overhydration)
        medication_ml = min(650, max(buffers) + 100 * max(0, len(buffers) - 1))
    else:
        medication_ml = 0

    total_target_ml = int(round((baseline_ml + activity_ml + climate_ml + illness_ml + medication_ml) / 25.0) * 25)
    target_liters = round(total_target_ml / 1000, 2)

    # 6. Fetch Live Verifiable PubMed Literature Extracts
    pubmed_query = (
        synced_meds[0]["pubmedQuery"]
        if synced_meds
        else "human hydration fluid intake renal function clinical guidelines"
    )
    async with httpx.AsyncClient() as client:
        pubmed_extracts = await _fetch_pubmed_extracts(client, pubmed_query)

    pacing_schedule = _build_hourly_pacing_schedule(total_target_ml, synced_meds)
    today_status = get_today_hydration_status()

    return {
        "success": True,
        "dailyGoalMl": total_target_ml,
        "targetLiters": target_liters,
        "totalGlasses250Ml": round(total_target_ml / 250, 1),
        "breakdown": {
            "physiologicalBaselineMl": baseline_ml,
            "baselineFormula": f"{clamped_weight:.0f} kg × 32 mL/kg (EFSA/IOM adult fluid standard)",
            "activityMl": activity_ml,
            "activityLabel": activity_label,
            "climateMl": climate_ml,
            "weatherSummary": f"{temp_c}°C, {humidity}% humidity ({weather['source']})",
            "illnessMl": illness_ml,
            "illnessSummary": "; ".join(illness_notes) if illness_notes else "None selected",
            "medicationMl": medication_ml,
        },
        "syncedMedications": synced_meds,
        "hourlyPacingSchedule": pacing_schedule,
        "pubmedExtracts": pubmed_extracts,
        "evidenceStandards": [
            "EFSA Panel on Dietetic Products, Nutrition and Allergies (NDA) — Dietary Reference Values for Water",
            "Institute of Medicine (IOM) — Dietary Reference Intakes for Water, Potassium, Sodium, Chloride",
            "KDIGO Clinical Practice Guideline for Acute Kidney Injury (Volume & Nephrotoxin Management)",
        ],
        "todayStatus": today_status,
    }