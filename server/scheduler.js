const cron = require('node-cron');
const Appointment = require('./models/Appointment');
const { sendAppointmentReminder, sendFollowUpEmail, sendDailyDigest } = require('./utils/emailService');

// Pokreni sve cron jobove
const startScheduler = () => {
  console.log('⏰ Pokretanje email schedulera...');

  // JOB 1: Reminder emailovi - provjerava svaki sat
  // Traži termine koji su za 24h (±1h radi tolerancije)
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('🔍 Provjeravam termine za reminder emailove...');
      
      const now = new Date();
      const in23Hours = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      // Pronađi termine koji su za ~24h i nisu otkazani i nisu dobili reminder
      const appointments = await Appointment.find({
        date: { $gte: in23Hours, $lte: in25Hours },
        status: { $in: ['pending', 'confirmed'] },
        reminderSent: { $ne: true }
      }).populate('service');

      console.log(`📧 Pronađeno ${appointments.length} termina za reminder`);

      for (const appointment of appointments) {
        const success = await sendAppointmentReminder(appointment);
        
        if (success) {
          appointment.reminderSent = true;
          appointment.reminderSentAt = new Date();
          await appointment.save();
          console.log(`✅ Reminder poslan za termin ${appointment._id}`);
        }
      }
    } catch (error) {
      console.error('❌ Greška u reminder cron jobu:', error);
    }
  });

  // JOB 2: Follow-up emailovi - provjerava svaki sat
  // Traži termine koji su završeni prije 23-25h
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('🔍 Provjeravam termine za follow-up emailove...');
      
      const now = new Date();
      const ago23Hours = new Date(now.getTime() - 23 * 60 * 60 * 1000);
      const ago25Hours = new Date(now.getTime() - 25 * 60 * 60 * 1000);

      // Pronađi termine koji su završeni prije ~24h i nisu dobili follow-up
      const appointments = await Appointment.find({
        date: { $gte: ago25Hours, $lte: ago23Hours },
        status: 'completed',
        followUpSent: { $ne: true }
      }).populate('service');

      console.log(`📧 Pronađeno ${appointments.length} termina za follow-up`);

      for (const appointment of appointments) {
        const success = await sendFollowUpEmail(appointment);
        
        if (success) {
          appointment.followUpSent = true;
          appointment.followUpSentAt = new Date();
          await appointment.save();
          console.log(`✅ Follow-up poslan za termin ${appointment._id}`);
        }
      }
    } catch (error) {
      console.error('❌ Greška u follow-up cron jobu:', error);
    }
  });

  console.log('✅ Email scheduler pokrenut:');
  console.log('   - Reminder emailovi: svaki sat (24h prije termina)');
  console.log('   - Follow-up emailovi: svaki sat (24h nakon termina)');

  // JOB 3: Dnevni sažetak termina - prema rasporedu (default 07:00 lokalno)
  const digestEnabled = (process.env.DIGEST_ENABLED || 'true').toLowerCase() !== 'false';
  if (digestEnabled) {
    const cronExpr = process.env.DIGEST_CRON || '0 7 * * *';
    cron.schedule(cronExpr, async () => {
      try {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

        const todays = await Appointment.find({
          date: { $gte: start, $lte: end },
          status: { $in: ['pending', 'confirmed', 'completed'] }
        }).populate('service').sort({ date: 1 });

        await sendDailyDigest({ date: start, appointments: todays });
      } catch (error) {
        console.error('❌ Greška u dnevnom sažetku:', error);
      }
    });
    console.log(`   - Dnevni sažetak: ${process.env.DIGEST_CRON || '07:00 svakog dana'}`);
  } else {
    console.log('   - Dnevni sažetak: ISKLJUČEN');
  }
};

module.exports = { startScheduler };
