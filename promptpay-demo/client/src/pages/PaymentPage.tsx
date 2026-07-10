import React, { useState } from 'react';
import { createPayment, type CreatePaymentResponse } from '../api';
import QRDisplay from '../components/QRDisplay';
import MockPayButton from '../components/MockPayButton';

type Stage = 'form' | 'qr' | 'paid';

function generateRef(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PP-${ts}-${rand}`;
}

export default function PaymentPage() {
  const [stage, setStage] = useState<Stage>('form');
  const [amount, setAmount] = useState('');
  const [ref, setRef] = useState(generateRef);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payment, setPayment] = useState<CreatePaymentResponse | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      setError('กรุณาระบุจำนวนเงินที่ถูกต้อง');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const result = await createPayment(amt, ref);
      setPayment(result);
      setStage('qr');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStage('form');
    setPayment(null);
    setAmount('');
    setRef(generateRef());
    setError(null);
  };

  const presets = [50, 100, 150, 500, 1000];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 flex flex-col items-center justify-center p-4">
      {/* Background decorative orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2 text-white/80 text-xs font-medium mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ระบบทดสอบ — ไม่มีเงินจริง
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            PromptPay QR <span className="text-blue-400">Demo</span>
          </h1>
          <p className="mt-2 text-white/60 text-sm">
            สร้าง QR มาตรฐาน EMVCo / PromptPay สำหรับการเรียนรู้
          </p>
        </div>

        {/* ─── Stage: FORM ─────────────────────────────────────────── */}
        {stage === 'form' && (
          <div id="payment-form-card" className="card animate-[fadeIn_0.4s_ease-out]">
            <h2 className="text-xl font-bold text-gray-800 mb-6">กรอกรายละเอียด</h2>

            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Amount */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  จำนวนเงิน (บาท)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">฿</span>
                  <input
                    id="amount-input"
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="input-field pl-8"
                    required
                  />
                </div>
                {/* Preset amounts */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {presets.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setAmount(p.toString())}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border-2 transition-all
                        ${amount === p.toString()
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-blue-300 hover:bg-blue-50'
                        }`}
                    >
                      ฿{p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ref */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Reference Number
                </label>
                <div className="flex gap-2">
                  <input
                    id="ref-input"
                    type="text"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    className="input-field font-mono text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setRef(generateRef())}
                    className="shrink-0 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium transition-colors"
                    title="สร้าง Ref ใหม่"
                  >
                    🔄
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
                  ❌ {error}
                </div>
              )}

              <button
                id="generate-qr-btn"
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    กำลังสร้าง QR...
                  </>
                ) : (
                  <>
                    <span className="text-xl">📱</span>
                    สร้าง PromptPay QR
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ─── Stage: QR ────────────────────────────────────────────── */}
        {stage === 'qr' && payment && (
          <div id="qr-stage" className="card space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">สแกนเพื่อชำระเงิน</h2>
              <span className="status-badge bg-amber-100 text-amber-700">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                รอชำระ
              </span>
            </div>

            <QRDisplay
              qrBase64={payment.qrBase64}
              amount={payment.amount}
              paymentRef={payment.ref}
              promptpayId={payment.promptpayId}
            />

            <div className="border-t border-gray-100 pt-4">
              <MockPayButton
                paymentRef={payment.ref}
                amount={payment.amount}
                onConfirmed={() => setStage('paid')}
              />
            </div>

            <button
              onClick={handleReset}
              className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              ← สร้าง QR ใหม่
            </button>
          </div>
        )}

        {/* ─── Stage: PAID ──────────────────────────────────────────── */}
        {stage === 'paid' && payment && (
          <div id="paid-stage" className="card text-center space-y-6 animate-[bounceIn_0.5s_ease-out]">
            {/* Success icon */}
            <div className="flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-2xl shadow-green-200">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-gray-800">ชำระเงินสำเร็จ!</h2>
              <p className="text-gray-500 mt-1 text-sm">(Mock — จำลองเพื่อการเรียนรู้)</p>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ยอดเงิน</span>
                <span className="font-bold text-emerald-700 text-base">
                  ฿{payment.amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Ref</span>
                <span className="font-mono font-semibold text-gray-800">{payment.ref}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">สถานะ</span>
                <span className="status-badge bg-emerald-100 text-emerald-700 py-0.5 px-2 text-xs">
                  ✅ paid
                </span>
              </div>
            </div>

            <button
              id="new-payment-btn"
              onClick={handleReset}
              className="btn-primary w-full"
            >
              สร้างรายการใหม่
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-6">
          PromptPay QR Demo · สำหรับการเรียนรู้เท่านั้น · ไม่มีเงินจริงหมุนเวียน
        </p>
      </div>
    </div>
  );
}
