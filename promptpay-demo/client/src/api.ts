// ─── API client for PromptPay Demo ───────────────────────────────────────────

const BASE = '/api/payment';

export interface CreatePaymentResponse {
  paymentId: number;
  ref: string;
  amount: number;
  status: 'pending' | 'paid';
  qrBase64: string;
  createdAt: string;
  promptpayId: string;
  note: string;
}

export interface PaymentStatusResponse {
  paymentId: number;
  ref: string;
  amount: number;
  status: 'pending' | 'paid';
  createdAt: string;
}

export interface ConfirmResponse {
  success: boolean;
  status: 'paid';
  ref: string;
  amount: number;
  message: string;
}

export async function createPayment(amount: number, ref: string): Promise<CreatePaymentResponse> {
  const res = await fetch(`${BASE}/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, ref }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'ไม่สามารถสร้าง QR ได้');
  return data;
}

export async function getPaymentStatus(ref: string): Promise<PaymentStatusResponse> {
  const res = await fetch(`${BASE}/${encodeURIComponent(ref)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'ไม่พบ payment');
  return data;
}

export async function confirmPayment(ref: string): Promise<ConfirmResponse> {
  const res = await fetch(`${BASE}/${encodeURIComponent(ref)}/confirm`, {
    method: 'POST',
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'ยืนยันไม่สำเร็จ');
  return data;
}
