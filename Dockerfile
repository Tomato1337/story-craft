FROM python:3.12.2-slim

WORKDIR /app

# Минимальные зависимости для сборки asyncpg
RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3005

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3005", "--reload"]