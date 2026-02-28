import traceback
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import health, auth, users, onboarding, gurus, strategies, chart, chat

settings = get_settings()
app = FastAPI(title=settings.project_name, debug=settings.debug)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Return JSON with error detail for every 500 so the client can show it."""
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )

# CORS: allow Vercel production + localhost; Railway env CORS_ORIGINS can set comma-separated list
_cors_origins = list(settings.cors_origins_list)
_required_origins = ["https://tradsy.vercel.app", "http://localhost:5173"]
for origin in _required_origins:
    if origin not in _cors_origins:
        _cors_origins.append(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(onboarding.router, prefix="/onboarding", tags=["onboarding"])
app.include_router(gurus.router, prefix="/gurus", tags=["gurus"])
app.include_router(strategies.router, prefix="/strategies", tags=["strategies"])
app.include_router(chart.router, prefix="/chart", tags=["chart"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])


@app.get("/")
def root():
    return {"app": settings.project_name, "status": "ok"}
