# Electricity Bill to Solar Load Excel Automation

A full-stack application to automate the extraction of electricity bill data and populate a solar load calculation Excel template.

## 🚀 Features
- **OCR Extraction**: Extract data from PDF and Images (JPG/PNG).
- **Regex Parsing**: Smart parsing for Units, Amount, and Tariff.
- **Excel Automation**: Populates a predefined `solar_template.xlsx` without breaking formulas.
- **Modern UI**: Premium Next.js interface with drag-and-drop and glassmorphism.

## 🛠️ Prerequisites
- Python 3.8+
- Node.js 18+
- Tesseract OCR (Optional but recommended for image extraction)
  - Mac: `brew install tesseract`
  - Linux: `sudo apt install tesseract-ocr`

## 🏗️ Setup & Run

### 1. Backend (FastAPI)
```bash
cd backend
python3 -m pip install -r requirements.txt
python3 main.py
```
Backend will run on `http://localhost:8000`.

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Frontend will run on `http://localhost:3000`.

## 📂 Project Structure
- `backend/`: FastAPI logic, OCR, and Excel writing.
- `frontend/`: Next.js UI.
- `templates/`: Contains the base Excel template.
- `uploads/`: Temporary storage for uploaded bills.
- `outputs/`: Generated Excel files.

## 🧪 Sample Flow
1. Open `http://localhost:3000`.
2. Drag and drop a sample electricity bill (PDF or Image).
3. Click "Process Bill".
4. Preview the extracted data.
5. Click "Download Solar Load Excel".
