# Vercel'ga Deploy Qilish (O'zbekcha qo'llanma)

Bu loyiha **Vercel** uchun tayyorlangan: Express → serverless function,
hamma narsa (ma'lumotlar + yuklangan fayllar) **Postgres (Neon)** da saqlanadi.

> ⚡ Faqat **bitta** narsa kerak: **Neon Postgres**. (Blob KERAK EMAS.)

---

## 1. GitHub'ga yuklash

Loyiha papkasini GitHub repozitoriyangizga yuklang.

## 2. Vercel loyihasi

1. https://vercel.com → **Add New → Project** → repongizni tanlang.
2. **Framework Preset**: `Other` (vercel.json o'zi sozlaydi).
3. Hozircha **Deploy** bosmang — avval bazani ulang.

## 3. Postgres baza (MAJBURIY)

Loyiha sahifasida **Storage** → **Create Database** → **Neon (Postgres)** → yarating.
`DATABASE_URL` avtomatik qo'shiladi. ✅ (Jadvallar birinchi so'rovda o'zi yaratiladi.)

## 4. Environment Variables

**Settings → Environment Variables**:

| Nomi | Qiymati | Izoh |
|------|---------|------|
| `JWT_SECRET` | uzun tasodifiy matn | majburiy |
| `ADMIN_CODE` | `2010` | admin panel kodi (xohlasangiz o'zgartiring) |
| `ADMIN_EMAIL` | `shohruxmuminov201@gmail.com` | (ixtiyoriy) |
| `GOOGLE_CLIENT_ID` | Google OAuth Web Client ID | (ixtiyoriy) Google bilan kirish |

> **Admin panelga kirish**: `/admin/login` → **Admin Code** maydoniga `2010` yozing.

## 5. Deploy

**Deployments → Redeploy**. Tugagach manzilingiz tayyor:
`https://SIZNING-LOYIHA.vercel.app`

---

## ⚠️ Muhim eslatma — fayl hajmi

Vercel serverless funksiyasida bitta so'rov **~4.5 MB** bilan cheklangan.
- HTML test fayllari (kichik) — muammosiz ishlaydi. ✅
- Listening audio yoki katta PDF **4.5 MB dan oshsa** — yuklanmasligi mumkin.
  Katta audio kerak bo'lsa, audio'ni kichikroq (masalan 64–96 kbps MP3) qiling.

---

## Lokal ishga tushirish (test)

Postgres kerak:

```bash
npm install
npm run client:install
cp .env.example .env     # DATABASE_URL ni to'ldiring

npm run dev:server       # http://localhost:8080  (1-terminal)
npm run dev:client       # http://localhost:5173  (2-terminal)
```

Yoki bitta serverda:
```bash
npm run build && npm start
```

---

## Foydalanish

1. **Admin**: `/admin/login` → **Admin Code** = `2010`.
   - **Mock Tests**: test yuklash (Listening HTML + ixtiyoriy audio, Reading HTML, Writing HTML).
   - **Candidates**: nomzod yaratish → 14 xonali kod avtomatik.
   - **Monitoring**: jonli kuzatuv, Warning, Ban.
   - **Review**: 14 xonali kod bilan javoblar va PDF.
2. **Nomzod**: bosh sahifa → **Enter Candidate Code** → 14 xonali kod → testlar.

Omad! 🚀
