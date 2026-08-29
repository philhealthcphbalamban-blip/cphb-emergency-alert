# 🏥 Hospital Rapid Emergency Code Alert System

Usa ka modernong real-time emergency alert & dispatch system para sa mga ospital nga gidesinyo aron dali ug paspas nga ma-broadcast ang **Code Blue** (Cardiac Arrest), **Code Baby Blue / Pink** (Pediatric Emergency / Abduction), **Code Red** (Fire), ug uban pang emergency codes sulod sa **ubos sa 100 milliseconds**.

---

## ⚡ Tech Stack

* **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, Lucide Icons
* **Realtime & Backend**: Supabase (PostgreSQL with Realtime Replication & RLS)
* **Audio & Voice**: Web Audio API (Hi-Lo Code Sirens, Pulsed Alarms) + Web Speech Synthesis (TTS Announcements)
* **Hosting**: Vercel (Edge Network) + Git (Continuous Deployment)

---

## 🚀 Quick Start (Local Development)

1. **Adto sa project directory:**
   ```bash
   cd hospital-emergency-alert
   ```

2. **Pag-install sa mga dependencies:**
   ```bash
   npm install
   ```

3. **Padagana ang development server:**
   ```bash
   npm run dev
   ```
   Ablihi ang [http://localhost:3000](http://localhost:3000) sa imong browser.

---

## ☁️ Supabase Cloud Setup (Production)

1. Paghimo og bag-ong project sa [Supabase Dashboard](https://supabase.com).
2. Adto sa **SQL Editor** ug i-paste ang sulod sa `supabase/schema.sql`.
3. Pindota ang **Run** aron mahimo ang mga tables, RLS policies, ug ma-enable ang Realtime replication.
4. Kopyaha ang **Project URL** ug **Anon Key** gikan sa Project Settings -> API.
5. Paghimo og `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

---

## 🚢 Pag-deploy sa Vercel

1. I-push ang code ngadto sa imong GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Hospital Code Alert System"
   git branch -M main
   git remote add origin https://github.com/your-username/hospital-code-alert.git
   git push -u origin main
   ```
2. Adto sa [Vercel Dashboard](https://vercel.com) -> **Add New Project** -> Import ang GitHub repository.
3. Ibutang ang Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Pindota ang **Deploy**.
