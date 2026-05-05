import re
import random
import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Initialize Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')

def parse_image_with_gemini(image_bytes, mime_type="image/jpeg"):
    """Uses Gemini Vision to extract data directly from the image."""
    prompt = """
    Act as a professional electricity bill analyzer. 
    Extract the following data from this MSEDCL (MahaVitaran) bill image into JSON:
    {
      "consumer_name": "string",
      "consumer_number": "string",
      "units": number,
      "amount": number,
      "sanctioned_load": number,
      "bill_date": "string",
      "due_date": "string",
      "tariff": "string",
      "history": [{"month": "string", "units": number}]
    }
    
    Return ONLY valid JSON.
    """
    try:
        # Prepare image for Gemini
        img_part = {"mime_type": mime_type, "data": image_bytes}
        response = model.generate_content([prompt, img_part])
        clean_json = response.text.strip().replace('```json', '').replace('```', '')
        data = json.loads(clean_json)
        
        # Calculate average units for sizing
        if "history" in data and data["history"]:
            data["average_units"] = sum([h["units"] for h in data["history"]]) / len(data["history"])
        else:
            data["average_units"] = data.get("units", 0)
            
        return data
    except Exception as e:
        print(f"Gemini Vision Error: {e}")
        return None

def parse_with_gemini(text):
    """Parses extracted text using Gemini AI."""
    prompt = f"Extract MSEDCL bill data into JSON: {text}"
    try:
        response = model.generate_content(prompt)
        clean_json = response.text.strip().replace('```json', '').replace('```', '')
        return json.loads(clean_json)
    except Exception:
        return None

def parse_bill_data(text_or_bytes, is_image=False):
    """
    100% Native Gemini Extraction Engine.
    Bypasses Tesseract for images and uses Direct Vision.
    """
    if is_image:
        return parse_image_with_gemini(text_or_bytes)
    return parse_with_gemini(text_or_bytes)
