from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import health, auth, users, onboarding, gurus, strategies, chart

settings = get_settings()
app = FastAPI(title=settings.project_name, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
app.include_router(gurus.router, prefix="/gurus", tags=["gurus"])
app.include_router(strategies.router, prefix="/strategies", tags=["strategies"])
app.include_router(chart.router, prefix="/chart", tags=["chart"])


@app.get("/")
def root():
    return {"app": settings.project_name, "status": "ok"}
