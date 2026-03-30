// src/api/tickets.ts
import CryptoJS from 'crypto-js';
import { API } from './config';
import { getUserId } from './session';

const AES_KEY = import.meta.env.VITE_AES_KEY as string;

function encryptAES(value: string): string {
  return CryptoJS.AES.encrypt(value, AES_KEY).toString();
}

/**
 * Appelle l'API pour récupérer les tickets de l'utilisateur connecté.
 */
export async function getUserTickets() {
  const studentId = getUserId();
  if (!studentId) {
    throw new Error('Utilisateur non connecté');
  }

  const body = {
    student_id: encryptAES(studentId),
  };

  const response = await fetch(`${API.baseUrl}/tickets`, {
    method: 'POST', // Utilisé ici comme POST pour l'encryption AES du paramètre
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erreur lors de la récupération des billets');
  }

  return data.data.tickets;
}
