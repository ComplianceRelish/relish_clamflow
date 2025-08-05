# label_generator.py
import qrcode
from PIL import Image
from escpos.printer import Usb

def generate_qr_code(lot_id):
    qr = qrcode.QRCode(version=1, box_size=10, border=2)
    qr.add_data(f"https://clamflow.com/trace/{lot_id}")
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    img.save(f"/labels/{lot_id}.png")
    return f"/labels/{lot_id}.png"

def print_label(lot_id, product_type, grade, weight_kg, process):
    printer = Usb(0x04b8, 0x0202)  # Zebra TLP 2844
    printer.text("RELISH HAO HAO CHI FOODS\n")
    printer.text("26/600 M O Ward, Alappuzha 688001\n")
    printer.text(f"Lot ID: {lot_id}\n")
    printer.text(f"Product: {product_type} - {grade}\n")
    printer.text(f"Weight: {weight_kg} kg\n")
    printer.text(f"Process: {process}\n")
    qr_path = generate_qr_code(lot_id)
    printer.image(qr_path)
    printer.cut()