import io
import os
import urllib.request
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image, ImageDraw, ImageFont
import barcode
from barcode.writer import ImageWriter
import httpx

# --- CONFIGURATION ---
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_SERVICE_ROLE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
IMAGE_URL = os.environ["IMAGE_URL"]
BUCKET = os.environ.get("BUCKET", "Tickets")

HEADERS = {
    "apikey": SUPABASE_SERVICE_ROLE_KEY,
    "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation",
}

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- SCHEMA ---
class ValidatePaymentRequest(BaseModel):
    student_id: str
    payment_id: str


# --- HELPERS ---

async def verifier_paiement(payment_id: str, student_id: str):
    """Vérifie que le paiement existe, appartient à l'étudiant, et est en attente."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{SUPABASE_URL}/rest/v1/payment_requests"
            f"?id=eq.{payment_id}&student_id=eq.{student_id}&select=id,status",
            headers=HEADERS,
        )
        data = resp.json()
        if not data:
            raise HTTPException(status_code=404, detail="Paiement introuvable ou n'appartient pas à cet étudiant")
        if data[0]["status"] == "approved":
            raise HTTPException(status_code=400, detail="Paiement déjà validé, ticket déjà généré")


async def get_next_ticket_number() -> str:
    """Récupère le prochain numéro de ticket via la séquence Supabase."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SUPABASE_URL}/rest/v1/rpc/next_ticket_number",
            headers=HEADERS,
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=500, detail=f"Séquence ticket échouée : {resp.text}")
        numero = resp.json()
    return str(numero).zfill(6)


def generer_image_ticket(ticket_code: str) -> bytes:
    """Génère l'image du ticket avec le code-barres et retourne les bytes JPEG."""

    # Télécharger l'image de base
    with urllib.request.urlopen(IMAGE_URL) as response:
        img_data = response.read()
    img = Image.open(io.BytesIO(img_data)).convert("RGBA")

    # Générer le code-barres Code128
    code_class = barcode.get_barcode_class('code128')
    writer_options = {"write_text": False, "module_height": 18.0, "quiet_zone": 1.0}
    barcode_obj = code_class(ticket_code, writer=ImageWriter())
    barcode_img = barcode_obj.render(writer_options)

    barcode_img = barcode_img.rotate(90, expand=True)
    barcode_img = barcode_img.resize((160, 480))
    img.paste(barcode_img, (30, 90), barcode_img if barcode_img.mode == 'RGBA' else None)

    # Numéro en texte vertical
    txt_layer = Image.new('RGBA', (400, 100), (255, 255, 255, 0))
    draw_txt = ImageDraw.Draw(txt_layer)
    try:
        font = ImageFont.truetype("arialbd.ttf", 65)
    except:
        font = ImageFont.load_default()
    draw_txt.text((0, 0), ticket_code, fill="black", font=font)
    txt_layer = txt_layer.rotate(90, expand=True)
    img.paste(txt_layer, (200, -50), txt_layer)

    # Export en mémoire
    buffer = io.BytesIO()
    img.convert("RGB").save(buffer, "JPEG", quality=95)
    buffer.seek(0)
    return buffer.read()


async def uploader_supabase(image_bytes: bytes, filename: str) -> str:
    """Upload l'image dans Supabase Storage et retourne le lien public."""
    upload_url = f"{SUPABASE_URL}/storage/v1/object/{BUCKET}/{filename}"

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            upload_url,
            content=image_bytes,
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "image/jpeg",
                "x-upsert": "true",
            }
        )
        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=500, detail=f"Upload Supabase échoué : {resp.text}")

    return f"{SUPABASE_URL}/storage/v1/object/public/{BUCKET}/{filename}"


async def sauvegarder_ticket(student_id: str, ticket_code: str, ticket_url: str):
    """Insère le ticket en base de données."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"{SUPABASE_URL}/rest/v1/tickets",
            headers=HEADERS,
            json={
                "student_id": student_id,
                "ticket_code": ticket_code,
                "ticket_url": ticket_url,
            }
        )
        if resp.status_code not in (200, 201):
            raise HTTPException(status_code=500, detail=f"Insertion ticket échouée : {resp.text}")
        return resp.json()[0]


async def approuver_paiement(payment_id: str):
    """Passe le statut du paiement à 'approved'."""
    async with httpx.AsyncClient() as client:
        resp = await client.patch(
            f"{SUPABASE_URL}/rest/v1/payment_requests?id=eq.{payment_id}",
            headers=HEADERS,
            json={"status": "approved"}
        )
        if resp.status_code not in (200, 204):
            raise HTTPException(status_code=500, detail=f"Approbation paiement échouée : {resp.text}")


# --- ENDPOINT ---

@app.post("/validate-payment")
async def validate_payment(body: ValidatePaymentRequest):
    # 0. Vérifier que le paiement est valide et en attente
    await verifier_paiement(body.payment_id, body.student_id)

    # 1. Numéro unique depuis la séquence
    ticket_code = await get_next_ticket_number()

    # 2. Génération de l'image avec code-barres
    image_bytes = generer_image_ticket(ticket_code)

    # 3. Upload dans Supabase Storage
    filename = f"ticket_{ticket_code}.jpg"
    ticket_url = await uploader_supabase(image_bytes, filename)

    # 4. Sauvegarde en base de données
    ticket = await sauvegarder_ticket(body.student_id, ticket_code, ticket_url)

    # 5. Approbation du paiement
    await approuver_paiement(body.payment_id)

    return {
        "success": True,
        "ticket_code": ticket_code,
        "ticket_url": ticket_url,
        "ticket_id": ticket.get("id"),
    }