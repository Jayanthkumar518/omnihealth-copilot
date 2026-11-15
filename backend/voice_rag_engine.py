import os
import re
import joblib
from typing import Dict, List, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

MODEL_DIR = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH = os.path.join(MODEL_DIR, "voice_intake_classifier.joblib")

TRAINING_DATA = [
    ("started yesterday morning", "onset"),
    ("since two days ago", "onset"),
    ("from the past 2 days", "onset"),
    ("began last night suddenly", "onset"),
    ("for the past 3 hours", "onset"),
    ("pain is 8 out of 10", "severity"),
    ("my pain intensity is about 7", "severity"),
    ("rated 7/10 severe throbbing", "severity"),
    ("mild discomfort around 3", "severity"),
    ("unbearable sharp pain level 9", "severity"),
    ("worse when bending over or bright light", "triggers"),
    ("become better when I lie down", "triggers"),
    ("not much movement helps", "triggers"),
    ("triggered after eating spicy food", "triggers"),
    ("feels better when resting in a dark room", "triggers"),
    ("also having fever and body heat", "autonomic"),
    ("I feel weak and nauseous", "autonomic"),
    ("feeling giddy dizzy and nauseous", "autonomic"),
    ("chills sweating and vomiting", "autonomic"),
    ("shortness of breath and fatigue", "autonomic"),
    ("took dolo 650 an hour ago", "medications"),
    ("haven't taken any medicines", "medications"),
    ("taking ibuprofen 400mg for pain", "medications"),
    ("had paracetamol and combiflam", "medications"),
    ("not taking any medicines yet", "medications"),
]

CLINICAL_RAG_GLOSSARY = {
    "giddy": {
        "clinical": "Dizziness / Lightheadedness (Vertigo screening indicated)",
        "plain": "Feeling dizzy, unsteady, or lightheaded",
    },
    "body heat": {
        "clinical": "Subjective Pyrexia / Febrile sensation",
        "plain": "Feeling unusually warm or feverish",
    },
    "dolo 650": {
        "clinical": "Paracetamol (Acetaminophen) 650 mg",
        "plain": "Fever and pain-relief tablet (Acetaminophen 650 mg)",
    },
    "dolo": {
        "clinical": "Paracetamol (Acetaminophen)",
        "plain": "Common fever and pain-relief medication",
    },
    "combiflam": {
        "clinical": "Ibuprofen 400 mg + Paracetamol 325 mg (NSAID combination)",
        "plain": "Combined anti-inflammatory and pain-relief tablet",
    },
    "loose motion": {
        "clinical": "Acute Diarrhea / Increased stool frequency",
        "plain": "Frequent watery bowel movements",
    },
    "paining": {
        "clinical": "Localized nociceptive discomfort / pain",
        "plain": "Experiencing active pain or soreness",
    },
    "gas": {
        "clinical": "Dyspepsia / Abdominal bloating & flatulence",
        "plain": "Stomach fullness, acidity, or trapped gas",
    },
    "throbbing": {
        "clinical": "Pulsatile / vascular-type pain quality",
        "plain": "Beating or pulsing pain rhythm",
    },
}

INTAKE_SCHEMA = [
    {
        "id": "onset",
        "title": "Onset & Timeline",
        "shortLabel": "When It Started",
        "voicePrompt": "When did these symptoms first start, and have they changed since then?",
        "patterns": [
            r"\b(?:from the past|for the past|since|started|began)\b[^,.!?]{1,35}",
            r"\b(?:\d+|one|two|three|four|five|six|seven)\s+(?:days?|hours?|weeks?|months?)\s*(?:ago|back)?\b",
            r"\b(?:yesterday|today|last night|this morning)\b[^,.!?]{0,20}",
        ],
    },
    {
        "id": "severity",
        "title": "Pain / Discomfort Intensity (1–10)",
        "shortLabel": "Severity (1–10)",
        "voicePrompt": "On a scale from 1 to 10, how strong is your discomfort right now?",
        "patterns": [
            r"\b(?:pain\s*(?:intensity|level|score)?\s*(?:is|around|about)?\s*(?:10|[1-9])(?:\s*(?:out of|/)\s*10)?)\b",
            r"\b(?:10|[1-9])\s*(?:out of|/)\s*10\b",
            r"\b(?:intensity|severity|level)\s*(?:is|of|around|about)?\s*(?:10|[1-9])\b",
            r"\b(?:mild|moderate|severe|unbearable|intense)\s+(?:pain|ache|headache|discomfort)\b",
        ],
    },
    {
        "id": "triggers",
        "title": "What Makes It Worse or Better",
        "shortLabel": "Triggers & Relief",
        "voicePrompt": "What makes the symptoms feel worse or better, such as movement, food, light, or rest?",
        "patterns": [
            r"\b(?:becomes?|gets?|feels?|is)?\s*(?:better|worse|relieved|triggered)\s+(?:when|with|after|while|on)\b[^,.!?]{1,45}",
            r"\b(?:not much movement|lying down|lie down|resting|rest|dark room|bright light|bending|eating|walking)\b[^,.!?]{0,25}",
        ],
    },
    {
        "id": "autonomic",
        "title": "Related Symptoms (Fever, Dizziness, Nausea)",
        "shortLabel": "Other Symptoms",
        "voicePrompt": "Are you also having any fever, body heat, dizziness, nausea, or breathing trouble?",
        "patterns": [
            r"\b(?:i\s+feel|feeling|also\s+having|have|with)\s+(?:very\s+)?(?:weak|nauseous|nausea|dizzy|giddy|fever|body heat|chills|vomiting|tired|fatigued|breathless)(?:\s+and\s+(?:weak|nauseous|nausea|dizzy|giddy|fever|body heat|chills|vomiting|tired|fatigued))?\b",
            r"\b(?:no\s+(?:fever|dizziness|nausea|vomiting))\b",
            r"\b(?:fever|body heat|giddy|dizzy|dizziness|nausea|nauseous|vomit|chills|sweating|weakness|weak)\b",
        ],
    },
    {
        "id": "medications",
        "title": "Medicines Taken Recently",
        "shortLabel": "Medicines Taken",
        "voicePrompt": "Have you taken any tablets or home remedies for this yet, such as Dolo, paracetamol, or ibuprofen?",
        "patterns": [
            r"\b(?:haven't|havent|have not|not)\s+taken\s+any\s+(?:medicines?|medications?|tablets?|pills?)\b",
            r"\b(?:took|taking|had|on)\s+(?:dolo\s*\d*|paracetamol|ibuprofen|combiflam|aspirin|tablets?|pills?|medicines?|medications?|syrup)\b[^,.!?]{0,25}",
            r"\b(?:dolo\s*\d*|paracetamol|ibuprofen|combiflam)\b",
        ],
    },
]


def _get_or_train_classifier() -> Pipeline:
    expected_classes = {item["id"] for item in INTAKE_SCHEMA}
    if os.path.exists(MODEL_PATH):
        try:
            loaded_model = joblib.load(MODEL_PATH)
            if set(map(str, loaded_model.classes_)) == expected_classes:
                return loaded_model
        except Exception:
            pass

    os.makedirs(MODEL_DIR, exist_ok=True)
    texts = [x[0] for x in TRAINING_DATA]
    labels = [x[1] for x in TRAINING_DATA]
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), lowercase=True)),
        ("clf", LogisticRegression(max_iter=500)),
    ])
    pipeline.fit(texts, labels)
    joblib.dump(pipeline, MODEL_PATH)
    return pipeline


def _clean_speech_stutter(text: str) -> str:
    # Collapse immediate repeated phrases from Web Speech API (e.g., "hi my name is hi my name is")
    cleaned = re.sub(r"\s+", " ", text).strip()
    cleaned = re.sub(r"\b(\w+(?:\s+\w+){0,5})\s+\1\b", r"\1", cleaned, flags=re.IGNORECASE)
    return cleaned


def _extract_patient_name(text: str) -> str | None:
    # Capture names spoken after "my name is" or "this is" even if STT lowercases the first name
    explicit_match = re.search(
        r"\b(?:my name is|this is)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)?)(?=\s+(?:i\b|and\b|from\b|my\b|not\b|having\b)|[,.!?]|$)",
        text,
        flags=re.IGNORECASE,
    )
    if explicit_match:
        candidate = explicit_match.group(1).strip().title()
        if candidate.lower() not in {"not feeling", "feeling", "having", "in pain", "sick", "unwell"}:
            return candidate

    cap_match = re.search(
        r"\bI am\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b",
        text,
    )
    if cap_match:
        return cap_match.group(1).strip()

    return None


def _segment_clauses(narrative: str) -> List[str]:
    # Split unpunctuated voice streams at punctuation, conjunctions, and natural clause starters
    split_pattern = (
        r"[.!?;,\n]+|"
        r"\b(?:and also|and then|also|but|because|while|plus|however)\b|"
        r"(?=\b(?:i am|i'm|i have|i've|i haven't|i havent|i feel|i felt|i took|i had|"
        r"my head|my pain|my stomach|my chest|my throat|my back|"
        r"it started|it began|it feels|it becomes|it gets|become better|becomes better|"
        r"from the past|for the past|since\s+(?:yesterday|today|last|\d|one|two|three)|"
        r"haven't taken|havent taken|and\s+i\s+feel|and\s+not\s+there)\b)"
    )
    raw_parts = re.split(split_pattern, narrative, flags=re.IGNORECASE)
    clauses = []
    for part in raw_parts:
        p = part.strip(" .,-")
        if len(p) >= 3 and not re.match(r"^(?:hi\s+)?(?:my name is|this is)\b", p, flags=re.IGNORECASE):
            clauses.append(p)
    return clauses


def _extract_category_phrases(
    clean_narrative: str,
    clauses: List[str],
    model: Pipeline,
) -> Dict[str, List[str]]:
    grouped: Dict[str, List[str]] = {item["id"]: [] for item in INTAKE_SCHEMA}

    # 1. Precision regex phrase extraction per category (prevents whole-sentence duplication)
    for item in INTAKE_SCHEMA:
        cat_id = item["id"]
        for pat in item["patterns"]:
            for m in re.finditer(pat, clean_narrative, flags=re.IGNORECASE):
                snippet = m.group(0).strip(" .,-")
                if snippet and not any(snippet.lower() in existing.lower() for existing in grouped[cat_id]):
                    grouped[cat_id].append(snippet)

    # 2. ML classifier fallback ONLY on short clauses (< 65 chars) for categories still empty
    for clause in clauses:
        if len(clause) > 65:
            continue
        probs = model.predict_proba([clause])[0]
        classes = model.classes_
        best_idx = probs.argmax()
        best_cat = str(classes[best_idx])
        if best_cat in grouped and probs[best_idx] >= 0.45 and not grouped[best_cat]:
            grouped[best_cat].append(clause)

    return grouped


def _extract_chief_complaint(clauses: List[str], grouped: Dict[str, List[str]]) -> str:
    # Identify primary symptom clauses that are not purely metadata (onset/meds/score)
    all_extracted = {q.lower() for quotes in grouped.values() for q in quotes}
    primary = []
    for c in clauses:
        c_low = c.lower()
        if c_low in all_extracted:
            continue
        if any(k in c_low for k in ["pain intensity", "haven't taken", "havent taken", "from the past", "for the past"]):
            continue
        if c_low in {"i am not feeling well", "im not feeling well"}:
            continue
        primary.append(c)

    if primary:
        return "; ".join(primary[:2])
    if clauses:
        return clauses[0]
    return "General discomfort"


def build_grouped_clinical_report(
    full_narrative: str,
    screening_answers: Dict[str, str] | None = None,
    pain_score: int | None = None,
) -> Dict[str, Any]:
    screening_answers = screening_answers or {}
    clean_narrative = _clean_speech_stutter(full_narrative)
    patient_name = _extract_patient_name(clean_narrative)

    model = _get_or_train_classifier()
    clauses = _segment_clauses(clean_narrative)
    lower_full = clean_narrative.lower()

    grouped_quotes = _extract_category_phrases(clean_narrative, clauses, model)

    # Sync 1-10 slider score if set
    if pain_score is not None and pain_score > 0:
        score_tag = f"Patient-rated severity: {pain_score}/10"
        if not any(f"{pain_score}" in q for q in grouped_quotes["severity"]):
            grouped_quotes["severity"].append(score_tag)

    # Build Red / Green Audit Items
    audit_items = []
    missing_items = []
    for item in INTAKE_SCHEMA:
        quotes = grouped_quotes[item["id"]]
        is_mentioned = len(quotes) > 0
        if not is_mentioned:
            missing_items.append(item)
        audit_items.append({
            "id": item["id"],
            "title": item["title"],
            "shortLabel": item["shortLabel"],
            "mentioned": is_mentioned,
            "status": "green" if is_mentioned else "red",
            "extractedQuotes": quotes,
            "voicePrompt": item["voicePrompt"],
            "clinicalNote": "; ".join(quotes) if is_mentioned else "Not yet reported by patient.",
        })

    # Organ System & Triage Routing (supports STT variants like "head seems to waking/aching")
    specialty = "General Ambulatory Care"
    urgency_level = "Routine / Semi-Urgent"
    vitals_focus = ["Blood Pressure (BP)", "Heart Rate (HR)", "Temperature", "SpO2"]
    screening_questions = [
        {"id": "q_appetite", "question": "Have you been able to keep food and water down today?"},
        {"id": "q_chronic", "question": "Do you have any existing conditions like diabetes, hypertension, or asthma?"},
    ]

    if any(w in lower_full for w in ["chest", "breath", "heart", "crushing", "palpitation"]):
        specialty = "Cardiovascular & Thoracic Triage"
        urgency_level = "HIGH PRIORITY — Immediate Evaluation Needed"
        vitals_focus = ["12-Lead ECG", "SpO2 Oxygen Saturation", "Bilateral BP", "Heart Rate & Respiratory Rate"]
        screening_questions = [
            {"id": "q_radiate", "question": "Does the discomfort spread to your left arm, jaw, neck, or back?"},
            {"id": "q_exertion", "question": "Did the tightness or breathlessness start during physical exertion?"},
        ]
    elif any(w in lower_full for w in ["headache", "migraine", "my head", "head seems", "giddy", "dizzy", "vision", "numb"]):
        specialty = "Neurological & Cranial Screening"
        urgency_level = "Urgent Neurological Review"
        vitals_focus = ["Blood Pressure", "Pupillary & Cranial Nerve Check", "Temperature", "Orthostatic Vitals"]
        screening_questions = [
            {"id": "q_neck", "question": "Do you have any neck stiffness or pain when bending your chin down?"},
            {"id": "q_vision", "question": "Have you noticed blurred vision, double vision, or weakness on one side?"},
        ]
    elif any(w in lower_full for w in ["stomach", "abdomen", "gastric", "acidity", "loose motion", "vomit", "nausea", "nauseous"]):
        specialty = "Gastrointestinal & Hydration Assessment"
        urgency_level = "Semi-Urgent Ambulatory Care"
        vitals_focus = ["Abdominal Tenderness Exam", "Heart Rate & BP (Hydration)", "Temperature"]
        screening_questions = [
            {"id": "q_fever_gi", "question": "Have you had a fever or noticed blood in your stool or vomit?"},
            {"id": "q_fluids", "question": "Are you able to sip oral fluids without immediate vomiting?"},
        ]

    # Clinical Safety & Drug-Symptom Alerts
    safety_alerts = []
    if any(w in lower_full for w in ["ibuprofen", "combiflam"]) and any(w in lower_full for w in ["stomach", "gastric", "acidity", "vomit"]):
        safety_alerts.append({
            "level": "critical",
            "title": "NSAID Gastric Irritation Warning",
            "detail": "Patient reported Ibuprofen/Combiflam alongside GI symptoms. Advise physician review for gastroprotection.",
        })
    if any(w in lower_full for w in ["dolo", "paracetamol", "combiflam"]):
        safety_alerts.append({
            "level": "warning",
            "title": "Cumulative Acetaminophen / Paracetamol Check",
            "detail": "Verify exact total mg taken in the last 24 hours to prevent accidental Paracetamol duplication.",
        })
    if any(w in lower_full for w in ["headache", "migraine", "my head", "head seems"]) and any(w in lower_full for w in ["fever", "body heat", "stiff"]):
        safety_alerts.append({
            "level": "critical",
            "title": "Acute Febrile Cephalgia Screening",
            "detail": "Headache combined with fever/body heat warrants targeted meningeal and infectious screening.",
        })

    # Plain-Language Health Glossary matches
    glossary_matches = []
    for term, info in CLINICAL_RAG_GLOSSARY.items():
        if term in lower_full:
            glossary_matches.append({
                "patientTerm": term,
                "clinicalTerm": info["clinical"],
                "plainExplanation": info["plain"],
            })

    # Crisp, Non-Repetitive Physician HPI Summary
    chief_complaint = _extract_chief_complaint(clauses, grouped_quotes)
    patient_label = f"Patient ({patient_name})" if patient_name else "Patient"

    confirmed_screening = [
        f"{q['question']} -> {screening_answers[q['id']]}"
        for q in screening_questions
        if q["id"] in screening_answers
    ]

    hpi_parts = [
        f"{patient_label} presents for {specialty.lower()} evaluation with primary complaint of: {chief_complaint}.",
        f"Onset/Timeline: {'; '.join(grouped_quotes['onset']) or 'Pending'}.",
        f"Severity: {'; '.join(grouped_quotes['severity']) or 'Pending'}.",
        f"Modifying Factors: {'; '.join(grouped_quotes['triggers']) or 'Pending'}.",
        f"Associated Symptoms: {'; '.join(grouped_quotes['autonomic']) or 'Pending'}.",
        f"Recent Self-Medication: {'; '.join(grouped_quotes['medications']) or 'None reported yet'}.",
    ]
    if confirmed_screening:
        hpi_parts.append("Screening Answers: " + " | ".join(confirmed_screening) + ".")

    hpi_summary = " ".join(hpi_parts)

    # Natural Two-Way Voice Response
    mentioned_count = len(INTAKE_SCHEMA) - len(missing_items)
    if missing_items:
        next_missing = missing_items[0]
        greeting_name = f" {patient_name}" if patient_name else ""
        if mentioned_count == 0:
            emotional_comfort = (
                f"I'm listening{greeting_name} and ready to organize everything for your doctor. "
                f"First, {next_missing['voicePrompt'].lower()}"
            )
        else:
            emotional_comfort = (
                f"Thank you{greeting_name}—I've marked {mentioned_count} of 5 details green on your doctor checklist. "
                f"Next, {next_missing['voicePrompt'].lower()}"
            )
        next_voice_prompt = next_missing["voicePrompt"]
    else:
        emotional_comfort = (
            "Wonderful! All 5 essential details are now green and cleanly organized in your doctor summary without repetition. "
            "You can read it aloud or export your PDF for your visit."
        )
        next_voice_prompt = "All required details are complete."

    return {
        "condition": specialty,
        "urgencyLevel": urgency_level,
        "emotionalComfort": emotional_comfort,
        "nextVoicePrompt": next_voice_prompt,
        "mentionedCount": mentioned_count,
        "totalRequired": len(INTAKE_SCHEMA),
        "doctorIntakeAudit": audit_items,
        "hpiSummary": hpi_summary,
        "safetyAlerts": safety_alerts,
        "screeningQuestions": screening_questions,
        "vitalsFocus": vitals_focus,
        "glossary": glossary_matches,
        "opqrst": {
            "Onset & Course": "; ".join(grouped_quotes["onset"]) or "Not yet mentioned",
            "Provocation / Palliation": "; ".join(grouped_quotes["triggers"]) or "Not yet mentioned",
            "Chief Complaint": chief_complaint,
            "Region / Organ System": specialty,
            "Severity (1–10)": "; ".join(grouped_quotes["severity"]) or "Not yet mentioned",
            "Associated Symptoms & Meds": "; ".join(grouped_quotes["autonomic"] + grouped_quotes["medications"]) or "Not yet mentioned",
        },
    }