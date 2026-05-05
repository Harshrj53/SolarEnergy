import pdfplumber
import pytesseract
from PIL import Image
import io

def extract_text_from_pdf(file_bytes):
    """Extracts text from a PDF file. If no digital text, falls back to OCR."""
    text = ""
    is_scanned = True
    
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text and len(page_text.strip()) > 50:
                text += page_text + "\n"
                is_scanned = False
    
    if is_scanned:
        # Fallback to OCR for scanned PDFs
        # For now, we'll process the whole file as an image if it's scanned.
        return "SCANNED_PDF_DETECTED" 
    
    return text

def extract_text_from_image(file_bytes):
    """Extracts text from an image file with performance optimizations."""
    image = Image.open(io.BytesIO(file_bytes))
    
    # Optimization 1: Resize if too large
    # 1500px is usually enough for MSEDCL bills and much faster
    max_width = 1500
    if image.width > max_width:
        ratio = max_width / float(image.width)
        height = int(float(image.height) * float(ratio))
        image = image.resize((max_width, height), Image.Resampling.LANCZOS)

    # Optimization 2: Preprocessing
    image = image.convert('L') # Grayscale
    
    # Optimization 3: Faster Tesseract config
    # --oem 3 (Default) is often faster than --oem 1 for simple layouts
    # --psm 6 (Assume a single uniform block of text) can be faster for structured docs
    custom_config = r'--oem 3 --psm 3'
    
    try:
        text = pytesseract.image_to_string(image, lang='eng+mar', config=custom_config)
    except Exception:
        text = pytesseract.image_to_string(image, lang='eng', config=custom_config)
        
    return text

def extract_text(file_bytes, filename):
    """General extractor that chooses method based on file extension."""
    if filename.lower().endswith('.pdf'):
        text = extract_text_from_pdf(file_bytes)
        if text == "SCANNED_PDF_DETECTED":
            # For scanned PDFs, we should ideally convert to image then OCR
            # But since we have the bytes, let's just return what we have or 
            # suggest the user that scanned PDFs are slower.
            return extract_text_from_image(file_bytes)
        return text
    else:
        return extract_text_from_image(file_bytes)
