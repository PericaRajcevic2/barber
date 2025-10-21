require('dotenv').config();
const nodemailer = require('nodemailer');

console.log('🔍 Testiranje email konfiguracije...');
console.log('EMAIL_USER:', process.env.EMAIL_USER);
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***' + process.env.EMAIL_PASS.slice(-4) : 'NIJE POSTAVLJEN');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Test konekcije
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email konfiguracija neuspješna:', error);
  } else {
    console.log('✅ Email server je spreman!');
    
    // Pokušaj poslati test email
    const mailOptions = {
      from: `"Test Barber Shop" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER, // Šalje sam sebi
      subject: 'Test Email - Barber Booking System',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h1>🎉 Test Email Uspješan!</h1>
          <p>Ako vidiš ovu poruku, email sistem radi ispravno.</p>
          <p>Vrijeme: ${new Date().toLocaleString('hr-HR')}</p>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('❌ Greška pri slanju test emaila:', error);
      } else {
        console.log('✅ Test email uspješno poslan!');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
      }
      process.exit(0);
    });
  }
});
