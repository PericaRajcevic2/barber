require('dotenv').config();
const mongoose = require('mongoose');
const Appointment = require('./models/Appointment');
const Service = require('./models/Service');
const crypto = require('crypto');

// Email service
const emailService = require('./utils/emailService');

async function createTestAppointment() {
  try {
    // Konektuj na bazu
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Pronađi prvu dostupnu uslugu
    const service = await Service.findOne();
    if (!service) {
      console.log('❌ Nema dostupnih usluga u bazi');
      process.exit(1);
    }

    console.log('📋 Pronađena usluga:', service.name);

    // Kreiraj termin za sutra u 14:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);

    // Generiši cancellation token
    const cancellationToken = crypto.randomBytes(32).toString('hex');

    const appointmentData = {
      customerName: 'Test Korisnik',
      customerEmail: process.env.EMAIL_USER, // Šalje na tvoj email
      customerPhone: '+38761123456',
      service: service._id,
      date: tomorrow,
      status: 'confirmed',
      notes: 'Test termin za otkazivanje putem emaila',
      cancellationToken: cancellationToken
    };

    // Kreiraj appointment
    const appointment = new Appointment(appointmentData);
    await appointment.save();
    await appointment.populate('service');

    console.log('✅ Test termin kreiran:', {
      id: appointment._id,
      datum: appointment.date.toLocaleString('hr-HR'),
      usluga: appointment.service.name,
      token: cancellationToken
    });

    // Pošalji email sa cancel linkom
    console.log('\n📧 Slanje confirmation emaila...');
    await emailService.sendAppointmentConfirmation(appointment);
    
    console.log('\n✅ Email poslan na:', process.env.EMAIL_USER);
    console.log('\n🔗 Cancel link:');
    console.log(`${process.env.APP_URL}/cancel/${cancellationToken}`);
    
    console.log('\n📸 Možeš otvoriti browser i vidjeti cancel stranicu!');

  } catch (error) {
    console.error('❌ Greška:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

createTestAppointment();
