const nodemailer = require('nodemailer');

// Kreiraj transporter - Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Testiraj email konfiguraciju
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email konfiguracija neuspješna:', error);
  } else {
    console.log('✅ Email server je spreman za slanje poruka');
  }
});

// 1. EMAIL POTVRDE ZA KLIJENTA
exports.sendAppointmentConfirmation = async (appointment) => {
  try {
    console.log('📧 Pokušavam poslati confirmation email na:', appointment.customerEmail);
    
    const mailOptions = {
      from: `"Barber Shop" <${process.env.EMAIL_USER}>`,
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

    await transporter.sendMail(mailOptions);
    console.log('✅ Email potvrde poslan korisniku:', appointment.customerEmail);
    return true;
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
      from: `"Barber Shop Notifications" <${process.env.EMAIL_USER}>`,
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

    await transporter.sendMail(mailOptions);
    console.log('✅ Obavijest o novoj narudžbi poslana frizeru');
    return true;
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
      from: `"Barber Shop" <${process.env.EMAIL_USER}>`,
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

    await transporter.sendMail(mailOptions);
    console.log('✅ Email o otkazivanju termina poslan korisniku:', appointment.customerEmail);
    return true;
  } catch (error) {
    console.error('❌ Greška pri slanju emaila o otkazivanju:', error);
    return false;
  }
};

// 4. EMAIL PODSJETNIK - 24h prije termina
exports.sendAppointmentReminder = async (appointment) => {
  try {
    const serviceName = appointment.service?.name || 'usluga';
    const isHaircut = serviceName.toLowerCase().includes('šišanje');
    const isTrim = serviceName.toLowerCase().includes('brada');
    
    let serviceEmoji = '✂️';
    let serviceMessage = 'Vaš termin se približava!';
    
    if (isHaircut) {
      serviceEmoji = '💇‍♂️';
      serviceMessage = 'Spremite se za novu frizuru!';
    } else if (isTrim) {
      serviceEmoji = '🧔';
      serviceMessage = 'Vrijeme je za osvježavanje!';
    }

    const trackingPixel = `${process.env.APP_URL || 'http://localhost:5000'}/api/appointments/track/${appointment._id}/reminder`;

    const mailOptions = {
      from: `"Barber Shop" <${process.env.EMAIL_USER}>`,
      to: appointment.customerEmail,
      subject: `⏰ Podsjetnik: Termin sutra - Barber Shop`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 15px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">${serviceEmoji} ${serviceMessage}</h1>
            <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.95;">Vaš termin je sutra</p>
          </div>

          <div style="background: #fff3cd; padding: 20px; border-radius: 10px; margin: 25px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #856404; margin: 0 0 15px 0;">⏰ Podsjetnik</h3>
            <p style="margin: 0; color: #856404;">
              Poštovani/a <strong>${appointment.customerName}</strong>,<br>
              Ovo je podsjetnik da imate zakazani termin <strong>sutra</strong>.
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Detalji termina:</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p><strong>📅 Datum:</strong><br>${new Date(appointment.date).toLocaleDateString('hr-HR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>🕒 Vrijeme:</strong><br>${new Date(appointment.date).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div>
                <p><strong>${serviceEmoji} Usluga:</strong><br>${serviceName}</p>
                <p><strong>💰 Cijena:</strong><br>${appointment.service?.price || 0}€</p>
              </div>
            </div>
            ${appointment.notes ? `<p style="margin-top: 15px;"><strong>📝 Vaše napomene:</strong><br>${appointment.notes}</p>` : ''}
          </div>

          <div style="background: #e7f3ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #0056b3;">
              <strong>💡 Savjet:</strong> Molimo vas da dođete nekoliko minuta ranije kako biste se mogli opustiti prije tretmana.
            </p>
          </div>

          ${appointment.cancellationToken ? `
          <div style="text-align: center; margin: 25px 0;">
            <p style="color: #666; margin-bottom: 15px;">
              Ako se okolnosti promijene, možete otkazati termin:
            </p>
            <a href="${process.env.APP_URL || 'http://localhost:5000'}/cancel/${appointment.cancellationToken}" 
               style="background: #dc3545; 
                      color: white; 
                      padding: 12px 28px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block; 
                      font-weight: bold;">
               ❌ Otkaži termin
            </a>
            <p style="color: #999; font-size: 12px; margin-top: 10px;">
              Otkazivanje je moguće najkasnije 2 sata prije termina
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
              Jedva čekamo vidjeti Vas!
            </p>
          </div>
          
          <!-- Tracking pixel -->
          <img src="${trackingPixel}" width="1" height="1" alt="" style="display:block;" />
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Reminder email poslan korisniku:', appointment.customerEmail);
    return true;
  } catch (error) {
    console.error('❌ Greška pri slanju reminder emaila:', error);
    return false;
  }
};

// 5. EMAIL ZA FOLLOW-UP / FEEDBACK
exports.sendFollowUpEmail = async (appointment) => {
  try {
    const trackingPixel = `${process.env.APP_URL || 'http://localhost:5000'}/api/appointments/track/${appointment._id}/followup`;
    const reviewTrackingUrl = `${process.env.APP_URL || 'http://localhost:5000'}/api/appointments/track/${appointment._id}/review-click`;

    const mailOptions = {
      from: `"Barber Shop" <${process.env.EMAIL_USER}>`,
      to: appointment.customerEmail,
      subject: '⭐ Kako je bilo? - Barber Shop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">💈 Barber Shop</h1>
            <h2 style="color: #667eea; margin-top: 0;">Hvala što ste bili kod nas!</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
            <p>Poštovani/a <strong>${appointment.customerName}</strong>,</p>
            <p>Nadamo se da ste zadovoljni našom uslugom <strong>${appointment.service?.name || 'frizerskom uslugom'}</strong>!</p>
            
            <p style="margin-top: 20px;">Vaše mišljenje nam puno znači. Molimo vas da izdvojite trenutak i podijelite svoje iskustvo s nama.</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${reviewTrackingUrl}" 
               style="background: linear-gradient(135deg, #4285f4 0%, #34a853 100%); 
                      color: white; 
                      padding: 16px 40px; 
                      text-decoration: none; 
                      border-radius: 10px; 
                      display: inline-block; 
                      font-weight: bold;
                      font-size: 16px;
                      box-shadow: 0 4px 15px rgba(66, 133, 244, 0.3);">
               ⭐ Ostavite Google recenziju
            </a>
            <p style="color: #666; font-size: 14px; margin-top: 15px;">
              Vaša recenzija pomaže nam da nastavimo pružati vrhunske usluge
            </p>
          </div>

          <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 25px 0;">
            <h4 style="color: #0056b3; margin: 0 0 10px 0;">💡 Imate prijedlog?</h4>
            <p style="margin: 0; color: #0056b3;">
              Slobodno nam se javite emailom ili telefonom. Uvijek smo tu da Vas saslušamo!
            </p>
          </div>

          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.APP_URL || 'http://localhost:5000'}" 
               style="background: #667eea; 
                      color: white; 
                      padding: 12px 30px; 
                      text-decoration: none; 
                      border-radius: 8px; 
                      display: inline-block; 
                      font-weight: bold;">
               📅 Zakaži sljedeći termin
            </a>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin-bottom: 5px;">
              <strong>Barber Shop</strong><br>
              📞 Kontakt: +385 99 123 4567<br>
              📍 Adresa: Primjer ulica 123, Zagreb
            </p>
            <p style="color: #999; font-size: 12px;">
              Radujemo se Vašem sljedećem posjetu!
            </p>
          </div>
          
          <!-- Tracking pixel -->
          <img src="${trackingPixel}" width="1" height="1" alt="" style="display:block;" />
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Follow-up email poslan korisniku:', appointment.customerEmail);
    return true;
  } catch (error) {
    console.error('❌ Greška pri slanju follow-up emaila:', error);
    return false;
  }
};

// 6. Dnevni sažetak termina (za admina)
exports.sendDailyDigest = async ({ date, appointments }) => {
  try {
    const adminEmail = process.env.DIGEST_EMAIL_TO || process.env.EMAIL_USER;
    if (!adminEmail) return false;

    const day = new Date(date);
    const titleDate = day.toLocaleDateString('hr-HR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const rows = appointments.map(a => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${new Date(a.date).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${a.customerName}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${a.service?.name || '-'}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${a.status}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"Barber Shop" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: `📅 Dnevni sažetak termina – ${titleDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 760px; margin: 0 auto; padding: 20px;">
          <h2 style="margin:0 0 10px;color:#333;">Dnevni sažetak termina</h2>
          <p style="margin:0 0 20px;color:#555;">${titleDate}</p>
          <table style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #eee;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#f8f9fa;">
                <th style="text-align:left;padding:10px 12px;border-bottom:1px solid #eee;">Vrijeme</th>
                <th style="text-align:left;padding:10px 12px;border-bottom:1px solid #eee;">Klijent</th>
                <th style="text-align:left;padding:10px 12px;border-bottom:1px solid #eee;">Usluga</th>
                <th style="text-align:left;padding:10px 12px;border-bottom:1px solid #eee;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${rows || `<tr><td colspan="4" style="padding:16px;color:#777;">Nema termina za danas</td></tr>`}
            </tbody>
          </table>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Dnevni sažetak poslan na', adminEmail);
    return true;
  } catch (error) {
    console.error('❌ Greška pri slanju dnevnog sažetka:', error);
    return false;
  }
};