import openpyxl
import datetime
import os

# Calculate template path relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEMPLATE_PATH = os.path.join(BASE_DIR, "templates", "solar_template.xlsx")

def write_to_template(data, output_path):
    """
    Loads the template, fills data into input cells, and saves it.
    Input Cells (based on scratch/create_template.py):
    B3: Consumer Name
    B4: Consumer Number
    B5: Units Consumed
    B6: Total Bill Amount
    B7: Tariff / Rate
    B8: Extraction Date
    """
    if not os.path.exists(TEMPLATE_PATH):
        raise FileNotFoundError(f"Template not found at {TEMPLATE_PATH}")

    wb = openpyxl.load_workbook(TEMPLATE_PATH)
    ws = wb.active

    ws['B3'] = data.get("consumer_name", "N/A")
    ws['B4'] = data.get("consumer_number", "N/A")
    ws['B5'] = data.get("units")
    ws['B6'] = data.get("amount")
    ws['B7'] = data.get("tariff")
    ws['B8'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

    wb.save(output_path)
    return output_path
