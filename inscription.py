# backend/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
import bcrypt
import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.padding import PKCS7
import base64

# ── CONFIGURATION SUPABASE ──
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# ── CONFIGURATION FLASK ──
app = Flask(__name__)
CORS(app)

SECRET_KEY = 'TaCleSecreteSuperRobusteDesIT11!'

def decryptAES(ciphertext: str) -> str:
    try:
        data = base64.b64decode(ciphertext)
        cipher = Cipher(algorithms.AES(SECRET_KEY), modes.ECB())
        decryptor = cipher.decryptor()
        padded_plain = decryptor.update(data) + decryptor.finalize()

        unpadder = PKCS7(128).unpadder()
        plain = unpadder.update(padded_plain) + unpadder.finalize()
        return plain.decode('utf-8')
    except Exception as e:
        print("Erreur déchiffrement:", e)
        return None

# ── ROUTE D’INSCRIPTION ──
@app.route("/register", methods=["POST"])
def register():
    data = request.get_json()

    first_name = decryptAES(data.get("firstName", ""))
    last_name = decryptAES(data.get("lastName", ""))
    phone = decryptAES(data.get("phone", ""))
    password_hash = data.get("password", "")  

    if not all([first_name, last_name, phone, password_hash]):
        return jsonify({"error": "Tous les champs sont obligatoires."}), 400

    existing = supabase.table("students").select("*").eq("phone", phone).execute()
    if existing.data and len(existing.data) > 0:
        return jsonify({"error": "Ce numéro de téléphone est déjà utilisé."}), 400

    hashed_password = bcrypt.hashpw(password_hash.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    student = {
        "first_name": first_name,
        "last_name": last_name,
        "phone": phone,
        "password": hashed_password
    }

    result = supabase.table("students").insert(student).execute()

    return jsonify({"message": "Inscription réussie !", "data": result.data})

# ── LANCEMENT DU SERVEUR ──
if __name__ == "__main__":
    app.run(debug=True)