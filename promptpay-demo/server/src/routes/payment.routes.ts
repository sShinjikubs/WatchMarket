import { Router, Request, Response } from 'express';
import { generateQR } from '../services/qr.service';
import {
  createPayment,
  getPaymentByRef,
  updatePaymentStatus,
} from '../db/database';

const router = Router();

// ─── DEMO PromptPay ID ────────────────────────────────────────────────────────
// ⚠️  ใช้เลขสมมติสำหรับ demo เท่านั้น — ห้ามใส่เลขบัญชี/บัตรประชาชนจริง
const DEMO_PROMPTPAY_ID = '0000000000';

// POST /api/payment/create
router.post('/create', async (req: Request, res: Response) => {
  const { amount, ref } = req.body as { amount: number; ref: string };

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'amount ต้องมากกว่า 0' });
  }
  if (!ref || typeof ref !== 'string' || ref.trim() === '') {
    return res.status(400).json({ error: 'ref ต้องไม่ว่าง' });
  }

  const cleanRef = ref.trim();

  try {
    const existing = await getPaymentByRef(cleanRef);
    if (existing) {
      return res.status(409).json({
        error: `ref "${cleanRef}" มีอยู่ในระบบแล้ว`,
        payment: { ...existing, qr_base64: undefined },
      });
    }

    const qrBase64 = await generateQR(DEMO_PROMPTPAY_ID, Number(amount));
    const payment = await createPayment(cleanRef, Number(amount), qrBase64);

    return res.status(201).json({
      paymentId: payment.id,
      ref: payment.ref,
      amount: payment.amount,
      status: payment.status,
      qrBase64: payment.qr_base64,
      createdAt: payment.created_at,
      promptpayId: DEMO_PROMPTPAY_ID,
      note: '⚠️ QR นี้สร้างเพื่อการเรียนรู้เท่านั้น — PromptPay ID เป็นตัวเลขสมมติ',
    });
  } catch (err) {
    console.error('[payment/create] Error:', err);
    return res.status(500).json({ error: 'ไม่สามารถสร้าง QR code ได้' });
  }
});

// GET /api/payment/:ref
router.get('/:ref', async (req: Request, res: Response) => {
  const { ref } = req.params;
  try {
    const payment = await getPaymentByRef(ref);
    if (!payment) {
      return res.status(404).json({ error: `ไม่พบ payment ref: ${ref}` });
    }
    return res.json({
      paymentId: payment.id,
      ref: payment.ref,
      amount: payment.amount,
      status: payment.status,
      createdAt: payment.created_at,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
});

// POST /api/payment/:ref/confirm — Mock payment (no real bank!)
router.post('/:ref/confirm', async (req: Request, res: Response) => {
  const { ref } = req.params;
  try {
    const payment = await getPaymentByRef(ref);

    if (!payment) {
      return res.status(404).json({ error: `ไม่พบ payment ref: ${ref}` });
    }
    if (payment.status === 'paid') {
      return res.json({
        success: true,
        status: 'paid',
        message: 'ชำระเงินเรียบร้อยแล้ว (mock)',
      });
    }

    await updatePaymentStatus(ref, 'paid');
    console.log(`[MOCK] ✅ Payment confirmed: ref=${ref} amount=${payment.amount} THB`);

    return res.json({
      success: true,
      status: 'paid',
      ref,
      amount: payment.amount,
      message: '✅ จำลองการชำระเงินสำเร็จ (mock — ไม่มีเงินจริงหมุนเวียน)',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Database error' });
  }
});

export default router;
