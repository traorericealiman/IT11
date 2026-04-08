# backend/connexion.py
from flask import Blueprint, request, jsonify
from supabase import create_client, Client
import bcrypt
import base64
import hashlib
import os
import jwt
import datetime
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.padding import PKCS7

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SECRET_KEY   = os.environ["AES_SECRET_KEY"]
JWT_SECRET   = os.environ["JWT_SECRET"]
JWT_EXPIRY_H = int(os.environ.get("JWT_EXPIRY_HOURS", 168))

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

login_admin_bp = Blueprint("login_admin", __name__)


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


def _generate_jwt(student: dict, is_admin: bool) -> str:
    now = datetime.datetime.utcnow()
    payload = {
        "sub":        str(student["id"]),
        "first_name": student["first_name"],
        "last_name":  student["last_name"],
        "phone":      student["phone"],
        "is_admin":   is_admin,
        "iat":        now,
        "exp":        now + datetime.timedelta(hours=JWT_EXPIRY_H),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm="HS256")


@login_admin_bp.route("/auth/login", methods=["POST"])
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
        .select("id, first_name, last_name, phone, password, is_admin")
        .eq("phone", phone)
        .limit(1)
        .execute()
    )

    if not result.data:
        return _bad("Identifiants incorrects.", 401)

    student = result.data[0]

    if student["is_admin"]:
        return _bad("Accès refusé. Utilisez la route admin.", 403)

    stored_hash    = student["password"].encode("utf-8")
    attempt        = password_hash.encode("utf-8")
    password_valid = bcrypt.checkpw(attempt, stored_hash)

    if not password_valid:
        return _bad("Identifiants incorrects.", 401)

    token = _generate_jwt(student, is_admin=False)

    return _ok(
        "Connexion réussie !",
        data={
            "token":      token,
            "id":         student["id"],
            "first_name": student["first_name"],
            "last_name":  student["last_name"],
        },
        status=200,
    )

@login_admin_bp.route("/admin/login", methods=["POST"])
def admin_login():
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
        .select("id, first_name, last_name, phone, password, is_admin")
        .eq("phone", phone)
        .limit(1)
        .execute()
    )

    if not result.data:
        return _bad("Identifiants incorrects.", 401)

    student = result.data[0]

    if not student["is_admin"]:
        return _bad("Accès refusé. Compte non administrateur.", 403)

    stored_hash    = student["password"].encode("utf-8")
    attempt        = password_hash.encode("utf-8")
    password_valid = bcrypt.checkpw(attempt, stored_hash)

    if not password_valid:
        return _bad("Identifiants incorrects.", 401)

    token = _generate_jwt(student, is_admin=True)

    return _ok(
        "Connexion admin réussie !",
        data={
            "token":      token,
            "id":         student["id"],
            "first_name": student["first_name"],
            "last_name":  student["last_name"],
            "is_admin":   True,
        },
        status=200,
    )