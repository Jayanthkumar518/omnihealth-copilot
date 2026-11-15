# 🏥 OmniHealth AI Copilot & Patient Care Sentinel

OmniHealth is an AI-powered healthcare and recovery web application built for remote patient triage, prescription safety verification, clinical hydration guidance, real-time ergonomic posture monitoring, and empathetic mental wellness.

Powered by a **Next.js (React)** frontend and a unified **Python FastAPI** backend, OmniHealth brings five clinical and wellness modules together in one cohesive interface.

---

## 🌟 Core Modules

1. **Caretaker Symptom Agent & Voice Intake (Module 1)**
   - Continuous speech-to-text symptom dictation with interactive 1–10 intensity scoring.
   - Cumulative intake memory tracking and automated, print-ready clinical consultation reports.
2. **Enterprise Prescription Scanner & OpenFDA RAG Parser (Module 2)**
   - Upload prescription images or text notes for live backend OCR extraction (`PyTesseract`).
   - Enriches detected medications with clinical purposes, administration schedules, and renal/hydration safety buffers.
3. **Clinical Hydration & Renal Calculator (Module 3)**
   - Computes personalized daily water intake and electrolyte targets tailored to patient weight, activity level, and clinical profile.
4. **3D Kinematic Posture & Desk Yoga Sentinel (Module 4)**
   - Real-time webcam and photo skeletal tracking using **MediaPipe Vision (`@0.10.0`)** with automatic GPU-to-CPU fallback.
   - Live Green/Red alignment HUD, REBA risk scoring, acoustic posture correction chimes, Z-axis screen proximity alerts, targeted sedentary Yoga Asanas with countdown timers, and printable diagnostic reports.
5. **Empathetic Care Buddy & Recovery Arcade (Module 5)**
   - **Empathetic Care Companion & Worry Cloud Releaser:** Mood-aware emotional validation, micro-comfort guidance, spoken encouragement, and an interactive sky worry-dissolver.
   - **Healing Orb Catcher Arcade:** 45-second interactive recovery mini-game with combo multipliers and XP leveling.
   - **Sensory & Cozy Recovery Games:** Pentatonic Zen Ripple Pond (`ON/OFF` toggle), Contextual Tension Popper, Care & Gratitude Garden, Cozy Comfort Card Match, Cookie-to-Zen Box Breathing, and AI Wellness Smiles.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS, Lucide Icons, Recharts, `@mediapipe/tasks-vision`
- **Backend:** Python 3.9+, FastAPI, Uvicorn, Pydantic, SQLite, PyTesseract, Pillow, NumPy, Requests

---

## 📁 Project Structure

```text
omnihealth-copilot/
├── app/
│   ├── about/
│   ├── dashboard/
│   ├── layout.js
│   └── page.js
├── backend/
│   ├── main.py                  # Unified FastAPI server (port 8000)
│   ├── stress_companion.py      # Module 5 empathetic care & wellness engine
│   └── ...                      # Additional clinical & OCR engines
├── components/
│   ├── CaretakerAgent.js        # Module 1: Voice & symptom intake
│   ├── PrescriptionScanner.js   # Module 2: OCR prescription scanner
│   ├── HydrationCalculator.js   # Module 3: Hydration & renal calculator
│   ├── PostureScreener.js       # Module 4: 3D MediaPipe posture & yoga sentinel
│   └── StressHub.js             # Module 5: Recovery arcade & care lounge
├── public/
├── package.json
├── requirements.txt
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher) and **npm**
- **Python** (v3.9 or higher) and **pip**
- **Tesseract OCR** *(optional, required only for image-based prescription OCR)*:
  - **Windows:** Install from [UB-Mannheim Tesseract](https://github.com/UB-Mannheim/tesseract/wiki) and ensure `tesseract.exe` is in your system `PATH`.
  - **macOS:** `brew install tesseract`
  - **Ubuntu / Debian:** `sudo apt-get install tesseract-ocr`

---

### 1. Clone the Repository

```bash
git clone [https://github.com/](https://github.com/)<your-username>/<your-repo-name>.git
cd <your-repo-name>
```

---

### 2. Start the Python FastAPI Backend

Open a terminal in the project root directory, install the Python dependencies from `requirements.txt`, and start the backend server:

```bash
cd backend
pip install -r ../requirements.txt
python main.py
```

- The FastAPI backend will start at **`http://127.0.0.1:8000`**.
- Interactive API documentation (Swagger UI) is available at **`http://127.0.0.1:8000/docs`**.

---

### 3. Start the Next.js Frontend

Open a **second terminal** in the project root directory (where `package.json` is located), install the Node packages, and run the development server:

```bash
npm install
npm run dev
```

- Open **`http://localhost:3000`** in your browser to launch the application.
- Navigate to **`http://localhost:3000/dashboard`** to access all five interactive modules.

*(Keep both the backend terminal on port `8000` and the frontend terminal on port `3000` running simultaneously while using the app.)*

---

## 🔌 Key Backend API Endpoints

| Method | Endpoint | Module | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/caregiver-agent` | Module 1 | Processes symptom intake and builds structured clinical triage reports |
| `POST` | `/api/parse-prescription-rag` | Module 2 | Extracts medications via OCR and retrieves clinical safety guidance |
| `POST` | `/api/calculate-hydration` | Module 3 | Calculates personalized daily hydration and electrolyte targets |
| `POST` | `/api/posture/analyze-kinematics` | Module 4 | Logs 3D posture kinematic metrics and matches yoga prescriptions |
| `POST` | `/api/stress-playground/care-companion` | Module 5 | Generates empathetic patient support and logs mood check-ins |
| `GET` | `/api/stress-playground/joke` | Module 5 | Returns lighthearted clinical and wellness humor |

---

## ⚠️ Disclaimer

OmniHealth is an educational and ergonomic wellness prototype designed to assist with symptom organization, posture awareness, and stress relief. It does not provide medical diagnoses or replace professional clinical care.