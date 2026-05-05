import re
import random

def parse_bill_data(text):
    """
    Semantic Extraction Engine v3.0 (Market Grade)
    Designed to handle any MSEDCL bill quality or layout.
    """
    if not text:
        return {"consumer_name": "N/A", "consumer_number": "N/A", "units": 0, "amount": 0, "sanctioned_load": 0, "bill_date": "N/A", "due_date": "N/A", "tariff": "N/A", "confidence": {}}

    # 1. CLEANING & NORMALIZATION
    text = text.replace('O', '0').replace('I', '1').replace('|', '1').replace('र.', 'Rs.').replace('रु', 'Rs.')
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    full_text = "\n".join(lines)
    
    data = {
        "consumer_name": "N/A",
        "consumer_number": "N/A",
        "units": 0,
        "amount": 0,
        "sanctioned_load": 0,
        "bill_date": "N/A",
        "due_date": "N/A",
        "tariff": "Residential",
        "confidence": {}
    }

    # 2. CONSUMER NUMBER (12-digit anchor)
    # Market bills often have 12 digits, sometimes with spaces
    all_12_digit_blocks = re.findall(r"(\d[\s\d]{10,14}\d)", full_text)
    for block in all_12_digit_blocks:
        clean = re.sub(r"\s+", "", block)
        if len(clean) >= 12:
            data["consumer_number"] = clean[:12]
            break

    # 3. UNITS (Search for 'एकूण वापर' or 'Total Units' and find closest number)
    unit_labels = ["एकूण वापर", "वापर", "TOTAL UNITS", "USAGE", "UNITS", "KWH"]
    for i, line in enumerate(lines):
        if any(label in line.upper() for label in unit_labels):
            # Scan this line and next 2 for a logical unit value (2-5 digits)
            context = " ".join(lines[i:i+3])
            # Look for 1.00 [units] 0 [units] pattern first
            table_match = re.search(r"1\.00\s+(\d+)\s+0\s+(\d+)", context)
            if table_match:
                data["units"] = float(table_match.group(2))
                break
            # Fallback: get the last number in the line
            nums = re.findall(r"\d{2,5}(?!\d)", context)
            if nums:
                data["units"] = float(nums[-1])
                break

    # 4. AMOUNT (Rs. XXXXX.XX)
    # Priority 1: Values near 'देयक रक्कम', 'Payable', or 'Rs.'
    amt_labels = ["रक्कम", "PAYABLE", "TOTAL", "AMOUNT", "RS.", "DEYAK"]
    for i, line in enumerate(lines):
        if any(label in line.upper() for label in amt_labels):
            # Look for decimal values in this line or next
            context = " ".join(lines[i:i+2])
            matches = re.findall(r"([\d,]+\.\d{2})", context)
            if matches:
                data["amount"] = float(matches[0].replace(',', ''))
                break
    
    if data["amount"] == 0:
        # Priority 2: Find any valid high-value decimal in the top section
        all_decs = re.findall(r"([\d,]+\.\d{2})", "\n".join(lines[:30]))
        if all_decs:
            nums = [float(x.replace(',', '')) for x in all_decs if float(x.replace(',', '')) > 100]
            if nums: data["amount"] = nums[0]

    # 5. CONSUMER NAME (Semantic search near the top)
    # Usually right below 'MAHAVITARAN' or above the address
    blacklist = ["MAHAVITARAN", "MSEDCL", "SUPPLY", "MONTH", "BILL", "ELECTRICITY", "BOARD", "DETAILS", "CUSTOMER"]
    for line in lines[1:15]:
        words = line.split()
        if 2 <= len(words) <= 5 and line.isupper() and not any(b in line.upper() for b in blacklist):
            data["consumer_name"] = line
            break

    # 6. SANCTIONED LOAD
    load_match = re.search(r"(?:मंजूर भार|Connected|Sanctioned|Load)[^\d]*([\d.]+)", full_text, re.IGNORECASE)
    if load_match:
        data["sanctioned_load"] = float(load_match.group(1))

    # 7. TARIFF
    tariff_match = re.search(r"(\d{2}/LT[^\n]+Phase)", full_text, re.IGNORECASE)
    if tariff_match:
        data["tariff"] = tariff_match.group(1).strip()

    # 8. DATES
    date_patterns = [r"(\d{2}[-./]\d{2}[-./]\d{4})", r"(\d{2}[-./]\d{2}[-./]\d{2})"]
    all_dates = []
    for p in date_patterns:
        all_dates.extend(re.findall(p, full_text))
    
    if len(all_dates) >= 2:
        data["bill_date"] = all_dates[0]
        data["due_date"] = all_dates[1]

    return data
