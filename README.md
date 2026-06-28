# IELTS Mock Test Platform

A production-ready IELTS mock test platform with a premium 3D dashboard, an
admin panel for managing tests and candidates, real-time exam monitoring, and a
secure full-screen examination flow (Listening → Reading → Writing).

**Built to deploy on [Vercel](https://vercel.com)** — Express runs as a
serverless function, data lives in **Postgres (Neon)**, and uploaded files live
in **Vercel Blob**.

> **Prepare Smart. Score High.**

---

## ✨ Features

- **3D dashboard** — lightweight Three.js background, responsive, light & dark themes.
- **Two login methods** — admin signs in with **Google** (restricted to `ADMIN_EMAIL`, with an optional password fallback); candidates enter their unique **14-digit code**.
- **Mock Test Management** — upload **Listening (HTML + optional Audio)**, **Reading (HTML)** and **Writing (HTML)**; stored permanently in Postgres + Blob and shown in order.
- **HTML rendering** — uploaded HTML renders exactly like a browser in a sandboxed iframe (CSS + JS execute); candidates never see source code.
- **Candidate Management** — guaranteed-unique 14-digit codes, search by name or code, ban/unban.
- **Exam flow** — Listening → 40-question answer sheet (5 min, test visible beside it) → Reading → 40-question answer sheet (5 min) → Writing → PDF essay upload → Thank You.
- **Full-screen security** — only the test enters full screen (after *Start Test*); leaving it alerts the admin with name, code, timestamp and section.
- **Real-time warnings & bans** — admin warnings appear instantly as a centered modal even mid-test; bans end the session immediately (delivered via a fast polling channel that works on serverless).
- **Admin review** — search by 14-digit code to view Listening/Reading answer sheets and open/download the Writing PDF.
- **Persistent storage** — Postgres + Blob: data survives refreshes, redeploys and restarts.

---

## 🧱 Tech stack

| Layer        | Technology |
|--------------|-----------|
| Hosting      | Vercel (serverless function + static client) |
| Backend      | Node.js, Express (as a Vercel function) |
| Database     | Postgres — [Neon](https://neon.tech) (`pg`) |
| File storage | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) (`@vercel/blob`) |
| Real-time    | Lightweight polling (`/api/monitor`) — serverless-friendly |
| Auth         | Google Identity Services + JWT |
| Frontend     | React, React Router, Vite, Three.js |

---

## 🚀 Deploy to Vercel (recommended)

1. **Push this repo to GitHub** and import it into Vercel
   (or run `vercel` from the Vercel CLI).
2. **Add storage** in the Vercel project:
   - **Storage → Create Database → Neon (Postgres)** → this sets `DATABASE_URL` automatically.
   - **Storage → Create → Blob** → this sets `BLOB_READ_WRITE_TOKEN` automatically.
3. **Set environment variables** (Project → Settings → Environment Variables):
   - `JWT_SECRET` — a long random string.
   - `ADMIN_EMAIL` — `shohruxmuminov201@gmail.com` (already the default).
   - `GOOGLE_CLIENT_ID` — your Google OAuth Web client ID (see below), **or**
   - `ADMIN_PASSWORD` — a password if you prefer the fallback login.
4. **Deploy.** `vercel.json` already wires the build, the API function and the SPA routing.

The included `vercel.json`:
- builds the React client (`npm run vercel-build` → `client/dist`),
- serves it statically,
- routes every `/api/*` request to the Express function in `api/index.js`.

The database schema is created automatically on first request.

---

## 💻 Local development

Requires a local (or remote) Postgres database.

```bash
# 1. Install dependencies
npm install
npm run client:install

# 2. Configure env
cp .env.example .env
#   set DATABASE_URL (e.g. postgres://postgres:postgres@127.0.0.1:5432/ielts)
#   set ADMIN_PASSWORD=yourpass   (quick admin login without Google)
#   set BLOB_READ_WRITE_TOKEN if you want to test uploads locally

# 3a. API (terminal 1)
npm run dev:server          # http://localhost:8080

# 3b. Client (terminal 2)
npm run dev:client          # http://localhost:5173 (proxies /api)
```

> File uploads use Vercel Blob, so testing the upload features locally requires a
> real `BLOB_READ_WRITE_TOKEN` (create a Blob store on Vercel and copy the token).
> All other features work against a plain local Postgres.

Production build locally:
```bash
npm run build && npm start   # serves API + client on PORT
```

---

## 🔐 Configuration

| Variable               | Description |
|------------------------|-------------|
| `DATABASE_URL`         | Postgres connection string (Neon on Vercel). |
| `BLOB_READ_WRITE_TOKEN`| Vercel Blob token for file uploads. |
| `JWT_SECRET`           | Secret for signing session tokens. **Change in production.** |
| `ADMIN_EMAIL`          | The only Google account allowed admin access. |
| `GOOGLE_CLIENT_ID`     | Google OAuth Web client ID. Empty = Google login disabled. |
| `ADMIN_PASSWORD`       | Optional admin password fallback. Empty = disabled. |
| `MAX_UPLOAD_BYTES`     | Max upload size (default 200 MB). |

### Enabling Google Sign-In

1. In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), create an **OAuth client ID** → **Web application**.
2. Add your origins (e.g. `http://localhost:5173` and your Vercel URL) to **Authorized JavaScript origins**.
3. Set `GOOGLE_CLIENT_ID`. Only `ADMIN_EMAIL` is granted access; any other account is rejected.

---

## 🗂️ Project structure

```
.
├── api/
│   └── index.js            # Vercel serverless entry → Express app
├── server/                 # Express API (shared by Vercel & local server)
│   ├── app.js              # builds the Express app
│   ├── index.js            # local dev server (listens on PORT)
│   ├── config.js           # env configuration
│   ├── db.js               # Postgres pool + schema
│   ├── auth.js             # JWT, Google verification, code generation
│   └── routes/             # auth, mock-tests, candidates, submissions, review, monitor, blob
├── client/                 # React + Vite + Three.js
│   └── src/
│       ├── pages/          # Home, logins, dashboard, test runner, admin
│       ├── components/     # 3D background, navbar, modal, answer sheet, …
│       └── lib/            # api client, auth, blob upload, exam state, theme
├── vercel.json
└── .env.example
```

---

## 🔄 Exam flow

1. Candidate enters 14-digit code → dashboard of available tests.
2. **Start Test** → browser enters full screen.
3. **Listening** (audio auto-plays once if provided) → **Submit** → 5-min Listening answer sheet (test visible beside it).
4. **Reading** → **Submit** → 5-min Reading answer sheet.
5. **Writing** → upload essay **PDF** ("Send Essay to Admin").
6. Full screen exits automatically → **Thank You** page.

The admin **Monitoring** tab shows who is online, their current section, and
full-screen-exit alerts — with one-click **Warning** and **Ban** actions
delivered in near real time.
