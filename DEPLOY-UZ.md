# Vercel'ga Deploy Qilish (O'zbekcha qo'llanma)

Bu loyiha **Vercel** uchun tayyorlangan: Express → serverless function,
ma'lumotlar → **Postgres (Neon)**, fayllar → **Vercel Blob**.

---

## 1. GitHub'ga yuklash

Loyiha papkasini GitHub repozitoriyangizga yuklang (yoki Vercel CLI ishlating).

## 2. Vercel loyihasini yaratish

1. https://vercel.com → **Add New → Project** → GitHub repongizni tanlang.
2. **Framework Preset**: `Other` (vercel.json hammasini o'zi sozlaydi).
3. Hozircha **Deploy** bosmang — avval bazani ulang (3-qadam).

## 3. Baza va fayl saqlash (MAJBURIY)

Loyiha sahifasida **Storage** bo'limiga kiring:

**a) Postgres (Neon):**
- **Create Database → Neon (Postgres)** → yarating.
- `DATABASE_URL` avtomatik qo'shiladi. ✅

**b) Blob (fayllar uchun):**
- **Create → Blob** → yarating.
- `BLOB_READ_WRITE_TOKEN` avtomatik qo'shiladi. ✅

## 4. Environment Variables

**Settings → Environment Variables** ga quyidagilarni qo'shing:

| Nomi | Qiymati | Izoh |
|------|---------|------|
| `JWT_SECRET` | uzun tasodifiy matn | majburiy |
| `ADMIN_EMAIL` | `shohruxmuminov201@gmail.com` | admin email |
| `ADMIN_PASSWORD` | o'zingiz tanlagan parol | Google'siz admin kirish |
| `GOOGLE_CLIENT_ID` | Google OAuth Web Client ID | (ixtiyoriy) Google bilan kirish |

> `ADMIN_PASSWORD` yoki `GOOGLE_CLIENT_ID` — kamida bittasi bo'lsin.

## 5. Deploy

**Deployments → Redeploy** (yoki birinchi deploy). Tugagach manzilingiz tayyor:
`https://SIZNING-LOYIHA.vercel.app`

---

## Lokal ishga tushirish (test uchun)

Postgres kerak. Keyin:

```bash
npm install
npm run client:install
cp .env.example .env     # DATABASE_URL va ADMIN_PASSWORD ni to'ldiring

npm run dev:server       # http://localhost:8080  (1-terminal)
npm run dev:client       # http://localhost:5173  (2-terminal)
```

> Fayl yuklashni lokalda test qilish uchun haqiqiy `BLOB_READ_WRITE_TOKEN`
> kerak (Vercel'da Blob yaratib token'ni nusxalang). Qolgan hamma narsa
> oddiy lokal Postgres bilan ishlaydi.

---

## Foydalanish

1. **Admin**: `/admin/login` → Google yoki parol bilan kiring.
   - **Mock Tests** tab: test yuklash (Listening HTML + ixtiyoriy audio, Reading HTML, Writing HTML).
   - **Candidates** tab: nomzod yaratish → 14 xonali kod avtomatik.
   - **Monitoring** tab: jonli kuzatuv, ogohlantirish (Warning) va Ban.
   - **Review** tab: 14 xonali kod bilan javoblar va PDF'ni ko'rish.
2. **Nomzod**: bosh sahifa → **Enter Candidate Code** → 14 xonali kod → testlar.
   - Start Test → to'liq ekran → Listening → javob varaqasi (5 daq) →
     Reading → javob varaqasi (5 daq) → Writing PDF → Thank You.

Hammasi tayyor. Omad! 🚀
