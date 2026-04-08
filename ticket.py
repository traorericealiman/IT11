# backend/validate_payment.py
import io
import os
import urllib.request
from flask import Blueprint, request, jsonify
from supabase import create_client, Client
from PIL import Image, ImageDraw, ImageFont
import barcode
from barcode.writer import ImageWriter
import requests

# --- CONFIGURATION ---
SUPABASE_URL              = os.environ.get("SUPABASE_URL")
SUPABASE_KEY              = os.environ.get("SUPABASE_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
IMAGE_URL                 = os.environ["IMAGE_URL"]
BUCKET                    = os.environ.get("BUCKET", "Tickets")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

validate_payment_bp = Blueprint("validate_payment", __name__)


# --- HELPERS ---

def _bad(message: str, status: int = 400):
    return jsonify({"error": message}), status


def _ok(message: str, data=None, status: int = 200):
    payload = {"message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status


def verifier_paiement(payment_id: str, student_id: str):
    """Vérifie que le paiement existe, appartient à l'étudiant, et n'est pas déjà approuvé."""
    result = (
        supabase
        .table("payment_requests")
        .select("id, status")
        .eq("id", payment_id)
        .eq("student_id", student_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        return None, "Paiement introuvable ou n'appartient pas à cet étudiant.", 404
    if result.data[0]["status"] == "approved":
        return None, "Paiement déjà validé, ticket déjà généré.", 400
    return result.data[0], None, None


def get_next_ticket_number() -> tuple:
    """Récupère le prochain numéro de ticket via la séquence Supabase."""
    resp = supabase.rpc("next_ticket_number").execute()
    if not resp.data:
        return None, "Séquence ticket échouée.", 500
    return str(resp.data).zfill(6), None, None


def generer_image_ticket(ticket_code: str) -> bytes:
    """Génère l'image du ticket avec le code-barres et retourne les bytes JPEG."""
    with urllib.request.urlopen(IMAGE_URL) as response:
        img_data = response.read()
    img = Image.open(io.BytesIO(img_data)).convert("RGBA")

    # Code-barres Code128 vertical
    code_class  = barcode.get_barcode_class("code128")
    writer_opts = {"write_text": False, "module_height": 18.0, "quiet_zone": 1.0}
    barcode_obj = code_class(ticket_code, writer=ImageWriter())
    barcode_img = barcode_obj.render(writer_opts)
    barcode_img = barcode_img.rotate(90, expand=True).resize((160, 480))
    img.paste(barcode_img, (30, 90), barcode_img if barcode_img.mode == "RGBA" else None)

    # Numéro en texte vertical
    txt_layer = Image.new("RGBA", (400, 100), (255, 255, 255, 0))
    draw_txt  = ImageDraw.Draw(txt_layer)
    try:
        font = ImageFont.truetype("arialbd.ttf", 65)
    except Exception:
        font = ImageFont.load_default()
    draw_txt.text((0, 0), ticket_code, fill="black", font=font)
    txt_layer = txt_layer.rotate(90, expand=True)
    img.paste(txt_layer, (200, -50), txt_layer)

    buffer = io.BytesIO()
    img.convert("RGB").save(buffer, "JPEG", quality=95)
    buffer.seek(0)
    return buffer.read()


def uploader_supabase(image_bytes: bytes, filename: str) -> tuple:
    """Upload l'image dans Supabase Storage et retourne le lien public."""
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{filename}"
    resp = requests.post(
        upload_url,
        data=image_bytes,
        headers={
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
            "Content-Type":  "image/jpeg",
            "x-upsert":      "true",
        },
    )
    if resp.status_code not in (200, 201):
        return None, f"Upload Supabase échoué : {resp.text}", 500
    public_url = f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{filename}"
    return public_url, None, None


def sauvegarder_ticket(student_id: str, ticket_code: str, ticket_url: str) -> tuple:
    """Insère le ticket en base de données."""
    result = (
        supabase
        .table("tickets")
        .insert({
            "student_id":  student_id,
            "ticket_code": ticket_code,
            "ticket_url":  ticket_url,
        })
        .execute()
    )
    if not result.data:
        return None, "Insertion ticket échouée.", 500
    return result.data[0], None, None


def approuver_paiement(payment_id: str) -> tuple:
    """Passe le statut du paiement à 'approved'."""
    result = (
        supabase
        .table("payment_requests")
        .update({"status": "approved"})
        .eq("id", payment_id)
        .execute()
    )
    if not result.data:
        return "Approbation paiement échouée.", 500
    return None, None


# --- ROUTE ---

@validate_payment_bp.route("/validate-payment", methods=["POST"])
def validate_payment():
    body = request.get_json(silent=True)
    if not body:
        return _bad("Corps JSON manquant ou invalide.")

    student_id = body.get("student_id", "").strip()
    payment_id = body.get("payment_id", "").strip()

    if not student_id or not payment_id:
        return _bad("student_id et payment_id sont requis.")

    # 0. Vérifier le paiement
    _, err, code = verifier_paiement(payment_id, student_id)
    if err:
        return _bad(err, code)

    # 1. Numéro unique depuis la séquence
    ticket_code, err, code = get_next_ticket_number()
    if err:
        return _bad(err, code)

    # 2. Génération de l'image avec code-barres
    image_bytes = generer_image_ticket(ticket_code)

    # 3. Upload dans Supabase Storage
    filename = f"ticket_{ticket_code}.jpg"
    ticket_url, err, code = uploader_supabase(image_bytes, filename)
    if err:
        return _bad(err, code)

    # 4. Sauvegarde en base de données
    ticket, err, code = sauvegarder_ticket(student_id, ticket_code, ticket_url)
    if err:
        return _bad(err, code)

    # 5. Approbation du paiement
    err, code = approuver_paiement(payment_id)
    if err:
        return _bad(err, code)

    return _ok(
        "Ticket généré avec succès !",
        data={
            "ticket_code": ticket_code,
            "ticket_url":  ticket_url,
            "ticket_id":   ticket.get("id"),
        },
        status=201,
    )