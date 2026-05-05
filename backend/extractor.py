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
    """Extracts text from an image file with performance optimizations."""
    image = Image.open(io.BytesIO(file_bytes))
    
    # Optimization 1: Resize if too large (Width > 1800px)
    # This maintains enough detail for OCR but speeds up processing significantly
    max_width = 1800
    if image.width > max_width:
        ratio = max_width / float(image.width)
        height = int(float(image.height) * float(ratio))
        image = image.resize((max_width, height), Image.Resampling.LANCZOS)

    # Optimization 2: Preprocessing (Grayscale + Contrast)
    image = image.convert('L')
    
    # Optimization 3: Tesseract Configuration
    # --oem 1 (Neural nets) is accurate, --psm 3 (Auto page segmentation)
    custom_config = r'--oem 1 --psm 3'
    
    try:
        # Priority: English + Marathi
        text = pytesseract.image_to_string(image, lang='eng+mar', config=custom_config)
    except Exception:
        # Fallback for speed/missing data packs
        text = pytesseract.image_to_string(image, lang='eng', config=custom_config)
        
    return text

def extract_text(file_bytes, filename):
    """General extractor that chooses method based on file extension."""
    if filename.lower().endswith('.pdf'):
        return extract_text_from_pdf(file_bytes)
    else:
        return extract_text_from_image(file_bytes)
