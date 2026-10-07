# Zamówienie grafik — Aura Fields

Spis wszystkich grafik potrzebnych grze. Nazwy plików są dokładne: gra wczyta je bez przerabiania, więc proszę ich nie zmieniać.
Każdy plik jako **WebP (jakość ok. 85)**; dodatkowo w osobnej paczce te same pliki w PNG (wersje źródłowe).

## Wspólny styl (dla wszystkich paczek)

- Malarski, miękki styl (gouache / digital painting) jak w obecnych grafikach zagonów i tłach gry: ciepła, lekko przygaszona paleta, brązy ziemi, złoto, oliwkowa zieleń.
- Światło zawsze z lewej góry, miękkie cienie w prawo w dół. Bez ostrych konturów i bez fotorealizmu.
- **Żadnego tekstu, liter, cyfr, logo ani ramek** na grafikach.
- Gra ma ciemny interfejs (prawie czarne, półprzezroczyste panele ze złotą obwódką), więc grafiki nie mogą być ani bardzo jasne, ani bardzo nasycone.
- Rośliny botanicznie wierne: nazwa łacińska podana przy każdej uprawie.

## Paczka A — zagony na kartach poletek (przerender w 3:2)

Karta poletka pokazuje wycinek ok. **7:5** (186×134 px na ekranie, na ekranach HiDPI ×2). Obecne grafiki są kwadratowe, więc góra i dół są ucinane, najbardziej korony drzew.

- Format: **768×512 px (3:2)**, folder `plots/`.
- Kadr: ten sam co obecnie (pole w perspektywie, rzędy zbiegające się ku górze, kamera lekko z góry), ale z rośliną ułożoną pod szerszy kształt. Ważna treść (rośliny, korony drzew) w pasie od 12% do 88% wysokości, bo krawędzie mogą być lekko przycięte.
- **Ten sam kadr, perspektywa i rozstaw rzędów** dla wszystkich etapów jednej rośliny i dla podłoży, żeby zmiana etapu wyglądała jak wzrost w tym samym miejscu.
- Pole: brązowa zaorana ziemia w rzędach. Pole ryżowe: rzędy w płytkiej wodzie (zielonkawa woda między rzędami). Szklarnia: ten sam zagon, ale widać szklane ściany/słupki po bokach i jaśniejsze, rozproszone światło.
- Uprawy szklarniowe rysujemy na podłożu szklarni, uprawy z pola ryżowego na podłożu ryżowym, reszta na polu (kolumna „Podłoże”).

### A1. Podłoża (6 plików)

| Plik | Co przedstawia |
|---|---|
| `pole.webp` | puste pole, świeżo zaorane rzędy |
| `pole-zima.webp` | to samo pole pod cienką warstwą śniegu, bruzdy prześwitują, szron |
| `mokre.webp` | puste pole ryżowe zalane wodą |
| `mokre-zima.webp` | pole ryżowe zimą: skuta lodem woda, oszronione grzbiety rzędów |
| `szklarnia.webp` | pusty zagon w szklarni |
| `szklarnia-zima.webp` | szklarnia zimą: w środku ciepło i zielono, na szybach i dachu śnieg, za szkłem zimowy chłód |

### A2. Etapy upraw

Nazwa pliku: `<id>-<etap>.webp`. Etapy: 1 = kiełek (świeżo wzeszłe, małe siewki w rzędach); 2 = wzrost (połowa wysokości, zielone, bez owoców/kłosów); 3 = gotowe do zbioru (pełna dojrzałość, wyraźny plon); 4 = po zbiorze (roślina dorosła, bez owoców, odrasta) (tylko drzewa, krzewy i byliny wieloletnie).

| id | Roślina | Łacina | Rodzaj | Podłoże | Pliki |
|---|---|---|---|---|---|
| `pszenica` | Pszenica zwyczajna | *Triticum aestivum* | zboże | pole | `pszenica-1.webp`, `pszenica-2.webp`, `pszenica-3.webp` |
| `durum` | Pszenica twarda | *Triticum durum* | zboże | pole | `durum-1.webp`, `durum-2.webp`, `durum-3.webp` |
| `orkisz` | Orkisz | *Triticum spelta* | zboże | pole | `orkisz-1.webp`, `orkisz-2.webp`, `orkisz-3.webp` |
| `plaskurka` | Płaskurka | *Triticum dicoccum* | zboże | pole | `plaskurka-1.webp`, `plaskurka-2.webp`, `plaskurka-3.webp` |
| `samopsza` | Samopsza | *Triticum monococcum* | zboże | pole | `samopsza-1.webp`, `samopsza-2.webp`, `samopsza-3.webp` |
| `khorasan` | Pszenica Khorasan | *Triticum turgidum* | zboże | pole | `khorasan-1.webp`, `khorasan-2.webp`, `khorasan-3.webp` |
| `zyto` | Żyto zwyczajne | *Secale cereale* | zboże | pole | `zyto-1.webp`, `zyto-2.webp`, `zyto-3.webp` |
| `pszenzyto` | Pszenżyto | *×Triticosecale* | zboże | pole | `pszenzyto-1.webp`, `pszenzyto-2.webp`, `pszenzyto-3.webp` |
| `jeczmien` | Jęczmień zwyczajny | *Hordeum vulgare* | zboże | pole | `jeczmien-1.webp`, `jeczmien-2.webp`, `jeczmien-3.webp` |
| `owies` | Owies zwyczajny | *Avena sativa* | zboże | pole | `owies-1.webp`, `owies-2.webp`, `owies-3.webp` |
| `owies_cert` | Owies certyfikowany | *Avena sativa, uprawa bezglutenowa* | zboże | pole | `owies_cert-1.webp`, `owies_cert-2.webp`, `owies_cert-3.webp` |
| `ryz` | Ryż siewny | *Oryza sativa* | zboże | pole ryżowe | `ryz-1.webp`, `ryz-2.webp`, `ryz-3.webp` |
| `ryz_kl` | Ryż kleisty | *Oryza sativa var. glutinosa* | zboże | pole ryżowe | `ryz_kl-1.webp`, `ryz_kl-2.webp`, `ryz_kl-3.webp` |
| `kukurydza` | Kukurydza zwyczajna | *Zea mays* | zboże | pole | `kukurydza-1.webp`, `kukurydza-2.webp`, `kukurydza-3.webp` |
| `gryka` | Gryka zwyczajna | *Fagopyrum esculentum* | roślina zielna | pole | `gryka-1.webp`, `gryka-2.webp`, `gryka-3.webp` |
| `proso` | Proso zwyczajne | *Panicum miliaceum* | zboże | pole | `proso-1.webp`, `proso-2.webp`, `proso-3.webp` |
| `amarantus` | Szarłat | *Amaranthus cruentus / caudatus* | roślina zielna | pole | `amarantus-1.webp`, `amarantus-2.webp`, `amarantus-3.webp` |
| `quinoa` | Komosa ryżowa | *Chenopodium quinoa* | roślina zielna | pole | `quinoa-1.webp`, `quinoa-2.webp`, `quinoa-3.webp` |
| `teff` | Miłka abisyńska | *Eragrostis tef* | zboże | szklarnia | `teff-1.webp`, `teff-2.webp`, `teff-3.webp` |
| `sorgo` | Sorgo dwubarwne | *Sorghum bicolor* | zboże | pole | `sorgo-1.webp`, `sorgo-2.webp`, `sorgo-3.webp` |
| `ragi` | Proso palczaste (Ragi) | *Eleusine coracana* | zboże | szklarnia | `ragi-1.webp`, `ragi-2.webp`, `ragi-3.webp` |
| `bajra` | Proso perłowe | *Pennisetum glaucum* | zboże | szklarnia | `bajra-1.webp`, `bajra-2.webp`, `bajra-3.webp` |
| `fonio` | Fonio | *Digitaria exilis* | zboże | szklarnia | `fonio-1.webp`, `fonio-2.webp`, `fonio-3.webp` |
| `dziki_ryz` | Dziki ryż | *Zizania aquatica* | zboże | pole ryżowe | `dziki_ryz-1.webp`, `dziki_ryz-2.webp`, `dziki_ryz-3.webp` |
| `ciecierzyca` | Ciecierzyca pospolita | *Cicer arietinum* | strączkowa | pole | `ciecierzyca-1.webp`, `ciecierzyca-2.webp`, `ciecierzyca-3.webp` |
| `soczewica` | Soczewica jadalna | *Lens culinaris* | strączkowa | pole | `soczewica-1.webp`, `soczewica-2.webp`, `soczewica-3.webp` |
| `soja` | Soja zwyczajna | *Glycine max* | strączkowa | pole | `soja-1.webp`, `soja-2.webp`, `soja-3.webp` |
| `groch` | Groch zwyczajny | *Pisum sativum* | strączkowa | pole | `groch-1.webp`, `groch-2.webp`, `groch-3.webp` |
| `bob` | Bób | *Vicia faba* | strączkowa | pole | `bob-1.webp`, `bob-2.webp`, `bob-3.webp` |
| `lubin` | Łubin słodki | *Lupinus angustifolius / albus* | strączkowa | pole | `lubin-1.webp`, `lubin-2.webp`, `lubin-3.webp` |
| `fasola` | Fasola zwyczajna | *Phaseolus vulgaris* | strączkowa | pole | `fasola-1.webp`, `fasola-2.webp`, `fasola-3.webp` |
| `mung` | Fasola złota (mung) | *Vigna radiata* | strączkowa | szklarnia | `mung-1.webp`, `mung-2.webp`, `mung-3.webp` |
| `urad` | Fasola mungo (urad) | *Vigna mungo* | strączkowa | szklarnia | `urad-1.webp`, `urad-2.webp`, `urad-3.webp` |
| `migdalowiec` | Migdałowiec zwyczajny | *Prunus dulcis* | drzewo | szklarnia | `migdalowiec-1.webp`, `migdalowiec-2.webp`, `migdalowiec-3.webp`, `migdalowiec-4.webp` |
| `orzech_wl` | Orzech włoski | *Juglans regia* | drzewo | pole | `orzech_wl-1.webp`, `orzech_wl-2.webp`, `orzech_wl-3.webp`, `orzech_wl-4.webp` |
| `leszczyna` | Leszczyna pospolita | *Corylus avellana* | krzew | pole | `leszczyna-1.webp`, `leszczyna-2.webp`, `leszczyna-3.webp`, `leszczyna-4.webp` |
| `arachid` | Orzech ziemny | *Arachis hypogaea* | bulwiasta | szklarnia | `arachid-1.webp`, `arachid-2.webp`, `arachid-3.webp` |
| `slonecznik` | Słonecznik zwyczajny | *Helianthus annuus* | roślina zielna | pole | `slonecznik-1.webp`, `slonecznik-2.webp`, `slonecznik-3.webp` |
| `len` | Len zwyczajny | *Linum usitatissimum* | roślina zielna | pole | `len-1.webp`, `len-2.webp`, `len-3.webp` |
| `dynia` | Dynia olbrzymia | *Cucurbita pepo / maxima* | warzywo | pole | `dynia-1.webp`, `dynia-2.webp`, `dynia-3.webp` |
| `konopie` | Konopie siewne | *Cannabis sativa* | roślina zielna | pole | `konopie-1.webp`, `konopie-2.webp`, `konopie-3.webp` |
| `sezam` | Sezam indyjski | *Sesamum indicum* | roślina zielna | szklarnia | `sezam-1.webp`, `sezam-2.webp`, `sezam-3.webp` |
| `nerkowiec` | Nanercz zachodni | *Anacardium occidentale* | drzewo | szklarnia | `nerkowiec-1.webp`, `nerkowiec-2.webp`, `nerkowiec-3.webp`, `nerkowiec-4.webp` |
| `makadamia` | Orzechowiec makadamia | *Macadamia integrifolia* | drzewo | szklarnia | `makadamia-1.webp`, `makadamia-2.webp`, `makadamia-3.webp`, `makadamia-4.webp` |
| `kasztan` | Kasztan jadalny | *Castanea sativa* | drzewo | pole | `kasztan-1.webp`, `kasztan-2.webp`, `kasztan-3.webp`, `kasztan-4.webp` |
| `czarnuszka` | Czarnuszka siewna | *Nigella sativa* | roślina zielna | pole | `czarnuszka-1.webp`, `czarnuszka-2.webp`, `czarnuszka-3.webp` |
| `wiesiolek` | Wiesiołek dwuletni | *Oenothera biennis* | roślina zielna | pole | `wiesiolek-1.webp`, `wiesiolek-2.webp`, `wiesiolek-3.webp` |
| `ziemniak` | Ziemniak | *Solanum tuberosum* | bulwiasta | pole | `ziemniak-1.webp`, `ziemniak-2.webp`, `ziemniak-3.webp` |
| `maniok` | Maniok jadalny | *Manihot esculenta* | bulwiasta | szklarnia | `maniok-1.webp`, `maniok-2.webp`, `maniok-3.webp` |
| `kokos` | Palma kokosowa | *Cocos nucifera* | bylina tropikalna | szklarnia | `kokos-1.webp`, `kokos-2.webp`, `kokos-3.webp`, `kokos-4.webp` |
| `banan` | Banan rajski | *Musa × paradisiaca* | bylina tropikalna | szklarnia | `banan-1.webp`, `banan-2.webp`, `banan-3.webp`, `banan-4.webp` |
| `batat` | Wilec ziemniaczany | *Ipomoea batatas* | bulwiasta | szklarnia | `batat-1.webp`, `batat-2.webp`, `batat-3.webp` |
| `maranta` | Maranta trzcinowa | *Maranta arundinacea* | bulwiasta | szklarnia | `maranta-1.webp`, `maranta-2.webp`, `maranta-3.webp` |
| `taro` | Kolokazja jadalna | *Colocasia esculenta* | bulwiasta | pole ryżowe | `taro-1.webp`, `taro-2.webp`, `taro-3.webp` |
| `jam` | Pochrzyn (jam) | *Dioscorea alata* | bulwiasta | szklarnia | `jam-1.webp`, `jam-2.webp`, `jam-3.webp` |
| `dab` | Dąb szypułkowy | *Quercus robur / petraea* | drzewo | pole | `dab-1.webp`, `dab-2.webp`, `dab-3.webp`, `dab-4.webp` |
| `chlebowiec` | Chlebowiec właściwy | *Artocarpus altilis* | drzewo | szklarnia | `chlebowiec-1.webp`, `chlebowiec-2.webp`, `chlebowiec-3.webp`, `chlebowiec-4.webp` |
| `szaranczyn` | Szarańczyn strąkowy | *Ceratonia siliqua* | drzewo | szklarnia | `szaranczyn-1.webp`, `szaranczyn-2.webp`, `szaranczyn-3.webp`, `szaranczyn-4.webp` |
| `jablon` | Jabłoń domowa | *Malus domestica* | drzewo | pole | `jablon-1.webp`, `jablon-2.webp`, `jablon-3.webp`, `jablon-4.webp` |
| `roza` | Róża dzika | *Rosa canina* | krzew | pole | `roza-1.webp`, `roza-2.webp`, `roza-3.webp`, `roza-4.webp` |
| `rokitnik` | Rokitnik zwyczajny | *Hippophae rhamnoides* | krzew | pole | `rokitnik-1.webp`, `rokitnik-2.webp`, `rokitnik-3.webp`, `rokitnik-4.webp` |
| `aronia` | Aronia czarnoowocowa | *Aronia melanocarpa* | krzew | pole | `aronia-1.webp`, `aronia-2.webp`, `aronia-3.webp`, `aronia-4.webp` |
| `winorosl` | Winorośl właściwa | *Vitis vinifera* | krzew | pole | `winorosl-1.webp`, `winorosl-2.webp`, `winorosl-3.webp`, `winorosl-4.webp` |
| `burak` | Burak ćwikłowy | *Beta vulgaris* | bulwiasta | pole | `burak-1.webp`, `burak-2.webp`, `burak-3.webp` |
| `kalafior` | Kalafior | *Brassica oleracea var. botrytis* | warzywo | pole | `kalafior-1.webp`, `kalafior-2.webp`, `kalafior-3.webp` |

Razem: 211 plików etapów + 6 podłoży.

## Paczka B — zima na polu

Zimą pole stoi: rośliny jednoroczne zasiane za późno przezimowują uśpione, a drzewa i krzewy na polu stoją przez zimę. Uprawy w szklarni zimą wyglądają normalnie, więc ich ta paczka nie dotyczy.

- Format i kadr jak w paczce A (768×512), **dokładnie ten sam kadr co odpowiadający plik letni**, folder `plots/`.
- Nazwa: `<id>-<etap>-zima.webp`.
- Rośliny jednoroczne: te same rośliny przyprószone śniegiem i oszronione, przygaszone kolory, ziemia/woda między rzędami biała lub skuta lodem. Etap 3 zimą: dojrzałe, niezebrane, przymarznięte i pochylone.
- Drzewa i krzewy: **gołe gałęzie** ze śniegiem na konarach (bez liści), etap 1–2 jako młode drzewka pod śniegiem, etap 3 jako gołe drzewo z kilkoma przemarzniętymi owocami, które zostały na gałęziach, etap 4 jako gołe drzewo bez owoców.

### B1. Rośliny jednoroczne (37 roślin × 3 = 111 plików)

- `pszenica` (Pszenica zwyczajna): `pszenica-1-zima.webp`, `pszenica-2-zima.webp`, `pszenica-3-zima.webp`
- `durum` (Pszenica twarda): `durum-1-zima.webp`, `durum-2-zima.webp`, `durum-3-zima.webp`
- `orkisz` (Orkisz): `orkisz-1-zima.webp`, `orkisz-2-zima.webp`, `orkisz-3-zima.webp`
- `plaskurka` (Płaskurka): `plaskurka-1-zima.webp`, `plaskurka-2-zima.webp`, `plaskurka-3-zima.webp`
- `samopsza` (Samopsza): `samopsza-1-zima.webp`, `samopsza-2-zima.webp`, `samopsza-3-zima.webp`
- `khorasan` (Pszenica Khorasan): `khorasan-1-zima.webp`, `khorasan-2-zima.webp`, `khorasan-3-zima.webp`
- `zyto` (Żyto zwyczajne): `zyto-1-zima.webp`, `zyto-2-zima.webp`, `zyto-3-zima.webp`
- `pszenzyto` (Pszenżyto): `pszenzyto-1-zima.webp`, `pszenzyto-2-zima.webp`, `pszenzyto-3-zima.webp`
- `jeczmien` (Jęczmień zwyczajny): `jeczmien-1-zima.webp`, `jeczmien-2-zima.webp`, `jeczmien-3-zima.webp`
- `owies` (Owies zwyczajny): `owies-1-zima.webp`, `owies-2-zima.webp`, `owies-3-zima.webp`
- `owies_cert` (Owies certyfikowany): `owies_cert-1-zima.webp`, `owies_cert-2-zima.webp`, `owies_cert-3-zima.webp`
- `ryz` (Ryż siewny): `ryz-1-zima.webp`, `ryz-2-zima.webp`, `ryz-3-zima.webp`
- `ryz_kl` (Ryż kleisty): `ryz_kl-1-zima.webp`, `ryz_kl-2-zima.webp`, `ryz_kl-3-zima.webp`
- `kukurydza` (Kukurydza zwyczajna): `kukurydza-1-zima.webp`, `kukurydza-2-zima.webp`, `kukurydza-3-zima.webp`
- `gryka` (Gryka zwyczajna): `gryka-1-zima.webp`, `gryka-2-zima.webp`, `gryka-3-zima.webp`
- `proso` (Proso zwyczajne): `proso-1-zima.webp`, `proso-2-zima.webp`, `proso-3-zima.webp`
- `amarantus` (Szarłat): `amarantus-1-zima.webp`, `amarantus-2-zima.webp`, `amarantus-3-zima.webp`
- `quinoa` (Komosa ryżowa): `quinoa-1-zima.webp`, `quinoa-2-zima.webp`, `quinoa-3-zima.webp`
- `sorgo` (Sorgo dwubarwne): `sorgo-1-zima.webp`, `sorgo-2-zima.webp`, `sorgo-3-zima.webp`
- `dziki_ryz` (Dziki ryż): `dziki_ryz-1-zima.webp`, `dziki_ryz-2-zima.webp`, `dziki_ryz-3-zima.webp`
- `ciecierzyca` (Ciecierzyca pospolita): `ciecierzyca-1-zima.webp`, `ciecierzyca-2-zima.webp`, `ciecierzyca-3-zima.webp`
- `soczewica` (Soczewica jadalna): `soczewica-1-zima.webp`, `soczewica-2-zima.webp`, `soczewica-3-zima.webp`
- `soja` (Soja zwyczajna): `soja-1-zima.webp`, `soja-2-zima.webp`, `soja-3-zima.webp`
- `groch` (Groch zwyczajny): `groch-1-zima.webp`, `groch-2-zima.webp`, `groch-3-zima.webp`
- `bob` (Bób): `bob-1-zima.webp`, `bob-2-zima.webp`, `bob-3-zima.webp`
- `lubin` (Łubin słodki): `lubin-1-zima.webp`, `lubin-2-zima.webp`, `lubin-3-zima.webp`
- `fasola` (Fasola zwyczajna): `fasola-1-zima.webp`, `fasola-2-zima.webp`, `fasola-3-zima.webp`
- `slonecznik` (Słonecznik zwyczajny): `slonecznik-1-zima.webp`, `slonecznik-2-zima.webp`, `slonecznik-3-zima.webp`
- `len` (Len zwyczajny): `len-1-zima.webp`, `len-2-zima.webp`, `len-3-zima.webp`
- `dynia` (Dynia olbrzymia): `dynia-1-zima.webp`, `dynia-2-zima.webp`, `dynia-3-zima.webp`
- `konopie` (Konopie siewne): `konopie-1-zima.webp`, `konopie-2-zima.webp`, `konopie-3-zima.webp`
- `czarnuszka` (Czarnuszka siewna): `czarnuszka-1-zima.webp`, `czarnuszka-2-zima.webp`, `czarnuszka-3-zima.webp`
- `wiesiolek` (Wiesiołek dwuletni): `wiesiolek-1-zima.webp`, `wiesiolek-2-zima.webp`, `wiesiolek-3-zima.webp`
- `ziemniak` (Ziemniak): `ziemniak-1-zima.webp`, `ziemniak-2-zima.webp`, `ziemniak-3-zima.webp`
- `taro` (Kolokazja jadalna): `taro-1-zima.webp`, `taro-2-zima.webp`, `taro-3-zima.webp`
- `burak` (Burak ćwikłowy): `burak-1-zima.webp`, `burak-2-zima.webp`, `burak-3-zima.webp`
- `kalafior` (Kalafior): `kalafior-1-zima.webp`, `kalafior-2-zima.webp`, `kalafior-3-zima.webp`

### B2. Drzewa i krzewy na polu (9 roślin × 4 = 36 plików)

- `orzech_wl` (Orzech włoski, drzewo): `orzech_wl-1-zima.webp`, `orzech_wl-2-zima.webp`, `orzech_wl-3-zima.webp`, `orzech_wl-4-zima.webp`
- `leszczyna` (Leszczyna pospolita, krzew): `leszczyna-1-zima.webp`, `leszczyna-2-zima.webp`, `leszczyna-3-zima.webp`, `leszczyna-4-zima.webp`
- `kasztan` (Kasztan jadalny, drzewo): `kasztan-1-zima.webp`, `kasztan-2-zima.webp`, `kasztan-3-zima.webp`, `kasztan-4-zima.webp`
- `dab` (Dąb szypułkowy, drzewo): `dab-1-zima.webp`, `dab-2-zima.webp`, `dab-3-zima.webp`, `dab-4-zima.webp`
- `jablon` (Jabłoń domowa, drzewo): `jablon-1-zima.webp`, `jablon-2-zima.webp`, `jablon-3-zima.webp`, `jablon-4-zima.webp`
- `roza` (Róża dzika, krzew): `roza-1-zima.webp`, `roza-2-zima.webp`, `roza-3-zima.webp`, `roza-4-zima.webp`
- `rokitnik` (Rokitnik zwyczajny, krzew): `rokitnik-1-zima.webp`, `rokitnik-2-zima.webp`, `rokitnik-3-zima.webp`, `rokitnik-4-zima.webp`
- `aronia` (Aronia czarnoowocowa, krzew): `aronia-1-zima.webp`, `aronia-2-zima.webp`, `aronia-3-zima.webp`, `aronia-4-zima.webp`
- `winorosl` (Winorośl właściwa, krzew): `winorosl-1-zima.webp`, `winorosl-2-zima.webp`, `winorosl-3-zima.webp`, `winorosl-4-zima.webp`

## Paczka C — ikony przedmiotów

Ikony w Spiżarni, na Targu, w przetwórni i w oknie siewu. Dziś to proste rysunki, a przy małym rozmiarze wiele z nich wygląda tak samo.

- Format: **256×256 px, przezroczyste tło**, folder `items/`, nazwa `<id>.webp`.
- Jeden wyraźny przedmiot na środku, zajmuje ok. 80% kwadratu, delikatny cień pod spodem (bez tła i bez podłoża).
- **Czytelność w 40×40 px**: wyrazista sylwetka i kolor, bez drobnych detali. Podobne rzeczy muszą się różnić kształtem lub kolorem (np. kłosy pszenicy, żyta i orkiszu: inna długość ości, gęstość kłosa, odcień).
- Na ikonie po prawej u dołu gra dokleja liczbę, więc ten róg niech będzie spokojniejszy.

### C1. Plony (65) — zbliżenie tego, co daje zbiór

- `k_psz` — Kłosy pszenicy (z rośliny: Pszenica zwyczajna, *Triticum aestivum*)
- `k_dur` — Kłosy pszenicy twardej (z rośliny: Pszenica twarda, *Triticum durum*)
- `k_ork` — Kłosy orkiszu (z rośliny: Orkisz, *Triticum spelta*)
- `k_pla` — Kłosy płaskurki (z rośliny: Płaskurka, *Triticum dicoccum*)
- `k_sam` — Kłosy samopszy (z rośliny: Samopsza, *Triticum monococcum*)
- `k_kho` — Kłosy Khorasan (z rośliny: Pszenica Khorasan, *Triticum turgidum*)
- `k_zyt` — Kłosy żyta (z rośliny: Żyto zwyczajne, *Secale cereale*)
- `k_pzy` — Kłosy pszenżyta (z rośliny: Pszenżyto, *×Triticosecale*)
- `k_jec` — Kłosy jęczmienia (z rośliny: Jęczmień zwyczajny, *Hordeum vulgare*)
- `k_owi` — Wiechy owsa (z rośliny: Owies zwyczajny, *Avena sativa*)
- `k_owc` — Wiechy owsa certyfikowanego (z rośliny: Owies certyfikowany, *Avena sativa, uprawa bezglutenowa*)
- `k_ryz` — Wiechy ryżu (z rośliny: Ryż siewny, *Oryza sativa*)
- `k_rkl` — Wiechy ryżu kleistego (z rośliny: Ryż kleisty, *Oryza sativa var. glutinosa*)
- `kolby` — Kolby kukurydzy (z rośliny: Kukurydza zwyczajna, *Zea mays*)
- `n_gry` — Nasiona gryki (z rośliny: Gryka zwyczajna, *Fagopyrum esculentum*)
- `k_pro` — Wiechy prosa (z rośliny: Proso zwyczajne, *Panicum miliaceum*)
- `k_ama` — Kwiatostany szarłatu (z rośliny: Szarłat, *Amaranthus cruentus / caudatus*)
- `k_qui` — Wiechy komosy (z rośliny: Komosa ryżowa, *Chenopodium quinoa*)
- `k_tef` — Wiechy teffu (z rośliny: Miłka abisyńska, *Eragrostis tef*)
- `k_sor` — Wiechy sorgo (z rośliny: Sorgo dwubarwne, *Sorghum bicolor*)
- `k_rag` — Kłosy ragi (z rośliny: Proso palczaste (Ragi), *Eleusine coracana*)
- `k_baj` — Kolby prosa perłowego (z rośliny: Proso perłowe, *Pennisetum glaucum*)
- `k_fon` — Wiechy fonio (z rośliny: Fonio, *Digitaria exilis*)
- `k_dry` — Wiechy dzikiego ryżu (z rośliny: Dziki ryż, *Zizania aquatica*)
- `s_cie` — Strąki ciecierzycy (z rośliny: Ciecierzyca pospolita, *Cicer arietinum*)
- `s_soc` — Strąki soczewicy (z rośliny: Soczewica jadalna, *Lens culinaris*)
- `s_soj` — Strąki soi (z rośliny: Soja zwyczajna, *Glycine max*)
- `s_gro` — Strąki grochu (z rośliny: Groch zwyczajny, *Pisum sativum*)
- `s_bob` — Strąki bobu (z rośliny: Bób, *Vicia faba*)
- `s_lub` — Strąki łubinu (z rośliny: Łubin słodki, *Lupinus angustifolius / albus*)
- `s_fas` — Strąki fasoli (z rośliny: Fasola zwyczajna, *Phaseolus vulgaris*)
- `s_mun` — Strąki fasoli mung (z rośliny: Fasola złota (mung), *Vigna radiata*)
- `s_ura` — Strąki urad (z rośliny: Fasola mungo (urad), *Vigna mungo*)
- `mig_lup` — Migdały w łupinie (z rośliny: Migdałowiec zwyczajny, *Prunus dulcis*)
- `wl_lup` — Orzechy włoskie w łupinie (z rośliny: Orzech włoski, *Juglans regia*)
- `las_lup` — Orzechy laskowe w łupinie (z rośliny: Leszczyna pospolita, *Corylus avellana*)
- `ara_lup` — Strąki orzeszków ziemnych (z rośliny: Orzech ziemny, *Arachis hypogaea*)
- `kosz` — Koszyczki słonecznika (z rośliny: Słonecznik zwyczajny, *Helianthus annuus*)
- `tor_len` — Torebki lnu (z rośliny: Len zwyczajny, *Linum usitatissimum*)
- `dynia` — Dynie (z rośliny: Dynia olbrzymia, *Cucurbita pepo / maxima*)
- `k_kon` — Kwiatostany konopi (z rośliny: Konopie siewne, *Cannabis sativa*)
- `k_sez` — Torebki sezamu (z rośliny: Sezam indyjski, *Sesamum indicum*)
- `jab_nerk` — Jabłka nerkowca (z rośliny: Nanercz zachodni, *Anacardium occidentale*)
- `mak_lup` — Makadamia w łupinie (z rośliny: Orzechowiec makadamia, *Macadamia integrifolia*)
- `kaszt` — Kasztany jadalne (z rośliny: Kasztan jadalny, *Castanea sativa*)
- `k_cza` — Torebki czarnuszki (z rośliny: Czarnuszka siewna, *Nigella sativa*)
- `k_wie` — Torebki wiesiołka (z rośliny: Wiesiołek dwuletni, *Oenothera biennis*)
- `ziem` — Bulwy ziemniaka (z rośliny: Ziemniak, *Solanum tuberosum*)
- `man` — Korzenie manioku (z rośliny: Maniok jadalny, *Manihot esculenta*)
- `kokos` — Kokosy (z rośliny: Palma kokosowa, *Cocos nucifera*)
- `banan` — Zielone banany (z rośliny: Banan rajski, *Musa × paradisiaca*)
- `batat` — Bulwy batata (z rośliny: Wilec ziemniaczany, *Ipomoea batatas*)
- `mar_kl` — Kłącza maranty (z rośliny: Maranta trzcinowa, *Maranta arundinacea*)
- `taro` — Bulwy taro (z rośliny: Kolokazja jadalna, *Colocasia esculenta*)
- `jam` — Bulwy jamu (z rośliny: Pochrzyn (jam), *Dioscorea alata*)
- `zol` — Żołędzie (z rośliny: Dąb szypułkowy, *Quercus robur / petraea*)
- `chleb` — Owoce chlebowca (z rośliny: Chlebowiec właściwy, *Artocarpus altilis*)
- `karob` — Strąki karobu (z rośliny: Szarańczyn strąkowy, *Ceratonia siliqua*)
- `jab` — Jabłka (z rośliny: Jabłoń domowa, *Malus domestica*)
- `roza` — Owoce dzikiej róży (z rośliny: Róża dzika, *Rosa canina*)
- `rok` — Owoce rokitnika (z rośliny: Rokitnik zwyczajny, *Hippophae rhamnoides*)
- `aro` — Owoce aronii (z rośliny: Aronia czarnoowocowa, *Aronia melanocarpa*)
- `wino` — Winogrona (z rośliny: Winorośl właściwa, *Vitis vinifera*)
- `burak` — Korzenie buraka (z rośliny: Burak ćwikłowy, *Beta vulgaris*)
- `kalaf` — Kalafiory (z rośliny: Kalafior, *Brassica oleracea var. botrytis*)

### C2. Półprodukty (148) — etapy obróbki

Ziarno, łuska, śruta, susz, mleczko skrobiowe, makuch itd. Pokazane jako garść / mała miseczka / kupka / plastry, tak żeby było widać stan obróbki (np. ziarno w plewach vs obłuskane, surowe vs prażone, plastry vs susz). Mleczka skrobiowe: mała misa z białawym płynem. Makuchy: sprasowany placek/kostka.

- `z_psz` — Ziarno pszenicy (kolor ok. #d8b04f)
- `z_dur` — Ziarno pszenicy twardej (kolor ok. #e0b53a)
- `p_ork` — Orkisz w plewach (kolor ok. #c99a4a)
- `z_ork` — Ziarno orkiszu (kolor ok. #c99a4a)
- `p_pla` — Płaskurka w plewach (kolor ok. #b98a45)
- `z_pla` — Ziarno płaskurki (kolor ok. #b98a45)
- `p_sam` — Samopsza w plewach (kolor ok. #c7a25e)
- `z_sam` — Ziarno samopszy (kolor ok. #c7a25e)
- `z_kho` — Ziarno Khorasan (kolor ok. #d9a845)
- `z_zyt` — Ziarno żyta (kolor ok. #a88a5c)
- `z_pzy` — Ziarno pszenżyta (kolor ok. #bf9c55)
- `p_jec` — Jęczmień w plewach (kolor ok. #d4bb6c)
- `z_jec` — Jęczmień obłuskany (kolor ok. #d4bb6c)
- `p_owi` — Owies w plewach (kolor ok. #cfc08a)
- `z_owi` — Ziarno owsa (kolor ok. #cfc08a)
- `z_owis` — Owies stabilizowany (kolor ok. #cfc08a)
- `p_owc` — Owies certyfikowany w plewach (kolor ok. #dccf98)
- `z_owc` — Ziarno owsa certyfikowanego (kolor ok. #dccf98)
- `z_owcs` — Owies certyfikowany stabilizowany (kolor ok. #dccf98)
- `ryz_nl` — Ryż niełuskany (kolor ok. #d6c27a)
- `ryz_br` — Ryż brązowy (kolor ok. #d6c27a)
- `ryz_bi` — Ryż biały (kolor ok. #f4efe0)
- `rkl_nl` — Ryż kleisty niełuskany (kolor ok. #e3d6a0)
- `rkl_br` — Ryż kleisty brązowy (kolor ok. #e3d6a0)
- `rkl_bi` — Ryż kleisty biały (kolor ok. #e3d6a0)
- `rkl_m` — Namoczony ryż kleisty (kolor ok. #e3d6a0)
- `rkl_masa` — Masa ryżowa (kolor ok. #e3d6a0)
- `z_kuk` — Ziarno kukurydzy (kolor ok. #f0c030)
- `nixt` — Nixtamal (kolor ok. #f0c030)
- `nixt_p` — Nixtamal wypłukany (kolor ok. #f0c030)
- `nixt_s` — Nixtamal suszony (kolor ok. #f0c030)
- `kasza_g` — Kasza gryczana niepalona (kolor ok. #8a6a4a)
- `kasza_gp` — Kasza gryczana palona (kolor ok. #8a6a4a)
- `p_pro` — Proso w łusce (kolor ok. #e8c860)
- `kasza_j` — Kasza jaglana (kolor ok. #e8c860)
- `n_ama` — Nasiona szarłatu (kolor ok. #c0406a)
- `n_qui` — Nasiona komosy (kolor ok. #d98a3a)
- `n_quip` — Komosa wypłukana (kolor ok. #d98a3a)
- `n_quis` — Komosa suszona (kolor ok. #d98a3a)
- `n_tef` — Ziarenka teffu (kolor ok. #a06a48)
- `p_sor` — Sorgo w łusce (kolor ok. #b0583a)
- `z_sor` — Ziarno sorgo (kolor ok. #b0583a)
- `z_rag` — Ziarno ragi (kolor ok. #8a4a3a)
- `z_baj` — Ziarno prosa perłowego (kolor ok. #9a9a7a)
- `p_fon` — Fonio w łusce (kolor ok. #d8c890)
- `z_fon` — Ziarno fonio (kolor ok. #d8c890)
- `dry_s` — Dziki ryż surowy (kolor ok. #5a4030)
- `dry_p` — Dziki ryż prażony (kolor ok. #5a4030)
- `z_dry` — Ziarno dzikiego ryżu (kolor ok. #5a4030)
- `n_cie` — Nasiona ciecierzycy (kolor ok. #d8b878)
- `cie_dal` — Chana dal (kolor ok. #d8b878)
- `n_soc` — Nasiona soczewicy (kolor ok. #b06a40)
- `soc_l` — Soczewica czerwona łuskana (kolor ok. #e88a50)
- `n_soj` — Ziarna soi (kolor ok. #d8c080)
- `soj_p` — Soja prażona (kolor ok. #d8c080)
- `soj_l` — Soja łuskana (kolor ok. #d8c080)
- `n_gro` — Nasiona grochu (kolor ok. #9ac040)
- `gro_l` — Groch łuskany połówki (kolor ok. #9ac040)
- `n_bob` — Nasiona bobu (kolor ok. #88b050)
- `bob_l` — Bób łuskany (kolor ok. #88b050)
- `n_lub` — Nasiona łubinu (kolor ok. #e0d070)
- `lub_l` — Łubin łuskany (kolor ok. #e0d070)
- `n_fas` — Nasiona fasoli (kolor ok. #c04848)
- `fas_p` — Fasola podprażona (kolor ok. #c04848)
- `n_mun` — Nasiona mung (kolor ok. #5a9a40)
- `mun_d` — Mung dal (kolor ok. #5a9a40)
- `n_ura` — Nasiona urad (kolor ok. #4a4040)
- `ura_d` — Urad dal (kolor ok. #ece6d6)
- `mig` — Migdały ze skórką (kolor ok. #c08a5a)
- `mig_b` — Migdały blanszowane (kolor ok. #f0e2c8)
- `wl` — Orzechy włoskie łuskane (kolor ok. #8a6a40)
- `wl_mak` — Makuch z orzechów włoskich (kolor ok. #8a6a40)
- `las` — Orzechy laskowe łuskane (kolor ok. #a0703a)
- `las_p` — Orzechy laskowe prażone (kolor ok. #a0703a)
- `ara` — Orzeszki ziemne (kolor ok. #d0a870)
- `ara_p` — Orzeszki prażone (kolor ok. #d0a870)
- `ara_mak` — Makuch arachidowy (kolor ok. #d0a870)
- `n_slo` — Nasiona słonecznika (kolor ok. #f0c020)
- `slo_l` — Słonecznik łuskany (kolor ok. #f0c020)
- `slo_mak` — Makuch słonecznikowy (kolor ok. #f0c020)
- `siemie` — Siemię lniane (kolor ok. #6a8ad0)
- `len_mak` — Makuch lniany (kolor ok. #6a8ad0)
- `pestki` — Pestki dyni (kolor ok. #e8dca0)
- `miazsz` — Miąższ dyni (kolor ok. #e07a20)
- `pestki_s` — Pestki dyni suszone (kolor ok. #e8dca0)
- `pestki_l` — Pestki dyni łuskane (kolor ok. #6a8a4a)
- `pes_mak` — Makuch z pestek dyni (kolor ok. #6a8a4a)
- `miazsz_s` — Susz z dyni (kolor ok. #e07a20)
- `n_kon` — Nasiona konopi (kolor ok. #7a9a3a)
- `kon_mak` — Makuch konopny (kolor ok. #7a9a3a)
- `n_sez` — Nasiona sezamu (kolor ok. #e8dcb8)
- `sez_m` — Sezam namoczony (kolor ok. #e8dcb8)
- `sez_l` — Sezam łuskany (kolor ok. #e8dcb8)
- `sez_mak` — Makuch sezamowy (kolor ok. #e8dcb8)
- `ner_lup` — Nerkowce w łupinie (kolor ok. #8a7a5a)
- `ner_p` — Nerkowce prażone w łupinie (kolor ok. #8a7a5a)
- `ner` — Nerkowce (kolor ok. #ecdcbc)
- `mak` — Orzechy makadamia (kolor ok. #f0e4c8)
- `mak_mak` — Makuch makadamia (kolor ok. #f0e4c8)
- `kaszt_s` — Kasztany suszone (kolor ok. #7a4a28)
- `kaszt_l` — Kasztany łuskane (kolor ok. #7a4a28)
- `n_cza` — Nasiona czarnuszki (kolor ok. #2a2628)
- `cza_mak` — Makuch z czarnuszki (kolor ok. #2a2628)
- `n_wie` — Nasiona wiesiołka (kolor ok. #6a5040)
- `wie_mak` — Makuch z wiesiołka (kolor ok. #6a5040)
- `skr_z` — Mleczko skrobiowe (kolor ok. #c8a060)
- `man_ob` — Maniok obrany (kolor ok. #efe4cc)
- `man_m` — Maniok namoczony (kolor ok. #efe4cc)
- `man_s` — Maniok suszony (kolor ok. #efe4cc)
- `skr_m` — Mleczko z manioku (kolor ok. #efe4cc)
- `kok_m` — Miąższ kokosa (kolor ok. #f4eee0)
- `kok_w` — Wiórki kokosowe (kolor ok. #f4eee0)
- `kok_ws` — Wiórki suszone (kolor ok. #f4eee0)
- `kok_mak` — Odtłuszczone wiórki (kolor ok. #f4eee0)
- `ban_pl` — Plastry zielonego banana (kolor ok. #7ab030)
- `ban_s` — Susz bananowy (kolor ok. #7ab030)
- `bat_pl` — Plastry batata (kolor ok. #d07040)
- `bat_s` — Susz z batata (kolor ok. #d07040)
- `skr_mar` — Mleczko z maranty (kolor ok. #d8c8a8)
- `mar_s` — Surowa skrobia maranty (kolor ok. #d8c8a8)
- `taro_pl` — Plastry taro (kolor ok. #8a7090)
- `taro_b` — Taro blanszowane (kolor ok. #8a7090)
- `taro_s` — Susz z taro (kolor ok. #8a7090)
- `jam_pl` — Plastry jamu (kolor ok. #9a5a9a)
- `jam_s` — Susz z jamu (kolor ok. #9a5a9a)
- `zol_l` — Żołędzie łuskane (kolor ok. #8a6a30)
- `zol_sr` — Śruta żołędziowa (kolor ok. #8a6a30)
- `zol_lg` — Śruta odgoryczona (kolor ok. #8a6a30)
- `zol_s` — Śruta żołędziowa suszona (kolor ok. #8a6a30)
- `chl_pl` — Plastry chlebowca (kolor ok. #a0c040)
- `chl_s` — Susz z chlebowca (kolor ok. #a0c040)
- `kar_m` — Miąższ strąków karobu (kolor ok. #5a3020)
- `kar_p` — Karob prażony (kolor ok. #5a3020)
- `jab_w` — Wytłoki jabłkowe (kolor ok. #b88a4a)
- `jab_ws` — Wytłoki jabłkowe suszone (kolor ok. #b88a4a)
- `roza_s` — Owoce róży suszone (kolor ok. #d02a20)
- `roza_sr` — Śruta z dzikiej róży (kolor ok. #d02a20)
- `rok_s` — Owoce rokitnika suszone (kolor ok. #f08a10)
- `aro_w` — Wytłoki aroniowe (kolor ok. #4a2050)
- `aro_ws` — Wytłoki aroniowe suszone (kolor ok. #4a2050)
- `win_w` — Wytłoki winogronowe (kolor ok. #7a3a7a)
- `pes_win` — Pestki winogron (kolor ok. #6a4a3a)
- `pes_ws` — Pestki winogron suszone (kolor ok. #6a4a3a)
- `win_mak` — Makuch z pestek winogron (kolor ok. #6a4a3a)
- `bur_pl` — Plastry buraka (kolor ok. #a01a44)
- `bur_s` — Susz z buraka (kolor ok. #a01a44)
- `kal_r` — Różyczki kalafiora (kolor ok. #efe8d0)
- `kal_s` — Susz z kalafiora (kolor ok. #efe8d0)

### C3. Mąki (70)

Każda mąka jako **mały lniany worek otwarty u góry**, z mąką w jej prawdziwym kolorze, z małym znakiem źródła obok lub na worku (np. kłos, strąk, orzech, owoc, bulwa), żeby 70 worków dało się odróżnić. Kolor mąki podany obok. Dział (z Księgi mąk) może subtelnie różnić worek, np. kolor sznurka:
- dział 1: Zboża glutenowe
- dział 2: Zboża i pseudozboża bezglutenowe
- dział 3: Rośliny strączkowe
- dział 4: Orzechy i nasiona oleiste
- dział 5: Skrobie, bulwy, korzenie i owoce
- dział 6: Owocowe, warzywne i specjalistyczne

- `m_psz` — Mąka pszenna zwyczajna (dział 1, kolor ok. #f3ead2; z ziarna pszenicy zwyczajnej (Triticum aestivum))
- `m_dur` — Mąka pszenna twarda (Semolina) (dział 1, kolor ok. #ecd27a; z ziarna pszenicy twardej (Triticum durum))
- `m_ork` — Mąka orkiszowa (dział 1, kolor ok. #e6d3a8; ze starożytnego gatunku pszenicy orkisz (Triticum spelta))
- `m_pla` — Mąka z płaskurki (dział 1, kolor ok. #dcc396; ze starożytnej pszenicy płaskurki (Triticum dicoccum))
- `m_sam` — Mąka z samopszy (dział 1, kolor ok. #e8cf8a; z najstarszej znanej pszenicy samopszy (Triticum monococcum))
- `m_kho` — Mąka Kamut (Khorasan) (dział 1, kolor ok. #e9cd86; z pszenicy starożytnej odmiany Khorasan (Triticum turgidum))
- `m_zyt` — Mąka żytnia (dział 1, kolor ok. #c9b597; z ziarna żyta zwyczajnego (Secale cereale))
- `m_pzy` — Mąka pszenżytnia (dział 1, kolor ok. #ddcdaa; z pszenżyta (Triticosecale), krzyżówki pszenicy i żyta)
- `m_jec` — Mąka jęczmienna (dział 1, kolor ok. #e2d5b2; z ziarna jęczmienia zwyczajnego (Hordeum vulgare))
- `m_owi` — Mąka owsiana (tradycyjna) (dział 1, kolor ok. #e6dcc0; z owsa zwyczajnego (Avena sativa) przetwarzanego na liniach z obecnością glutenu)
- `m_ryzb` — Mąka ryżowa biała (dział 2, kolor ok. #f7f4ec; z oczyszczonego ziarna ryżu siewnego (Oryza sativa))
- `m_ryzbr` — Mąka ryżowa brązowa (pełnoziarnista) (dział 2, kolor ok. #cbb08a; z nieoczyszczonego ziarna ryżu siewnego (Oryza sativa))
- `m_mochi` — Mąka z ryżu kleistego (Mochiko / Shiratamako) (dział 2, kolor ok. #fbf8f0; ze specjalnej odmiany ryżu kleistego (Oryza sativa var. glutinosa))
- `m_kuk` — Mąka kukurydziana (dział 2, kolor ok. #f2c94a; z ziaren kukurydzy zwyczajnej (Zea mays))
- `m_masa` — Mąka Masa Harina (dział 2, kolor ok. #e9d08a; z kukurydzy (Zea mays) po nikstamalizacji, czyli gotowaniu w wodzie wapiennej)
- `m_gry` — Mąka gryczana (dział 2, kolor ok. #a89078; z nasion gryki zwyczajnej (Fagopyrum esculentum), z kaszy palonej lub niepalonej)
- `m_jag` — Mąka jaglana (dział 2, kolor ok. #f0d88a; z nasion prosa zwyczajnego (Panicum miliaceum))
- `m_owc` — Mąka owsiana bezglutenowa (dział 2, kolor ok. #ece2c8; z certyfikowanego, czystego biologicznie owsa zwyczajnego (Avena sativa))
- `m_ama` — Mąka z amarantusa (szarłatu) (dział 2, kolor ok. #e3cfa4; z nasion szarłatu (Amaranthus cruentus / caudatus))
- `m_qui` — Mąka z komosy ryżowej (Quinoa) (dział 2, kolor ok. #e8d7b0; z nasion komosy ryżowej (Chenopodium quinoa))
- `m_tef` — Mąka Teff (dział 2, kolor ok. #a2765a; z drobnych nasion miłki abisyńskiej (Eragrostis tef))
- `m_sor` — Mąka z sorgo (Jowar) (dział 2, kolor ok. #e0caa6; z ziarna sorgo dwubarwnego (Sorghum bicolor))
- `m_rag` — Mąka Ragi (Finger Millet) (dział 2, kolor ok. #9a6a5a; z nasion prosa palczastego (Eleusine coracana))
- `m_baj` — Mąka z prosa perłowego (Bajra) (dział 2, kolor ok. #b8b49c; z nasion prosa perłowego (Pennisetum glaucum))
- `m_fon` — Mąka z fonio (dział 2, kolor ok. #efe3c0; z drobnego ziarna afrykańskiego fonio (Digitaria exilis))
- `m_dry` — Mąka z dzikiego ryżu (dział 2, kolor ok. #6e5644; z nasion zizanii wodnej (Zizania aquatica))
- `m_cie` — Mąka z ciecierzycy (Besan) (dział 3, kolor ok. #ead08a; z nasion ciecierzycy pospolitej (Cicer arietinum))
- `m_soc_c` — Mąka z soczewicy czerwonej (dział 3, kolor ok. #f0a86a; z łuskanych nasion soczewicy jadalnej (Lens culinaris))
- `m_soc_z` — Mąka z soczewicy zielonej / brązowej (dział 3, kolor ok. #a8946a; z pełnych nasion soczewicy jadalnej (Lens culinaris))
- `m_soj` — Mąka sojowa (dział 3, kolor ok. #efd894; z ziaren soi zwyczajnej (Glycine max))
- `m_gro` — Mąka z grochu żółtego lub zielonego (dział 3, kolor ok. #d8d47a; z nasion grochu zwyczajnego (Pisum sativum))
- `m_bob` — Mąka z bobu (dział 3, kolor ok. #d6c89a; z nasion bobu (Vicia faba))
- `m_lub` — Mąka z łubinu (dział 3, kolor ok. #f2dc7a; ze słodkich odmian łubinu wąskolistnego lub białego (Lupinus angustifolius / albus))
- `m_fas` — Mąka z fasoli (białej, czarnej, czerwonej) (dział 3, kolor ok. #e2cfc0; z wybranych odmian fasoli zwyczajnej (Phaseolus vulgaris))
- `m_mun` — Mąka z fasoli Mung (dział 3, kolor ok. #e6dc8a; z nasion fasoli złotej (Vigna radiata))
- `m_ura` — Mąka z urad dal (dział 3, kolor ok. #ece6d6; z nasion fasoli mungo (Vigna mungo))
- `m_mig` — Mąka migdałowa (dział 4, kolor ok. #efdcc0; z nasion migdałowca zwyczajnego (Prunus dulcis), ze skórką lub blanszowanych)
- `m_wl` — Mąka z orzechów włoskich (dział 4, kolor ok. #b8946a; z owoców orzecha włoskiego (Juglans regia))
- `m_las` — Mąka z orzechów laskowych (dział 4, kolor ok. #c8a07a; z owoców leszczyny pospolitej (Corylus avellana))
- `m_ara` — Mąka z orzechów arachidowych (ziemnych) (dział 4, kolor ok. #d8b07a; z nasion orzecha ziemnego (Arachis hypogaea))
- `m_slo` — Mąka z nasion słonecznika (dział 4, kolor ok. #bdb4a0; z nasion słonecznika zwyczajnego (Helianthus annuus))
- `m_len` — Mąka z siemienia lnianego (dział 4, kolor ok. #a8804a; z nasion lnu zwyczajnego (Linum usitatissimum), pełnotłusta lub odtłuszczona)
- `m_pes` — Mąka z pestek dyni (dział 4, kolor ok. #7a9a5a; z nasion dyni zwyczajnej lub olbrzymiej (Cucurbita pepo / maxima))
- `m_kon` — Mąka konopna (dział 4, kolor ok. #7a8a5a; z nasion konopi siewnych (Cannabis sativa))
- `m_sez` — Mąka z sezamu (dział 4, kolor ok. #eee2c4; z nasion sezamu indyjskiego (Sesamum indicum))
- `m_ner` — Mąka z orzechów nerkowca (dział 4, kolor ok. #ecdcbc; z nasion nanercza zachodniego (Anacardium occidentale))
- `m_mak` — Mąka z orzechów macadamia (dział 4, kolor ok. #f0e4c8; z owoców orzechowca makadamia (Macadamia integrifolia))
- `m_kas` — Mąka z kasztanów jadalnych (dział 4, kolor ok. #c8a880; z owoców kasztana jadalnego (Castanea sativa))
- `m_cza` — Mąka z czarnuszki (dział 4, kolor ok. #5a5258; z odtłuszczonych nasion czarnuszki siewnej (Nigella sativa))
- `m_wie` — Mąka z wiesiołka (dział 4, kolor ok. #8a7258; z nasion wiesiołka dwuletniego (Oenothera biennis))
- `m_ziem` — Mąka / skrobia ziemniaczana (dział 5, kolor ok. #fbfaf6; z bulw ziemniaka (Solanum tuberosum))
- `m_kasawa` — Mąka z kasawy (manioku) (dział 5, kolor ok. #f2ead8; z całego suszonego korzenia manioku jadalnego (Manihot esculenta))
- `m_tapioka` — Mąka z tapioki (dział 5, kolor ok. #fdfcf8; z wypłukanej czystej skrobi z korzenia manioku (Manihot esculenta))
- `m_kok` — Mąka kokosowa (dział 5, kolor ok. #f4eee0; z suszonego i odtłuszczonego miąższu kokosa (Cocos nucifera))
- `m_ban` — Mąka z zielonych bananów (platanów) (dział 5, kolor ok. #d8d0a8; z surowych, zielonych owoców banana rajskiego (Musa × paradisiaca))
- `m_bat` — Mąka ze słodkich ziemniaków (bataty) (dział 5, kolor ok. #e8a868; z bulw wilca ziemniaczanego (Ipomoea batatas))
- `m_arr` — Mąka Arrowroot (maranta) (dział 5, kolor ok. #fafaf5; z kłączy maranty trzcinowej (Maranta arundinacea))
- `m_taro` — Mąka Taro (dział 5, kolor ok. #c8b8c8; z bulw kolokazji jadalnej (Colocasia esculenta))
- `m_jam` — Mąka z jamu (Dioscorea) (dział 5, kolor ok. #b890b8; z bulw pochrzynu (Dioscorea alata))
- `m_zol` — Mąka z żołędzi (dział 5, kolor ok. #a07a4a; z odgoryczonych owoców dębu szypułkowego lub bezszypułkowego (Quercus robur / petraea))
- `m_chl` — Mąka z miąższu chlebowca (dział 5, kolor ok. #e2d8a8; z owoców chlebowca właściwego (Artocarpus altilis))
- `m_kar` — Mąka z chleba świętojańskiego (karob) (dział 5, kolor ok. #7a4a30; ze zmielonych strąków szarańczyna strąkowego (Ceratonia siliqua))
- `m_jab` — Mąka jabłkowa (dział 6, kolor ok. #c8945a; z wysuszonych wytłoków jabłek (Malus domestica))
- `m_roza` — Mąka z dzikiej róży (dział 6, kolor ok. #d8603a; z suszonych owoców róży dzikiej (Rosa canina))
- `m_rok` — Mąka z rokitnika (dział 6, kolor ok. #e8a030; z suszonych owoców rokitnika zwyczajnego (Hippophae rhamnoides))
- `m_aro` — Mąka z aronii (dział 6, kolor ok. #6a3058; z wytłoków aronii czarnoowocowej (Aronia melanocarpa))
- `m_win` — Mąka z nasion winogron (dział 6, kolor ok. #7a4444; z odtłuszczonych nasion winorośli właściwej (Vitis vinifera))
- `m_dyn` — Mąka z dyni (warzywna) (dział 6, kolor ok. #f0a040; z suszonego miąższu dyni (Cucurbita))
- `m_bur` — Mąka z buraka (dział 6, kolor ok. #b03060; z suszonego korzenia buraka ćwikłowego (Beta vulgaris))
- `m_kal` — Mąka z kalafiora (dział 6, kolor ok. #ece6cc; z suszonych różyczek kalafiora (Brassica oleracea var. botrytis))

### C4. Produkty uboczne i zaopatrzenie (5)

- `wapno` — Wapno spożywcze
- `otreby` — Otręby
- `olej` — Olej tłoczony
- `sok` — Sok owocowy
- `nas_kar` — Nasiona karobu

## Paczka D — maszyny (13)

Ilustracje maszyn w przetwórni i ulepszeniach. **512×512 px, przezroczyste tło**, folder `machines/`, nazwa `<id>.webp`. Rzemieślnicze, drewniano-żeliwne maszyny wiejskiego młyna (XIX/XX w.), widok 3/4, ten sam kąt i skala dla wszystkich. Do każdej druga wersja `<id>-praca.webp`: ta sama maszyna w pracy (ruch, pył, para, sypiące się ziarno), w identycznym kadrze, żeby dało się je podmieniać.

- `mlo` — Młocarnia: Oddziela ziarno i nasiona od kłosów, strąków, koszyczków i kolb.
- `zar` — Żarna: Mielą ziarno, nasiona, makuch i susz na mąkę.
- `lus` — Łuszczarka: Zdejmuje plewy i łuski, poleruje ryż, dzieli nasiona strączków.
- `plu` — Płuczka skrobi: Ściera bulwy i wypłukuje z nich czystą skrobię.
- `sus` — Suszarnia: Odparowuje wodę z ziarna, plastrów, wytłoków i mokrej skrobi.
- `obi` — Stół krojenia: Obiera, kroi w plastry, wypestkowuje i dryluje.
- `pra` — Prażalnik: Praży, stabilizuje ziarno termicznie i rozkłada szkodliwe związki.
- `kad` — Kadź do moczenia: Moczy, płucze i wyługowuje gorycz zimną wodą.
- `pre` — Prasa: Tłoczy sok z owoców i olej z nasion. Zostają wytłoki albo makuch.
- `sit` — Odsiewacz: Przesiewa śrutę i oddziela pestki od wytłoków.
- `lup` — Łupiarka orzechów: Rozłupuje twarde łupiny orzechów, kasztanów, żołędzi i kokosów.
- `koc` — Kocioł: Blanszuje i gotuje, także w wodzie wapiennej.
- `mbg` — Młyn czystej linii: Osobny młyn bez kontaktu z glutenem. Tylko na nim powstaje certyfikowana mąka owsiana.

## Paczka E — ludzie (4)

Portrety do kart pracowników, **256×256 px, przezroczyste tło**, folder `people/`, popiersie, ten sam styl i kadr:

- `parobek.webp` — parobek: młody, w lnianej koszuli, z sierpem/koszem plonów
- `siewca.webp` — siewca: starszy, z płachtą/workiem ziarna przewieszonym przez ramię
- `kupiec.webp` — kupiec: kamizelka, notes, waga sklepowa albo sakiewka
- `mlynarz.webp` — młynarz: biały fartuch i czapka przyprószone mąką

## Paczka F — ikona aplikacji

- `icon-1024.png` — 1024×1024, kwadrat z zaokrągleniem robi system: wiatrak na wzgórzu w złotym świetle, czytelny także w 32×32 (prosta sylwetka, kontrast).

## Kolejność (od najważniejszego)

1. Paczka C1 + C3 (plony i mąki): największa zmiana w Spiżarni, na Targu i w oknie siewu.
2. Paczka A (zagony 3:2) i B (zima).
3. Paczka C2 (półprodukty), D (maszyny), E, F.
