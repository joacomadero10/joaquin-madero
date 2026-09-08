const crypto = require('crypto');
const QRCode = require('qrcode');

/**
 * Genera un token unico y no adivinable para identificar una mesa en el QR.
 * Se guarda en tables.qr_token.
 */
function generateQrToken() {
  return crypto.randomBytes(24).toString('hex');
}

/**
 * Devuelve la URL publica que el QR de una mesa debe apuntar:
 * el cliente escanea, entra al menu de ESE restaurante y ESA mesa.
 */
function buildTableUrl(qrToken) {
  const frontendUrl = process.env.FRONTEND_URL || 'https://comandy.com.ar';
  return `${frontendUrl}/mesa/${qrToken}`;
}

/**
 * Genera la imagen del QR (PNG buffer) para una mesa.
 */
async function generateQrImageBuffer(qrToken) {
  const url = buildTableUrl(qrToken);
  return QRCode.toBuffer(url, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 400,
  });
}

module.exports = { generateQrToken, buildTableUrl, generateQrImageBuffer };
