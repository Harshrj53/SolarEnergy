import openpyxl
from openpyxl.styles import Font, Alignment, PatternFill, Border, Side
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

def auto_adjust_columns(ws):
    """
    Dynamically adjusts column widths based on content length.
    Capped at 40 characters for readability.
    """
    for col in ws.columns:
        max_length = 0
        column = col[0].column_letter # Get the column name
        for cell in col:
            try:
                if len(str(cell.value)) > max_length:
                    max_length = len(str(cell.value))
            except:
                pass
        adjusted_width = min(max_length + 4, 40)
        ws.column_dimensions[column].width = adjusted_width

def apply_cell_styling(cell, is_header=False, is_label=False):
    """
    Applies consistent alignment, borders, and fonts to a cell.
    """
    # Alignment logic
    align = "left"
    if is_header:
        align = "center"
    
    cell.alignment = Alignment(horizontal=align, vertical="center", wrap_text=True)
    cell.border = THIN_BORDER
    
    if is_header:
        cell.font = Font(bold=True, size=12)
    elif is_label:
        cell.font = Font(bold=True)

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
    Professional Excel Automation Engine with Advanced Formatting.
    """
    data = payload.get("data", payload)
    
    if not os.path.exists(TEMPLATE_PATH):
        raise FileNotFoundError(f"Template not found at {TEMPLATE_PATH}")

    try:
        wb = openpyxl.load_workbook(TEMPLATE_PATH)
        
        # Apply to all sheets (Requirements check)
        for ws in wb.worksheets:
            logger.info(f"Styling sheet: {ws.title}")
            
            # 1. Row Height for Header
            ws.row_dimensions[1].height = 30
            
            # 2. Data Mapping (Assumes Bill Data is on the active/main sheet)
            if ws == wb.active:
                # Write and Style Labels (A3:A8)
                labels_map = {
                    "A3": "Consumer Name:",
                    "A4": "Consumer Number:",
                    "A5": "Units Consumed (kWh):",
                    "A6": "Total Bill Amount (₹):",
                    "A7": "Tariff / Rate (₹/kWh):",
                    "A8": "Extraction Date:"
                }
                for cell_ref, val in labels_map.items():
                    ws[cell_ref] = val
                    apply_cell_styling(ws[cell_ref], is_label=True)

                # Write and Style Values (B3:B8)
                ws['B3'] = str(data.get("consumer_name") or "Valued Customer")
                ws['B4'] = str(data.get("consumer_number") or "N/A")
                
                # Numeric fields with specific formatting
                ws['B5'] = int(clean_numeric(data.get("units")))
                ws['B5'].number_format = '#,##0' # Integer
                
                ws['B6'] = clean_numeric(data.get("amount"))
                ws['B6'].number_format = '₹#,##0.00' # Currency
                
                ws['B7'] = clean_numeric(data.get("tariff"))
                ws['B7'].number_format = '0.00' # Float
                
                ws['B8'] = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")

                # Apply styling to value cells
                for row in ws.iter_rows(min_row=3, max_row=8, min_col=2, max_col=2):
                    for cell in row:
                        apply_cell_styling(cell)

            # 3. Final Polish: Auto-adjust and Spacing
            auto_adjust_columns(ws)

        wb.save(output_path)
        logger.info(f"Professional Excel report saved: {output_path}")
        return output_path

    except Exception as e:
        logger.error(f"Excel styling/writing error: {str(e)}")
        raise
