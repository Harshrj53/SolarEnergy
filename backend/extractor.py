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
def extract_text_from_image(image_bytes):
    """Extracts text from an image with enhancement for low-quality photos."""
    image = Image.open(io.BytesIO(image_bytes))
    
    # Pre-processing for better OCR
    image = image.convert('L') # Grayscale
    
    from PIL import ImageEnhance, ImageFilter
    # Increase contrast
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2.0)
    
    # Sharpening
    image = image.filter(ImageFilter.SHARPEN)
    
    # Scaling up if small
    if image.width < 1500:
        image = image.resize((image.width * 2, image.height * 2), Image.Resampling.LANCZOS)

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
            # For scanned PDFs, convert first page to image using pypdfium2
            import pypdfium2 as pdfium
            pdf = pdfium.PdfDocument(io.BytesIO(file_bytes))
            page = pdf[0] # Process first page
            bitmap = page.render(scale=2) # 2x scale for better OCR
            pil_image = bitmap.to_pil()
            
            # Save PIL image to bytes to reuse extract_text_from_image
            img_byte_arr = io.BytesIO()
            pil_image.save(img_byte_arr, format='JPEG')
            return extract_text_from_image(img_byte_arr.getvalue())
        return text
    else:
        return extract_text_from_image(file_bytes)
