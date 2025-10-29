# 🔄 Napredni Sistem Otkazivanja/Promjene Termina

## ✅ Implementirano

### 1. **Cancellation Reason Dropdown** 
- ✅ 5 predefiniranih razloga:
  - 🤒 **Bolest**
  - 🚨 **Hitno / Nepredviđeno**
  - 📅 **Zauzet / Obaveze**
  - ❌ **Greška pri rezervaciji**
  - 💬 **Ostalo**
- ✅ Dropdown umjesto textarea polja
- ✅ Dodatno polje za napomenu (opciono)
- ✅ Pohranjivanje u bazu (cancellationReason, cancellationNote, cancelledAt)

### 2. **Reschedule Option**
- ✅ Tri ekrana:
  - **Choice** - Odabir između otkazivanja i promjene
  - **Cancel** - Forma za otkazivanje sa razlogom
  - **Reschedule** - Kalendar + izbor termina
- ✅ Integracija sa CustomCalendar komponentom
- ✅ Prikaz dostupnih termina (API poziv)
- ✅ Validacija zauzetih termina
- ✅ Blokiranje prošlih datuma i blokiranih dana

### 3. **Configurable Time Limits**
- ✅ Settings model sa poljima:
  - `cancellationTimeLimit` - minimalno sati prije za otkazivanje (default: 2h)
  - `allowReschedule` - omogući/onemogući promjenu termina (default: true)
  - `rescheduleTimeLimit` - minimalno sati prije za promjenu (default: 2h)
- ✅ Admin može podesiti preko Settings API
- ✅ Validacija na backend-u i frontend-u
- ✅ Dinamički prikaz poruka sa konfigurisanim limitom

---

## 📂 Kreirani/Ažurirani Fajlovi

### Backend

#### 1. **server/models/Settings.js** (NOVO)
```javascript
// Singleton pattern za globalne postavke
// Polja:
// - cancellationTimeLimit: Number (default: 2)
// - allowReschedule: Boolean (default: true)
// - rescheduleTimeLimit: Number (default: 2)
// - businessName, businessPhone, businessAddress
// - googleReviewUrl
```

#### 2. **server/models/Appointment.js** (AŽURIRANO)
```javascript
// Dodana polja:
// - cancellationReason: { type: String, enum: ['illness', 'emergency', 'schedule_conflict', 'mistake', 'other'] }
// - cancellationNote: String
// - cancelledAt: Date
// - rescheduledFrom: Date
```

#### 3. **server/routes/settings.js** (NOVO)
```javascript
// GET /api/settings - dohvati postavke
// PUT /api/settings - ažuriraj postavke (security: allowedFields)
```

#### 4. **server/routes/appointments.js** (AŽURIRANO)
```javascript
// NOVI ENDPOINTI:

// GET /api/appointments/by-token/:token
// - Dohvaća appointment po cancellation tokenu
// - Za inicijalni load podataka u CancelAppointment komponenti

// POST /api/appointments/cancel/:token (AŽURIRANO)
// - Prima: { reason, note }
// - Validira timeLimit iz Settings
// - Sprema cancellationReason, cancellationNote, cancelledAt
// - Šalje email + SMS notifikaciju
// - Briše iz Google Calendara

// POST /api/appointments/reschedule/:token (NOVO)
// - Prima: { newDate }
// - Validira timeLimit iz Settings
// - Provjerava allowReschedule flag
// - Provjerava zauzeće novog termina
// - Sprema rescheduledFrom
// - Ažurira Google Calendar
// - Šalje email potvrdu
```

#### 5. **server/server.js** (AŽURIRANO)
```javascript
// Dodan route:
app.use('/api/settings', require('./routes/settings'));
```

### Frontend

#### 1. **client/src/components/CancelAppointment.jsx** (POTPUNO NOVO)
```javascript
// Stanja:
// - mode: 'choice' | 'cancel' | 'reschedule'
// - cancellationReason, cancellationNote
// - newDate, selectedTime, availableSlots
// - settings (iz API-ja)

// Funkcije:
// - fetchSettings() - dohvat Settings iz API-ja
// - fetchAppointment() - po tokenu
// - fetchAvailableSlots() - za reschedule kalendar
// - canCancelOrReschedule() - validacija sa timeLimit
// - handleCancel() - POST /api/appointments/cancel/:token
// - handleReschedule() - POST /api/appointments/reschedule/:token

// 3 UI ekrana:
// 1. Choice - Prikaz detalja + 3 opcije (Reschedule/Cancel/Keep)
// 2. Cancel - Dropdown razloga + textarea napomene
// 3. Reschedule - CustomCalendar + time slot picker
```

---

## 🔧 Kako koristiti

### Korisnik (Public)

1. Korisnik prima email sa linkovima za otkazivanje
2. Klik na link otvara CancelAppointment stranicu
3. Korisnik vidi 3 opcije:
   - **Promijeni termin** (ako je `allowReschedule: true`)
   - **Otkaži termin**
   - **Zadrži termin** (nazad na početnu)

#### Ako odabere Otkazivanje:
1. Selektuje razlog iz dropdowna (obavezno)
2. Unosi dodatnu napomenu (opciono)
3. Potvrđuje otkazivanje
4. Prima email potvrdu

#### Ako odabere Promjenu:
1. Vidi kalendar sa blokiranih datumima
2. Bira novi datum
3. Bira slobodni termin iz liste
4. Potvrđuje novu rezervaciju
5. Prima email potvrdu sa novim terminom

### Admin (Postavke)

**Trenutno:** Settings API postoji, ali nema UI u admin panelu.

**Planirana funkcionalnost:**
- Admin panel → Settings tab
- Forma za podešavanje:
  - Cancellation time limit (u satima)
  - Enable/disable reschedule
  - Reschedule time limit (u satima)
  - Business info (name, phone, address)
  - Google review URL

---

## 🚀 Sledeći Koraci

### 1. SettingsManagement Component (Admin UI)
```javascript
// TODO: Kreirati server/client/src/components/SettingsManagement.jsx
// - Forma za sve Settings polja
// - PUT /api/settings endpoint za save
// - Validacija (npr. timeLimit minimum 1h, maximum 72h)
```

### 2. Dodati Settings Tab u AdminDashboard
```javascript
// TODO: Ažurirati AdminDashboard.jsx
// - Dodati "⚙️ Postavke" tab
// - Renderovati <SettingsManagement />
```

### 3. CSS za Reschedule Screen
```css
/* TODO: Ažurirati CancelAppointment.css */
/* - reschedule-container styling */
/* - calendar-wrapper layout */
/* - slots-grid responsive design */
/* - choice-buttons styling */
```

### 4. Email Template za Reschedule
```javascript
// TODO: Dodati u emailService.js
// sendAppointmentReschedule(appointment, oldDate)
// - Template sa starim i novim terminom
// - Tracking pixel
```

### 5. Testiranje

**Manual Test Checklist:**
- [ ] Cancel sa svakim razlogom (5 opcija)
- [ ] Cancel sa i bez napomene
- [ ] Cancel < 2h prije (should fail)
- [ ] Reschedule sa dostupnim terminom
- [ ] Reschedule sa zauzetim terminom (should fail)
- [ ] Reschedule < 2h prije (should fail)
- [ ] Reschedule kada je disabled (should hide button)
- [ ] Email potvrde za cancel i reschedule
- [ ] Admin notifikacije preko socket.io
- [ ] Google Calendar sync (delete + update)

---

## 📊 Analitika

### Podaci koji se sada prikupljaju:

1. **Razlozi otkazivanja:**
   - illness
   - emergency
   - schedule_conflict
   - mistake
   - other

2. **Dodatni insights:**
   - `cancelledAt` timestamp
   - `cancellationNote` detalji
   - `rescheduledFrom` tracking

### Moguće analitike:
- Broj otkazivanja po razlogu (pie chart)
- Najčešći razlog otkazivanja
- Postotak reschedule vs cancel
- Average hours before cancellation
- Peak cancellation times/days

---

## 🔐 Security

### Implementirano:
- ✅ Cancellation token (32-byte random hex)
- ✅ Token validacija na svim endpointima
- ✅ Status check (samo pending/confirmed mogu biti cancelled)
- ✅ Time limit validacija (minimum X hours before)
- ✅ Conflict detection za reschedule
- ✅ allowedFields whitelist u Settings PUT endpoint

### Best Practices:
- Token je jedinstven po appointmentu
- Token se ne može ponovno koristiti nakon cancellacije
- Rate limiting bi trebao biti dodan (TODO)

---

## 🎯 User Experience Improvements

### Prije:
- Jednostavno textarea polje za razlog
- Samo opcija za otkazivanje
- Fiksirano 2h pravilo
- Nema mogućnosti promjene

### Sada:
- Strukturiran dropdown sa emojima
- Opcija za reschedule ili cancel
- Konfigurisano vrijeme (admin kontrola)
- Full calendar UI za promjenu
- Real-time prikaz dostupnih termina
- Email potvrde za sve akcije

---

## 📝 Database Schema Update

```javascript
// Appointment model - Nova polja:
{
  cancellationReason: {
    type: String,
    enum: ['illness', 'emergency', 'schedule_conflict', 'mistake', 'other']
  },
  cancellationNote: String,
  cancelledAt: Date,
  rescheduledFrom: Date
}

// Settings model - Sva polja:
{
  cancellationTimeLimit: { type: Number, default: 2 },
  allowReschedule: { type: Boolean, default: true },
  rescheduleTimeLimit: { type: Number, default: 2 },
  businessName: String,
  businessPhone: String,
  businessAddress: String,
  googleReviewUrl: String
}
```

---

## 🐛 Known Issues / TODO

1. **Settings Admin UI** - Nije kreiran
2. **CSS za reschedule** - Inline JSX, treba ekstraktovati u CSS fajl
3. **Rate limiting** - Nema zaštite od brute force
4. **Email template** - Reschedule email koristi confirmation template (treba custom)
5. **Loading states** - Može se dodati skeleton loader
6. **Error handling** - Trenutno alert(), može se koristiti toast
7. **Mobile responsive** - Calendar i time slots treba testirati

---

## 📚 API Documentation

### GET /api/appointments/by-token/:token
**Response:**
```json
{
  "_id": "...",
  "customerName": "Ime Prezime",
  "customerEmail": "email@example.com",
  "service": { "name": "Muško šišanje", "price": 10 },
  "date": "2025-01-15T10:00:00.000Z",
  "status": "confirmed",
  "cancellationToken": "abc123..."
}
```

### POST /api/appointments/cancel/:token
**Body:**
```json
{
  "reason": "illness",
  "note": "Prehladio sam se"
}
```
**Response:**
```json
{
  "message": "Termin uspješno otkazan",
  "appointment": { ... }
}
```

### POST /api/appointments/reschedule/:token
**Body:**
```json
{
  "newDate": "2025-01-16T14:00:00.000Z"
}
```
**Response:**
```json
{
  "message": "Termin uspješno promijenjen",
  "appointment": { ... }
}
```

### GET /api/settings
**Response:**
```json
{
  "cancellationTimeLimit": 2,
  "allowReschedule": true,
  "rescheduleTimeLimit": 2,
  "businessName": "Frizerski Salon Jimmy",
  "googleReviewUrl": "https://g.page/..."
}
```

### PUT /api/settings
**Body:**
```json
{
  "cancellationTimeLimit": 4,
  "allowReschedule": false
}
```
**Response:**
```json
{
  "cancellationTimeLimit": 4,
  "allowReschedule": false,
  ...
}
```

---

## 🎉 Summary

Sistem naprednog otkazivanja/promjene termina je uspješno implementiran sa svim traženim funkcionalnostima:

1. ✅ **Cancellation Reason** - Dropdown sa 5 opcija + napomena
2. ✅ **Reschedule Option** - Full calendar UI sa time slot picker
3. ✅ **Configurable Limits** - Admin može podesiti preko Settings API

Backend i frontend su potpuno integrisani. Potrebno je samo dodati Settings UI u admin panel i dodatni CSS styling.
