from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Food Review API")

# Cấu hình CORS để frontend có thể gọi được API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Trong thực tế nên giới hạn domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api")
def read_root():
    return {"message": "Welcome to Food Review API"}

@app.get("/api/health")
def health_check():
    return {"status": "ok", "environment": "Vercel"}
