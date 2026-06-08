<div align="center">

<img src="src/assets/logo.svg" width="120" height="120" alt="Arcanum" />

# Arcanum

### Sześć żywiołów codzienności

Grywalizacyjny menedżer życia w stylu RPG — zamień nawyki, zadania i cele w przygodę.
Twoje życie to postać, którą rozwijasz przez sześć żywiołów.

<br />

![Tauri](https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-edition_2021-000000?logo=rust&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-bundled-003B57?logo=sqlite&logoColor=white)

</div>

---

## ✦ Czym jest Arcanum?

Arcanum to **lekka aplikacja desktopowa** (Tauri + React), która ujmuje samorozwój w ramy gry RPG.
Każda dziedzina życia to **żywioł** z osobnym poziomem i punktami doświadczenia. Wykonujesz
**zadania (questy)**, budujesz **nawyki**, walczysz z **pokusami** — a Twoja postać rośnie w siłę
i zmienia klasę zależnie od tego, w czym jesteś najlepszy.

Wszystkie dane żyją lokalnie w bazie **SQLite** na Twoim komputerze. Bez chmury, bez konta, bez śledzenia.

## ✦ Sześć żywiołów

| Rune | Żywioł | Dziedzina | Statystyka | Klasa lidera |
|:---:|:---|:---|:---:|:---|
| 火 | **Ogień** | Zdrowie i Siłownia | STR — Siła | Wojownik |
| 土 | **Ziemia** | Finanse | WIS — Mądrość | Strateg |
| 水 | **Woda** | Nawyki i Rutyny | CON — Kondycja | Mnich |
| 風 | **Powietrze** | Nauka i Rozwój | INT — Intelekt | Uczony |
| 金 | **Metal** | Praca i Projekty | DEX — Zręczność | Rzemieślnik |
| 心 | **Duch** | Relacje Społeczne | CHA — Charyzma | Dyplomata |

> Twoja **klasa postaci** wynika z żywiołu o najwyższym XP. Gdy dwa żywioły są wyrównane —
> jesteś **Awanturnikiem**.

## ✦ Funkcje

- 🎯 **Zadania (Questy)** — trzy kubełki: dzienne, tygodniowe, epickie. Każdy z własną rzadkością i nagrodą XP.
- 🔁 **Nawyki** — codzienne odhaczanie z licznikiem serii (streak) i historią ostatnich 7 dni.
- 🌑 **Pokusy (Shadow Habits)** — negatywne nawyki z odwróconą logiką (patrz niżej).
- 📈 **System poziomów** — osobne krzywe XP dla postaci i dla każdego żywiołu.
- 📜 **Dziennik czynów** — kronika aktywności z dnia, czyszczona automatycznie po każdej dobie.
- 🎨 **5 motywów** — Żywioły, Pergamin, Świt, Łąka, Północ.
- 🔔 **Powiadomienia** — natywny toast przy awansie na nowy poziom; toasty XP znikają po 5 s.
- 💾 **Eksport danych** — zrzut całego stanu do JSON.

## ✦ Mechanika Pokus (Shadow Habits)

Pokusy to zachowania, które chcesz eliminować. Działają na dwa sposoby równocześnie:

1. **Shadow block** — uleganie pokusie **blokuje dzienny bonus XP** z pozytywnych nawyków
   w tej samej kategorii. Działa od pierwszego dnia. Kara to *utracona nagroda*, nie strata zarobionego XP.
2. **Streak penalty** — dopiero **3 dni z rzędu** ulegania uruchamiają aktywne odejmowanie
   `penalty_xp` od kategorii. Jedna wpadka nie rujnuje postępu — masz margines błędu.

Odhaczenie pokusy oznacza „uległem dziś". Cofnięcie odznaczenia przywraca zablokowany bonus
lub odjęty XP.

## ✦ System XP

| Poziom | Postać (globalnie) | Żywioł (kategoria) |
|:---|:---|:---|
| Bazowy próg | 1000 XP | 250 XP |
| Mnożnik / poziom | × 1.15 | × 1.20 |

Każdy kolejny poziom wymaga progresywnie więcej doświadczenia.

## ✦ Stack technologiczny

| Warstwa | Technologia |
|:---|:---|
| Powłoka desktopowa | **Tauri 2** (Rust) |
| Frontend | **React 19** + **TypeScript** + **Vite** |
| Stan serwera | **TanStack Query v5** (cache wyników z Rusta) |
| Stan UI | **Zustand** (motyw, modale, toasty) |
| Baza danych | **SQLite** przez `rusqlite` (bundled), migracje wersjonowane |
| Powiadomienia | `tauri-plugin-notification` |

## ✦ Szybki start

### Wymagania

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://www.rust-lang.org/tools/install) (toolchain stabilny)
- Zależności systemowe Tauri — patrz [docs.tauri.app](https://tauri.app/start/prerequisites/)
  (na Windows: **Microsoft C++ Build Tools** + **WebView2**)

### Instalacja i uruchomienie

```bash
# instalacja zależności frontendu
npm install

# tryb deweloperski (hot-reload frontendu + Rust)
npm run tauri dev

# build produkcyjny (instalator dla Twojej platformy)
npm run tauri build
```

## ✦ Struktura projektu

```
Arcanum/
├─ src/                      # frontend (React + TS)
│  ├─ components/            # panele UI (CharacterPanel, QuestPanel, HabitTracker…)
│  ├─ hooks/                 # hooki TanStack Query (useQuests, useHabits…)
│  ├─ lib/tauri.ts           # typowane wrappery invoke() do komend Rusta
│  ├─ store/                 # Zustand (stan UI)
│  ├─ data.ts                # definicje żywiołów, motywów, statystyk
│  └─ types/                 # interfejsy TypeScript
├─ src-tauri/                # backend (Rust)
│  ├─ migrations/            # wersjonowane migracje SQL (001 → 003)
│  ├─ src/
│  │  ├─ commands/           # komendy Tauri (character, quests, habits, negative_habits…)
│  │  ├─ db.rs               # otwarcie bazy + migracje + dziennik
│  │  ├─ models.rs           # struktury danych (serde)
│  │  ├─ xp.rs               # krzywe XP, poziomy, klasy
│  │  └─ notifications.rs    # powiadomienia o awansie
│  └─ icons/                 # ikony aplikacji (generowane z logo.svg)
└─ scripts/render-icon.mjs   # render logo.svg → PNG przez headless Chrome
```

## ✦ Ikony aplikacji

Logo (`src/assets/logo.svg`) używa japońskiego fontu **Yuji Boku**, którego renderer Tauri CLI
(`resvg`) nie obsługuje. Dlatego ikony generujemy w dwóch krokach:

```bash
# 1. wyrenderuj PNG-i przez headless Chrome (pełna obsługa Google Fonts)
node scripts/render-icon.mjs

# 2. wygeneruj wszystkie formaty (ICO/ICNS/APPX/iOS/Android) z PNG 512×512
npx @tauri-apps/cli icon src-tauri/icons/512x512.png
```

## ✦ Architektura danych

- **Stan = SQLite po stronie Rusta** — frontend nigdy nie dotyka bazy bezpośrednio, tylko przez komendy Tauri.
- **Migracje wersjonowane** przez `PRAGMA user_version` — każda owinięta w transakcję `BEGIN…COMMIT`.
- **TanStack Query** cache'uje wyniki komend; mutacje unieważniają odpowiednie klucze.
- **Dziennik czynów** czyści się dobowo (przy pierwszym odczycie nowego dnia, wg czasu lokalnego),
  a dodatkowo stosuje przycinanie FIFO — maks. 200 wpisów jako zabezpieczenie.

---

<div align="center">
<sub>Zbudowane z 火 土 水 風 金 心</sub>
</div>
