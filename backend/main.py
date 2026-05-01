from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import shutil
import os
import uuid

from extractor import extract_text
from parser import parse_bill_data
from excel_writer import write_to_template

app = FastAPI(title="Electricity Bill to Solar Load API")

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

@app.get("/")
async def root():
    return {"message": "Electricity Bill to Solar Load API is running"}

@app.post("/process-bill")
async def process_bill(file: UploadFile = File(...)):
    # 1. Save uploaded file temporarily
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    input_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        # 2. Extract Text
        with open(input_path, "rb") as f:
            file_bytes = f.read()
        
        raw_text = extract_text(file_bytes, file.filename)
        if not raw_text.strip():
            raise HTTPException(status_code=400, detail="Could not extract text from file")
        
        # 3. Parse Data
        parsed_data = parse_bill_data(raw_text)
        
        # 4. Fill Excel Template
        output_filename = f"output_{file_id}.xlsx"
        output_path = os.path.join(OUTPUT_DIR, output_filename)
        write_to_template(parsed_data, output_path)
        
        # 5. Return success info and filename (frontend will handle download)
        return {
            "success": True,
            "data": parsed_data,
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
            filename="Solar_Load_Calculation.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    raise HTTPException(status_code=404, detail="File not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
