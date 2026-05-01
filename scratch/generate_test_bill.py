from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import os

def create_sample_bill(output_path):
    c = canvas.Canvas(output_path, pagesize=letter)
    width, height = letter

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "MUNICIPAL ELECTRICITY BOARD")
    
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 70, "123 Energy Street, Power City")
    c.drawString(50, height - 85, "Date: 2026-04-25")

    c.line(50, height - 100, width - 50, height - 100)

    # Bill Details
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 130, "Consumer Details:")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 150, "Name: John Doe")
    c.drawString(50, height - 165, "Consumer Number: 987654321")

    # Usage Details
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 200, "Billing Information:")
    c.setFont("Helvetica", 12)
    c.drawString(50, height - 220, "Previous Reading: 5400 kWh")
    c.drawString(50, height - 235, "Current Reading: 5850 kWh")
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, height - 255, "Units Consumed: 450 kWh")
    
    # Financials
    c.line(50, height - 275, width - 50, height - 275)
    c.drawString(50, height - 300, "Unit Rate (Tariff): ₹ 7.50 / kWh")
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, height - 330, "Total Bill Amount: ₹ 3375.00")
    
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 360, "Please pay by the due date to avoid late fees.")

    c.save()
    print(f"Sample bill created at: {output_path}")

if __name__ == "__main__":
    test_dir = "/Users/harshraj/Desktop/EnergyBae/test_files"
    os.makedirs(test_dir, exist_ok=True)
    create_sample_bill(os.path.join(test_dir, "sample_bill.pdf"))
