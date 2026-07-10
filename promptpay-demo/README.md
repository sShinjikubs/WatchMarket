# PromptPay QR Demo 🟦

ระบบจำลองการชำระเงินด้วย **PromptPay QR Code** สำหรับการเรียนรู้และทดสอบ  
สร้างโดยใช้มาตรฐาน **EMVCo / PromptPay** จริง — แต่ใช้ PromptPay ID สมมติ ไม่มีเงินจริงหมุนเวียน

---

## 🏗️ โครงสร้างโปรเจกต์

```
promptpay-demo/
├── server/                      ← Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/
│   │   │   └── payment.routes.ts    ← API endpoints
│   │   ├── services/
│   │   │   └── qr.service.ts        ← สร้าง PromptPay QR payload
│   │   └── db/
│   │       └── database.ts          ← SQLite CRUD
│   └── package.json
├── client/                      ← React + Tailwind v3
│   ├── src/
│   │   ├── pages/
│   │   │   └── PaymentPage.tsx      ← หน้าหลัก
│   │   ├── components/
│   │   │   ├── QRDisplay.tsx        ← แสดง QR + ยอดเงิน
│   │   │   └── MockPayButton.tsx    ← ปุ่มจำลองชำระเงิน
│   │   └── api.ts                   ← API client
│   └── package.json
└── README.md
```

---

## 🚀 วิธีรัน

### 1. ติดตั้ง dependencies

```bash
# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

### 2. Build frontend → output ไปยัง `client/dist/`

```bash
cd client && npm run build
```

### 3. รัน Backend Server (เสิร์ฟทั้ง API + Frontend)

```bash
cd server && npm start
```

เปิดเบราว์เซอร์: **http://localhost:4000**

### (Optional) Development mode

```bash
# Backend dev (auto-reload)
cd server && npm run dev

# Frontend dev server (Vite HMR, port 5174)
cd client && npm run dev
```

---

## 📡 API Endpoints

| Method | Path | คำอธิบาย |
|--------|------|-----------|
| `POST` | `/api/payment/create` | สร้าง QR + บันทึก payment |
| `GET` | `/api/payment/:ref` | ดูสถานะ payment |
| `POST` | `/api/payment/:ref/confirm` | **[MOCK]** จำลองการยืนยันชำระ |
| `GET` | `/api/health` | Health check |

### ตัวอย่าง POST /api/payment/create

**Request:**
```json
{
  "amount": 150.00,
  "ref": "PP-ORDER-001"
}
```

**Response:**
```json
{
  "paymentId": 1,
  "ref": "PP-ORDER-001",
  "amount": 150,
  "status": "pending",
  "qrBase64": "data:image/png;base64,...",
  "createdAt": "2025-01-01 12:00:00",
  "promptpayId": "0000000000",
  "note": "⚠️ QR นี้สร้างเพื่อการเรียนรู้เท่านั้น"
}
```

---

## 📱 เกี่ยวกับ QR Code มาตรฐาน EMVCo / PromptPay

QR Code ที่สร้างโดยโปรเจกต์นี้ใช้ library [`promptpay-qr`](https://www.npmjs.com/package/promptpay-qr) ซึ่งสร้าง payload ตามมาตรฐาน:

- **EMVCo Merchant Presented QR** (มาตรฐานสากล)
- **Bank of Thailand PromptPay Specification**

payload ที่ได้เป็นข้อมูล text string ที่ encode ยอดเงินและ PromptPay ID ไว้ในรูปแบบที่แอปธนาคารไทยทุกแห่งสามารถ parse ได้

### ทดสอบสแกน QR

QR ที่สร้างจาก demo นี้ **สแกนได้จริง** ด้วยแอปธนาคารไทย และจะแสดงผลว่าจะโอนเงินไปยัง PromptPay ID `0000000000` ซึ่งเป็นเลขสมมติ (ไม่มีบัญชีจริง)

> **หมายเหตุ:** เมื่อสแกน QR ด้วยแอปธนาคาร แอปจะ error หรือแจ้งว่า "ไม่พบผู้รับเงิน" เนื่องจาก PromptPay ID เป็นตัวเลขสมมติ — นี่คือพฤติกรรมที่ถูกต้องและปลอดภัย

---

## ⚠️ คำเตือนและข้อจำกัด

> [!CAUTION]
> **ห้ามใช้เลขบัญชี / เลขบัตรประชาชน / เลขโทรศัพท์จริงเป็น PromptPay ID ในโปรเจกต์นี้**  
> เนื่องจากเป็นระบบเรียนรู้ที่ไม่มีการเข้ารหัสหรือรักษาความปลอดภัยระดับ production

- ❌ **ไม่ต่อ** payment gateway จริง
- ❌ **ไม่เก็บ** API key ธนาคาร
- ❌ **ไม่มี** เงินจริงหมุนเวียน
- ✅ QR payload **ถูกต้องตามมาตรฐาน** EMVCo/PromptPay
- ✅ **สแกนทดสอบได้** แต่จะไม่สามารถโอนเงินได้เนื่องจาก ID สมมติ
- ✅ สถานะ payment เก็บใน **SQLite local** เท่านั้น

---

## 🛠️ Tech Stack

| ส่วน | เทคโนโลยี |
|------|------------|
| Backend | Node.js, Express, TypeScript |
| QR Generation | `promptpay-qr` + `qrcode` |
| Database | SQLite (`sqlite3`) |
| Frontend | React 18, Vite |
| Styling | Tailwind CSS v3 |

---

*โปรเจกต์นี้สร้างขึ้นเพื่อการศึกษาเท่านั้น ในรายวิชา CSI204*
