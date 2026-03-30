// src/api/payment.ts
import CryptoJS from 'crypto-js';
import { API, WAVE_LINKS, AMOUNTS } from './config';

const AES_KEY = 'TaCleSecreteSuperRobusteDesIT11!';

function encryptAES(value: string): string {
  return CryptoJS.AES.encrypt(value, AES_KEY).toString();
}

export interface PaymentPayload {
  student_id:   string;
  quantity:     number;
  sender_phone: string;
}

export async function initiatePayment(payload: PaymentPayload): Promise<void> {
  const { total } = AMOUNTS[payload.quantity];

  const body = {
    student_id:   encryptAES(payload.student_id),
    quantity:     encryptAES(payload.quantity.toString()),
    amount:       encryptAES(total.toString()),
    sender_phone: encryptAES(payload.sender_phone),
  };

  const response = await fetch(API.requestPayment, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok) {
    console.log('Erreur backend:', data);
    throw new Error(data.error || 'Une erreur est survenue. Veuillez réessayer.');
  }

  window.location.href = WAVE_LINKS[payload.quantity];
}