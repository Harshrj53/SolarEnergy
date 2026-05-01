import openpyxl
from openpyxl.styles import Font, Alignment, Border, Side
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

# Styling Tokens
THIN_BORDER = Border(
    left=Side(style='thin', color='CCCCCC'),
    right=Side(style='thin', color='CCCCCC'),
    top=Side(style='thin', color='CCCCCC'),
    bottom=Side(style='thin', color='CCCCCC')
)

def setup_page_layout(ws):
    """
    Sets explicit column widths and header row height for cross-platform stability.
    Standardized for Excel, Google Sheets, and Numbers.
    """
    # Column Widths (A=18, B=18, C=22, D=22)
    ws.column_dimensions['A'].width = 18
    ws.column_dimensions['B'].width = 18
    ws.column_dimensions['C'].width = 22
    ws.column_dimensions['D'].width = 22

    # Header Height
    ws.row_dimensions[1].height = 35

    # Merge Header A1:D1
    ws.unmerge_cells('A1:D1') # Reset if exists
    ws.merge_cells('A1:D1')
    
    header = ws['A1']
    header.alignment = Alignment(horizontal="center", vertical="center")
    header.font = Font(bold=True, size=14)

def write_data_row(ws, row_idx, label, value, number_format=None, is_bold_value=False):
    """
    Writes a 4-column balanced row:
    - Merges A:B for Label
    - Merges C:D for Value
    - Applies wrap_text and vertical centering
    """
    # 1. Prepare Label (A:B)
    ws.merge_cells(start_row=row_idx, start_column=1, end_row=row_idx, end_column=2)
    cell_label = ws.cell(row=row_idx, column=1)
    cell_label.value = label
    cell_label.font = Font(bold=True)
    cell_label.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
    
    # 2. Prepare Value (C:D)
    ws.merge_cells(start_row=row_idx, start_column=3, end_row=row_idx, end_column=4)
    cell_value = ws.cell(row=row_idx, column=3)
    cell_value.value = value
    if number_format:
        cell_value.number_format = number_format
    
    cell_value.alignment = Alignment(horizontal="left", vertical="center", wrap_text=True)
    if is_bold_value:
        cell_value.font = Font(bold=True)

    # 3. Apply Row Height & Borders
    ws.row_dimensions[row_idx].height = 25
    
    # Apply borders to all 4 cells in the row
    for col in range(1, 5):
        cell = ws.cell(row=row_idx, column=col)
        cell.border = THIN_BORDER

def clean_numeric(value):
    """Utility to ensure we are writing floats to Excel."""
    if value is None or value == "": return 0.0
    if isinstance(value, (int, float)): return float(value)
    cleaned = re.sub(r"[^\d.]", "", str(value).replace(',', ''))
    try:
        return float(cleaned)
    except:
        return 0.0

def write_to_template(payload, output_path):
    """
    Advanced Refactored Excel Generation Engine.
    Uses a balanced 4-column grid (A:B Label | C:D Value).
    """
    data = payload.get("data", payload)
    
    if not os.path.exists(TEMPLATE_PATH):
        raise FileNotFoundError(f"Template not found at {TEMPLATE_PATH}")

    try:
        wb = openpyxl.load_workbook(TEMPLATE_PATH)
        ws = wb.active
        
        # 1. Initialize Structure
        setup_page_layout(ws)
        
        # 2. Populate Data using the 4-Column Balanced Grid
        # Row 3: Consumer Name
        write_data_row(ws, 3, "Consumer Name", str(data.get("consumer_name") or "Valued Customer"))
        
        # Row 4: Consumer Number
        write_data_row(ws, 4, "Consumer Number", str(data.get("consumer_number") or "N/A"))
        
        # Row 5: Units (Shortened label as requested)
        units = int(clean_numeric(data.get("units")))
        write_data_row(ws, 5, "Units (kWh)", units, number_format='#,##0')
        
        # Row 6: Total Bill Amount
        amount = clean_numeric(data.get("amount"))
        write_data_row(ws, 6, "Total Bill Amount", amount, number_format='₹#,##0.00')
        
        # Row 7: Rate (Shortened label as requested)
        tariff = clean_numeric(data.get("tariff"))
        write_data_row(ws, 7, "Rate (₹/kWh)", tariff, number_format='0.00')
        
        # Row 8: Extraction Date
        date_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
        write_data_row(ws, 8, "Extraction Date", date_str)

        # 3. Save
        wb.save(output_path)
        logger.info(f"Professional 4-column report generated: {output_path}")
        return output_path

    except Exception as e:
        logger.error(f"Excel Refactor Error: {str(e)}")
        raise
