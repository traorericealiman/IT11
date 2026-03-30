// src/api/inscription.ts
import CryptoJS from 'crypto-js';
import { API } from './config';

export interface RegisterPayload {
  firstName: string;
  lastName:  string;
  phone:     string;
  password:  string;
  confirm:   string;
}

export interface ValidationError {
  field:   string;
  message: string;
}

const SECRET_KEY       = 'TaCleSecreteSuperRobusteDesIT11!';
const PASSWORD_MIN_LEN = 8;
const PASSWORD_REGEX   = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
const PHONE_REGEX      = /^\+?225\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/;
const NAME_REGEX       = /^[a-zA-ZÀ-ÿ' -]{2,50}$/;

export function validateRegisterForm(payload: RegisterPayload): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!payload.firstName.trim()) {
    errors.push({ field: 'firstName', message: 'Le prénom est obligatoire.' });
  } else if (!NAME_REGEX.test(payload.firstName.trim())) {
    errors.push({ field: 'firstName', message: 'Le prénom contient des caractères invalides (min. 2 lettres).' });
  }

  if (!payload.lastName.trim()) {
    errors.push({ field: 'lastName', message: 'Le nom est obligatoire.' });
  } else if (!NAME_REGEX.test(payload.lastName.trim())) {
    errors.push({ field: 'lastName', message: 'Le nom contient des caractères invalides (min. 2 lettres).' });
  }

  if (!payload.phone.trim()) {
    errors.push({ field: 'phone', message: 'Le numéro de téléphone est obligatoire.' });
  } else if (!PHONE_REGEX.test(payload.phone.trim())) {
    errors.push({ field: 'phone', message: 'Numéro invalide. Format attendu : +225 XX XX XX XX XX' });
  }

  if (!payload.password) {
    errors.push({ field: 'password', message: 'Le mot de passe est obligatoire.' });
  } else if (payload.password.length < PASSWORD_MIN_LEN) {
    errors.push({ field: 'password', message: `Le mot de passe doit contenir au moins ${PASSWORD_MIN_LEN} caractères.` });
  } else if (!PASSWORD_REGEX.test(payload.password)) {
    errors.push({
      field: 'password',
      message: 'Le mot de passe doit contenir : une majuscule, une minuscule, un chiffre et un caractère spécial.',
    });
  }

  if (!payload.confirm) {
    errors.push({ field: 'confirm', message: 'Veuillez confirmer votre mot de passe.' });
  } else if (payload.password !== payload.confirm) {
    errors.push({ field: 'confirm', message: 'Les mots de passe ne correspondent pas.' });
  }

  return errors;
}

function encryptAES(text: string): string {
  return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
}

const SERVER_ERROR_MAP: Record<string, string> = {
  'Ce numéro de téléphone est déjà utilisé.':
    'Ce numéro de téléphone est déjà associé à un compte. Essayez de vous connecter.',
  'Tous les champs sont obligatoires ou le déchiffrement a échoué.':
    'Une erreur technique est survenue. Veuillez réessayer.',
  'Format du mot de passe invalide.':
    'Le format du mot de passe reçu par le serveur est invalide. Contactez le support.',
};

function mapServerError(raw: string): string {
  return SERVER_ERROR_MAP[raw] ?? raw ?? 'Une erreur inattendue est survenue. Veuillez réessayer.';
}

export async function registerUser(
  payload: RegisterPayload
): Promise<{ message: string; data?: { id: string } }> {

  const errors = validateRegisterForm(payload);
  if (errors.length > 0) {
    throw new Error(errors[0].message);
  }

  const encryptedPayload = {
    firstName: encryptAES(payload.firstName.trim()),
    lastName:  encryptAES(payload.lastName.trim()),
    phone:     encryptAES(payload.phone.trim()),
    password:  hashPassword(payload.password),
  };

  let response: Response;
  try {
    response = await fetch(API.register, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(encryptedPayload),
    });
  } catch {
    throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion internet.');
  }

  if (!response.ok) {
    if (response.status === 409) {
      throw new Error('Ce numéro de téléphone est déjà associé à un compte. Essayez de vous connecter.');
    }
    if (response.status === 500) {
      throw new Error('Le serveur a rencontré un problème. Réessayez dans quelques instants.');
    }

    let serverMessage = 'Une erreur inattendue est survenue.';
    try {
      const err = await response.json();
      serverMessage = err.error ?? err.message ?? serverMessage;
    } catch { /* ignore */ }

    throw new Error(mapServerError(serverMessage));
  }

  return response.json();
}