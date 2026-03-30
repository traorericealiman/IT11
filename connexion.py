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


# ══════════════════════════════════════════════════════════════
#  CONFIGURATION
# ══════════════════════════════════════════════════════════════

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SECRET_KEY   = os.environ.get("AES_SECRET_KEY", "TaCleSecreteSuperRobusteDesIT11!")
JWT_SECRET   = os.environ.get("JWT_SECRET", "JWT_Secret_P11_2024!")
JWT_EXPIRY_H = int(os.environ.get("JWT_EXPIRY_HOURS", 168))  # 7 jours = 168 heures

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

login_bp = Blueprint("login", __name__)


# ══════════════════════════════════════════════════════════════
#  UTILITAIRES AES  (même implémentation que inscription.py)
# ══════════════════════════════════════════════════════════════

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


# ══════════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════════

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


# ══════════════════════════════════════════════════════════════
#  ROUTE  POST /login
# ══════════════════════════════════════════════════════════════

@login_bp.route("/login", methods=["POST"])
def login():
    body = request.get_json(silent=True)
    if not body:
        return _bad("Corps JSON manquant ou invalide.")

    # 1. Déchiffrement AES
    phone         = decrypt_aes(body.get("phone", ""))
    password_hash = body.get("password", "").strip()   # SHA-256 hex, haché côté client

    # 2. Validation basique
    if not phone:
        return _bad("Numéro de téléphone invalide ou déchiffrement échoué.")
    if not password_hash:
        return _bad("Mot de passe manquant.")
    if len(password_hash) != 64:
        return _bad("Format du mot de passe invalide.")

    # 3. Recherche dans Supabase par numéro de téléphone
    result = (
        supabase
        .table("students")
        .select("id, first_name, last_name, phone, password")
        .eq("phone", phone)
        .limit(1)
        .execute()
    )

    # Message générique : ne pas révéler si c'est le n° ou le mdp qui est faux
    if not result.data:
        return _bad("Identifiants incorrects.", 401)

    student = result.data[0]

    # 4. Vérification bcrypt
    stored_hash    = student["password"].encode("utf-8")
    attempt        = password_hash.encode("utf-8")
    password_valid = bcrypt.checkpw(attempt, stored_hash)

    if not password_valid:
        return _bad("Identifiants incorrects.", 401)

    # 5. Génération du JWT (valide 7 jours)
    token = _generate_jwt(student)

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
