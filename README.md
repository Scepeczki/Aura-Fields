# Aura Fields

Spokojna gra o gospodarstwie i młynie: uprawiasz pola, przetwarzasz plony na 70 rodzajów mąki, prowadzisz sklep i realizujesz zamówienia.

## Jak grać

- **Windows:** pobierz [Aura-Fields-Setup.exe](https://github.com/Scepeczki/Aura-Fields/releases/latest/download/Aura-Fields-Setup.exe) i uruchom. Instalator nie wymaga uprawnień administratora. Zanim zacznie, sprawdza, czy jest nowsza wersja, i instaluje najnowszą.
  Gra sama sprawdza aktualizacje: w górnym pasku pojawia się przycisk **Pobierz**, a po pobraniu **Zainstaluj** (postęp zapisuje się, gra uruchamia się ponownie).
- **Przeglądarka:** strona GitHub Pages tego repozytorium (zakładka *Deployments* → *github-pages*) albo `web/index.html` otwarty lokalnie.

Postęp zapisuje się sam (klucz `mlyn-poletko-v3`). Aplikacja i przeglądarka mają osobne zapisy; przenosisz je kopią do pliku i wczytaniem z pliku w Kronice.

## Pliki

| Ścieżka | Co zawiera |
|---|---|
| `web/index.html` | układ strony i style |
| `web/data.js` | maszyny, uprawy, 70 mąk, receptury i ceny |
| `web/game.js` | logika gry i interfejs |
| `web/desktop.js` | tylko w aplikacji: przycisk aktualizacji w górnym pasku |
| `web/sw.js`, `web/manifest.webmanifest` | działanie jako aplikacja i offline w przeglądarce |
| `web/bg/` | tła: `{wiosna,lato,jesien,zima}-{dzien,noc}.jpg` |
| `src-tauri/` | aplikacja na Windows (Tauri): okno, aktualizator, instalator NSIS |
| `src-tauri/windows/hooks.nsh` | instalator pobiera najnowszą wersję przed instalacją |

## Budowanie

Potrzebne: Node.js, Rust (`rustup`), Windows 10/11.

```powershell
npm install
npm run dev      # okno gry z bieżących plików
npm run build    # exe + instalator w src-tauri/target/release/bundle/nsis
```

## Wydania

Każda zmiana to osobne wydanie z numerem wersji:

```powershell
.\release.ps1 -Notes "Pierwsza zmiana; Druga zmiana"           # wersja X.Y.Z+1: build, Defender, commit, tag
.\release.ps1 -Bump minor -Notes "Większa nowość" -Push        # to samo i od razu publikacja na GitHubie
.\release.ps1 -Publish                                          # publikacja wydania zbudowanego wcześniej
```

Skrypt podbija wersję (`web/game.js`, `web/sw.js`, `package.json`, `src-tauri/Cargo.toml`), dopisuje notatki do `CHANGELOG.md`, buduje aplikację i instalator, sprawdza je Defenderem (wykrycie przerywa wydanie) i odkłada pliki w `dist/vX.Y.Z/`. Publikacja wysyła `main` i tag oraz tworzy wydanie z plikami:

- `Aura-Fields-Setup.exe`: instalator (stała nazwa, więc link z tej strony zawsze daje najnowszy)
- `Aura-Fields-Setup.exe.sig`, `latest.json`: z nich aplikacja i instalator sprawdzają i weryfikują aktualizacje
- `aura-fields-vX.Y.Z.zip`: wersja przeglądarkowa

Wypchnięta gałąź `main` aktualizuje też stronę gry (workflow *Strona gry*).

**Klucz podpisu.** Aktualizacje są podpisane kluczem z `~/.tauri/aura-fields.key`; klucz publiczny jest w `src-tauri/tauri.conf.json`. Zainstalowane gry przyjmują tylko paczki podpisane tym kluczem, więc trzymaj jego kopię poza komputerem. Bez niego nie wydasz już aktualizacji dla obecnych instalacji.

Instalator i exe nie mają podpisu Authenticode, więc przy pierwszym uruchomieniu SmartScreen może pokazać „System Windows ochronił ten komputer” (*Więcej informacji* → *Uruchom mimo to*). Usuwa to dopiero certyfikat do podpisywania kodu.
