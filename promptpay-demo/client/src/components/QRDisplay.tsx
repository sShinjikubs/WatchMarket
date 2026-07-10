
interface QRDisplayProps {
  qrBase64: string;
  amount: number;
  paymentRef: string;
  promptpayId: string;
}

export default function QRDisplay({ qrBase64, amount, paymentRef, promptpayId }: QRDisplayProps) {
  return (
    <div className="flex flex-col items-center animate-[fadeIn_0.4s_ease-out]">
      {/* QR Frame */}
      <div className="relative bg-white rounded-3xl p-6 shadow-2xl border-4 border-blue-100">
        {/* PromptPay header badge */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg tracking-wide">
          PromptPay QR
        </div>

        {/* QR Image */}
        <div className="mt-2 rounded-2xl overflow-hidden">
          <img
            src={qrBase64}
            alt="PromptPay QR Code"
            className="w-56 h-56 object-contain"
          />
        </div>

        {/* Thai QR mark */}
        <div className="mt-3 text-center">
          <span className="text-xs text-gray-400 font-medium tracking-widest uppercase">
            Thai QR Payment · EMVCo
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500 font-medium mb-1">ยอดที่ต้องชำระ</p>
        <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
          ฿{amount.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
        </div>
      </div>

      {/* Meta info */}
      <div className="mt-4 w-full bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Ref</span>
          <span className="font-mono font-semibold text-gray-800">{paymentRef}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">PromptPay ID</span>
          <span className="font-mono font-semibold text-gray-800">{promptpayId}</span>
        </div>
      </div>

      {/* Warning banner */}
      <div className="mt-4 w-full bg-amber-50 border border-amber-200 rounded-xl p-3 flex gap-2 items-start">
        <span className="text-amber-500 text-lg shrink-0">⚠️</span>
        <p className="text-xs text-amber-700 leading-relaxed">
          QR นี้สร้างด้วยมาตรฐาน <strong>EMVCo / PromptPay</strong> จริง แต่ใช้ <strong>PromptPay ID สมมติ</strong>{' '}
          สำหรับการเรียนรู้เท่านั้น — ห้ามใช้เลขบัญชีจริงในโปรเจกต์นี้
        </p>
      </div>
    </div>
  );
}
