# backend/app.py
from flask import Blueprint, Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
import bcrypt
import os
import base64
import hashlib
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.padding import PKCS7

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SECRET_KEY   = os.environ["AES_SECRET_KEY"]

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

register_bp = Blueprint("register", __name__)


app = Flask(__name__)
CORS(app)


def _derive_key_iv(password: bytes, salt: bytes):
    """Dérive une clé AES-256 (32 B) et un IV (16 B) à la manière d'OpenSSL."""
    d, d_i = b"", b""
    while len(d) < 48:
        d_i = hashlib.md5(d_i + password + salt).digest()
        d += d_i
    return d[:32], d[32:48]


def decrypt_aes(ciphertext_b64: str) -> str | None:
    """
    Déchiffre une valeur chiffrée par CryptoJS.AES.encrypt(text, passphrase).
    Retourne le texte clair ou None en cas d'erreur.
    """
    try:
        raw = base64.b64decode(ciphertext_b64)

        if raw[:8] != b"Salted__":
            raise ValueError("Header 'Salted__' absent — format CryptoJS inattendu.")

        salt      = raw[8:16]
        encrypted = raw[16:]

        key, iv = _derive_key_iv(SECRET_KEY.encode("utf-8"), salt)

        cipher    = Cipher(algorithms.AES(key), modes.CBC(iv))
        decryptor = cipher.decryptor()
        padded    = decryptor.update(encrypted) + decryptor.finalize()

        unpadder = PKCS7(128).unpadder()
        plain    = unpadder.update(padded) + unpadder.finalize()

        return plain.decode("utf-8")

    except Exception as e:
        app.logger.error("Erreur déchiffrement AES : %s", e)
        return None

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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)