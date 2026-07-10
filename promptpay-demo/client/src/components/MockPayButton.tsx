import { useState } from 'react';
import { confirmPayment } from '../api';

interface MockPayButtonProps {
  paymentRef: string;
  amount: number;
  onConfirmed: () => void;
}

export default function MockPayButton({ paymentRef, amount, onConfirmed }: MockPayButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMockPay = async () => {
    setLoading(true);
    setError(null);
    try {
      await confirmPayment(paymentRef);
      onConfirmed();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full space-y-3">
      <button
        id="mock-pay-btn"
        onClick={handleMockPay}
        disabled={loading}
        className="btn-success w-full flex items-center justify-center gap-2 text-base"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            กำลังประมวลผล...
          </>
        ) : (
          <>
            <span className="text-xl">💳</span>
            จำลองว่าจ่ายแล้ว ฿{amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </>
        )}
      </button>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm text-center">
          ❌ {error}
        </div>
      )}

      <p className="text-center text-xs text-gray-400">
        ปุ่มนี้จำลอง webhook จากธนาคาร — ไม่มีการโอนเงินจริง
      </p>
    </div>
  );
}
