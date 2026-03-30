# backend/routes/inscription.py
from flask import Blueprint, request, jsonify
from supabase import create_client, Client
import bcrypt
import os
from ..utils.crypto import decrypt_aes

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

register_bp = Blueprint("register", __name__)


def _bad(message: str, status: int = 400):
    return jsonify({"error": message}), status


def _ok(message: str, data=None, status: int = 200):
    payload = {"message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status


@register_bp.route("/register", methods=["POST"])
def register():
    body = request.get_json(silent=True)
    if not body:
        return _bad("Corps JSON manquant ou invalide.")

    first_name    = decrypt_aes(body.get("firstName", ""))
    last_name     = decrypt_aes(body.get("lastName",  ""))
    phone         = decrypt_aes(body.get("phone",     ""))
    password_hash = body.get("password", "").strip()

    if not all([first_name, last_name, phone, password_hash]):
        return _bad("Tous les champs sont obligatoires ou le déchiffrement a échoué.")

    if len(password_hash) != 64:
        return _bad("Format du mot de passe invalide.")

    existing = supabase.table("students").select("id").eq("phone", phone).execute()
    if existing.data:
        return _bad("Ce numéro de téléphone est déjà utilisé.", 409)

    hashed_password = bcrypt.hashpw(
        password_hash.encode("utf-8"),
        bcrypt.gensalt(rounds=12)
    ).decode("utf-8")

    student = {
        "first_name": first_name,
        "last_name":  last_name,
        "phone":      phone,
        "password":   hashed_password,
    }

    result = supabase.table("students").insert(student).execute()

    return _ok("Inscription réussie !", data={"id": result.data[0].get("id")}, status=201)
