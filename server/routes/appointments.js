const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');

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
      // Koristi UTC za konzistentnost - početak i kraj dana u UTC
      const startDate = new Date(date + 'T00:00:00.000Z');
      const endDate = new Date(date + 'T23:59:59.999Z');
      
      console.log(`📅 GET appointments za datum: ${date}`);
      console.log(`🕐 UTC raspon: ${startDate.toISOString()} - ${endDate.toISOString()}`);
      
      filter.date = {
        $gte: startDate,
        $lt: endDate
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
    
    const appointment = new Appointment({
      customerName,
      customerEmail,
      customerPhone,
      service,
      date: utcAppointmentTime, // Spremi kao UTC
      notes
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
    
    // Pošalji EMAIL notifikacije
    if (emailService && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        await emailService.sendAppointmentConfirmation(savedAppointment);
        await emailService.sendNewAppointmentNotification(savedAppointment);
        console.log('✅ Email notifikacije uspješno poslane');
      } catch (emailError) {
        console.error('❌ Greška pri slanju email notifikacija:', emailError);
      }
    } else {
      console.log('ℹ️  Email notifikacije su isključene');
    }
    
    // Pošalji SMS notifikacije
    if (smsService && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const smsResult = await smsService.sendAppointmentConfirmation(savedAppointment);
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
    
    // Dodaj u GOOGLE CALENDAR (ako je autentificiran)
    if (calendarService && calendarService.isAuthenticated()) {
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

    // Ažuriraj Google Calendar ako postoji eventId i autentifikacija
    if (appointment.googleCalendarEventId && calendarService && calendarService.isAuthenticated()) {
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

    // Pošalji SMS ako je narudžba otkazana
    if (status === 'cancelled' && smsService && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
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

// DELETE /api/appointments/:id - Obriši narudžbu
router.delete('/:id', async (req, res) => {
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

module.exports = router;