# backend/payment.py
from flask import Blueprint, request, jsonify
from supabase import create_client, Client
import base64
import hashlib
import os
import datetime
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.padding import PKCS7

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SECRET_KEY = os.environ["AES_SECRET_KEY"]
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

payment_bp = Blueprint("payment", __name__)

VALID_AMOUNTS = {1: 5050, 2: 10100, 3: 15150}


def _derive_key_iv(password: bytes, salt: bytes):
    d, d_i = b"", b""
    while len(d) < 48:
        d_i = hashlib.md5(d_i + password + salt).digest()
        d += d_i
    return d[:32], d[32:48]


def decrypt_aes(ciphertext_b64: str) -> str | None:
    try:
        raw = base64.b64decode(ciphertext_b64)
        if raw[:8] != b"Salted__":
            raise ValueError("Header 'Salted__' absent.")
        salt      = raw[8:16]
        encrypted = raw[16:]
        key, iv   = _derive_key_iv(SECRET_KEY.encode("utf-8"), salt)
        cipher    = Cipher(algorithms.AES(key), modes.CBC(iv))
        decryptor = cipher.decryptor()
        padded    = decryptor.update(encrypted) + decryptor.finalize()
        unpadder  = PKCS7(128).unpadder()
        plain     = unpadder.update(padded) + unpadder.finalize()
        return plain.decode("utf-8")
    except Exception:
        return None

def _bad(message: str, status: int = 400):
    return jsonify({"error": message}), status

def _ok(message: str, data=None, status: int = 200):
    payload = {"message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status

@payment_bp.route("/payment/request", methods=["POST"])
def request_payment():
    body = request.get_json(silent=True)
    if not body:
        return _bad("Corps JSON manquant ou invalide.")

    student_id   = decrypt_aes(body.get("student_id",   ""))
    quantity_str = decrypt_aes(body.get("quantity",     ""))
    amount_str   = decrypt_aes(body.get("amount",       ""))
    sender_phone = decrypt_aes(body.get("sender_phone", ""))

    if not all([student_id, quantity_str, amount_str, sender_phone]):
        return _bad("Déchiffrement échoué : données corrompues ou clé invalide.")

    try:
        quantity = int(quantity_str)
        amount   = int(amount_str)
    except ValueError:
        return _bad("Format de quantité ou de montant invalide.")

    if quantity not in VALID_AMOUNTS:
        return _bad(f"Quantité invalide. Valeurs acceptées : {list(VALID_AMOUNTS.keys())}.")

    if amount != VALID_AMOUNTS[quantity]:
        return _bad("Montant incohérent avec la quantité.")

    student_result = (
        supabase
        .table("students")
        .select("id, first_name, last_name")
        .eq("id", student_id)
        .limit(1)
        .execute()
    )
    if not student_result.data:
        return _bad("Étudiant introuvable.", 404)

    payment_data = {
        "student_id":   student_id,
        "quantity":     quantity,
        "amount_paid":       amount,
        "sender_phone": sender_phone,
        "status":       "pending",
        "created_at":   datetime.datetime.utcnow().isoformat(),
    }

    insert_result = supabase.table("payment_requests").insert(payment_data).execute()

    if not insert_result.data:
        return _bad("Erreur lors de l'enregistrement en base de données.", 500)

    payment_id = insert_result.data[0]["id"]

    return _ok(
        "Paiement enregistré. Redirection Wave en cours.",
        data={"payment_id": payment_id},
        status=201,
    )


# ══════════════════════════════════════════════════════════════
#  ROUTE  POST /payment/approve/<request_id>
# ══════════════════════════════════════════════════════════════

@payment_bp.route("/payment/approve/<request_id>", methods=["POST"])
def approve_payment(request_id: str):
    update_result = (
        supabase
        .table("payment_requests")
        .update({
            "status":     "approved",
            "updated_at": datetime.datetime.utcnow().isoformat(),
        })
        .eq("id", request_id)
        .execute()
    )

    if not update_result.data:
        return _bad("Paiement introuvable ou déjà traité.", 404)

    return _ok("Paiement approuvé.", data={"payment_id": request_id})