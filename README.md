# 🎮 GameVerse – Roblox-ähnliche Spieleplattform

Eine vollständige Gaming-Plattform mit React + Supabase.  
Spieler können sich registrieren, Spiele entdecken, bewerten, liken und spielen.

---

## 📁 Projektstruktur

```
gameverse/
├── index.html
├── vite.config.js
├── package.json
├── .env.example          ← hier deine Supabase-Keys eintragen
├── .gitignore
│
├── supabase/
│   └── schema.sql        ← Datenbank-Schema (einmal ausführen)
│
└── src/
    ├── main.jsx           ← React-Einstiegspunkt
    ├── App.jsx            ← Haupt-App (alle Seiten, Routing, Layout)
    │
    ├── lib/
    │   └── supabase.js    ← Supabase-Client + alle DB-Funktionen
    │
    ├── hooks/
    │   └── useAuth.js     ← Login / Logout / Registrierung / Profil
    │
    └── components/
        └── AuthModal.jsx  ← Login- & Registrierungs-Modal
```

---

## 🚀 Setup in 5 Schritten

### Schritt 1 – Supabase-Projekt erstellen

1. Gehe zu [supabase.com](https://supabase.com) → **New Project**
2. Gib einen Namen ein (z.B. `gameverse`) und ein sicheres DB-Passwort
3. Warte bis das Projekt bereit ist (~1 Minute)

---

### Schritt 2 – Datenbank-Schema einrichten

1. Gehe zu **SQL Editor** → **New Query**
2. Kopiere den kompletten Inhalt von `supabase/schema.sql`
3. Klicke **Run** (grüner Button)

✅ Das erstellt automatisch:
- `profiles` – Benutzerprofile
- `games` – alle Spiele
- `game_sessions` – wer spielt gerade
- `game_ratings` – Sternebewertungen
- `game_likes` – Likes
- `game_stats` – aggregierte View mit Online-Spielern, Likes, Rating
- Alle RLS-Policies (Row Level Security)
- Trigger für Auto-Profil bei Registrierung
- 20 Beispiel-Spiele

---

### Schritt 3 – API-Keys eintragen

1. Supabase Dashboard → **Settings** → **API**
2. Kopiere:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** Key → `VITE_SUPABASE_ANON_KEY`

```bash
cp .env.example .env
```

Dann `.env` öffnen und eintragen:
```
VITE_SUPABASE_URL=https://xyzxyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

> ⚠️ Die `.env` Datei **niemals** in Git pushen – sie ist bereits in `.gitignore`

---

### Schritt 4 – Auth in Supabase aktivieren

1. Supabase → **Authentication** → **Providers**
2. **Email** muss aktiviert sein (ist Standard)
3. Optional: **Confirm email** auf `false` stellen für einfacheres Testen:  
   Authentication → Settings → "Enable email confirmations" deaktivieren

---

### Schritt 5 – Lokal starten

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

Öffne [http://localhost:5173](http://localhost:5173) 🎉

---

## 📦 Deployment auf Vercel / Netlify

### Vercel (empfohlen)
```bash
npm install -g vercel
vercel
```
Dann in Vercel Dashboard → **Environment Variables** die beiden `.env`-Werte eintragen.

### Netlify
```bash
npm run build
# dist/ Ordner hochladen oder GitHub-Repo verbinden
```
In Netlify → **Site Settings** → **Environment Variables** eintragen.

---

## 🗄️ Eigene Spiele hinzufügen

### Option A – Supabase Dashboard (einfach)
1. Supabase → **Table Editor** → `games`
2. **Insert Row** klicken
3. Felder ausfüllen:

| Feld | Beispiel |
|------|---------|
| `name` | Mein cooles Spiel |
| `description` | Beschreibung hier |
| `category` | `Action` / `Tycoon` / `Horror` / `Racing` / `Puzzle` / `Roleplay` / `Adventure` / `Simulator` |
| `color_from` | `#FF6B6B` (Hex-Farbe) |
| `color_to` | `#EE5A24` |
| `is_featured` | `true` für Trending |

### Option B – SQL
```sql
insert into public.games (name, description, category, color_from, color_to, is_featured)
values ('Mein Spiel', 'Tolle Beschreibung', 'Action', '#FF6B6B', '#EE5A24', true);
```

### Option C – In der App (als eingeloggter User)
Kommt als nächstes Feature: **Spiel-Creator** direkt in der UI.

---

## ✨ Features

| Feature | Status |
|---------|--------|
| 🔐 Registrierung & Login | ✅ |
| 👤 Auto-Profil bei Signup | ✅ |
| 🎮 Spiele aus Supabase laden | ✅ |
| 🔥 Featured / Trending | ✅ |
| 🔍 Volltext-Suche | ✅ |
| 🏷️ Kategorie-Filter | ✅ |
| ❤️ Spiele liken | ✅ |
| ⭐ Sternebewertung | ✅ |
| 👥 Online-Spieler (live) | ✅ |
| 📊 Besuchs-Zähler | ✅ (Trigger) |
| 🔒 Row Level Security | ✅ |
| 📱 Responsive Design | ✅ |

---

## 🛠️ Geplante Erweiterungen

- [ ] **Spiel-Creator** – Eigene Spiele hochladen
- [ ] **Profilseite** – Avatar, Bio, gespielte Spiele
- [ ] **Freundesliste** – Freunde einladen
- [ ] **Kommentare** – Bewertungen mit Text
- [ ] **Coins-System** – Belohnungen für Aktivität
- [ ] **Admin-Panel** – Spiele moderieren
- [ ] **Realtime-Chat** – In-Game-Chat via Supabase Realtime
- [ ] **Thumbnail-Upload** – Bilder via Supabase Storage

---

## 🔧 Technologie-Stack

| Tool | Verwendung |
|------|-----------|
| **React 18** | UI-Framework |
| **Vite** | Build-Tool & Dev-Server |
| **Supabase** | Datenbank, Auth, Realtime |
| **PostgreSQL** | Datenbank (via Supabase) |

---

## 🐛 Troubleshooting

**"Missing Supabase environment variables"**  
→ `.env` Datei fehlt oder Variablen falsch geschrieben. Prüfe `VITE_` Prefix.

**"permission denied for table games"**  
→ RLS-Policies nicht angelegt. Schema nochmal ausführen oder Policies prüfen.

**Registrierung schlägt fehl**  
→ Email-Bestätigung deaktivieren: Authentication → Settings → Confirmations aus.

**Spiele werden nicht geladen**  
→ Prüfe ob `game_stats` View existiert: SQL Editor → `select * from game_stats limit 1;`
