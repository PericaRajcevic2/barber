# 📧 Email Automation - Implementacija

## ✅ Što je implementirano

### 1. **Email Template Functions**

#### Reminder Email (24h prije termina)
- **Funkcija:** `sendAppointmentReminder(appointment)`
- **Lokacija:** `server/utils/emailService.js`
- **Features:**
  - ✨ Dinamični sadržaj baziran na tipu usluge (šišanje, brada, ostalo)
  - 🎨 Različiti emoji i poruke za različite usluge
  - 📅 Prikaz detalja termina (datum, vrijeme, cijena)
  - ❌ Link za otkazivanje termina (ako postoji cancellationToken)
  - 📊 Tracking pixel za praćenje otvaranja

#### Follow-Up Email (1 dan nakon termina)
- **Funkcija:** `sendFollowUpEmail(appointment)`
- **Lokacija:** `server/utils/emailService.js`
- **Features:**
  - ⭐ Google Review link s trackingom
  - 📅 Poziv na akciju za zakazivanje sljedećeg termina
  - 💡 Poziv na feedback i prijedloge
  - 📊 Tracking pixel za praćenje otvaranja

---

### 2. **Email Scheduler (Cron Jobs)**

**Lokacija:** `server/scheduler.js`

#### Job 1: Reminder Emails
- **Schedule:** Svaki sat (`0 * * * *`)
- **Logika:**
  - Pronalazi termine koji su za 23-25h (±1h tolerancija)
  - Status: `pending` ili `confirmed`
  - Provjerava da reminder nije već poslan
  - Šalje reminder email
  - Ažurira `reminderSent: true` i `reminderSentAt`

#### Job 2: Follow-Up Emails
- **Schedule:** Svaki sat (`0 * * * *`)
- **Logika:**
  - Pronalazi termine koji su završeni prije 23-25h
  - Status: `completed`
  - Provjerava da follow-up nije već poslan
  - Šalje follow-up email
  - Ažurira `followUpSent: true` i `followUpSentAt`

**Pokretanje:** Automatski se pokreće u `server.js` nakon MongoDB connection

---

### 3. **Database Model - Email Tracking**

**Lokacija:** `server/models/Appointment.js`

Dodana polja:

```javascript
reminderSent: Boolean          // Da li je reminder poslan
reminderSentAt: Date           // Kada je reminder poslan
followUpSent: Boolean          // Da li je follow-up poslan
followUpSentAt: Date           // Kada je follow-up poslan

emailTracking: {
  reminderOpened: Boolean      // Da li je reminder otvoren
  reminderOpenedAt: Date       // Kada je reminder otvoren
  followUpOpened: Boolean      // Da li je follow-up otvoren
  followUpOpenedAt: Date       // Kada je follow-up otvoren
  reviewLinkClicked: Boolean   // Da li je review link kliknut
  reviewLinkClickedAt: Date    // Kada je review link kliknut
}
```

---

### 4. **Email Tracking Endpoints**

**Lokacija:** `server/routes/appointments.js`

#### GET `/api/appointments/track/:id/:type`
- **Tracking Pixel:** 1x1 transparentni GIF
- **Type:** `reminder` ili `followup`
- **Funkcija:** Bilježi otvaranje emaila
- **Response:** Transparentni pixel

#### GET `/api/appointments/track/:id/review-click`
- **Funkcija:** Bilježi klik na review link
- **Response:** Redirect na Google Review URL

#### PUT `/api/appointments/:id/send-followup`
- **Funkcija:** Ručno slanje follow-up emaila iz admin panela
- **Accessible:** Samo admin
- **Features:**
  - Ažurira `followUpSent` i `followUpSentAt`
  - Vraća success/error message

---

### 5. **Admin UI - Email Management**

**Lokacija:** `server/client/src/components/AppointmentsManagement.jsx`

#### Email Status Display
- 📧 Vizualni prikaz email statusa u terminu:
  - ⏰ Reminder poslan + datum
  - ✓ Da li je otvoren
  - ⭐ Follow-up poslan + datum
  - ✓ Da li je otvoren
  - ⭐ Da li je review link kliknut

#### Manual Follow-Up Button
- 📧 Dugme "Pošalji Follow-Up"
- Prikazuje se samo za termine sa statusom `completed`
- Omogućava ručno slanje follow-up emaila
- Potvrda prije slanja

---

## 🎨 Dynamic Templates - Primjeri

### Šišanje
- Emoji: 💇‍♂️
- Poruka: "Spremite se za novu frizuru!"

### Brada
- Emoji: 🧔
- Poruka: "Vrijeme je za osvježavanje!"

### Ostale usluge
- Emoji: ✂️
- Poruka: "Vaš termin se približava!"

---

## ⚙️ Environment Variables

Dodaj u `.env`:

```bash
# Email configuration (već postoji)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# App URL za linkove
APP_URL=http://localhost:5000

# Google Review URL
GOOGLE_REVIEW_URL=https://g.page/r/YOUR_BUSINESS_ID/review
```

---

## 🚀 Kako testirati

### 1. Test Reminder Email

#### Opcija A: Ručno testiranje
```javascript
// U node REPL ili test skripti
const { sendAppointmentReminder } = require('./utils/emailService');
const Appointment = require('./models/Appointment');

const appointment = await Appointment.findById('YOUR_APPOINTMENT_ID').populate('service');
await sendAppointmentReminder(appointment);
```

#### Opcija B: Kreiranje test termina za sutra
```javascript
// Koristi create-test-appointment.js ili ručno kreiraj termin za sutra
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(14, 0, 0, 0); // 14:00 sutra
```

### 2. Test Follow-Up Email

#### Opcija A: Iz admin panela
1. Postavi termin na status `completed`
2. Klikni dugme "📧 Pošalji Follow-Up"

#### Opcija B: Ručno
```javascript
const { sendFollowUpEmail } = require('./utils/emailService');
await sendFollowUpEmail(appointment);
```

### 3. Test Email Tracking

1. Otvori poslani email
2. Provjeri u admin panelu da li je označen kao otvoren
3. Klikni na "Ostavite Google recenziju"
4. Provjeri da li je review link označen kao kliknut

---

## 📊 Monitoring

### Console Logs

Scheduler loguje:
```
🔍 Provjeravam termine za reminder emailove...
📧 Pronađeno X termina za reminder
✅ Reminder poslan za termin 123abc
```

Email service loguje:
```
✅ Reminder email poslan korisniku: user@example.com
✅ Follow-up email poslan korisniku: user@example.com
```

Tracking loguje:
```
📧 Reminder email otvoren za termin 123abc
⭐ Review link kliknut za termin 123abc
```

---

## 🛠️ Troubleshooting

### Emailovi se ne šalju automatski
1. Provjeri da je server pokrenut
2. Provjeri da je scheduler pokrenut (vidi console log)
3. Provjeri da termini imaju točne datume
4. Provjeri EMAIL_USER i EMAIL_PASS u .env

### Tracking ne radi
1. Provjeri APP_URL u .env
2. Provjeri da su emaili poslani sa tracking pixelom
3. Provjeri browser console za greške pri učitavanju pixela

### Follow-up dugme ne radi
1. Provjeri da je termin status `completed`
2. Provjeri console za greške
3. Provjeri da endpoint `/api/appointments/:id/send-followup` postoji

---

## 📝 Sljedeći koraci (opciono)

1. **Email Analytics Dashboard:**
   - Chart: Open rate over time
   - Top 5 usluga s najviše review klikova
   - Conversion rate (reminder → completed)

2. **Email Templates Editor:**
   - Admin UI za uređivanje email template-a
   - Preview prije slanja
   - A/B testing različitih poruka

3. **Advanced Tracking:**
   - Integracija sa SendGrid/Mailgun za detaljnije tracking
   - Click tracking na sve linkove u emailu
   - Bounce rate i delivery tracking

4. **SMS Reminders:**
   - Alternative/dodatak email reminderima
   - Integracija sa Twilio/SMS providerom

---

## ✅ Checklist - Prije deploya

- [ ] EMAIL_USER i EMAIL_PASS postavljeni u production .env
- [ ] APP_URL postavljen na production domenu
- [ ] GOOGLE_REVIEW_URL postavljen na pravi Google review link
- [ ] Testirani reminder emailovi (24h prije)
- [ ] Testirani follow-up emailovi (nakon termina)
- [ ] Testirano ručno slanje follow-up emaila
- [ ] Testirano email tracking (open/click)
- [ ] Provjereno da scheduler radi u production environmentu
- [ ] Provjereno da cron job ne duplicira emailove

---

**Datum implementacije:** ${new Date().toLocaleDateString('hr-HR')}
**Developer:** GitHub Copilot + Pero
