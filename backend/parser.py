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

    # 0. Pre-processing: Ignore Bank Details section (bottom of the bill)
    # This section often contains misleading numbers and names (e.g., MSEDCL)
    bank_section_keywords = ["For making Energy Bill payment", "Beneficiary Name", "IFS Code", "Bank Name"]
    for keyword in bank_section_keywords:
        if keyword in text:
            text = text.split(keyword)[0]
            break

    # Clean text to remove extra whitespaces but keep line breaks for positional context
    text_lines = [line.strip() for line in text.split('\n') if line.strip()]
    clean_text = "\n".join(text_lines)

    # 1. Units Extraction (Including Marathi 'एकूण वापर')
    # Patterns: Units: 137, एकूण वापर 137, Total Units 137
    # More specific search for the table value
    units_match = re.search(r"(?:एकूण वापर|Total Units|Units|Usage)[^0-9\n]*(\d{1,4})(?!\d)", clean_text, re.IGNORECASE)
    if units_match:
        data["units"] = float(units_match.group(1).replace(',', ''))
        data["confidence"]["units"] = 0.95
    else:
        # Look for the last number in the units table row
        # Usually: 18429 18292 1.00 137 0 137
        table_row = re.search(r"(\d{5})\s+(\d{5})\s+[\d.]+\s+(\d+)\s+0\s+(\d+)", clean_text)
        if table_row:
            data["units"] = float(table_row.group(4))
            data["confidence"]["units"] = 0.85

    # 2. Amount Extraction (Including Marathi 'देयक रक्कम')
    # Priority on 'देयक रक्कम' which is the actual bill amount
    amount_match = re.search(r"(?:देयक रक्कम|Bill Amount|Payable Amount)[^0-9₹$]*([\d,]+\.\d{2})", clean_text, re.IGNORECASE)
    if not amount_match:
        amount_match = re.search(r"(?:Total|Amount|Payable)[^0-9₹$]*([\d,]+\.\d{2})", clean_text, re.IGNORECASE)
    
    if amount_match:
        data["amount"] = float(amount_match.group(1).replace(',', ''))
        data["confidence"]["amount"] = 0.98
    elif re.search(r"Rs\.\s*([\d,]+\.\d{2})", clean_text):
        # Fallback to general Rs. pattern
        amt = re.findall(r"Rs\.\s*([\d,]+\.\d{2})", clean_text)
        if amt:
            data["amount"] = float(amt[0].replace(',', ''))
            data["confidence"]["amount"] = 0.70

    # 3. Consumer Number (Including Marathi 'ग्राहक क्रमांक')
    number_match = re.search(r"(?:ग्राहक क्रमांक|Consumer|Account)\s*(?:No|Number)?\s*[:.]?\s*(\d{12})", clean_text, re.IGNORECASE)
    if number_match:
        data["consumer_number"] = number_match.group(1).strip()
    
    # 4. Consumer Name
    # Blacklist common false positives
    blacklist = ["MSEDCL", "MAHAVITARAN", "BILL OF SUPPLY", "STATE BANK OF INDIA", "IFB BKC", "TUMSAR", "BHANDARA"]
    
    # Look for Name specifically
    name_match = re.search(r"(?:Name|नाव)\s*[:.-]\s*([A-Z\s]{5,})", clean_text, re.IGNORECASE)
    if name_match:
        name = name_match.group(1).strip()
        if not any(b in name for b in blacklist):
            data["consumer_name"] = name
            data["confidence"]["consumer_name"] = 0.95

    if not data["consumer_name"]:
        # Positional Fallback: Name is often the first line of text after consumer info
        # Look for the first line that is all uppercase and at least 10 chars
        potential_names = re.findall(r"^[A-Z\s]{10,40}$", clean_text, re.MULTILINE)
        for name in potential_names:
            name = name.strip()
            if name and not any(b in name for b in blacklist) and len(name.split()) >= 2:
                data["consumer_name"] = name
                data["confidence"]["consumer_name"] = 0.80
                break

    # 5. Tariff Extraction
    tariff_match = re.search(r"(?:Tariff|Rate|Unit Rate|दर संकेत|दर)[^0-9]*([\d/]+|[A-Z\d\s/-]{5,})", clean_text, re.IGNORECASE)
    if tariff_match:
        data["tariff"] = tariff_match.group(1).strip()
        data["confidence"]["tariff"] = 0.90
    else:
        # Match pattern like '90/LT I Res 1-Phase'
        pattern_match = re.search(r"(\d{2}/[A-Z\s\d-]+Phase)", clean_text)
        if pattern_match:
            data["tariff"] = pattern_match.group(1).strip()
            data["confidence"]["tariff"] = 0.85

    return data
