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
    console.log('âťŚ Email konfiguracija neuspjeĹˇna:', error);
  } else {
    console.log('âś… Email server je spreman za slanje poruka');
  }
});

// 1. EMAIL POTVRDE ZA KLIJENTA
exports.sendAppointmentConfirmation = async (appointment) => {
  try {
    console.log('đź“§ PokuĹˇavam poslati confirmation email na:', appointment.customerEmail);
    
    const mailOptions = {
      from: `"Barber Shop" <${process.env.EMAIL_USER}>`,
      to: appointment.customerEmail,
      subject: 'Potvrda rezervacije termina - Barber Shop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">đź’ Barber Shop</h1>
            <h2 style="color: #667eea; margin-top: 0;">Hvala na rezervaciji!</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0; border-bottom: 2px solid #667eea; padding-bottom: 10px;">Detalji termina:</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <p><strong>đź“… Datum:</strong><br>${new Date(appointment.date).toLocaleDateString('hr-HR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>đź•’ Vrijeme:</strong><br>${new Date(appointment.date).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div>
                <p><strong>âś‚ď¸Ź Usluga:</strong><br>${appointment.service.name}</p>
                <p><strong>đź’° Cijena:</strong><br>${appointment.service.price}â‚¬</p>
              </div>
            </div>
            ${appointment.notes ? `<p style="margin-top: 15px;"><strong>đź“ť VaĹˇe napomene:</strong><br>${appointment.notes}</p>` : ''}
          </div>

          <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>â„ąď¸Ź VaĹľno:</strong> Molimo vas da doÄ‘ete toÄŤno na vrijeme. 
              Ako Ĺľelite otkazati termin, koristite dugme ispod (najmanje 2 sata unaprijed).
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
               âťŚ OtkaĹľi termin
            </a>
            <p style="color: #666; font-size: 12px; margin-top: 10px;">
              Link za otkazivanje vaĹľi do termina
            </p>
          </div>
          ` : ''}

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; margin-bottom: 5px;">
              <strong>Barber Shop</strong><br>
              đź“ž Kontakt: +385 99 123 4567<br>
              đź“Ť Adresa: Primjer ulica 123, Zagreb
            </p>
            <p style="color: #999; font-size: 12px;">
              Hvala Ĺˇto koristite naĹˇe usluge!
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('âś… Email potvrde poslan korisniku:', appointment.customerEmail);
    return true;
  } catch (error) {
    console.error('âťŚ GreĹˇka pri slanju confirmation emaila:', error);
    console.error('Error details:', error.message);
    return false;
  }
};

// 2. EMAIL OBAVIJESTI ZA FRIZERA
exports.sendNewAppointmentNotification = async (appointment) => {
  try {
    console.log('đź“§ PokuĹˇavam poslati notification email frizeru');
    
    const mailOptions = {
      from: `"Barber Shop Notifications" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: 'đź“‹ Nova narudĹľba - Barber Shop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">NOVA NARUDĹ˝BA!</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Stigla je nova rezervacija termina</p>
          </div>

          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Detalji narudĹľbe:</h3>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
              <div>
                <h4 style="color: #667eea; margin-bottom: 10px;">đź‘¤ Podaci o klijentu</h4>
                <p><strong>Ime i prezime:</strong><br>${appointment.customerName}</p>
                <p><strong>Email:</strong><br>${appointment.customerEmail}</p>
                <p><strong>Telefon:</strong><br>${appointment.customerPhone}</p>
              </div>
              
              <div>
                <h4 style="color: #667eea; margin-bottom: 10px;">đź“… Detalji termina</h4>
                <p><strong>Datum:</strong><br>${new Date(appointment.date).toLocaleDateString('hr-HR')}</p>
                <p><strong>Vrijeme:</strong><br>${new Date(appointment.date).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}</p>
                <p><strong>Usluga:</strong><br>${appointment.service.name}</p>
                <p><strong>Trajanje:</strong><br>${appointment.service.duration} min</p>
              </div>
            </div>

            ${appointment.notes ? `
              <div style="margin-top: 15px; padding: 15px; background: #e7f3ff; border-radius: 5px;">
                <h4 style="color: #0056b3; margin: 0 0 10px 0;">đź“ť Napomene klijenta:</h4>
                <p style="margin: 0; font-style: italic;">"${appointment.notes}"</p>
              </div>
            ` : ''}
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="${process.env.APP_URL || 'http://localhost:5000'}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
               đź”Ť Pogledaj u admin panelu
            </a>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
            <p>Ovo je automatska obavijest. Molimo ne odgovarati na ovaj email.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('âś… Obavijest o novoj narudĹľbi poslana frizeru');
    return true;
  } catch (error) {
    console.error('âťŚ GreĹˇka pri slanju notification emaila frizeru:', error);
    console.error('Error details:', error.message);
    return false;
  }
};

// 3. EMAIL ZA OTPUĹ TANJE TERMINA
exports.sendAppointmentCancellation = async (appointment, reason = '') => {
  try {
    const mailOptions = {
      from: `"Barber Shop" <${process.env.EMAIL_USER}>`,
      to: appointment.customerEmail,
      subject: 'Otkazivanje termina - Barber Shop',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">đź’ Barber Shop</h1>
            <h2 style="color: #dc3545; margin-top: 0;">Termin otkazan</h2>
          </div>
          
          <div style="background: #f8f9fa; padding: 25px; border-radius: 10px; margin: 20px 0;">
            <p>PoĹˇtovani/a <strong>${appointment.customerName}</strong>,</p>
            <p>Ĺ˝ao nam je, ali vaĹˇ termin je otkazan.</p>
            
            <div style="margin: 20px 0; padding: 15px; background: #f8d7da; border-radius: 5px;">
              <h4 style="color: #721c24; margin: 0 0 10px 0;">Otkazani termin:</h4>
              <p style="margin: 5px 0;"><strong>Datum:</strong> ${new Date(appointment.date).toLocaleDateString('hr-HR')}</p>
              <p style="margin: 5px 0;"><strong>Vrijeme:</strong> ${new Date(appointment.date).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}</p>
              <p style="margin: 5px 0;"><strong>Usluga:</strong> ${appointment.service.name}</p>
              ${reason ? `<p style="margin: 5px 0;"><strong>Razlog:</strong> ${reason}</p>` : ''}
            </div>

            <p>Molimo vas da rezervirate novi termin putem naĹˇeg online sustava.</p>
          </div>

          <div style="text-align: center; margin-top: 25px;">
            <a href="${process.env.APP_URL || 'http://localhost:5000'}" 
               style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
               đź“… Rezerviraj novi termin
            </a>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #666;">
            <p>Za sva dodatna pitanja, slobodno nas kontaktirajte.</p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('âś… Email o otkazivanju termina poslan korisniku:', appointment.customerEmail);
    return true;
  } catch (error) {
    console.error('âťŚ GreĹˇka pri slanju emaila o otkazivanju:', error);
    return false;
  }
};
