import generatePayload from 'promptpay-qr';
import QRCode from 'qrcode';

/**
 * Generate a PromptPay QR code as a base64-encoded PNG image.
 *
 * The payload follows the EMVCo Merchant Presented QR standard (PromptPay spec),
 * identical to what Thai banking apps can scan. This is used for EDUCATIONAL
 * purposes only — do not use a real PromptPay ID you wish to keep private.
 *
 * @param promptpayId - Phone number (10 digits) or National ID (13 digits) or Tax ID
 * @param amount      - Amount in THB (e.g. 150.00)
 * @returns Base64 data URI string (data:image/png;base64,...)
 */
export async function generateQR(promptpayId: string, amount: number): Promise<string> {
  // 1. Generate the EMVCo PromptPay payload string
  const payload = generatePayload(promptpayId, { amount });

  // 2. Render payload → QR PNG → base64 data URI
  const qrDataUri = await QRCode.toDataURL(payload, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    margin: 2,
    color: {
      dark: '#1a1a2e',   // deep navy for QR modules
      light: '#ffffff',  // white background
    },
    width: 400,
  });

  return qrDataUri;
}
