# Postavljanje Email Obavijesti sa Resend (za Render)

## Problem
Render.com blokira SMTP portove (587, 465) za vanjske servise poput Gmaila. Zato koristimo **Resend** koji koristi HTTPS API.

## Rješenje: Resend API

### 1. Kreiraj Resend Account
1. Idi na: https://resend.com/signup
2. Registruj se (besplatan plan: 100 emailova/dan, 3000/mjesec)
3. Potvrdi email

### 2. Generiši API Key
1. Idi na: https://resend.com/api-keys
2. Klikni **Create API Key**
3. Daj mu ime (npr. "Barber Production")
4. Kopiraj API key (počinje sa `re_...`)

### 3. (Opciono) Dodaj Custom Domain
**Napomena:** Za testiranje možeš koristiti `onboarding@resend.dev` email adresu.

Ako želiš slati sa svog domena (npr. `noreply@tvoj-domen.com`):
1. Idi na: https://resend.com/domains
2. Klikni **Add Domain**
3. Unesi svoj domen
4. Dodaj DNS zapise koje ti Resend prikaže
5. Verifikuj domen

### 4. Postavi Environment Varijable na Renderu

Idi na Render Dashboard → твој servis → **Environment** → **Add Environment Variable**:

```bash
RESEND_API_KEY=re_tvoj_api_key_ovdje
EMAIL_FROM=Barber Shop <onboarding@resend.dev>
# Ili ako imaš custom domain:
# EMAIL_FROM=Barber Shop <noreply@tvoj-domen.com>
```

**VAŽNO:** Obriši ili NE dodavaj `EMAIL_USER` i `EMAIL_PASS` varijable na Renderu.

### 5. Redeploy

Klikni **Manual Deploy** → **Deploy latest commit** na Renderu.

### 6. Testiranje

Napravi test rezervaciju i provjeri:
- Render logove: `✅ Resend email poslan: <email_id>`
- Resend Dashboard: https://resend.com/emails

---

## Lokalno Testiranje (opciono)

Za lokalno testiranje možeš koristiti Gmail SMTP:

**.env** (lokalno):
```bash
# Gmail SMTP (radi lokalno)
EMAIL_USER=tvoj.email@gmail.com
EMAIL_PASS=tvoja_app_lozinka

# NE postavljaj RESEND_API_KEY za lokalno testiranje
```

---

## Troubleshooting

### Email se ne šalje
1. Provjeri Render logove za greške
2. Provjeri da li je `RESEND_API_KEY` ispravan
3. Provjeri Resend Dashboard za failed emails
4. Provjeri da li je `EMAIL_FROM` adresa dozvoljena (mora biti onboarding@resend.dev ili verified domain)

### "Invalid 'from' address"
Koristiš nepostojući ili neverifikovani domen. Koristi:
```bash
EMAIL_FROM=Barber Shop <onboarding@resend.dev>
```

### Rate limit exceeded
Besplatni plan ima limit od 100 emailova/dan. Upgrade na paid plan ili čekaj reset.

---

## Prednosti Resend vs Gmail SMTP

✅ **Radi na Renderu** (nema SMTP blokade)  
✅ **Brži delivery** (API je brži od SMTP)  
✅ **Bolji tracking** (vidiš status svakog emaila)  
✅ **99.9% uptime**  
✅ **Besplatan plan** (3000 emailova/mjesec)

---

## Dokumentacija

- Resend Docs: https://resend.com/docs
- API Reference: https://resend.com/docs/api-reference/emails/send-email
- Node.js SDK: https://github.com/resendlabs/resend-node
