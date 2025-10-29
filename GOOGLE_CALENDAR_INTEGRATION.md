# Google Calendar Integracija - Dokumentacija

## ✅ Implementirane Features

### 1. **Spremanje Tokena u MongoDB**
- **Model**: `GoogleToken.js` (models/)
- Polja: `access_token`, `refresh_token`, `scope`, `token_type`, `expiry_date`
- Singleton pattern sa `getToken()` i `setToken(tokens)` helper metodama
- Tokeni se čuvaju u bazi umjesto u memoriji
- **Benefit**: Tokeni ne nestaju nakon restarta servera

### 2. **Toggle On/Off za Integraciju**
- **Settings Model**: Dodano `googleCalendarEnabled` polje (default: `false`)
- Admin može uključiti/isključiti integraciju bez brisanja tokena
- Tokeni ostaju spremljeni i mogu se ponovo aktivirati
- **API Endpoint**: `POST /api/auth/google/toggle`
  ```json
  { "enabled": true/false }
  ```

### 3. **Two-Way Sync preko Webhooks**
- **Webhook Endpoint**: `POST /api/auth/google/webhook`
- Google Calendar šalje notifikacije o promjenama
- Automatski sync događaja (updated/cancelled) sa lokalnim terminima
- Koristi `googleCalendarEventId` za mapiranje
- Sinkronizuje promjene datuma i otkazivanja

---

## 📁 Izmijenjeni Fajlovi

### Backend
1. **models/GoogleToken.js** (NOVI)
   - MongoDB model za OAuth tokene
   - Singleton methods za read/write

2. **models/Settings.js**
   - Added: `googleCalendarEnabled: Boolean`

3. **routes/googleAuth.js**
   - `/callback`: Sprema tokene u DB umjesto memorije
   - `/status`: Vraća `{ authenticated, hasTokens, enabled }`
   - `/toggle` (NEW): Enable/disable integraciju
   - `/disconnect`: Opcionalno briše tokene (`?wipe=true`)
   - `/webhook` (NEW): Webhook handler za two-way sync

4. **routes/settings.js**
   - Dopušta update `googleCalendarEnabled` polja

5. **routes/appointments.js**
   - Provjerava `settings.googleCalendarEnabled` prije poziva `calendarService`
   - Primjenjeno na: create, update, cancel, reschedule, delete

6. **server.js**
   - Na startup učitava tokene iz DB
   - Inicijalizuje `calendarService` sa OAuth clientom ako tokeni postoje

### Frontend
7. **components/GoogleCalendarSettings.jsx**
   - Prikazuje 3 statusa: `authenticated`, `hasTokens`, `enabled`
   - Toggle dugme za uključi/isključi (dok su tokeni spremljeni)
   - Disconnect dugme (briše tokene)
   - Prikazuje webhook info

---

## 🔄 Kako Funkcionira

### Initial Setup (Povezivanje)
```
1. Admin → "Poveži Google Calendar" → Otvara OAuth flow
2. Korisnik odobri pristup → Google vraća tokene
3. Tokeni se spremaju u MongoDB (GoogleToken kolekcija)
4. calendarService.setAuthClient() inicijalizuje OAuth klijenta
5. Status: authenticated=true, hasTokens=true, enabled=false (default)
```

### Enabling Integration
```
1. Admin → Toggle "Uključi"
2. Frontend šalje POST /api/auth/google/toggle { enabled: true }
3. Settings.googleCalendarEnabled se postavlja na true
4. Od sada se svi termini sync-uju sa Google Calendar
```

### Disabling (bez brisanja tokena)
```
1. Admin → Toggle "Isključi"
2. googleCalendarEnabled = false
3. Tokeni ostaju u bazi, ali se ne koriste
4. Kasnije se može ponovo uključiti
```

### Disconnect (brisanje tokena)
```
1. Admin → "Odspoji Google Calendar"
2. Briše in-memory auth client
3. Tokeni ostaju u DB (osim ako se ne doda ?wipe=true)
4. Za potpuno brisanje: POST /disconnect?wipe=true
```

### Server Restart
```
1. MongoDB connect
2. Učitaj tokene iz GoogleToken kolekcije
3. Ako postoje → inicijalizuj OAuth client
4. calendarService.setAuthClient(oauth2Client)
5. ✅ Integracija radi odmah nakon restarta
```

### Two-Way Sync (Webhook)
```
Google Calendar promjene → POST /webhook → Provjeri events → Sync sa DB

Primjer:
- Admin briše termin u Google Calendaru
- Google šalje webhook notifikaciju
- Webhook handler pronalazi termin po googleCalendarEventId
- Postavlja status='cancelled' u lokalnoj bazi
- ✅ Sinkronizovano
```

---

## 🛠️ Setup za Webhooks (Opcionalno)

Za aktiviranje two-way sync-a potrebno je:

1. **Push Notifications Setup**
   ```javascript
   // U calendarService.js dodati watch channel registration
   const watchChannel = await calendar.events.watch({
     calendarId: 'primary',
     requestBody: {
       id: 'unique-channel-id',
       type: 'web_hook',
       address: 'https://your-domain.com/api/auth/google/webhook'
     }
   });
   ```

2. **Public URL**
   - Google mora moći pristupiti webhook endpointu
   - U dev: koristiti ngrok ili slično
   - U production: Render.com automatski exposed

3. **Token Refresh**
   - Ako `expiry_date` prođe, refresh `access_token` sa `refresh_token`
   - Automatski update tokena u DB

---

## 🎯 API Endpoints Summary

| Method | Endpoint | Opis |
|--------|----------|------|
| GET | `/api/auth/google` | Generiše OAuth URL |
| GET | `/api/auth/google/callback` | OAuth redirect handler |
| GET | `/api/auth/google/status` | Vraća auth/tokens/enabled status |
| POST | `/api/auth/google/toggle` | Uključi/isključi integraciju |
| POST | `/api/auth/google/disconnect` | Odspoji (opcionalno ?wipe=true) |
| POST | `/api/auth/google/webhook` | Google webhook za sync |

---

## 📊 Database Schema

### GoogleToken Collection
```javascript
{
  _id: ObjectId,
  access_token: String,
  refresh_token: String,
  scope: String,
  token_type: String,
  expiry_date: Number, // Unix timestamp
  createdAt: Date,
  updatedAt: Date
}
```

### Settings (extended)
```javascript
{
  // ... existing fields
  googleCalendarEnabled: Boolean (default: false)
}
```

---

## 🧪 Testing

1. **Connect Flow**
   ```bash
   # Admin panel → Google Calendar tab → Poveži
   # Verify: Status shows "Povezan"
   # Verify: MongoDB has token in GoogleToken collection
   ```

2. **Toggle On**
   ```bash
   # Toggle "Uključi"
   # Create appointment
   # Check Google Calendar → termin se pojavljuje
   ```

3. **Toggle Off**
   ```bash
   # Toggle "Isključi"
   # Create appointment
   # Check Google Calendar → termin se NE pojavljuje
   # Tokens still in DB
   ```

4. **Server Restart**
   ```bash
   npm run dev
   # Check logs: "✅ Google Calendar auth initialized from DB tokens"
   # Integration works immediately
   ```

5. **Webhook Sync**
   ```bash
   # U Google Calendaru: Otkaži termin
   # Webhook endpoint primi notifikaciju
   # Termin u bazi: status='cancelled'
   ```

---

## 🔐 Environment Variables

```env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
GOOGLE_CALENDAR_ID=primary
```

---

## ✅ Checklist

- [x] Tokeni spremljeni u MongoDB (GoogleToken model)
- [x] Toggle on/off bez brisanja tokena (Settings.googleCalendarEnabled)
- [x] Two-way sync webhook endpoint
- [x] Server restart učitava tokene iz DB
- [x] Admin UI prikazuje 3 statusa (auth, tokens, enabled)
- [x] Svi calendar operacije gate-ovane sa `googleCalendarEnabled` check
- [x] Disconnect opcionalno briše tokene (?wipe=true)

---

## 🚀 Production Deployment

1. Postavi env varijable na Render.com
2. MongoDB Atlas automatski dostupan
3. Google OAuth Redirect URI: `https://your-app.onrender.com/api/auth/google/callback`
4. Webhook URL: `https://your-app.onrender.com/api/auth/google/webhook`
5. Admin prvi put conectuje calendar
6. Toggle "Uključi" → Sync aktiviran
7. ✅ Radi!

