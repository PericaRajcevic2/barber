const https = require('https');

// Helper: simple POST to WhatsApp Cloud API
function postWhatsApp(path, payload, token) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const options = {
      hostname: 'graph.facebook.com',
      path,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ success: true, data: json });
          } else {
            resolve({ success: false, error: json });
          }
        } catch (e) {
          resolve({ success: false, error: { message: 'Invalid JSON response from WhatsApp', body } });
        }
      });
    });

    req.on('error', (err) => resolve({ success: false, error: err }));
    req.write(data);
    req.end();
  });
}

function isConfigured() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

function normalizePhone(e164Maybe) {
  if (!e164Maybe) return '';
  // Keep digits only; WhatsApp expects international number string without spaces (with or without + works)
  const digits = String(e164Maybe).replace(/\D/g, '');
  return digits;
}

async function sendText(to, text) {
  if (!isConfigured()) {
    console.log('ℹ️  SMS (WhatsApp) nije konfiguriran - preskačem slanje');
    return { success: false, error: 'WHATSAPP not configured' };
  }

  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const recipient = normalizePhone(to);

  const payload = {
    messaging_product: 'whatsapp',
    to: recipient,
    type: 'text',
    text: { body: text }
  };

  const path = `/v17.0/${encodeURIComponent(phoneId)}/messages`;
  const res = await postWhatsApp(path, payload, token);
  if (!res.success) {
    console.error('❌ WhatsApp slanje nije uspjelo:', res.error);
  } else {
    console.log('✅ WhatsApp poruka poslana na', recipient);
  }
  return res;
}

function formatDate(dt) {
  try {
    return new Date(dt).toLocaleString('hr-HR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return String(dt); }
}

function appUrl() {
  return process.env.APP_URL || 'http://localhost:5000';
}

// Public API used by routes/appointments.js
exports.sendAppointmentConfirmation = async (appointment) => {
  try {
    const to = appointment.customerPhone;
    if (!to) return { success: false, error: 'No customerPhone' };

    const when = formatDate(appointment.date);
    const service = appointment.service?.name || 'Usluga';
    const cancel = appointment.cancellationToken ? `\n\nAko želite otkazati: ${appUrl()}/cancel/${appointment.cancellationToken}` : '';

    const body = `💈 Barber Shop\n\nPotvrda rezervacije:\n• Ime: ${appointment.customerName}\n• Termin: ${when}\n• Usluga: ${service}${cancel}`;
    return await sendText(to, body);
  } catch (e) {
    return { success: false, error: e };
  }
};

exports.sendNewAppointmentNotification = async (appointment) => {
  try {
    const to = process.env.BARBER_PHONE;
    if (!to) return { success: false, error: 'No BARBER_PHONE' };

    const when = formatDate(appointment.date);
    const service = appointment.service?.name || 'Usluga';

    const body = `📋 Nova narudžba\n\n${appointment.customerName} (${appointment.customerPhone})\n${service} — ${when}\nEmail: ${appointment.customerEmail || '-'}\nNapomene: ${appointment.notes || '-'}`;
    return await sendText(to, body);
  } catch (e) {
    return { success: false, error: e };
  }
};

exports.sendAppointmentCancellation = async (appointment, reason = '') => {
  try {
    const to = appointment.customerPhone;
    if (!to) return { success: false, error: 'No customerPhone' };

    const when = formatDate(appointment.date);
    const service = appointment.service?.name || 'Usluga';

    const body = `❌ Otkazivanje termina\n\nPozdrav ${appointment.customerName},\nVaš termin je otkazan.\n• Termin: ${when}\n• Usluga: ${service}\n• Razlog: ${reason || '—'}\n\nRezervirajte novi termin: ${appUrl()}`;
    return await sendText(to, body);
  } catch (e) {
    return { success: false, error: e };
  }
};

// Optional export to check config status
exports.isConfigured = isConfigured;
