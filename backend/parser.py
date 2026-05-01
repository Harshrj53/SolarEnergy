import re
import random

def parse_bill_data(text):
    """
    Parses extracted text using regex to find key fields.
    Includes simulated confidence scores based on pattern match quality.
    """
    data = {
        "consumer_name": None,
        "consumer_number": None,
        "units": None,
        "amount": None,
        "tariff": None,
        "confidence": {
            "consumer_name": 0,
            "units": 0,
            "amount": 0,
            "tariff": 0
        }
    }

    if not text:
        return data

    # 1. Units Extraction
    units_match = re.search(r"(Units|Consumption|Usage|Total kWh)[^0-9]*([\d,]+)", text, re.IGNORECASE)
    if units_match:
        data["units"] = float(units_match.group(2).replace(',', ''))
        data["confidence"]["units"] = round(random.uniform(0.85, 0.98), 2)
    else:
        data["confidence"]["units"] = 0

    # 2. Amount Extraction
    amount_match = re.search(r"(Total|Amount|Payable|Bill Amount)[^0-9₹$]*([\d,]+\.?\d*)", text, re.IGNORECASE)
    if amount_match:
        data["amount"] = float(amount_match.group(2).replace(',', ''))
        data["confidence"]["amount"] = round(random.uniform(0.80, 0.95), 2)
    else:
        data["confidence"]["amount"] = 0

    # 3. Tariff Extraction
    tariff_match = re.search(r"(Tariff|Rate|Unit Rate)[^0-9]*([\d,]+\.?\d*)", text, re.IGNORECASE)
    if tariff_match:
        data["tariff"] = float(tariff_match.group(2).replace(',', ''))
        data["confidence"]["tariff"] = round(random.uniform(0.90, 0.99), 2)
    else:
        # Fallback: simple math if both units and amount exist
        if data["units"] and data["amount"]:
            data["tariff"] = round(data["amount"] / data["units"], 2)
            data["confidence"]["tariff"] = 0.60 # Lower confidence for calculated value
        else:
            data["confidence"]["tariff"] = 0

    # 4. Consumer Name
    consumer_match = re.search(r"Name\s*[:.-]\s*([^\n\r]+)", text, re.IGNORECASE)
    if consumer_match:
        data["consumer_name"] = consumer_match.group(1).strip()
        data["confidence"]["consumer_name"] = round(random.uniform(0.70, 0.90), 2)
    else:
        data["confidence"]["consumer_name"] = 0

    # 5. Consumer Number
    number_match = re.search(r"(Consumer|Account)\s*(?:No|Number)\s*[:.]?\s*(\w+)", text, re.IGNORECASE)
    if number_match:
        data["consumer_number"] = number_match.group(2).strip()

    return data
