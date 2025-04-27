from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from datetime import datetime
from typing import List
import shutil
import os
import uuid
from api.image_classifier import classify_image

app = FastAPI()

# 一時的な履歴保存
classification_history = []

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.post("/classify/image")
async def classify_image_api(file: UploadFile = File(...)):
    upload_dir = "static/uploads"
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = await classify_image(file_path)
    result["image_path"] = f"/static/uploads/{file.filename}"
    return JSONResponse({
        "result": result["predicted_class"],
        "labels": result["labels"],
        "scores": result["scores"],
        "image_path": f"/static/uploads/{file.filename}"
    })

class HistoryEntry(BaseModel):
    image_name: str
    result: str
    confidence: float

class HistoryResponse(BaseModel):
    time: str
    image_name: str
    result: str
    confidence: float

@app.post("/save_history", response_model=List[HistoryResponse])
def save_history(entry: HistoryEntry):
    record = {
        "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "image_name": entry.image_name,
        "result": entry.result,
        "confidence": entry.confidence
    }
    classification_history.insert(0, record)  
    return classification_history 

@app.get("/get_history", response_model=List[HistoryResponse])
def get_history():
    return classification_history

@app.post("/clear_history")
def clear_history():
    classification_history.clear()
    return {"message": "履歴を全て削除しました"}

@app.get("/")
def root():
    return FileResponse("static/index.html")
