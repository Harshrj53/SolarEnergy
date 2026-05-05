import sys
import os

# Add backend to path
sys.path.append('/Users/harshraj/Desktop/EnergyBae/backend')

from extractor import extract_text
from parser import parse_bill_data

def test_extraction(file_path):
    print(f"Testing: {file_path}")
    with open(file_path, "rb") as f:
        file_bytes = f.read()
    
    text = extract_text(file_bytes, os.path.basename(file_path))
    print("\n--- Extracted Text (Preview) ---")
    print(text[:300] + "...")
    
    data = parse_bill_data(text)
    print("\n--- Parsed Data ---")
    for key, value in data.items():
        if key != "confidence":
            print(f"{key}: {value}")
    print(f"Confidence: {data['confidence']}")

if __name__ == "__main__":
    sample_path = "/Users/harshraj/Desktop/EnergyBae/test_files/sample_bill.pdf"
    if os.path.exists(sample_path):
        test_extraction(sample_path)
    else:
        print("Sample bill not found.")
