const mongoose = require('mongoose');
const Service = require('./models/Service');
const WorkingHours = require('./models/WorkingHours');
require('dotenv').config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/barber-booking');
    
    // Obriši postojeće podatke
    await Service.deleteMany({});
    await WorkingHours.deleteMany({});
    
    // Dodaj usluge
    const services = await Service.insertMany([
      {
        name: 'Šišanje',
        duration: 30,
        price: 50,
        description: 'Osnovno šišanje'
      },
      {
        name: 'Brijanje',
        duration: 20,
        price: 30,
        description: 'Brijanje mašinicom ili žiletom'
      },
      {
        name: 'Šišanje i brijanje',
        duration: 50,
        price: 70,
        description: 'Komplet usluga'
      }
    ]);
    
    // Dodaj radno vrijeme
    const workingHours = await WorkingHours.insertMany([
      { dayOfWeek: 1, dayName: 'Ponedjeljak', startTime: '09:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 2, dayName: 'Utorak', startTime: '09:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 3, dayName: 'Srijeda', startTime: '09:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 4, dayName: 'Četvrtak', startTime: '09:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 5, dayName: 'Petak', startTime: '09:00', endTime: '17:00', isWorking: true },
      { dayOfWeek: 6, dayName: 'Subota', startTime: '10:00', endTime: '15:00', isWorking: true },
      { dayOfWeek: 0, dayName: 'Nedjelja', startTime: '00:00', endTime: '00:00', isWorking: false }
    ]);
    
    console.log('✅ Podaci uspješno dodani!');
    console.log('Usluge:', services.length);
    console.log('Radni dani:', workingHours.length);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Greška pri dodavanju podataka:', error);
    process.exit(1);
  }
};

seedData();