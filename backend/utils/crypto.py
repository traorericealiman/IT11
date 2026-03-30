# backend/utils/crypto.py
"""
Utilitaire de déchiffrement AES-CBC compatible avec CryptoJS.AES.encrypt(text, passphrase).

La clé et l'IV sont dérivés selon la méthode OpenSSL (MD5 EVP_BytesToKey),
avec un en-tête 'Salted__' suivi du salt sur 8 octets.
"""

import base64
import hashlib
import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.padding import PKCS7

AES_SECRET_KEY: str = os.environ["AES_SECRET_KEY"]


def _derive_key_iv(passphrase: bytes, salt: bytes) -> tuple[bytes, bytes]:
    """Dérive une clé AES-256 (32 B) et un IV (16 B) à la manière d'OpenSSL."""
    d, d_i = b"", b""
    while len(d) < 48:
        d_i = hashlib.md5(d_i + passphrase + salt).digest()
        d += d_i
    return d[:32], d[32:48]


def decrypt_aes(ciphertext_b64: str) -> str | None:
    """
    Déchiffre une valeur produite par CryptoJS.AES.encrypt(text, passphrase).
    Retourne le texte clair, ou None en cas d'erreur.
    """
    try:
        raw = base64.b64decode(ciphertext_b64)
        if raw[:8] != b"Salted__":
            raise ValueError("En-tête 'Salted__' absent.")
        salt      = raw[8:16]
        encrypted = raw[16:]
        key, iv   = _derive_key_iv(AES_SECRET_KEY.encode("utf-8"), salt)
        cipher    = Cipher(algorithms.AES(key), modes.CBC(iv))
        decryptor = cipher.decryptor()
        padded    = decryptor.update(encrypted) + decryptor.finalize()
        unpadder  = PKCS7(128).unpadder()
        plain     = unpadder.update(padded) + unpadder.finalize()
        return plain.decode("utf-8")
    except Exception:
        return None
