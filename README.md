# Sanctuary

Sanctuary is a trauma-informed legal documentation assistant. It provides a safe, conversational interface designed to gently and empathetically help survivors record factual accounts of incidents (the Who, What, Where, When, and How) to build structured, professional testimonies.

The platform relies on a sophisticated LLM engine powered by the lightning-fast Groq API, ensuring privacy, empathy, and highly accurate fact-gathering without interrogating or overwhelming the user. It also supports real-time Voice-to-Text for seamless conversational input.

## Features
- **Trauma-Informed AI Engine:** Asks exactly one gentle, factual question at a time. Comforts the user dynamically if they express distress or shyness.
- **Voice-to-Text Dictation:** Users can speak their testimonies directly into the application using integrated Web Speech API.
- **Automated Testimony Generation:** At the end of the session, the AI synthesizes all facts into a beautiful, objective, and professionally formatted Markdown report.
- **Privacy First:** Clean environment variables and local Docker support keep all API keys and data strictly under your control.

## Tech Stack
- **Frontend:** React + TypeScript + Vite + Tailwind CSS + Framer Motion
- **Backend:** Python + FastAPI + Uvicorn
- **AI Engine:** Groq API (Llama 3.3 70B Versatile)
- **Deployment:** Docker & Docker Compose

## Quick Start (Local Development)

### 1. Configure Secrets
Create a `.env` file in the root folder (this file is ignored by Git to protect your secrets):
```bash
cp .env.example .env
```
Open `.env` and add your free Groq API key:
```env
LLM_API_KEY=gsk_your_real_key_here
```

### 2. Run the Backend
Open a terminal in the root directory:
```bash
# Create and activate a virtual environment
python -m venv venv
.\venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Export your environment variables and run the server
$env:LLM_PROVIDER="groq"
$env:LLM_API_KEY="gsk_your_real_key_here"
uvicorn backend.main:app --reload
```
The backend will run on `http://127.0.0.1:8000`.

### 3. Run the Frontend
Open a **second terminal** in the `FRONTEND` directory:
```bash
cd FRONTEND
npm install
npm run dev
```
The frontend will be accessible at `http://localhost:5173`.

---

## Production Deployment (Docker)

To deploy the full stack on a VPS or cloud provider, simply clone the repository, recreate your `.env` file, and run Docker Compose:

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME

# Setup environment variables securely
echo "LLM_API_KEY=gsk_your_groq_key_here" > .env

# Build and start the application in detached mode
docker-compose up -d --build
```
- The API will be accessible on port `8000`.
- The Web Interface will be accessible on port `5173`.

## Architecture Details
- **`backend/trauma_engine.py`**: Contains the core LLM prompt and message history logic (Groq / Ollama).
- **`backend/main.py`**: The FastAPI server that handles REST endpoints and database mocking.
- **`FRONTEND/src/pages/WritePage.tsx`**: The main interactive React page for gathering the testimony, complete with Voice-to-Text hooks.

## Deployment (Vercel + Render)

### Backend (Render)
1. Create a new **Web Service**.
2. **Root Directory:** `backend`
3. **Build Command:** `pip install -r requirements.txt`
4. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Environment Variables:** `LLM_PROVIDER`, `LLM_API_KEY`, `CORS_ORIGINS` (include your Vercel domain), etc.

### Frontend (Vercel)
1. Import the `FRONTEND` directory (or set Root Directory to `FRONTEND`).
2. **Environment Variable (set in Vercel → Settings → Environment Variables):**
   ```
   VITE_API_URL=https://your-render-backend.onrender.com
   ```
   Replace with your actual Render URL. Redeploy after setting it.
3. Build automatically runs `npm run build` (tsc + vite build).

> For local development, copy `FRONTEND/.env.example` to `FRONTEND/.env` and set the same `VITE_API_URL`.
