# 🚀 Deploy Guide - Barber Booking App

## 📋 Preduslovi
- MongoDB Atlas account
- Render.com account
- GitHub account (optional ali preporučeno)

---

## 1️⃣ MONGODB ATLAS SETUP

### Kreiraj Cluster:
1. Idi na https://www.mongodb.com/cloud/atlas
2. Registruj se / Login
3. Klikni **"Build a Database"**
4. Izaberi **FREE tier (M0 Sandbox)**
5. Region: **Frankfurt** (za Evropu)
6. Ime clustera: npr. `BarberCluster`
7. Klikni **"Create Cluster"** (traje 3-5 min)

### Kreiraj Database User:
1. Lijeva strana → **Security** → **Database Access**
2. Klikni **"Add New Database User"**
3. **Username**: npr. `barber_admin`
4. **Password**: kreiraj jak password (SAČUVAJ GA!)
   - Kopiraj password odmah negdje sigurno
5. **Database User Privileges**: `Read and write to any database`
6. Klikni **"Add User"**

### Dozvoli Network Access:
1. Lijeva strana → **Security** → **Network Access**
2. Klikni **"Add IP Address"**
3. Klikni **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Ovo je potrebno jer Render ima dinamičke IP adrese
4. Klikni **"Confirm"**

### Uzmi Connection String:
1. Lijeva strana → **Database** → **Clusters**
2. Klikni **"Connect"** pored svog clustera
3. Izaberi **"Connect your application"**
4. Driver: **Node.js**
5. Version: **5.5 or later**
6. **Kopiraj connection string**:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
7. **ZAMIJENI** `<username>` i `<password>` sa stvarnim kredencijalima
8. **DODAJ** ime baze između `.net/` i `?`:
   ```
   mongodb+srv://barber_admin:tvoj_password@cluster0.xxxxx.mongodb.net/barber-booking?retryWrites=true&w=majority
   ```

---

## 2️⃣ PRIPREMI PROJEKAT

### Kreiraj `.env` file u `server/` folderu:
```env
# MongoDB
MONGODB_URI=mongodb+srv://barber_admin:tvoj_password@cluster0.xxxxx.mongodb.net/barber-booking?retryWrites=true&w=majority

# JWT Secret (generiraj random string)
JWT_SECRET=super_tajni_random_string_123456789

# Email (Gmail App Password)
EMAIL_USER=tvoj.email@gmail.com
EMAIL_PASS=tvoja_gmail_app_lozinka

# Google Calendar (ako koristiš)
GOOGLE_CLIENT_ID=tvoj_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tvoj_google_client_secret
GOOGLE_REDIRECT_URI=https://tvoja-app.onrender.com/api/google/callback
GOOGLE_CALENDAR_ID=tvoj_calendar_id@group.calendar.google.com

# Server Config
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://tvoja-app.onrender.com
```

### Testiraj lokalno sa MongoDB Atlas:
```powershell
cd server
npm start
```
Ako vidiš `MongoDB connected successfully` - super! ✅

---

## 3️⃣ PUSH NA GITHUB (Preporučeno)

### Kreiraj GitHub Repository:
1. Idi na https://github.com/new
2. Repository name: `barber-booking`
3. Visibility: **Public** ili **Private**
4. **NE DODAVAJ** README, .gitignore, ili license
5. Klikni **"Create repository"**

### Push projekat:
```powershell
# U root folderu projekta (c:\Users\Windows\Desktop\barber)
git init
git add .
git commit -m "Initial commit - Barber booking app"
git branch -M main
git remote add origin https://github.com/TVOJ_USERNAME/barber-booking.git
git push -u origin main
```

### Kreiraj `.gitignore` file u root-u:
```
node_modules/
.env
.env.local
.env.production
dist/
build/
*.log
.DS_Store
```

---

## 4️⃣ RENDER.COM DEPLOY

### Kreiraj Web Service:
1. Idi na https://render.com
2. Registruj se / Login (možeš sa GitHub-om)
3. Dashboard → Klikni **"New +"** → **"Web Service"**

### Connect Repository:
- **Ako imaš GitHub**: Izaberi svoj repository
- **Ako NEMAŠ GitHub**: Izaberi "Public Git repository" i unesi URL

### Konfiguriši Service:
```
Name: barber-booking
Region: Frankfurt (EU Central)
Branch: main
Root Directory: server
Runtime: Node
Build Command: npm install && npm run build
Start Command: npm start
```

### Environment Variables:
Klikni **"Advanced"** → **"Add Environment Variable"**

Dodaj SVE iz tvog `.env` filea:
```
MONGODB_URI = mongodb+srv://barber_admin:...
JWT_SECRET = super_tajni_random_string_123456789
EMAIL_USER = tvoj.email@gmail.com
EMAIL_PASS = tvoja_app_lozinka
GOOGLE_CLIENT_ID = ...
GOOGLE_CLIENT_SECRET = ...
GOOGLE_REDIRECT_URI = https://tvoja-app.onrender.com/api/google/callback
GOOGLE_CALENDAR_ID = ...
NODE_ENV = production
PORT = 5000
FRONTEND_URL = https://tvoja-app.onrender.com
```

### Instance Type:
- **Free tier** (dovoljan za početak)

### Klikni "Create Web Service"

---

## 5️⃣ AŽURIRAJ FRONTEND URL

Nakon što Render deployuje app, dobit ćeš URL:
```
https://barber-booking-xyz.onrender.com
```

### Ažuriraj `.env` na Renderu:
1. Dashboard → Tvoj service → **Environment**
2. Uredi `FRONTEND_URL`:
   ```
   FRONTEND_URL=https://barber-booking-xyz.onrender.com
   ```
3. Uredi `GOOGLE_REDIRECT_URI` (ako koristiš):
   ```
   GOOGLE_REDIRECT_URI=https://barber-booking-xyz.onrender.com/api/google/callback
   ```
4. Klikni **"Save Changes"** (automatski će restart)

### Ažuriraj klijent `.env.production`:
```
VITE_API_URL=https://barber-booking-xyz.onrender.com
```

---

## 6️⃣ SEED INITIAL DATA

### Povezivanje na deployed app:
```powershell
# Uredi server/seed.js i promijeni connection string na production MongoDB
# ili koristi environment variable
```

### Opcija 1 - Lokalno seedovanje na Atlas:
```powershell
cd server
# Dodaj MONGODB_URI u .env sa Atlas connection stringom
node seed.js
```

### Opcija 2 - Ručno dodavanje kroz Admin panel:
1. Otvori `https://tvoja-app.onrender.com/admin`
2. Login sa default kredencijalima
3. Dodaj services, working hours, itd.

---

## 7️⃣ TESTIRANJE

### Provjeri:
✅ Homepage učitava: `https://tvoja-app.onrender.com`
✅ Admin login radi: `https://tvoja-app.onrender.com/admin`
✅ API radi: `https://tvoja-app.onrender.com/api/services`
✅ Rezervacije se spremaju u MongoDB Atlas
✅ Email notifikacije rade (ako si podesio)

---

## 📝 NAPOMENE

### Free Tier Limitacije:
- Render free tier **gasi app nakon 15 min neaktivnosti**
- **Prvi request traje 30-60 sec** (cold start)
- Ograničeno na 750 sati mjesečno

### Custom Domain (Optional):
1. Render Dashboard → Settings → Custom Domains
2. Dodaj svoj domen
3. Podesi DNS record kod registrara

### Auto-Deploy:
- Render automatski deployuje kada pushneš na GitHub
- Svaki git push = novi deploy

---

## 🆘 TROUBLESHOOTING

### App ne startuje:
- Provjeri Logs na Render dashboardu
- Provjeri da li su sve ENV variables postavljene

### MongoDB connection failed:
- Provjeri connection string
- Provjeri da li je IP 0.0.0.0/0 dozvoljen
- Provjeri username/password

### Frontend se ne učitava:
- Provjeri da li je build uspješan: `npm run build` u `client/`
- Provjeri `VITE_API_URL` u `.env.production`

### CORS errors:
- Provjeri `FRONTEND_URL` u server `.env`
- Provjeri CORS config u `server.js`

---

## ✅ GOTOVO!

Tvoja aplikacija je sada live na:
🌐 **https://tvoja-app.onrender.com**

---

**Made with ❤️ for Barber Shop Booking**
