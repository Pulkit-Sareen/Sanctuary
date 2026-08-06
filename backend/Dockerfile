FROM python:3.11-slim

WORKDIR /app

# Copy requirements from root
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend and model directories
COPY backend/ ./backend/
COPY model/ ./model/

# Set working directory to backend so uvicorn runs correctly
WORKDIR /app/backend

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
