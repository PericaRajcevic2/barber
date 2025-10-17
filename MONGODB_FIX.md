# 🔑 MongoDB Atlas - Kreiranje Novog Usera

## Koraci:

### 1. Idi na MongoDB Atlas Dashboard
https://cloud.mongodb.com/

### 2. Kreiraj NOVOG Database Usera:
- Lijevo: **Security** → **Database Access**
- Klikni: **+ ADD NEW DATABASE USER**

### 3. Popuni podatke:
```
Authentication Method: Password

Username: barber_app_user
          ↑ Možeš koristiti bilo koje ime (bez specijalnih karaktera)

Password: Klikni "Autogenerate Secure Password"
          ↑ KOPIRAJ ODMAH! (npr: XyZ9kLm2PqRs3TuV)
          
Password: ili kreiraj jednostavan password bez specijalnih karaktera
          ↑ npr: barber2024app (samo slova i brojevi)
```

### 4. Database User Privileges:
- Izaberi: **Read and write to any database**

### 5. Klikni: **Add User**

---

## 📝 Connection String Format:

Nakon što kreiraš usera, uzmi connection string:

### Originalni string iz Atlas:
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

### Zamijeni <username> i <password>:
```
mongodb+srv://barber_app_user:XyZ9kLm2PqRs3TuV@cluster0.xxxxx.mongodb.net/barber-booking?retryWrites=true&w=majority
                ↑               ↑                                               ↑
            tvoj username    tvoj password                              ime baze podataka
```

---

## 🚀 Ažuriraj na Render.com:

### 1. Idi na Render Dashboard:
https://dashboard.render.com/

### 2. Izaberi svoj Web Service

### 3. Lijevo → **Environment**

### 4. Pronađi **MONGODB_URI**

### 5. Klikni na edit (pencil ikona)

### 6. Zalijepi NOVI connection string:
```
mongodb+srv://barber_app_user:XyZ9kLm2PqRs3TuV@cluster0.xxxxx.mongodb.net/barber-booking?retryWrites=true&w=majority
```

### 7. Klikni **Save Changes**

Render će **automatski restartati** aplikaciju sa novim kredencijalima.

---

## ✅ Testiranje:

Nakon 1-2 minute, otvori Render Logs:
- Trebao bi vidjeti: `✅ MongoDB connected successfully`
- Ako još uvijek vidiš grešku, provjeri:
  - Da li si točno kopirao password (bez dodatnih space-ova)
  - Da li ime baze podataka postoji (`barber-booking`)
  - Da li je IP 0.0.0.0/0 dozvoljen u Network Access

---

## 🔍 Česte Greške:

### Password sadrži specijalne karaktere:
```
❌ P@ssw0rd!  → treba URL encoding
✅ Passw0rd123 → najbolje bez specijalnih karaktera
```

### Zaboravio dodati ime baze:
```
❌ ...mongodb.net/?retryWrites...
✅ ...mongodb.net/barber-booking?retryWrites...
                 ↑ dodaj ime baze
```

### Kopirao sa space-ovima:
```
❌ mongodb+srv://user:pass @cluster...
                        ↑ space ovdje
✅ mongodb+srv://user:pass@cluster...
```

---

**Made with ❤️ - Rješavanje MongoDB Auth problema**
