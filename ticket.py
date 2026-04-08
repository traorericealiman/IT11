import io
import os
import urllib.parse
import urllib.request
from flask import Blueprint, request, jsonify
from supabase import create_client, Client
from PIL import Image, ImageDraw, ImageFont
import barcode
from barcode.writer import ImageWriter
import requests
import jwt

SUPABASE_URL              = os.environ.get("SUPABASE_URL")
SUPABASE_KEY              = os.environ.get("SUPABASE_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
JWT_SECRET                = os.environ["JWT_SECRET"]
IMAGE_URL                 = os.environ["IMAGE_URL"]
BUCKET                    = os.environ.get("BUCKET", "Tickets")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
validate_payment_bp = Blueprint("validate_payment", __name__)


def _bad(message, status=400):
    return jsonify({"error": message}), status

def _ok(message, data=None, status=200):
    payload = {"message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status

def _require_admin(req):
    auth = req.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        return None
    token = auth.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        if not payload.get("is_admin"):
            return None
        return payload
    except jwt.PyJWTError:
        return None


def _extract_path(ticket_url: str) -> str:
    """Extrait le path relatif depuis une URL Supabase complète."""
    if ticket_url.startswith("http"):
        parsed = urllib.parse.urlparse(ticket_url)
        marker = f"/object/public/{BUCKET}/"
        if marker in parsed.path:
            return parsed.path.split(marker, 1)[1]
        return parsed.path.rsplit("/", 1)[-1]
    return ticket_url


def get_next_ticket_number():
    resp = supabase.rpc("next_ticket_number").execute()
    if not resp.data:
        return None, "Séquence ticket échouée.", 500
    return str(resp.data).zfill(6), None, None


def generer_image_ticket(ticket_code: str) -> bytes:
    with urllib.request.urlopen(IMAGE_URL) as response:
        img_data = response.read()
    img = Image.open(io.BytesIO(img_data)).convert("RGBA")

    code_class  = barcode.get_barcode_class("code128")
    writer_opts = {"write_text": False, "module_height": 18.0, "quiet_zone": 1.0}
    barcode_obj = code_class(ticket_code, writer=ImageWriter())
    barcode_img = barcode_obj.render(writer_opts)
    barcode_img = barcode_img.rotate(90, expand=True).resize((160, 480))
    img.paste(barcode_img, (30, 90), barcode_img if barcode_img.mode == "RGBA" else None)

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


def uploader_supabase(image_bytes: bytes, filename: str):
    """Upload dans Supabase Storage — stocke uniquement le path relatif."""
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

    file_path = filename
    return file_path, None, None


def sauvegarder_ticket(student_id, ticket_code, ticket_path, payment_id):
    result = (
        supabase
        .table("tickets")
        .insert({
            "student_id":         student_id,
            "ticket_code":        ticket_code,
            "ticket_url":         ticket_path,   
            "payment_id": payment_id,    
        })
        .execute()
    )
    if not result.data:
        return None, "Insertion ticket échouée.", 500
    return result.data[0], None, None


def approuver_paiement(payment_id):
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


# ── Route ────────────────────────────────────────────────────
@validate_payment_bp.route("/validate-payment", methods=["POST"])
def validate_payment():
    # Auth admin
    admin = _require_admin(request)
    if not admin:
        return _bad("Accès refusé.", 403)

    body = request.get_json(silent=True)
    if not body:
        return _bad("Corps JSON manquant.")

    student_id = body.get("student_id", "").strip()
    payment_id = body.get("payment_id", "").strip()

    if not student_id or not payment_id:
        return _bad("student_id et payment_id sont requis.")

    result = (
        supabase.table("payment_requests")
        .select("id, status, quantity")
        .eq("id", payment_id)
        .eq("student_id", student_id)
        .limit(1)
        .execute()
    )
    if not result.data:
        return _bad("Paiement introuvable.", 404)
    if result.data[0]["status"] == "approved":
        return _bad("Paiement déjà validé.", 400)

    quantity = result.data[0].get("quantity", 1)

    generated = []
    for _ in range(quantity):
        ticket_code, err, code = get_next_ticket_number()
        if err:
            return _bad(err, code)

        image_bytes = generer_image_ticket(ticket_code)

        filename = f"ticket_{ticket_code}.jpg"
        ticket_path, err, code = uploader_supabase(image_bytes, filename)
        if err:
            return _bad(err, code)

        ticket, err, code = sauvegarder_ticket(student_id, ticket_code, ticket_path, payment_id)
        if err:
            return _bad(err, code)

        generated.append({
            "ticket_code": ticket_code,
            "ticket_id":   ticket.get("id"),
        })

    err, code = approuver_paiement(payment_id)
    if err:
        return _bad(err, code)

    return _ok(
        f"{quantity} ticket(s) généré(s) avec succès.",
        data={"tickets": generated, "payment_id": payment_id},
        status=201,
    )