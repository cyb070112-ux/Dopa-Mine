import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

from .course import router as course_router

load_dotenv(Path(__file__).parent / ".env")

app = FastAPI(title="Dopa-Mine API", version="0.1.0")

_raw_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:5174,http://localhost:4173",
)
_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(course_router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(status_code=500, content={"detail": "서버 오류"})


@app.get("/")
async def root():
    return {"status": "ok", "service": "Dopa-Mine API"}


@app.get("/health")
async def health_check():
    return {"status": "ok"}
