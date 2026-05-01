import openpyxl
import datetime
import os
import logging
import re

# Configure Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Calculate template path relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_PATH = os.path.join(BASE_DIR, "templates", "solar_template.xlsx")

# Config Defaults
DEFAULTS = {
    "sanctioned_load": 1.0,
    "tariff": 8.0,
    "consumer_name": "Valued Customer",
    "consumer_number": "N/A"
}

def clean_numeric(value):
    """
    Cleans string values like '₹ 3,375.00' or '450 kWh' into clean floats.
    """
    if value is None or value == "":
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    
    # Remove currency symbols, commas, and units
    cleaned = re.sub(r"[^\d.]", "", str(value).replace(',', ''))
    try:
        return float(cleaned)
    except ValueError:
        logger.warning(f"Could not convert value '{value}' to numeric. Using 0.0")
        return 0.0

def write_to_template(payload, output_path):
    """
    Enhanced Excel automation engine.
    Accepts payload: {"data": {...}, "confidence": {...}}
    """
    data = payload.get("data", payload) # Support both new payload and legacy flat dict
    confidence = payload.get("confidence", {})

    logger.info("Starting Excel generation process...")

    # 1. Validation & Cleaning Layer
    try:
        cleaned_data = {
            "consumer_name": str(data.get("consumer_name") or DEFAULTS["consumer_name"]),
            "consumer_number": str(data.get("consumer_number") or DEFAULTS["consumer_number"]),
            "units": clean_numeric(data.get("units")),
            "amount": clean_numeric(data.get("amount")),
            "tariff": clean_numeric(data.get("tariff") or DEFAULTS["tariff"]),
        }
        
        logger.info(f"Cleaned Data: {cleaned_data}")

        # Required Field Validation
        if cleaned_data["units"] == 0 or cleaned_data["amount"] == 0:
            logger.error("Validation failed: Units or Amount is missing/zero.")
            raise ValueError("Critical data missing: Units and Amount are required.")

        # 2. Confidence Awareness
        for field, score in confidence.items():
            if score < 0.6:
                logger.warning(f"LOW CONFIDENCE ALERT: Field '{field}' has confidence {score * 100}%. Please verify manually.")

    except Exception as e:
        logger.error(f"Data validation/cleaning error: {str(e)}")
        raise

    # 3. Excel Writing Layer
    if not os.path.exists(TEMPLATE_PATH):
        logger.error(f"Template not found at {TEMPLATE_PATH}")
        raise FileNotFoundError(f"Template not found at {TEMPLATE_PATH}")

    try:
        wb = openpyxl.load_workbook(TEMPLATE_PATH)
        ws = wb.active

        # Mapping data to cells with proper types
        # B3: Consumer Name
        ws['B3'] = cleaned_data["consumer_name"]
        
        # B4: Consumer Number
        ws['B4'] = cleaned_data["consumer_number"]
        
        # B5: Units Consumed (Numeric)
        ws['B5'] = cleaned_data["units"]
        ws['B5'].number_format = '#,##0.00'
        
        # B6: Total Bill Amount (Numeric/Currency)
        ws['B6'] = cleaned_data["amount"]
        ws['B6'].number_format = '"₹"#,##0.00'
        
        # B7: Tariff / Rate (Numeric)
        ws['B7'] = cleaned_data["tariff"]
        ws['B7'].number_format = '0.00'
        
        # B8: Extraction Date
        ws['B8'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

        wb.save(output_path)
        logger.info(f"Successfully generated Excel report at {output_path}")
        return output_path

    except Exception as e:
        logger.error(f"Excel writing error: {str(e)}")
        raise RuntimeError(f"Failed to write to Excel template: {str(e)}")
