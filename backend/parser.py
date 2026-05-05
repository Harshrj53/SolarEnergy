import re
import random

def parse_bill_data(text):
    """
    Robust parsing for MahaVitaran (MSEDCL) bills.
    Uses section isolation and multi-language key matching.
    """
    data = {
        "consumer_name": "N/A",
        "consumer_number": "N/A",
        "units": 0,
        "amount": 0,
        "tariff": "Residential",
        "confidence": {"consumer_name": 0, "units": 0, "amount": 0, "tariff": 0}
    }

    if not text:
        return data

    # Clean text: remove redundant spaces but keep lines
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    full_text = "\n".join(lines)

    # 1. ISOLATE CONSUMER SECTION (Usually top half)
    # Most false positives (Bank details, MSEDCL name) are at the bottom.
    header_section = full_text
    footer_keywords = ["Bank Details", "देयक भरणा", "Instructions", "For making Energy Bill", "Beneficiary"]
    for kw in footer_keywords:
        if kw in full_text:
            header_section = full_text.split(kw)[0]
            break

    # 2. CONSUMER NUMBER (8-12 Digits)
    # Pattern: 'ग्राहक क्रमांक : 439322232375' or 'Consumer No : 439322232375'
    cons_no_match = re.search(r"(?:ग्राहक क्रमांक|Consumer No|Consumer Number|Account No)[^\d]*(\d{8,12})", header_section, re.IGNORECASE)
    if cons_no_match:
        data["consumer_number"] = cons_no_match.group(1)
        data["confidence"]["consumer_number"] = 0.99

    # 3. CONSUMER NAME
    # Look for 'Name / नाव :' or 'Bill For :'
    # Avoid lines starting with 'MSEDCL', 'MAHAVITARAN', etc.
    blacklist = ["MSEDCL", "MAHAVITARAN", "BILL OF SUPPLY", "STATE BANK", "IFB", "TUMSAR", "BHANDARA", "OFFICE"]
    
    name_patterns = [
        r"(?:Name|नाव|Name of Consumer|Customer Name)\s*[:.-]?\s*([A-Z\s]{3,})",
        r"(?:Bill For)\s*[:.-]?\s*([A-Z\s]{3,})",
    ]
    
    for pattern in name_patterns:
        match = re.search(pattern, header_section, re.IGNORECASE)
        if match:
            candidate = match.group(1).strip()
            # Split into lines in case regex is too greedy
            candidate = candidate.split('\n')[0].strip()
            if not any(b in candidate.upper() for b in blacklist) and len(candidate.split()) >= 2:
                data["consumer_name"] = candidate
                data["confidence"]["consumer_name"] = 0.95
                break

    if data["consumer_name"] == "N/A":
        # Fallback: Find the first line with at least 2 words, all caps, not blacklisted
        for line in lines[:15]: # Look in top 15 lines
            if line.isupper() and len(line.split()) >= 2 and not any(b in line.upper() for b in blacklist):
                data["consumer_name"] = line
                data["confidence"]["consumer_name"] = 0.85
                break

    # 4. UNITS CONSUMED (kWh)
    # Search for 'Total Units' or 'एकूण वापर'
    units_match = re.search(r"(?:एकूण वापर|Total Units|Units|Usage)[^\d]*(\d{1,5})(?!\d)", header_section, re.IGNORECASE)
    if units_match:
        data["units"] = float(units_match.group(1))
        data["confidence"]["units"] = 0.98
    else:
        # Table row fallback
        table_row = re.search(r"(\d{3,6})\s+(\d{3,6})\s+[\d.]+\s+(\d+)\s+0\s+(\d+)", header_section)
        if table_row:
            data["units"] = float(table_row.group(4))
            data["confidence"]["units"] = 0.90

    # 5. BILL AMOUNT (₹)
    amount_match = re.search(r"(?:देयक रक्कम|Bill Amount|Payable Amount|Total Payable)[^0-9₹]*([\d,]+\.\d{2})", header_section, re.IGNORECASE)
    if amount_match:
        data["amount"] = float(amount_match.group(1).replace(',', ''))
        data["confidence"]["amount"] = 0.99
    else:
        # Simple digit fallback - look for a large number with decimal near the end
        amt_fallback = re.search(r"(?:Total|Payable|₹|n)\s*([\d,]+\.\d{2})", header_section, re.IGNORECASE)
        if amt_fallback:
            data["amount"] = float(amt_fallback.group(1).replace(',', ''))
            data["confidence"]["amount"] = 0.80

    # 6. TARIFF CATEGORY
    tariff_match = re.search(r"(?:Tariff|दर संकेत|Category|Rate)\s*[:.-]?\s*([A-Z\d\s/-]{3,})", header_section, re.IGNORECASE)
    if tariff_match:
        data["tariff"] = tariff_match.group(1).strip().split('\n')[0]
        data["confidence"]["tariff"] = 0.90

    return data

    return data
