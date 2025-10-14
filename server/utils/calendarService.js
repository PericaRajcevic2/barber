const { google } = require('googleapis');

class CalendarService {
  constructor() {
    this.oAuth2Client = null;
    this.calendar = null;
  }

  // Postavi OAuth klijenta
  setAuthClient(oAuth2Client) {
    this.oAuth2Client = oAuth2Client;
    this.calendar = google.calendar({ version: 'v3', auth: this.oAuth2Client });
  }

  // Dodaj termin u Google Calendar
  async createAppointmentEvent(appointment) {
    try {
      if (!this.oAuth2Client) {
        console.log('ℹ️  Google Calendar nije autentificiran');
        return { success: false, error: 'Google Calendar nije autentificiran' };
      }

      const event = {
        summary: `Barber Shop - ${appointment.service.name}`,
        description: `Klijent: ${appointment.customerName}\nTelefon: ${appointment.customerPhone}\nEmail: ${appointment.customerEmail}\nUsluga: ${appointment.service.name}\nTrajanje: ${appointment.service.duration} minuta\nCijena: ${appointment.service.price}€${appointment.notes ? `\nNapomene: ${appointment.notes}` : ''}`,
        start: {
          dateTime: appointment.date,
          timeZone: 'Europe/Sarajevo',
        },
        end: {
          dateTime: new Date(new Date(appointment.date).getTime() + appointment.service.duration * 60000),
          timeZone: 'Europe/Sarajevo',
        },
        attendees: [
          { email: appointment.customerEmail, displayName: appointment.customerName },
          { email: process.env.EMAIL_USER, displayName: 'Barber Shop' }
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 1 dan prije
            { method: 'popup', minutes: 60 }, // 1 sat prije
          ],
        },
      };

      const response = await this.calendar.events.insert({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        resource: event,
        sendUpdates: 'all',
      });

      console.log('✅ Termin dodan u Google Calendar:', response.data.htmlLink);
      return {
        success: true,
        eventId: response.data.id,
        eventLink: response.data.htmlLink
      };
    } catch (error) {
      console.error('❌ Greška pri dodavanju termina u Google Calendar:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Ažuriraj termin u Google Calendaru
  async updateAppointmentEvent(eventId, appointment) {
    try {
      if (!this.oAuth2Client) {
        return { success: false, error: 'Google Calendar nije autentificiran' };
      }

      const event = {
        summary: `Barber Shop - ${appointment.service.name}`,
        description: `Klijent: ${appointment.customerName}\nTelefon: ${appointment.customerPhone}\nEmail: ${appointment.customerEmail}\nUsluga: ${appointment.service.name}\nTrajanje: ${appointment.service.duration} minuta\nCijena: ${appointment.service.price}€${appointment.notes ? `\nNapomene: ${appointment.notes}` : ''}`,
        start: {
          dateTime: appointment.date,
          timeZone: 'Europe/Sarajevo',
        },
        end: {
          dateTime: new Date(new Date(appointment.date).getTime() + appointment.service.duration * 60000),
          timeZone: 'Europe/Sarajevo',
        },
      };

      const response = await this.calendar.events.update({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        eventId: eventId,
        resource: event,
        sendUpdates: 'all',
      });

      console.log('✅ Termin ažuriran u Google Calendaru');
      return { success: true };
    } catch (error) {
      console.error('❌ Greška pri ažuriranju termina u Google Calendaru:', error);
      return { success: false, error: error.message };
    }
  }

  // Obriši termin iz Google Calendara
  async deleteAppointmentEvent(eventId) {
    try {
      if (!this.oAuth2Client) {
        return { success: false, error: 'Google Calendar nije autentificiran' };
      }

      await this.calendar.events.delete({
        calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
        eventId: eventId,
        sendUpdates: 'all',
      });

      console.log('✅ Termin obrisan iz Google Calendara');
      return { success: true };
    } catch (error) {
      console.error('❌ Greška pri brisanju termina iz Google Calendara:', error);
      return { success: false, error: error.message };
    }
  }

  // Provjeri da li je kalendar autentificiran
  isAuthenticated() {
    return this.oAuth2Client !== null;
  }
}

module.exports = new CalendarService();