const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// Odabir providera: preferiraj RESEND (stabilno na Renderu), fallback na Gmail SMTP
const USE_RESEND = Boolean(process.env.RESEND_API_KEY);
let resend = null;

if (USE_RESEND) {
  resend = new Resend(process.env.RESEND_API_KEY);
  console.log('✉️  Email slanje konfigurirano preko RESEND API (bez SMTP)');
}

let transporter = null;
if (!USE_RESEND && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  // Testiraj SMTP konfiguraciju samo ako ne koristimo Resend
  transporter.verify((error, success) => {
    if (error) {
      console.log('❌ Email konfiguracija (SMTP) neuspješna:', error.message);
      console.log('💡 TIP: Na Renderu koristi RESEND_API_KEY umjesto Gmail SMTP');
    } else {
      console.log('✅ SMTP email server je spreman za slanje poruka');
    }
  });
} else if (!USE_RESEND) {
  console.log('ℹ️  Email slanje nije konfigurirano (nedostaju EMAIL_USER/EMAIL_PASS ili RESEND_API_KEY)');
}

async function sendViaResend({ to, subject, html }) {
  try {
    if (!resend) return false;
    
    const from = process.env.EMAIL_FROM || 'Barber Shop <onboarding@resend.dev>';
    
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html
    });

    if (error) {
      console.error('❌ Resend greška:', error);
      return false;
    }

    console.log('✅ Resend email poslan:', data.id);
    return true;
  } catch (err) {
    console.error('❌ Resend greška (network):', err);
    return false;
  }
}

async function sendEmail({ to, subject, html }) {
  if (USE_RESEND) {
    return await sendViaResend({ to, subject, html });
  }
  if (!transporter) {
    console.log('ℹ️  Email slanje preskočeno - nije konfigurirano');
    return false;
  }
  try {
    await transporter.sendMail({
      from: `"Barber Shop" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log('✅ SMTP email poslan');
    return true;
  } catch (e) {
    console.error('❌ SMTP slanje nije uspjelo:', e.message);
    return false;
  }
}

// 1. EMAIL POTVRDE ZA KLIJENTA
exports.sendAppointmentConfirmation = async (appointment) => {
  try {
    console.log('📧 Pokušavam poslati confirmation email na:', appointment.customerEmail);
    
    const mailOptions = {
      to: appointment.customerEmail,
      subject: 'Potvrda rezervacije termina - Barber Shop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">💈 Barber Shop</h1>
            <h2 style="color: #667eea; margin-top: 0;">Hvala na rezervaciji!</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Detalji termina:</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p><strong>📅 Datum:</strong><br>${new Date(appointment.date).toLocaleDateString('hr-HR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>🕒 Vrijeme:</strong><br>${new Date(appointment.date).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div>
                <p><strong>✂️ Usluga:</strong><br>${appointment.service.name}</p>
                <p><strong>💰 Cijena:</strong><br>${appointment.service.price}€</p>
              </div>
            </div>
            ${appointment.notes ? `<p style="margin-top: 15px;"><strong>📝 Vaše napomene:</strong><br>${appointment.notes}</p>` : ''}
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>ℹ️ Važno:</strong> Molimo vas da dođete točno na vrijeme. 
              Ako želite otkazati termin, koristite dugme ispod (najmanje 2 sata unaprijed).
            </p>
          </div>

          ${appointment.cancellationToken ? `
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.APP_URL || 'http://localhost:5000'}/cancel/${appointment.cancellationToken}" 
               style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); 
                      color: white; 
                      padding: 14px 32px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block; 
                      font-weight: bold;
                      box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);">
               ❌ Otkaži termin
            </a>
            <p style="color: #666; font-size: 12px; margin-top: 10px;">
              Link za otkazivanje važi do termina
            </p>
          </div>
          ` : ''}

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin-bottom: 5px;">
              <strong>Barber Shop</strong><br>
              📞 Kontakt: +385 99 123 4567<br>
              📍 Adresa: Primjer ulica 123, Zagreb
            </p>
            <p style="color: #999; font-size: 12px;">
              Hvala što koristite naše usluge!
            </p>
          </div>
        </div>
      `
    };

    const ok = await sendEmail(mailOptions);
    if (ok) {
      console.log('✅ Email potvrde poslan korisniku:', appointment.customerEmail);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Greška pri slanju confirmation emaila:', error);
    console.error('Error details:', error.message);
    return false;
  }
};

// 2. EMAIL OBAVIJESTI ZA FRIZERA
exports.sendNewAppointmentNotification = async (appointment) => {
  try {
    console.log('📧 Pokušavam poslati notification email frizeru');
    
    const mailOptions = {
      to: process.env.EMAIL_USER,
      subject: '📋 Nova narudžba - Barber Shop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">NOVA NARUDŽBA!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Stigla je nova rezervacija termina</p>
          </div>

          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Detalji narudžbe:</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <h4 style="color: #667eea; margin-bottom: 10px;">👤 Podaci o klijentu</h4>
                <p><strong>Ime i prezime:</strong><br>${appointment.customerName}</p>
                <p><strong>Email:</strong><br>${appointment.customerEmail}</p>
                <p><strong>Telefon:</strong><br>${appointment.customerPhone}</p>
              </div>
              
              <div>
                <h4 style="color: #667eea; margin-bottom: 10px;">📅 Detalji termina</h4>
                <p><strong>Datum:</strong><br>${new Date(appointment.date).toLocaleDateString('hr-HR')}</p>
                <p><strong>Vrijeme:</strong><br>${new Date(appointment.date).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>Usluga:</strong><br>${appointment.service.name}</p>
                <p><strong>Trajanje:</strong><br>${appointment.service.duration} min</p>
              </div>
            </div>

            ${appointment.notes ? `
              <div style="margin-top: 15px; padding: 15px; background: #e7f3ff; border-radius: 5px;">
                <h4 style="color: #0056b3; margin: 0 0 10px 0;">📝 Napomene klijenta:</h4>
                <p style="margin: 0; font-style: italic;">"${appointment.notes}"</p>
              </div>
            ` : ''}
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="${process.env.APP_URL || 'http://localhost:5000'}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
               🔍 Pogledaj u admin panelu
            </a>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
            <p>Ovo je automatska obavijest. Molimo ne odgovarati na ovaj email.</p>
          </div>
        </div>
      `
    };

    const ok = await sendEmail(mailOptions);
    if (ok) {
      console.log('✅ Obavijest o novoj narudžbi poslana frizeru');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Greška pri slanju notification emaila frizeru:', error);
    console.error('Error details:', error.message);
    return false;
  }
};

// 3. EMAIL ZA OTPUŠTANJE TERMINA
exports.sendAppointmentCancellation = async (appointment, reason = '') => {
  try {
    const mailOptions = {
      to: appointment.customerEmail,
      subject: 'Otkazivanje termina - Barber Shop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">💈 Barber Shop</h1>
            <h2 style="color: #dc3545; margin-top: 0;">Termin otkazan</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
            <p>Poštovani/a <strong>${appointment.customerName}</strong>,</p>
            <p>Žao nam je, ali vaš termin je otkazan.</p>
            
            <div style="margin: 20px 0; padding: 15px; background: #f8d7da; border-radius: 5px;">
              <h4 style="color: #721c24; margin: 0 0 10px 0;">Otkazani termin:</h4>
              <p style="margin: 5px 0;"><strong>Datum:</strong> ${new Date(appointment.date).toLocaleDateString('hr-HR')}</p>
              <p style="margin: 5px 0;"><strong>Vrijeme:</strong> ${new Date(appointment.date).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}</p>
              <p style="margin: 5px 0;"><strong>Usluga:</strong> ${appointment.service.name}</p>
              ${reason ? `<p style="margin: 5px 0;"><strong>Razlog:</strong> ${reason}</p>` : ''}
            </div>

            <p>Molimo vas da rezervirate novi termin putem našeg online sustava.</p>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="${process.env.APP_URL || 'http://localhost:5000'}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
               📅 Rezerviraj novi termin
            </a>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #666;">
            <p>Za sva dodatna pitanja, slobodno nas kontaktirajte.</p>
          </div>
        </div>
      `
    };

    const ok = await sendEmail(mailOptions);
    if (ok) {
      console.log('✅ Email o otkazivanju termina poslan korisniku:', appointment.customerEmail);
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Greška pri slanju emaila o otkazivanju:', error);
    return false;
  }
};