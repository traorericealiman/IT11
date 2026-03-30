// src/api/connexion.ts
import CryptoJS from 'crypto-js';
import { API } from './config';

const AES_KEY = 'TaCleSecreteSuperRobusteDesIT11!';

function encryptAES(value: string): string {
  return CryptoJS.AES.encrypt(value, AES_KEY).toString();
}

function hashSHA256(value: string): string {
  return CryptoJS.SHA256(value).toString(CryptoJS.enc.Hex);
}


export interface LoginPayload {
  phone:    string;   
  password: string;   
}

export interface LoginResponse {
  token:      string;
  id:         string;
  first_name: string;
  last_name:  string;
}


export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  const body = {
    phone:    encryptAES(payload.phone),
    password: hashSHA256(payload.password),
  };

  const response = await fetch(API.login, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Une erreur est survenue. Veuillez réessayer.');
  }

  localStorage.setItem('token',      data.data.token);
  localStorage.setItem('userId',     String(data.data.id));
  localStorage.setItem('firstName',  data.data.first_name);
  localStorage.setItem('lastName',   data.data.last_name);

  return data.data as LoginResponse;
}

export function getToken(): string | null {
  return localStorage.getItem('token');
}

export function logout(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  localStorage.removeItem('firstName');
  localStorage.removeItem('lastName');
}