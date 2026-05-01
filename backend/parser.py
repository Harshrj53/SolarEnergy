import re

def parse_bill_data(text):
    """
    Parses extracted text using regex to find key fields.
    Fields: Units, Amount, Tariff (Optional)
    """
    data = {
        "units": None,
        "amount": None,
        "tariff": None,
        "consumer_name": "N/A",
        "consumer_number": "N/A"
    }

    # Regex patterns (flexible to handle variations)
    # Units: (Units|Consumption) followed by some non-digits and then digits
    units_match = re.search(r"(Units|Consumption|Usage|Total kWh)[^0-9]*([\d,]+)", text, re.IGNORECASE)
    if units_match:
        data["units"] = float(units_match.group(2).replace(',', ''))

    # Amount: (Total|Amount|Payable) followed by digits
    amount_match = re.search(r"(Total|Amount|Payable|Bill Amount)[^0-9₹$]*([\d,]+\.?\d*)", text, re.IGNORECASE)
    if amount_match:
        data["amount"] = float(amount_match.group(2).replace(',', ''))

    # Tariff: (Tariff|Rate|Category)
    tariff_match = re.search(r"(Tariff|Rate|Unit Rate)[^0-9]*([\d,]+\.?\d*)", text, re.IGNORECASE)
    if tariff_match:
        data["tariff"] = float(tariff_match.group(2).replace(',', ''))

    # Simple Consumer extraction
    consumer_match = re.search(r"Name\s*:\s*([^\n\r]+)", text, re.IGNORECASE)
    if consumer_match:
        data["consumer_name"] = consumer_match.group(1).strip()

    number_match = re.search(r"(Consumer|Account)\s*(?:No|Number)\s*[:.]?\s*(\w+)", text, re.IGNORECASE)
    if number_match:
        data["consumer_number"] = number_match.group(2).strip()

    return data
