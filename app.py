import threading
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from reader import Reader

ROOT = Path(__file__).parent
reader = Reader()


@asynccontextmanager
async def lifespan(_app):
    threading.Thread(target=reader.load, daemon=True).start()
    yield


app = FastAPI(title="Stack Picker", lifespan=lifespan)
app.mount("/static", StaticFiles(directory=ROOT / "static"), name="static")


class Idea(BaseModel):
    idea: str = Field(min_length=3, max_length=2000)


@app.get("/")
def index():
    return FileResponse(ROOT / "static" / "index.html")


@app.get("/api/status")
def status():
    return reader.status()


@app.post("/api/read")
def read(body: Idea):
    if reader.state == "loading":
        raise HTTPException(503, detail="Laya is still warming up. Try again in a few seconds.")
    if reader.state == "error":
        raise HTTPException(500, detail=f"Laya failed to load: {reader.error}")
    return reader.read(body.idea.strip())
