// src/api/payment.ts
import CryptoJS from 'crypto-js';
import { API, WAVE_LINKS, AMOUNTS } from './config';
import type { PaymentPayload } from '../types';

export type { PaymentPayload };

const AES_KEY = import.meta.env.VITE_AES_KEY as string;

function encryptAES(value: string): string {
  return CryptoJS.AES.encrypt(value, AES_KEY).toString();
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