FROM python:3.11-slim

WORKDIR /app

# Copy requirements from backend
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source (includes trauma_engine.py)
COPY . .

EXPOSE 8000

# Run with Render-style command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
