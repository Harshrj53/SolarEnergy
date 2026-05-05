from fastapi import FastAPI, UploadFile, File, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import shutil
import os
import uuid
import asyncio
from pydantic import BaseModel
from typing import Optional

from extractor import extract_text
from parser import parse_bill_data
from excel_writer import write_to_template

app = FastAPI(title="EnergyBae AI Bill Extraction API")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

class BillData(BaseModel):
    consumer_name: Optional[str] = "N/A"
    consumer_number: Optional[str] = "N/A"
    units: Optional[float] = 0.0
    amount: Optional[float] = 0.0
    tariff: Optional[float] = 0.0

@app.get("/")
async def root():
    return {"message": "EnergyBae API is operational"}

@app.post("/process-bill")
async def process_bill(file: UploadFile = File(...)):
    """
    Step 1: Extract and Parse data from the bill.
    """
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    input_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        with open(input_path, "rb") as f:
            file_bytes = f.read()
        
        is_img = ext.lower() in ['.jpg', '.jpeg', '.png']
        
        if is_img:
            # 100% Native Gemini Vision Path
            parsed_data = parse_bill_data(file_bytes, is_image=True)
        else:
            # PDF Path: Extract text first
            raw_text = extract_text(file_bytes, file.filename)
            parsed_data = parse_bill_data(raw_text, is_image=False)
        
        return {
            "success": True,
            "filename": file.filename,
            "data": parsed_data,
            "engine": "Gemini 1.5 Native"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-excel")
async def generate_excel(payload: dict = Body(...)):
    """
    Step 2: Take edited data and generate the final Excel.
    Expects: {"data": {...}, "confidence": {...}}
    """
    try:
        data = payload.get("data", {})
        confidence = payload.get("confidence", {})
        
        file_id = str(uuid.uuid4())
        output_filename = f"Solar_Calculation_{file_id}.xlsx"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        
        # Pass the full payload to the robust writer
        write_to_template(payload, output_path)
        
        return {
            "success": True,
            "download_url": f"/download/{output_filename}"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(
            path=file_path, 
            filename="Solar_Load_Report.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    raise HTTPException(status_code=404, detail="File not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
