# Aura Fields

Spokojna gra przeglądarkowa o gospodarstwie i młynie: uprawiasz pola, przetwarzasz plony na 70 rodzajów mąki, prowadzisz sklep i realizujesz zamówienia.

## Jak grać

- Online: strona GitHub Pages tego repozytorium (zakładka *Deployments* → *github-pages*).
- Lokalnie: otwórz `index.html` w przeglądarce. Na Windows najwygodniej jako okno aplikacji:
  `brave.exe --app="file:///C:/Projects/Farming/index.html"`.

Postęp zapisuje się sam w pamięci przeglądarki (klucz `mlyn-poletko-v3`). Kopię do pliku i wczytanie z pliku znajdziesz w Kronice.

## Pliki

| Plik | Co zawiera |
|---|---|
| `index.html` | układ strony i style |
| `data.js` | maszyny, uprawy, 70 mąk, receptury i ceny |
| `game.js` | logika gry i interfejs |
| `sw.js`, `manifest.webmanifest` | działanie jako aplikacja i offline (na serwerze) |
| `bg/` | tła nagłówka: `{wiosna,lato,jesien,zima}-{dzien,noc}.jpg` |

## Wydania

Każda zmiana to osobne wydanie z numerem wersji:

```powershell
.\release.ps1 -Notes "Pierwsza zmiana; Druga zmiana"          # commit + tag vX.Y.Z (patch)
.\release.ps1 -Bump minor -Notes "Większa nowość" -Push       # od razu wysyła na GitHuba
```

Wypchnięty tag tworzy wydanie z paczką `.zip` (workflow *Wydanie*), a wypchnięta gałąź `main` aktualizuje stronę gry (workflow *Strona gry*). Notatki trafiają do `CHANGELOG.md`.
