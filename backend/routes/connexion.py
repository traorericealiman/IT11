# backend/routes/connexion.py
from flask import Blueprint, request, jsonify
from supabase import create_client, Client
import bcrypt
import os
import jwt
import datetime
from utils.crypto import decrypt_aes

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
JWT_SECRET   = os.environ["JWT_SECRET"]
JWT_EXPIRY_H = int(os.environ.get("JWT_EXPIRY_HOURS", 168))

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

login_bp = Blueprint("login", __name__)


def _bad(message: str, status: int = 400):
    return jsonify({"error": message}), status


def _ok(message: str, data=None, status: int = 200):
    payload = {"message": message}
    if data is not None:
        payload["data"] = data
    return jsonify(payload), status


def _generate_jwt(student: dict) -> str:
    now = datetime.datetime.utcnow()
    payload = {
        "sub":        str(student["id"]),
        "first_name": student["first_name"],
        "last_name":  student["last_name"],
        "phone":      student["phone"],
        "iat":        now,
        "exp":        now + datetime.timedelta(hours=JWT_EXPIRY_H),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


@login_bp.route("/login", methods=["POST"])
def login():
    body = request.get_json(silent=True)
    if not body:
        return _bad("Corps JSON manquant ou invalide.")

    phone         = decrypt_aes(body.get("phone", ""))
    password_hash = body.get("password", "").strip()

    if not phone:
        return _bad("Numéro de téléphone invalide ou déchiffrement échoué.")
    if not password_hash:
        return _bad("Mot de passe manquant.")
    if len(password_hash) != 64:
        return _bad("Format du mot de passe invalide.")

    result = (
        supabase
        .table("students")
        .select("id, first_name, last_name, phone, password")
        .eq("phone", phone)
        .limit(1)
        .execute()
    )

    if not result.data:
        return _bad("Identifiants incorrects.", 401)

    student = result.data[0]

    password_valid = bcrypt.checkpw(
        password_hash.encode("utf-8"),
        student["password"].encode("utf-8")
    )

    if not password_valid:
        return _bad("Identifiants incorrects.", 401)

    token = _generate_jwt(student)

    return _ok(
        "Connexion réussie !",
        data={
            "token":      token,
            "id":         student["id"],
            "first_name": student["first_name"],
            "last_name":  student["last_name"],
        },
    )
