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
    """Extracts text from an image file using pytesseract."""
    image = Image.open(io.BytesIO(file_bytes))
    text = pytesseract.image_to_string(image)
    return text

def extract_text(file_bytes, filename):
    """General extractor that chooses method based on file extension."""
    if filename.lower().endswith('.pdf'):
        return extract_text_from_pdf(file_bytes)
    else:
        return extract_text_from_image(file_bytes)
