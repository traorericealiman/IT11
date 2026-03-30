# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
import bcrypt
import os
import base64
import hashlib
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.padding import PKCS7


# ══════════════════════════════════════════════════════════════
#  CONFIGURATION
# ══════════════════════════════════════════════════════════════

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
SECRET_KEY   = os.environ.get("AES_SECRET_KEY", "TaCleSecreteSuperRobusteDesIT11!")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app = Flask(__name__)
CORS(app)


# ══════════════════════════════════════════════════════════════
#  UTILITAIRES AES  (compatible CryptoJS / format OpenSSL)
#  CryptoJS produit : base64( b"Salted__" + salt[8] + cipher )
#  Clé + IV dérivés via EVP_BytesToKey (MD5 itéré)
# ══════════════════════════════════════════════════════════════

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


# ══════════════════════════════════════════════════════════════
#  ROUTES
# ══════════════════════════════════════════════════════════════

# ── INSCRIPTION ──────────────────────────────────────────────
@app.route("/register", methods=["POST"])
def register():
    body = request.get_json(silent=True)
    if not body:
        return _bad("Corps JSON manquant ou invalide.")

    # 1. Déchiffrement des champs AES
    first_name    = decrypt_aes(body.get("firstName", ""))
    last_name     = decrypt_aes(body.get("lastName",  ""))
    phone         = decrypt_aes(body.get("phone",     ""))
    password_hash = body.get("password", "").strip()   # SHA-256 hex envoyé tel quel

    # 2. Validation
    if not all([first_name, last_name, phone, password_hash]):
        return _bad("Tous les champs sont obligatoires ou le déchiffrement a échoué.")

    if len(password_hash) != 64:
        return _bad("Format du mot de passe invalide.")

    # 3. Unicité du numéro de téléphone
    existing = supabase.table("students").select("id").eq("phone", phone).execute()
    if existing.data:
        return _bad("Ce numéro de téléphone est déjà utilisé.", 409)

    # 4. Hachage bcrypt du SHA-256 reçu
    hashed_password = bcrypt.hashpw(
        password_hash.encode("utf-8"),
        bcrypt.gensalt(rounds=12)
    ).decode("utf-8")

    # 5. Insertion en base
    student = {
        "first_name": first_name,
        "last_name":  last_name,
        "phone":      phone,
        "password":   hashed_password,
    }

    result = supabase.table("students").insert(student).execute()

    return _ok("Inscription réussie !", data={"id": result.data[0].get("id")}, status=201)

# ══════════════════════════════════════════════════════════════
#  LANCEMENT
# ══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)