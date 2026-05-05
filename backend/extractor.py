import pdfplumber
import pytesseract
from PIL import Image
import io

def extract_text_from_pdf(file_bytes):
    """Extracts text from a PDF file using pdfplumber."""
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def extract_text_from_image(file_bytes):
    """Extracts text from an image file using pytesseract with Marathi support."""
    image = Image.open(io.BytesIO(file_bytes))
    
    # Preprocessing: Convert to grayscale for better OCR
    image = image.convert('L')
    
    # Use both English and Marathi for OCR
    try:
        text = pytesseract.image_to_string(image, lang='eng+mar')
    except Exception:
        # Fallback to English only if mar language pack is missing
        text = pytesseract.image_to_string(image, lang='eng')
        
    return text

def extract_text(file_bytes, filename):
    """General extractor that chooses method based on file extension."""
    if filename.lower().endswith('.pdf'):
        return extract_text_from_pdf(file_bytes)
    else:
        return extract_text_from_image(file_bytes)
