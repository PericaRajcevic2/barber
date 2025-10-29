const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Notification = require('../models/Notification');
const crypto = require('crypto');

// Učitaj servise
let emailService, smsService, calendarService;
try {
  emailService = require('../utils/emailService');
} catch (error) {
  console.log('ℹ️  Email service nije dostupan');
}
try {
  smsService = require('../utils/smsService');
} catch (error) {
  console.log('ℹ️  SMS service nije dostupan');
}
try {
  calendarService = require('../utils/calendarService');
} catch (error) {
  console.log('ℹ️  Calendar service nije dostupan');
}

// Middleware za dobivanje io instance
router.use((req, res, next) => {
  req.io = req.app.get('io');
  next();
});

// GET /api/appointments - Dohvati sve narudžbe (s mogućnošću filtriranja)
router.get('/', async (req, res) => {
  try {
    const { date, status } = req.query;
    let filter = {};
    
    if (date) {
      // Tretiraj incoming YYYY-MM-DD kao LOKALNI datum
      const [y, m, d] = date.split('-').map(Number);
      const startDate = new Date(y, m - 1, d, 0, 0, 0, 0);
      const endDate = new Date(y, m - 1, d, 23, 59, 59, 999);

      console.log(`📅 GET appointments za datum (lokalno): ${date}`);
      console.log(`🕐 Lokalni raspon: ${startDate.toString()} - ${endDate.toString()}`);

      filter.date = {
        $gte: startDate,
        $lt: new Date(endDate.getTime() + 1)
      };
    }
    
    if (status) {
      filter.status = status;
    }
    
    const appointments = await Appointment.find(filter)
      .populate('service')
      .sort({ date: 1 });
    
    console.log(`✅ Pronađeno ${appointments.length} narudžbi`);
    
    res.json(appointments);
  } catch (error) {
    console.error('❌ Greška pri dohvaćanju narudžbi:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/appointments/week - Dohvati narudžbe za tjedan
router.get('/week', async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({ message: 'Start i end datumi su obavezni' });
    }

    // Parse start i end datume (YYYY-MM-DD format)
    const [startY, startM, startD] = start.split('-').map(Number);
    const [endY, endM, endD] = end.split('-').map(Number);
    
    const startDate = new Date(startY, startM - 1, startD, 0, 0, 0, 0);
    const endDate = new Date(endY, endM - 1, endD, 23, 59, 59, 999);

    console.log(`📅 GET appointments za tjedan: ${start} - ${end}`);
    console.log(`🕐 Lokalni raspon: ${startDate.toString()} - ${endDate.toString()}`);

    const appointments = await Appointment.find({
      date: {
        $gte: startDate,
        $lt: new Date(endDate.getTime() + 1)
      }
    })
    .populate('service')
    .sort({ date: 1 });
    
    console.log(`✅ Pronađeno ${appointments.length} narudžbi za tjedan`);
    
    res.json(appointments);
  } catch (error) {
    console.error('❌ Greška pri dohvaćanju narudžbi za tjedan:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/appointments - Kreiraj novu narudžbu
router.post('/', async (req, res) => {
  try {
    const { customerName, customerEmail, customerPhone, service, date, notes } = req.body;
    
    console.log(`📥 Primljen zahtjev za termin:`, {
      customerName,
      date: date,
      service,
      notes
    });

    // Koristi UTC datum za konzistentnost
    const appointmentTime = new Date(date);
    console.log(`🕒 Vrijeme termina (raw): ${appointmentTime.toISOString()}`);
    console.log(`🕒 Vrijeme termina (local): ${appointmentTime.toLocaleString('hr-HR')}`);
    
    // Postavi UTC vrijeme za tačnu provjeru
    const utcAppointmentTime = new Date(appointmentTime.toISOString());
    
    // Provjeri je li termin dostupan - koristi UTC vremena
    const startTime = new Date(utcAppointmentTime.getTime() - 29 * 60000); // 29 minuta ranije
    const endTime = new Date(utcAppointmentTime.getTime() + 29 * 60000);   // 29 minuta kasnije

    console.log(`🔍 Provjeravam zauzeće u rasponu:`);
    console.log(`   - Start: ${startTime.toISOString()}`);
    console.log(`   - End:   ${endTime.toISOString()}`);
    
    const existingAppointment = await Appointment.findOne({
      date: {
        $gte: startTime,
        $lt: endTime
      },
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (existingAppointment) {
      console.log(`❌ Termin je već zauzet:`, {
        existingDate: existingAppointment.date.toISOString(),
        existingCustomer: existingAppointment.customerName
      });
      return res.status(400).json({ message: 'Termin je već zauzet' });
    }
    
    // Generiši jedinstveni cancellation token
    const cancellationToken = crypto.randomBytes(32).toString('hex');
    
    const appointment = new Appointment({
      customerName,
      customerEmail,
      customerPhone,
      service,
      date: utcAppointmentTime, // Spremi kao UTC
      notes,
      cancellationToken
    });
    
    const savedAppointment = await appointment.save();
    await savedAppointment.populate('service');
    
    console.log(`✅ Termin uspješno spremljen:`, {
      id: savedAppointment._id,
      date: savedAppointment.date.toISOString(),
      customer: savedAppointment.customerName,
      service: savedAppointment.service.name
    });
    
    // Pošalji real-time obavijest adminima
    try {
      const io = req.io;
      if (io) {
        io.to('admin_room').emit('new_appointment', savedAppointment);
        console.log('🔔 Real-time obavijest poslana adminima');
      }
    } catch (socketError) {
      console.error('❌ Greška pri slanju socket obavijesti:', socketError);
    }

    // Persist notification in DB
    try {
      await Notification.create({
        type: 'appointment.created',
        title: 'Nova narudžba',
        message: `${savedAppointment.customerName} – ${savedAppointment.service?.name || ''}`.trim(),
        data: { appointmentId: savedAppointment._id, date: savedAppointment.date }
      });
    } catch (nerr) {
      console.error('❌ Ne mogu spremiti notifikaciju:', nerr.message);
    }

    // Send PUSH notification to admins
    try {
      const axios = require('axios');
      const baseURL = process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
      await axios.post(`${baseURL}/api/push/send-admin`, {
        title: '🎉 Nova Narudžba!',
        body: `${savedAppointment.customerName} - ${savedAppointment.service.name}`,
        data: {
          url: '/admin',
          appointmentId: savedAppointment._id
        }
      }).catch(err => console.log('Push notification skipped:', err.message));
    } catch (pushError) {
      console.log('Push notification not sent:', pushError.message);
    }
    
  // Pošalji EMAIL notifikacije
    console.log('🔍 Provjeravam email uslove:', {
      emailService: !!emailService,
      EMAIL_USER: !!process.env.EMAIL_USER,
      EMAIL_PASS: !!process.env.EMAIL_PASS
    });
    
    if (emailService && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        console.log('📧 Pokušavam poslati emailove...');
        await emailService.sendAppointmentConfirmation(savedAppointment);
        await emailService.sendNewAppointmentNotification(savedAppointment);
        console.log('✅ Email notifikacije uspješno poslane');
      } catch (emailError) {
        console.error('❌ Greška pri slanju email notifikacija:', emailError);
        console.error('Stack trace:', emailError.stack);
      }
    } else {
      console.log('ℹ️  Email notifikacije su isključene');
    }
    
  // Pošalji SMS/OTT notifikacije (WhatsApp Cloud API)
  if (smsService && (smsService.isConfigured?.() || (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID))) {
      try {
        // Ako je konfiguriran WhatsApp template za potvrdu, koristi ga; u suprotnom, plain text
        let smsResult;
        if (smsService.sendTemplateConfirmation && process.env.WHATSAPP_TEMPLATE_CONFIRMATION_NAME) {
          smsResult = await smsService.sendTemplateConfirmation(savedAppointment);
        } else {
          smsResult = await smsService.sendAppointmentConfirmation(savedAppointment);
        }
        if (smsResult.success) {
          console.log('✅ SMS potvrda uspješno poslana klijentu');
        } else {
          console.error('❌ Greška pri slanju SMS-a klijentu:', smsResult.error);
        }
        
        // Pošalji frizeru samo ako je broj postavljen
        if (process.env.BARBER_PHONE) {
          const barberSmsResult = await smsService.sendNewAppointmentNotification(savedAppointment);
          if (barberSmsResult.success) {
            console.log('✅ SMS obavijest uspješno poslana frizeru');
          } else {
            console.error('❌ Greška pri slanju SMS-a frizeru:', barberSmsResult.error);
          }
        }
      } catch (smsError) {
        console.error('❌ Greška pri slanju SMS notifikacija:', smsError);
      }
    } else {
      console.log('ℹ️  SMS notifikacije su isključene');
    }
    
    // Dodaj u GOOGLE CALENDAR (ako je autentificiran i omogućeno)
    const Settings = require('../models/Settings');
    const settings = await Settings.getSettings();
    if (settings.googleCalendarEnabled && calendarService && calendarService.isAuthenticated()) {
      try {
        const calendarResult = await calendarService.createAppointmentEvent(savedAppointment);
        if (calendarResult.success) {
          // Spremi Google Calendar event ID u bazu
          savedAppointment.googleCalendarEventId = calendarResult.eventId;
          await savedAppointment.save();
          console.log('✅ Termin dodan u Google Calendar');
        } else {
          console.error('❌ Greška pri dodavanju u Google Calendar:', calendarResult.error);
        }
      } catch (calendarError) {
        console.error('❌ Greška pri pozivu Google Calendar servisa:', calendarError);
      }
    } else {
      console.log('ℹ️  Google Calendar nije autentificiran - preskačem dodavanje termina');
    }
    
    res.status(201).json(savedAppointment);
  } catch (error) {
    console.error('❌ Greška pri kreiranju narudžbe:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/appointments/:id - Ažuriraj status narudžbe
router.put('/:id', async (req, res) => {
  try {
    const { status, cancellationReason } = req.body;
    
    console.log(`🔄 Ažuriram status narudžbe ${req.params.id} na: ${status}`);
    
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('service');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Narudžba nije pronađena' });
    }

    console.log(`✅ Status narudžbe ažuriran:`, {
      id: appointment._id,
      customer: appointment.customerName,
      newStatus: appointment.status,
      date: appointment.date.toISOString()
    });

    // Ažuriraj Google Calendar ako postoji eventId, autentifikacija i uključeno
    const Settings = require('../models/Settings');
    const settings = await Settings.getSettings();
    if (settings.googleCalendarEnabled && appointment.googleCalendarEventId && calendarService && calendarService.isAuthenticated()) {
      try {
        if (status === 'cancelled') {
          await calendarService.deleteAppointmentEvent(appointment.googleCalendarEventId);
          console.log('✅ Termin obrisan iz Google Calendara');
        } else {
          await calendarService.updateAppointmentEvent(appointment.googleCalendarEventId, appointment);
          console.log('✅ Termin ažuriran u Google Calendaru');
        }
      } catch (calendarError) {
        console.error('❌ Greška pri ažuriranju Google Calendara:', calendarError);
      }
    }

    // Pošalji EMAIL ako je narudžba otkazana
    if (status === 'cancelled' && emailService && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await emailService.sendAppointmentCancellation(appointment, cancellationReason);
        console.log('✅ Email o otkazivanju poslan korisniku');
      } catch (emailError) {
        console.error('❌ Greška pri slanju emaila o otkazivanju:', emailError);
      }
    }

  // Pošalji SMS/OTT ako je narudžba otkazana
  if (status === 'cancelled' && smsService && (smsService.isConfigured?.() || (process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID))) {
      try {
        const smsResult = await smsService.sendAppointmentCancellation(appointment, cancellationReason);
        if (smsResult.success) {
          console.log('✅ SMS o otkazivanju poslan korisniku');
        } else {
          console.error('❌ Greška pri slanju SMS-a o otkazivanju:', smsResult.error);
        }
      } catch (smsError) {
        console.error('❌ Greška pri slanju SMS notifikacije o otkazivanju:', smsError);
      }
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('❌ Greška pri ažuriranju narudžbe:', error);
    res.status(400).json({ message: error.message });
  }
});

// GET /api/appointments/cancel/:token - Prikaži detalje termina za otkazivanje (javni pristup)
router.get('/cancel/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log(`🔍 Pregled termina sa tokenom: ${token}`);
    
    const appointment = await Appointment.findOne({ 
      cancellationToken: token,
      status: { $in: ['pending', 'confirmed'] }
    }).populate('service');
    
    if (!appointment) {
      return res.status(404).json({ 
        message: 'Termin nije pronađen ili je već otkazan' 
      });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('❌ Greška pri dohvaćanju termina:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET /api/appointments/by-token/:token - Dohvati termin putem tokena (javni pristup)
router.get('/by-token/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    console.log(`🔍 Dohvaćam termin sa tokenom: ${token}`);
    
    const appointment = await Appointment.findOne({ 
      cancellationToken: token,
      status: { $in: ['pending', 'confirmed'] }
    }).populate('service');
    
    if (!appointment) {
      return res.status(404).json({ 
        message: 'Termin nije pronađen ili je već otkazan' 
      });
    }
    
    res.json(appointment);
  } catch (error) {
    console.error('❌ Greška pri dohvaćanju termina:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST /api/appointments/cancel/:token - Otkaži termin putem tokena (javni pristup)
router.post('/cancel/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { reason, note } = req.body;
    
    console.log(`🔍 Pokušaj otkazivanja termina sa tokenom: ${token}`);
    
    // Pronađi termin sa ovim tokenom
    const appointment = await Appointment.findOne({ 
      cancellationToken: token,
      status: { $in: ['pending', 'confirmed'] } // Samo aktivni termini mogu biti otkazani
    }).populate('service');
    
    if (!appointment) {
      console.log('❌ Termin nije pronađen ili je već otkazan');
      return res.status(404).json({ 
        message: 'Termin nije pronađen ili je već otkazan' 
      });
    }
    
    // Dohvati postavke za cancellation time limit
    const Settings = require('../models/Settings');
    const settings = await Settings.getSettings();
    const timeLimit = settings.cancellationTimeLimit || 2;
    
    // Provjeri da li je termin u budućnosti (minimalno X sati unaprijed)
    const now = new Date();
    const appointmentDate = new Date(appointment.date);
    const hoursDifference = (appointmentDate - now) / (1000 * 60 * 60);
    
    if (hoursDifference < timeLimit) {
      console.log(`❌ Termin ne može biti otkazan manje od ${timeLimit}h prije početka`);
      return res.status(400).json({ 
        message: `Termin ne može biti otkazan manje od ${timeLimit}h prije početka` 
      });
    }
    
    // Ažuriraj status na cancelled
    appointment.status = 'cancelled';
    if (reason) appointment.cancellationReason = reason;
    if (note) appointment.cancellationNote = note;
    appointment.cancelledAt = new Date();
    await appointment.save();
    
    console.log(`✅ Termin otkazan:`, {
      id: appointment._id,
      customer: appointment.customerName,
      date: appointment.date.toISOString(),
      reason: reason || 'Korisnik otkazao',
      note: note || 'N/A'
    });
    
    // Obriši iz Google Calendara ako postoji i integracija uključena
    if (settings.googleCalendarEnabled && appointment.googleCalendarEventId && calendarService && calendarService.isAuthenticated()) {
      try {
        await calendarService.deleteAppointmentEvent(appointment.googleCalendarEventId);
        console.log('✅ Termin obrisan iz Google Calendara');
      } catch (calendarError) {
        console.error('❌ Greška pri brisanju iz Google Calendara:', calendarError);
      }
    }
    
    // Pošalji email potvrdu otkazivanja
    if (emailService && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await emailService.sendAppointmentCancellation(appointment, reason || 'Korisnik otkazao termin');
        console.log('✅ Email potvrda otkazivanja poslana korisniku');
      } catch (emailError) {
        console.error('❌ Greška pri slanju emaila:', emailError);
      }
    }
    
    // Pošalji SMS potvrdu otkazivanja
    if (smsService && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const smsResult = await smsService.sendAppointmentCancellation(appointment, reason);
        if (smsResult.success) {
          console.log('✅ SMS potvrda otkazivanja poslana korisniku');
        }
      } catch (smsError) {
        console.error('❌ Greška pri slanju SMS-a:', smsError);
      }
    }
    
    // Obavijesti admina o otkazivanju
    try {
      const io = req.io;
      if (io) {
        io.to('admin_room').emit('appointment_cancelled', {
          appointment,
          reason: reason || 'Korisnik otkazao termin'
        });
        console.log('🔔 Admin obavijesten o otkazivanju');
      }
    } catch (socketError) {
      console.error('❌ Greška pri slanju socket obavijesti:', socketError);
    }

    // Persist notification in DB
    try {
      await Notification.create({
        type: 'appointment.cancelled',
        title: 'Termin otkazan',
        message: `${appointment.customerName} – ${appointment.service?.name || ''}`,
        data: { appointmentId: appointment._id, date: appointment.date, reason: reason || '' }
      });
    } catch (nerr) {
      console.error('❌ Ne mogu spremiti notifikaciju (cancel):', nerr.message);
    }
    
    res.json({ 
      message: 'Termin uspješno otkazan',
      appointment 
    });
  } catch (error) {
    console.error('❌ Greška pri otkazivanju termina:', error);
    res.status(500).json({ message: error.message });
  }
});

// DELETE /api/appointments/:id - Obriši narudžbu
router.delete('/:id', async (req, res) => {
// POST /api/appointments/reschedule/:token - Promijeni termin putem tokena (javni pristup)
router.post('/reschedule/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { newDate } = req.body;
    
    if (!newDate) {
      return res.status(400).json({ message: 'Nedostaje novi datum' });
    }
    
    console.log(`🔍 Pokušaj promjene termina sa tokenom: ${token}`);
    
    // Pronađi termin sa ovim tokenom
    const appointment = await Appointment.findOne({ 
      cancellationToken: token,
      status: { $in: ['pending', 'confirmed'] }
    }).populate('service');
    
    if (!appointment) {
      return res.status(404).json({ 
        message: 'Termin nije pronađen ili je već otkazan' 
      });
    }
    
    // Dohvati postavke
    const Settings = require('../models/Settings');
    const settings = await Settings.getSettings();
    
    // Provjeri da li je reschedule omogućen
    if (!settings.allowReschedule) {
      return res.status(403).json({ 
        message: 'Promjena termina trenutno nije omogućena' 
      });
    }
    
    const timeLimit = settings.rescheduleTimeLimit || settings.cancellationTimeLimit || 2;
    
    // Provjeri da li je termin dovoljno unaprijed
    const now = new Date();
    const appointmentDate = new Date(appointment.date);
    const hoursDifference = (appointmentDate - now) / (1000 * 60 * 60);
    
    if (hoursDifference < timeLimit) {
      return res.status(400).json({ 
        message: `Promjena termina moguća najkasnije ${timeLimit}h prije početka` 
      });
    }
    
    // Parse novi datum
    const parsedNewDate = new Date(newDate);
    if (isNaN(parsedNewDate.getTime())) {
      return res.status(400).json({ message: 'Neispravan format datuma' });
    }
    
    // Provjeri da li je novi termin u budućnosti
    if (parsedNewDate <= now) {
      return res.status(400).json({ message: 'Novi termin mora biti u budućnosti' });
    }
    
    // Provjeri zauzeće novog termina (+/- 29 minuta)
    const utcNewDate = new Date(parsedNewDate.toISOString());
    const startTime = new Date(utcNewDate.getTime() - 29 * 60000);
    const endTime = new Date(utcNewDate.getTime() + 29 * 60000);
    
    const conflict = await Appointment.findOne({
      _id: { $ne: appointment._id },
      date: { $gte: startTime, $lt: endTime },
      status: { $in: ['pending', 'confirmed'] }
    });
    
    if (conflict) {
      return res.status(400).json({ message: 'Novi termin je zauzet' });
    }
    
    // Spremi stari datum za tracking
    const oldDate = appointment.date;
    
    // Ažuriraj datum
    appointment.date = utcNewDate;
    appointment.rescheduledFrom = oldDate;
    await appointment.save();
    
    console.log(`✅ Termin promijenjen:`, {
      id: appointment._id,
      customer: appointment.customerName,
      oldDate: oldDate.toISOString(),
      newDate: appointment.date.toISOString()
    });
    
    // Ažuriraj Google Calendar ako postoji i uključeno
    if (settings.googleCalendarEnabled && appointment.googleCalendarEventId && calendarService && calendarService.isAuthenticated()) {
      try {
        await calendarService.updateAppointmentEvent(appointment.googleCalendarEventId, appointment);
        console.log('✅ Termin ažuriran u Google Calendaru');
      } catch (calendarError) {
        console.error('❌ Greška pri ažuriranju Google Calendara:', calendarError);
      }
    }
    
    // Pošalji email potvrdu o promjeni
    if (emailService && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await emailService.sendAppointmentConfirmation(appointment);
        console.log('✅ Email potvrda nove termina poslana korisniku');
      } catch (emailError) {
        console.error('❌ Greška pri slanju emaila:', emailError);
      }
    }
    
    // Obavijesti admina
    try {
      const io = req.io;
      if (io) {
        io.to('admin_room').emit('appointment_rescheduled', {
          appointment,
          oldDate,
          newDate: appointment.date
        });
        console.log('🔔 Admin obavijesten o promjeni termina');
      }
    } catch (socketError) {
      console.error('❌ Greška pri slanju socket obavijesti:', socketError);
    }

    // Persist notification in DB
    try {
      await Notification.create({
        type: 'appointment.rescheduled',
        title: 'Termin promijenjen',
        message: `${appointment.customerName} – ${appointment.service?.name || ''}`,
        data: { appointmentId: appointment._id, oldDate, newDate: appointment.date }
      });
    } catch (nerr) {
      console.error('❌ Ne mogu spremiti notifikaciju (reschedule):', nerr.message);
    }
    
    res.json({ 
      message: 'Termin uspješno promijenjen',
      appointment 
    });
  } catch (error) {
    console.error('❌ Greška pri promjeni termina:', error);
    res.status(500).json({ message: error.message });
  }
});

  try {
    console.log(`🗑️ Brišem narudžbu: ${req.params.id}`);
    
    const appointment = await Appointment.findById(req.params.id);
    
    if (!appointment) {
      return res.status(404).json({ message: 'Narudžba nije pronađena' });
    }

    console.log(`✅ Pronađena narudžba za brisanje:`, {
      id: appointment._id,
      customer: appointment.customerName,
      date: appointment.date.toISOString()
    });

    // Obriši iz Google Calendara ako postoji eventId i autentifikacija
    if (appointment.googleCalendarEventId && calendarService && calendarService.isAuthenticated()) {
      try {
        await calendarService.deleteAppointmentEvent(appointment.googleCalendarEventId);
        console.log('✅ Termin obrisan iz Google Calendara');
      } catch (calendarError) {
        console.error('❌ Greška pri brisanju iz Google Calendara:', calendarError);
      }
    }

    await Appointment.findByIdAndDelete(req.params.id);
    
    console.log(`✅ Narudžba uspješno obrisana: ${req.params.id}`);
    
    res.json({ message: 'Narudžba obrisana' });
  } catch (error) {
    console.error('❌ Greška pri brisanju narudžbe:', error);
    res.status(500).json({ message: error.message });
  }
});

// PUT /api/appointments/:id/reschedule - Promijeni termin (datum/vrijeme)
router.put('/:id/reschedule', async (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ message: 'Nedostaje novi datum/vrijeme' });
    }

    const newDate = new Date(date);
    if (isNaN(newDate.getTime())) {
      return res.status(400).json({ message: 'Neispravan format datuma' });
    }

    // Spremamo kao UTC
    const utcNewDate = new Date(newDate.toISOString());

    // Provjera zauzeća +/- 29 minuta oko novog termina, ignoriraj trenutni termin
    const startTime = new Date(utcNewDate.getTime() - 29 * 60000);
    const endTime = new Date(utcNewDate.getTime() + 29 * 60000);

    const conflict = await Appointment.findOne({
      _id: { $ne: req.params.id },
      date: { $gte: startTime, $lt: endTime },
      status: { $in: ['pending', 'confirmed'] }
    });

    if (conflict) {
      return res.status(400).json({ message: 'Novi termin je zauzet' });
    }

    // Ažuriraj datum
    let appointment = await Appointment.findById(req.params.id).populate('service');
    if (!appointment) {
      return res.status(404).json({ message: 'Narudžba nije pronađena' });
    }

    appointment.date = utcNewDate;
    await appointment.save();

    // Ažuriraj Google Calendar event ako postoji i uključeno
    const Settings = require('../models/Settings');
    const settings = await Settings.getSettings();
    if (settings.googleCalendarEnabled && appointment.googleCalendarEventId && calendarService && calendarService.isAuthenticated()) {
      try {
        await calendarService.updateAppointmentEvent(appointment.googleCalendarEventId, appointment);
        console.log('✅ Termin ažuriran u Google Calendaru (reschedule)');
      } catch (calendarError) {
        console.error('❌ Greška pri ažuriranju Google Calendara (reschedule):', calendarError);
      }
    }

    // Obavijesti admin sobe preko socket-a
    try {
      const io = req.io;
      if (io) {
        io.to('admin_room').emit('appointment_rescheduled', appointment);
      }
    } catch (socketError) {
      console.error('❌ Greška pri slanju socket obavijesti (reschedule):', socketError);
    }

    res.json(appointment);
  } catch (error) {
    console.error('❌ Greška pri promjeni termina:', error);
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/appointments/:id/send-followup - Ručno slanje follow-up emaila
router.put('/:id/send-followup', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('service');
    
    if (!appointment) {
      return res.status(404).json({ message: 'Termin nije pronađen' });
    }

    if (emailService && emailService.sendFollowUpEmail) {
      const success = await emailService.sendFollowUpEmail(appointment);
      
      if (success) {
        appointment.followUpSent = true;
        appointment.followUpSentAt = new Date();
        await appointment.save();
        
        res.json({ 
          message: 'Follow-up email poslan!',
          appointment 
        });
      } else {
        res.status(500).json({ message: 'Greška pri slanju follow-up emaila' });
      }
    } else {
      res.status(503).json({ message: 'Email servis nije dostupan' });
    }
  } catch (error) {
    console.error('❌ Greška pri slanju follow-up emaila:', error);
    res.status(400).json({ message: error.message });
  }
});

// GET /api/appointments/track/:id/:type - Email tracking endpoint (pixel)
router.get('/track/:id/:type', async (req, res) => {
  try {
    const { id, type } = req.params; // type: 'reminder' ili 'followup'
    
    const appointment = await Appointment.findById(id);
    if (appointment) {
      if (type === 'reminder' && !appointment.emailTracking.reminderOpened) {
        appointment.emailTracking.reminderOpened = true;
        appointment.emailTracking.reminderOpenedAt = new Date();
        await appointment.save();
        console.log(`📧 Reminder email otvoren za termin ${id}`);
      } else if (type === 'followup' && !appointment.emailTracking.followUpOpened) {
        appointment.emailTracking.followUpOpened = true;
        appointment.emailTracking.followUpOpenedAt = new Date();
        await appointment.save();
        console.log(`📧 Follow-up email otvoren za termin ${id}`);
      }
    }
    
    // Vrati 1x1 transparentni pixel
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixel.length,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(pixel);
  } catch (error) {
    console.error('❌ Greška pri trackiranju emaila:', error);
    const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
    res.writeHead(200, { 'Content-Type': 'image/gif' });
    res.end(pixel);
  }
});

// GET /api/appointments/track/:id/review-click - Track review link clicks
router.get('/track/:id/review-click', async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (appointment && !appointment.emailTracking.reviewLinkClicked) {
      appointment.emailTracking.reviewLinkClicked = true;
      appointment.emailTracking.reviewLinkClickedAt = new Date();
      await appointment.save();
      console.log(`⭐ Review link kliknut za termin ${req.params.id}`);
    }
    
    // Redirect na Google review URL
    const googleReviewUrl = process.env.GOOGLE_REVIEW_URL || 'https://g.page/r/YOUR_BUSINESS_ID/review';
    res.redirect(googleReviewUrl);
  } catch (error) {
    console.error('❌ Greška pri trackiranju review clicka:', error);
    res.redirect(process.env.GOOGLE_REVIEW_URL || 'https://google.com');
  }
});

module.exports = router;
