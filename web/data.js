// Aura Fields — dane gry: maszyny, rośliny, 70 mąk i receptury przetwórcze.
// Pliki ładowane jako zwykłe skrypty, więc stałe z najwyższego poziomu są widoczne w game.js.

// [id, nazwa, opis, cena, czas bazowy s, wymagany poziom gospodarza]
const MACH=[
 ['czw','Czyszczalnia wstępna','Sita i strumień powietrza usuwają ze świeżego ziarna plewy, kurz, słomę, kamyki i nasiona chwastów.',0,4,1],
 ['sus','Suszarnia','Odparowuje wodę z ziarna, kłosków, plastrów, wytłoków i mokrej skrobi.',650,6,1],
 ['sil','Silos','Przechowuje wysuszone ziarno, aż dojrzeje pożniwnie. Zboża oplewione leżą tu w kłoskach.',300,20,1],
 ['mag','Separator magnetyczny','Wyłapuje z ziarna metal: śruby i drut, które uszkodziłyby walce.',300,2,1],
 ['sep','Separator sitowy','Dokładne sita z aspiracją oddzielają grube i drobne zanieczyszczenia oraz pył.',300,3,1],
 ['odk','Odkamieniacz','Oddziela po ciężarze kamyki, grudki ziemi i szkło wielkości ziarna.',300,3,1],
 ['try','Tryjer','Cylinder z wgłębieniami oddziela nasiona krótsze i dłuższe od ziarna: kąkol, wykę, owies.',300,4,1],
 ['stg','Stół grawitacyjny','Wibrujący blat z nadmuchem od dołu: lekkie ziarna i sklerocja sporyszu spływają w dół.',300,4,1],
 ['sor','Sortownik optyczny','Kamery wyłapują ziarna przebarwione, porażone i sporysz, a dysze sprężonego powietrza je wydmuchują.',300,3,1],
 ['obr','Obieraczka','Ściera z powierzchni ziarna brud, bródki i drobnoustroje. To nie łuskanie z plew.',300,4,1],
 ['naw','Nawilżalnik','Dozuje wodę i miesza ziarno przed przemiałem.',300,2,1],
 ['odl','Zbiornik odleżakowy','Ziarno odlega, aż woda wniknie do środka: okrywa mięknie, a bielmo kruszeje.',300,8,1],
 ['zar','Żarna','Mielą ziarno, nasiona, makuch i susz na mąkę, a kondycjonowane ziarno pszenicy twardej na semolinę.',0,5,1],
 ['lus','Łuszczarka','Zdejmuje plewy i łuski: łuszczy kłoski zbóż oplewionych i jęczmień, poleruje ryż, dzieli nasiona strączków.',400,4,1],
 ['osc','Odościacz','Wał z łopatkami odbija ości od ziarna jęczmienia.',300,3,1],
 ['kal','Kalibrator','Sita szczelinowe dzielą jęczmień na frakcje grubości przed łuszczeniem i słodowaniem.',300,3,1],
 ['per','Perlak','Cylinder ścierny zdziera kolejne warstwy łuszczonego ziarna: z jęczmienia powstaje pęczak, z płaskurki farro.',300,6,2],
 ['kra','Krajalnica','Tnie pęczak na kawałki kaszy.',300,3,2],
 ['plr','Polerka szczotkowa','Wygładza kaszę łamaną na gładką, jasną kaszę perłową.',300,4,2],
 ['plt','Płatkownica','Paruje łuszczone ziarno i zgniata je gładkimi walcami w płatki.',300,6,3],
 ['kie','Kiełkownia','Namoczone ziarno kiełkuje kilka dni w skrzyni z przewracaniem. Powstaje słód zielony.',300,14,3],
 ['ssl','Suszarnia słodu','Suszy słód zielony. Temperatura końcowa decyduje, czy słód będzie jasny, czy ciemny.',300,10,3],
 ['okw','Odkiełkowywacz','Usuwa z suszonego słodu gorzkie kiełki korzeniowe.',300,3,3],
 ['srt','Śrutownik','Rozdrabnia ziarno na śrutę paszową albo gniecie je na płasko.',300,4,2],
 ['mlo','Młocarnia','Oddziela ziarno i nasiona od kłosów, strąków, koszyczków i kolb.',0,4,1],
 ['plu','Płuczka skrobi','Ściera bulwy i wypłukuje z nich czystą skrobię.',700,7,3],
 ['obi','Stół krojenia','Obiera, kroi w plastry, wypestkowuje i dryluje.',550,4,3],
 ['pra','Prażalnik','Praży, stabilizuje ziarno termicznie i rozkłada szkodliwe związki.',900,6,4],
 ['kad','Kadź do moczenia','Moczy, płucze i wyługowuje gorycz zimną wodą. Moczy też jęczmień na słód.',800,7,5],
 ['pre','Prasa','Tłoczy sok z owoców i olej z nasion. Zostają wytłoki albo makuch.',1600,6,5],
 ['sit','Odsiewacz','Przesiewa śrutę i kaszę, oddziela pestki od wytłoków.',1100,4,6],
 ['lup','Łupiarka orzechów','Rozłupuje twarde łupiny orzechów, kasztanów, żołędzi i kokosów.',1800,5,7],
 ['koc','Kocioł','Blanszuje i gotuje, także w wodzie wapiennej.',1500,6,7],
 ['mbg','Młyn czystej linii','Osobny młyn bez kontaktu z glutenem. Tylko na nim powstaje certyfikowana mąka owsiana.',4000,6,9],
];
// skale urządzeń z dokumentu linii: ulepszana maszyna staje się kolejnym urządzeniem [od poziomu, nazwa]
const MTIER={
 czw:[[1,'Wialnia'],[4,'Czyszczalnia płaska'],[8,'Czyszczalnia bębnowa'],[11,'Separator wstępny wysokiej wydajności']],
 sus:[[1,'Suszarnia komorowa'],[4,'Suszarnia z mieszalnikiem'],[8,'Suszarnia kolumnowa'],[11,'Suszarnia kolumnowa z odzyskiem ciepła']],
 sil:[[1,'Worki i big-bagi'],[3,'Magazyn płaski'],[6,'Silos lejowy'],[9,'Silos płaskodenny'],[11,'Elewator']],
 mag:[[1,'Magnes płytowy'],[6,'Separator bębnowy samooczyszczający']],
 sep:[[1,'Czyszczalnia płaska uniwersalna'],[6,'Separator młyński z aspiracją']],
 odk:[[1,'Stół grawitacyjny uniwersalny'],[5,'Odkamieniacz wibracyjny'],[10,'Koncentrator']],
 try:[[1,'Tryjer cylindryczny'],[7,'Tryjer tarczowy']],
 stg:[[1,'Stół grawitacyjny'],[8,'Wialnia pneumatyczna']],
 sor:[[1,'Sortownik kanałowy'],[7,'Sortownik wielokanałowy RGB i NIR']],
 obr:[[1,'Szczotkarka'],[4,'Obieraczka pozioma'],[9,'Obieraczka pionowa']],
 naw:[[1,'Mieszalnik bębnowy'],[4,'Ślimak z dyszą dozującą'],[7,'Zwilżacz automatyczny'],[10,'Zwilżacz wirnikowy z czujnikiem NIR']],
 odl:[[1,'Skrzynie i big-bagi'],[6,'Zbiorniki odleżakowe lejowe']],
 lus:[[1,'Mała łuszczarka'],[4,'Łuszczarka uderzeniowa'],[7,'Łuszczarka walcowa'],[10,'Łuszczarka tarczowa']],
 kal:[[1,'Kalibrator płaski'],[7,'Kalibrator bębnowy']],
 per:[[1,'Perlak partiowy'],[6,'Perlak ciągły']],
 kra:[[1,'Krajalnica nożowa'],[6,'Łamacz walcowy']],
 kie:[[1,'Skrzynia kiełkownicza'],[7,'Bęben kiełkowniczy'],[11,'Kiełkownia-suszarnia GKV']],
 ssl:[[1,'Suszarnia słodu jednopoziomowa'],[7,'Suszarnia słodu dwupoziomowa']],
 srt:[[1,'Śrutownik bijakowy'],[6,'Śrutownik walcowy']],
};
// maszyny linii zbożowych są tańsze, bo pierwszą mąkę robi się dopiero z całej linii
const MLINE=new Set(['czw','sus','sil','mag','sep','odk','try','stg','sor','obr','naw','odl','lus','osc','kal']);
const M={}; MACH.forEach(([id,n,d,p,t,lv])=>M[id]={id,n,d,p,t,lv});
// mnożniki czasu: uprawy rosną TG razy dłużej, maszyny pracują TM razy dłużej niż wartości bazowe
const TG=8, TM=6;

const ENV={pole:'Pole',mokre:'Pole ryżowe',szklarnia:'Szklarnia'};
const KIND={zboze:'zboże',kwiat:'roślina zielna',straczek:'strączkowa',bulwa:'bulwiasta',warzywo:'warzywo',krzew:'krzew',drzewo:'drzewo',palma:'bylina tropikalna'};

// poziom gospodarza, od którego można kupić nasiona
const LVL={pszenica:1,zyto:1,jeczmien:1,owies:1,ziemniak:1,groch:1,burak:1,gryka:1,
 pszenzyto:2,zbita:3,kukurydza:2,proso:2,len:2,slonecznik:2,fasola:2,bob:2,kalafior:2,dynia:2,
 orkisz:3,soczewica:3,lubin:3,jablon:3,roza:3,aronia:3,
 durum:4,polska:4,soja:4,owies_cert:4,ciecierzyca:4,rokitnik:4,leszczyna:4,konopie:4,czarnuszka:4,
 plaskurka:5,samopsza:5,khorasan:5,perska:5,indyjska:5,tritordeum:6,ryz:5,amarantus:5,quinoa:5,winorosl:5,wiesiolek:5,
 dab:6,orzech_wl:6,kasztan:6,sorgo:6,ryz_kl:6,taro:6,
 teff:7,ragi:7,bajra:7,mung:7,urad:7,arachid:7,sezam:7,batat:7,
 fonio:8,dziki_ryz:8,maniok:8,maranta:8,jam:8,banan:8,
 migdalowiec:9,szaranczyn:9,chlebowiec:9,
 nerkowiec:10,makadamia:10,kokos:10};

// [id, nazwa, łacina, rodzaj, środowisko, czas wzrostu s, odrastanie s (0 = jednoroczna), plon, cena nasion, produkt, nazwa produktu, kolor]
const CROPS_RAW=[
'G:Zboża glutenowe',
// w kolejności drzewa pokrewieństwa: pszenice od samopszy po heksaploidy, potem żyto, jęczmień i ich mieszańce z pszenicą
['samopsza','Samopsza','Triticum monococcum','zboze','pole',40,0,3,18,'k_sam','Kłoski samopszy z kombajnu','#c7a25e'],
['plaskurka','Płaskurka','Triticum dicoccum','zboze','pole',38,0,3,16,'k_pla','Kłoski płaskurki z kombajnu','#b98a45'],
['durum','Pszenica twarda','Triticum durum','zboze','pole',34,0,4,12,'k_dur','Ziarno pszenicy twardej z kombajnu','#e0b53a'],
['polska','Pszenica polska','Triticum polonicum','zboze','pole',38,0,4,16,'k_pol','Ziarno pszenicy polskiej z kombajnu','#d4b25c'],
['khorasan','Pszenica Khorasan (Kamut)','Triticum turanicum','zboze','pole',40,0,4,20,'k_kho','Ziarno Khorasan z kombajnu','#d9a845'],
['perska','Pszenica perska','Triticum carthlicum','zboze','pole',38,0,4,18,'k_per','Ziarno pszenicy perskiej z kombajnu','#b8904a'],
['pszenica','Pszenica zwyczajna','Triticum aestivum','zboze','pole',30,0,4,10,'k_psz','Ziarno pszenicy z kombajnu','#d8b04f'],
['orkisz','Orkisz','Triticum spelta','zboze','pole',36,0,4,14,'k_ork','Kłoski orkiszu z kombajnu','#c99a4a'],
['zbita','Pszenica zbita','Triticum compactum','zboze','pole',32,0,4,12,'k_zbi','Ziarno pszenicy zbitej z kombajnu','#dcbc68'],
['indyjska','Pszenica indyjska','Triticum sphaerococcum','zboze','pole',36,0,4,18,'k_ind','Ziarno pszenicy indyjskiej z kombajnu','#d2ac58'],
['zyto','Żyto zwyczajne','Secale cereale','zboze','pole',30,0,4,10,'k_zyt','Ziarno żyta z kombajnu','#a88a5c'],
['pszenzyto','Pszenżyto','×Triticosecale','zboze','pole',32,0,4,12,'k_pzy','Ziarno pszenżyta z kombajnu','#bf9c55'],
['jeczmien','Jęczmień zwyczajny','Hordeum vulgare','zboze','pole',28,0,4,10,'k_jec','Ziarno jęczmienia z kombajnu','#d4bb6c'],
['tritordeum','Tritordeum','×Tritordeum martinii','zboze','pole',36,0,4,18,'k_trd','Ziarno tritordeum z kombajnu','#cfb070'],
'G:Zboża i pseudozboża bezglutenowe',
['owies','Owies zwyczajny','Avena sativa','zboze','pole',28,0,4,10,'k_owi','Wiechy owsa','#cfc08a'],
['owies_cert','Owies certyfikowany','Avena sativa, uprawa bezglutenowa','zboze','pole',32,0,3,18,'k_owc','Wiechy owsa certyfikowanego','#dccf98'],
['ryz','Ryż siewny','Oryza sativa','zboze','mokre',45,0,4,16,'k_ryz','Wiechy ryżu','#d6c27a'],
['ryz_kl','Ryż kleisty','Oryza sativa var. glutinosa','zboze','mokre',48,0,3,22,'k_rkl','Wiechy ryżu kleistego','#e3d6a0'],
['kukurydza','Kukurydza zwyczajna','Zea mays','zboze','pole',40,0,3,14,'kolby','Kolby kukurydzy','#f0c030'],
['gryka','Gryka zwyczajna','Fagopyrum esculentum','kwiat','pole',26,0,4,10,'n_gry','Nasiona gryki','#8a6a4a'],
['proso','Proso zwyczajne','Panicum miliaceum','zboze','pole',26,0,4,10,'k_pro','Wiechy prosa','#e8c860'],
['amarantus','Szarłat','Amaranthus cruentus / caudatus','kwiat','pole',34,0,4,14,'k_ama','Kwiatostany szarłatu','#c0406a'],
['quinoa','Komosa ryżowa','Chenopodium quinoa','kwiat','pole',36,0,3,18,'k_qui','Wiechy komosy','#d98a3a'],
['teff','Miłka abisyńska','Eragrostis tef','zboze','szklarnia',30,0,4,16,'k_tef','Wiechy teffu','#a06a48'],
['sorgo','Sorgo dwubarwne','Sorghum bicolor','zboze','pole',38,0,4,14,'k_sor','Wiechy sorgo','#b0583a'],
['ragi','Proso palczaste (Ragi)','Eleusine coracana','zboze','szklarnia',36,0,4,18,'k_rag','Kłosy ragi','#8a4a3a'],
['bajra','Proso perłowe','Pennisetum glaucum','zboze','szklarnia',36,0,4,16,'k_baj','Kolby prosa perłowego','#9a9a7a'],
['fonio','Fonio','Digitaria exilis','zboze','szklarnia',30,0,3,20,'k_fon','Wiechy fonio','#d8c890'],
['dziki_ryz','Dziki ryż','Zizania aquatica','zboze','mokre',50,0,3,24,'k_dry','Wiechy dzikiego ryżu','#5a4030'],
'G:Rośliny strączkowe',
['ciecierzyca','Ciecierzyca pospolita','Cicer arietinum','straczek','pole',36,0,3,14,'s_cie','Strąki ciecierzycy','#d8b878'],
['soczewica','Soczewica jadalna','Lens culinaris','straczek','pole',30,0,4,12,'s_soc','Strąki soczewicy','#b06a40'],
['soja','Soja zwyczajna','Glycine max','straczek','pole',38,0,4,12,'s_soj','Strąki soi','#d8c080'],
['groch','Groch zwyczajny','Pisum sativum','straczek','pole',26,0,4,8,'s_gro','Strąki grochu','#9ac040'],
['bob','Bób','Vicia faba','straczek','pole',30,0,4,10,'s_bob','Strąki bobu','#88b050'],
['lubin','Łubin słodki','Lupinus angustifolius / albus','straczek','pole',30,0,4,10,'s_lub','Strąki łubinu','#e0d070'],
['fasola','Fasola zwyczajna','Phaseolus vulgaris','straczek','pole',32,0,4,10,'s_fas','Strąki fasoli','#c04848'],
['mung','Fasola złota (mung)','Vigna radiata','straczek','szklarnia',30,0,4,14,'s_mun','Strąki fasoli mung','#5a9a40'],
['urad','Fasola mungo (urad)','Vigna mungo','straczek','szklarnia',32,0,4,16,'s_ura','Strąki urad','#4a4040'],
'G:Orzechy i nasiona oleiste',
['migdalowiec','Migdałowiec zwyczajny','Prunus dulcis','drzewo','szklarnia',120,60,4,60,'mig_lup','Migdały w łupinie','#c08a5a'],
['orzech_wl','Orzech włoski','Juglans regia','drzewo','pole',140,70,4,50,'wl_lup','Orzechy włoskie w łupinie','#8a6a40'],
['leszczyna','Leszczyna pospolita','Corylus avellana','krzew','pole',90,50,4,35,'las_lup','Orzechy laskowe w łupinie','#a0703a'],
['arachid','Orzech ziemny','Arachis hypogaea','bulwa','szklarnia',40,0,4,16,'ara_lup','Strąki orzeszków ziemnych','#d0a870'],
['slonecznik','Słonecznik zwyczajny','Helianthus annuus','kwiat','pole',36,0,3,10,'kosz','Koszyczki słonecznika','#f0c020'],
['len','Len zwyczajny','Linum usitatissimum','kwiat','pole',28,0,4,10,'tor_len','Torebki lnu','#6a8ad0'],
['dynia','Dynia olbrzymia','Cucurbita pepo / maxima','warzywo','pole',40,0,2,12,'dynia','Dynie','#e07a20'],
['konopie','Konopie siewne','Cannabis sativa','kwiat','pole',34,0,4,14,'k_kon','Kwiatostany konopi','#7a9a3a'],
['sezam','Sezam indyjski','Sesamum indicum','kwiat','szklarnia',36,0,4,16,'k_sez','Torebki sezamu','#e8dcb8'],
['nerkowiec','Nanercz zachodni','Anacardium occidentale','drzewo','szklarnia',150,70,3,80,'jab_nerk','Jabłka nerkowca','#e05a30'],
['makadamia','Orzechowiec makadamia','Macadamia integrifolia','drzewo','szklarnia',160,80,3,90,'mak_lup','Makadamia w łupinie','#7a5a38'],
['kasztan','Kasztan jadalny','Castanea sativa','drzewo','pole',140,70,4,55,'kaszt','Kasztany jadalne','#7a4a28'],
['czarnuszka','Czarnuszka siewna','Nigella sativa','kwiat','pole',28,0,4,14,'k_cza','Torebki czarnuszki','#7aa0e0'],
['wiesiolek','Wiesiołek dwuletni','Oenothera biennis','kwiat','pole',50,0,4,12,'k_wie','Torebki wiesiołka','#f0e040'],
'G:Bulwy, korzenie i owoce skrobiowe',
['ziemniak','Ziemniak','Solanum tuberosum','bulwa','pole',32,0,4,8,'ziem','Bulwy ziemniaka','#c8a060'],
['maniok','Maniok jadalny','Manihot esculenta','bulwa','szklarnia',50,0,3,20,'man','Korzenie manioku','#9a6a48'],
['kokos','Palma kokosowa','Cocos nucifera','palma','szklarnia',170,80,2,90,'kokos','Kokosy','#7a5030'],
['banan','Banan rajski','Musa × paradisiaca','palma','szklarnia',100,55,3,50,'banan','Zielone banany','#7ab030'],
['batat','Wilec ziemniaczany','Ipomoea batatas','bulwa','szklarnia',40,0,3,14,'batat','Bulwy batata','#d07040'],
['maranta','Maranta trzcinowa','Maranta arundinacea','bulwa','szklarnia',44,0,3,20,'mar_kl','Kłącza maranty','#d8c8a8'],
['taro','Kolokazja jadalna','Colocasia esculenta','bulwa','mokre',44,0,3,20,'taro','Bulwy taro','#8a7090'],
['jam','Pochrzyn (jam)','Dioscorea alata','bulwa','szklarnia',50,0,3,22,'jam','Bulwy jamu','#9a5a9a'],
['dab','Dąb szypułkowy','Quercus robur / petraea','drzewo','pole',160,80,5,40,'zol','Żołędzie','#8a6a30'],
['chlebowiec','Chlebowiec właściwy','Artocarpus altilis','drzewo','szklarnia',160,80,3,80,'chleb','Owoce chlebowca','#a0c040'],
['szaranczyn','Szarańczyn strąkowy','Ceratonia siliqua','drzewo','szklarnia',150,75,4,70,'karob','Strąki karobu','#5a3020'],
'G:Owoce i warzywa',
['jablon','Jabłoń domowa','Malus domestica','drzewo','pole',130,60,5,45,'jab','Jabłka','#d03a30'],
['roza','Róża dzika','Rosa canina','krzew','pole',80,45,4,25,'roza','Owoce dzikiej róży','#d02a20'],
['rokitnik','Rokitnik zwyczajny','Hippophae rhamnoides','krzew','pole',90,50,4,28,'rok','Owoce rokitnika','#f08a10'],
['aronia','Aronia czarnoowocowa','Aronia melanocarpa','krzew','pole',80,45,4,25,'aro','Owoce aronii','#4a2050'],
['winorosl','Winorośl właściwa','Vitis vinifera','krzew','pole',100,55,4,40,'wino','Winogrona','#7a3a7a'],
['burak','Burak ćwikłowy','Beta vulgaris','bulwa','pole',30,0,3,8,'burak','Korzenie buraka','#a01a44'],
['kalafior','Kalafior','Brassica oleracea var. botrytis','warzywo','pole',34,0,2,10,'kalaf','Kalafiory','#efe8d0'],
];
const CROPS=[], CR={}, CROP_GROUPS=[];
// zboża glutenowe: kombajn od razu młóci, więc plon liczy się w ziarnie (dwa razy więcej sztuk niż kłosów)
(()=>{let grp='';
CROPS_RAW.forEach(x=>{ if(typeof x==='string'){grp=x.slice(2);CROP_GROUPS.push(grp);return}
  const [id,n,lat,kind,env,g0,r,y,p,out,outN,col]=x; const lvl=(LVL[id]||1)*2-1;
  // dalsze uprawy rosną dłużej
  const g=r?g0:Math.round(g0*(1+0.025*(lvl-1)));
  const c={id,n,lat,kind,env,g,g0,r,y:grp==='Zboża glutenowe'?y*2:y,p,out,outN,col,grp,lvl}; CROPS.push(c); CR[id]=c; });
})();

const ITEMS={};
function item(id,n,col,kind,extra){ ITEMS[id]=Object.assign({id,n,col,kind},extra||{}); }
CROPS.forEach(c=>item(c.out,c.outN,c.col,'raw',{crop:c.id}));
item('wapno','Wapno spożywcze','#e8e8e0','supply');
item('otreby','Otręby','#b08a58','by'); item('olej','Olej tłoczony','#d8c040','by');
item('sok','Sok owocowy','#c84a3a','by'); item('nas_kar','Nasiona karobu','#4a2a18','by');

// do Księgi: genom (litery jak na drzewie pokrewieństwa), białko glutenowe i krótka notka
const CINFO={
 samopsza:{g:'AA',pro:'gliadyna',d:'Najstarsza uprawna pszenica, udomowiona ok. 10,5 tys. lat temu na terenie dzisiejszej Turcji. Drobne kłosy, ziarno w plewach.'},
 plaskurka:{g:'AABB',pro:'gliadyna',d:'Prapszenica z Żyznego Półksiężyca, udomowiona ok. 10 tys. lat temu. Ziarno mocno trzyma się plew.'},
 durum:{g:'AABB',pro:'gliadyna',d:'Twarde, szkliste ziarno. Z grubo mielonej semoliny powstają makarony i kuskus.'},
 polska:{g:'AABB',pro:'gliadyna',d:'Rzadki gatunek o bardzo długich plewach i wydłużonym ziarnie (mutacja VRT-A2). Mimo nazwy nie pochodzi z Polski.'},
 khorasan:{g:'AABB',pro:'gliadyna',d:'Starożytna pszenica o dużych ziarnach, sprzedawana pod marką Kamut. Prawdopodobnie krzyżówka pszenicy twardej z polską.'},
 perska:{g:'AABB',pro:'gliadyna',d:'Pszenica szorstkoziarnista z Gruzji i Zakaukazia. Nie ma genomu D, choć część cech mogła przejąć od pszenicy zwyczajnej.'},
 pszenica:{g:'AABBDD',pro:'gliadyna',d:'Najważniejsza pszenica świata. Powstała ok. 8–10 tys. lat temu nad Morzem Kaspijskim, gdy dołączył genom D kozieńca Tauscha. Chleb, bułki, ciasta, makarony.'},
 orkisz:{g:'AABBDD',pro:'gliadyna',d:'Starożytna pszenica w plewach. Europejski orkisz to krzyżówka pszenicy zwyczajnej z płaskurką.'},
 zbita:{g:'AABBDD',pro:'gliadyna',d:'Krótkie, gęste kłosy (mutacja C). Miękka mąka na ciastka i krakersy.'},
 indyjska:{g:'AABBDD',pro:'gliadyna',d:'Pszenica okrągłoziarnista z północnych Indii i Pakistanu (mutacja S1). Drobne, kuliste ziarna.'},
 zyto:{g:'RR',pro:'sekalina',d:'Odporne na chłód i słabe gleby. Zamiast gliadyny ma sekalinę, która przy celiakii szkodzi tak samo.'},
 pszenzyto:{g:'AABBRR',pro:'gliadyna i sekalina',d:'Mieszaniec pszenicy i żyta: plenność pszenicy, wytrzymałość żyta.'},
 jeczmien:{g:'HH',pro:'hordeina',d:'Jedno z pierwszych udomowionych zbóż. Jego prolamina to hordeina.'},
 tritordeum:{g:'AABBHchHch',pro:'gliadyna',d:'Nowe zboże z Hiszpanii: pszenica twarda skrzyżowana z dzikim jęczmieniem chilijskim (Hordeum chilense).'},
 owies:{d:'Owies sam w sobie nie ma glutenu. Jego białko, awenina, zwykle nie szkodzi przy celiakii.'},
};
const CATS=['','Zboża glutenowe','Zboża i pseudozboża bezglutenowe','Rośliny strączkowe','Orzechy i nasiona oleiste','Skrobie, bulwy, korzenie i owoce','Owocowe, warzywne i specjalistyczne'];
const FL=[
[1,'m_sam','Mąka z samopszy','#e8cf8a','z najstarszej znanej pszenicy samopszy (Triticum monococcum)'],
[1,'m_pla','Mąka z płaskurki','#dcc396','ze starożytnej pszenicy płaskurki (Triticum dicoccum)'],
[1,'m_dur','Semolina z pszenicy twardej','#ecd27a','z ziarna pszenicy twardej (Triticum durum)'],
[1,'m_pol','Semolina z pszenicy polskiej','#e4c98a','z wydłużonego ziarna pszenicy polskiej (Triticum polonicum)'],
[1,'m_kho','Semolina Kamut (Khorasan)','#e9cd86','z pszenicy Khorasan (Triticum turanicum), znanej pod marką Kamut'],
[1,'m_per','Semolina z pszenicy perskiej','#d8bc8a','z ziarna pszenicy szorstkoziarnistej, perskiej (Triticum carthlicum)'],
[1,'m_psz','Mąka pszenna zwyczajna','#f3ead2','z ziarna pszenicy zwyczajnej (Triticum aestivum)'],
[1,'m_ork','Mąka orkiszowa','#e6d3a8','ze starożytnego gatunku pszenicy orkisz (Triticum spelta)'],
[1,'m_zbi','Mąka z pszenicy zbitej','#f2e8d0','z miękkiego ziarna pszenicy zbitej (Triticum compactum), na ciastka i krakersy'],
[1,'m_ind','Mąka z pszenicy indyjskiej','#eadaae','z okrągłego ziarna pszenicy indyjskiej (Triticum sphaerococcum)'],
[1,'m_zyt','Mąka żytnia','#c9b597','z ziarna żyta zwyczajnego (Secale cereale)'],
[1,'m_pzy','Mąka pszenżytnia','#ddcdaa','z pszenżyta (Triticosecale), krzyżówki pszenicy i żyta'],
[1,'m_jec','Mąka jęczmienna','#e2d5b2','z ziarna jęczmienia zwyczajnego (Hordeum vulgare)'],
[1,'m_trd','Semolina z tritordeum','#e6cf94','z tritordeum, krzyżówki pszenicy twardej z dzikim jęczmieniem chilijskim (Hordeum chilense)'],
[2,'m_ryzb','Mąka ryżowa biała','#f7f4ec','z oczyszczonego ziarna ryżu siewnego (Oryza sativa)'],
[2,'m_ryzbr','Mąka ryżowa brązowa (pełnoziarnista)','#cbb08a','z nieoczyszczonego ziarna ryżu siewnego (Oryza sativa)','Łuska zawsze trafia do łuszczarki. Pełnoziarnista mąka zachowuje otręby i zarodek, bo ryż nie jest polerowany.'],
[2,'m_mochi','Mąka z ryżu kleistego (Mochiko / Shiratamako)','#fbf8f0','ze specjalnej odmiany ryżu kleistego (Oryza sativa var. glutinosa)'],
[2,'m_kuk','Mąka kukurydziana','#f2c94a','z ziaren kukurydzy zwyczajnej (Zea mays)'],
[2,'m_masa','Mąka Masa Harina','#e9d08a','z kukurydzy (Zea mays) po nikstamalizacji, czyli gotowaniu w wodzie wapiennej'],
[2,'m_gry','Mąka gryczana','#a89078','z nasion gryki zwyczajnej (Fagopyrum esculentum), z kaszy palonej lub niepalonej'],
[2,'m_jag','Mąka jaglana','#f0d88a','z nasion prosa zwyczajnego (Panicum miliaceum)'],
[2,'m_owi','Mąka owsiana','#e6dcc0','z owsa zwyczajnego (Avena sativa)'],
[2,'m_owc','Mąka owsiana bezglutenowa','#ece2c8','z certyfikowanego, czystego biologicznie owsa zwyczajnego (Avena sativa)'],
[2,'m_ama','Mąka z amarantusa (szarłatu)','#e3cfa4','z nasion szarłatu (Amaranthus cruentus / caudatus)'],
[2,'m_qui','Mąka z komosy ryżowej (Quinoa)','#e8d7b0','z nasion komosy ryżowej (Chenopodium quinoa)'],
[2,'m_tef','Mąka Teff','#a2765a','z drobnych nasion miłki abisyńskiej (Eragrostis tef)'],
[2,'m_sor','Mąka z sorgo (Jowar)','#e0caa6','z ziarna sorgo dwubarwnego (Sorghum bicolor)'],
[2,'m_rag','Mąka Ragi (Finger Millet)','#9a6a5a','z nasion prosa palczastego (Eleusine coracana)','W spisie jako „miodunka / kaniuszy”. Eleusine coracana po polsku najczęściej nazywa się prosem palczastym lub ragi.'],
[2,'m_baj','Mąka z prosa perłowego (Bajra)','#b8b49c','z nasion prosa perłowego (Pennisetum glaucum)'],
[2,'m_fon','Mąka z fonio','#efe3c0','z drobnego ziarna afrykańskiego fonio (Digitaria exilis)','W spisie jako „Dinkel / Fonio”. Dinkel to niemiecka nazwa orkiszu, więc tutaj mielemy samo fonio.'],
[2,'m_dry','Mąka z dzikiego ryżu','#6e5644','z nasion zizanii wodnej (Zizania aquatica)'],
[3,'m_cie','Mąka z ciecierzycy (Besan)','#ead08a','z nasion ciecierzycy pospolitej (Cicer arietinum)'],
[3,'m_soc_c','Mąka z soczewicy czerwonej','#f0a86a','z łuskanych nasion soczewicy jadalnej (Lens culinaris)'],
[3,'m_soc_z','Mąka z soczewicy zielonej / brązowej','#a8946a','z pełnych nasion soczewicy jadalnej (Lens culinaris)'],
[3,'m_soj','Mąka sojowa','#efd894','z ziaren soi zwyczajnej (Glycine max)'],
[3,'m_gro','Mąka z grochu żółtego lub zielonego','#d8d47a','z nasion grochu zwyczajnego (Pisum sativum)'],
[3,'m_bob','Mąka z bobu','#d6c89a','z nasion bobu (Vicia faba)'],
[3,'m_lub','Mąka z łubinu','#f2dc7a','ze słodkich odmian łubinu wąskolistnego lub białego (Lupinus angustifolius / albus)'],
[3,'m_fas','Mąka z fasoli (białej, czarnej, czerwonej)','#e2cfc0','z wybranych odmian fasoli zwyczajnej (Phaseolus vulgaris)'],
[3,'m_mun','Mąka z fasoli Mung','#e6dc8a','z nasion fasoli złotej (Vigna radiata)'],
[3,'m_ura','Mąka z urad dal','#ece6d6','z nasion fasoli mungo (Vigna mungo)'],
[4,'m_mig','Mąka migdałowa','#efdcc0','z nasion migdałowca zwyczajnego (Prunus dulcis), ze skórką lub blanszowanych'],
[4,'m_wl','Mąka z orzechów włoskich','#b8946a','z owoców orzecha włoskiego (Juglans regia)'],
[4,'m_las','Mąka z orzechów laskowych','#c8a07a','z owoców leszczyny pospolitej (Corylus avellana)'],
[4,'m_ara','Mąka z orzechów arachidowych (ziemnych)','#d8b07a','z nasion orzecha ziemnego (Arachis hypogaea)'],
[4,'m_slo','Mąka z nasion słonecznika','#bdb4a0','z nasion słonecznika zwyczajnego (Helianthus annuus)'],
[4,'m_len','Mąka z siemienia lnianego','#a8804a','z nasion lnu zwyczajnego (Linum usitatissimum), pełnotłusta lub odtłuszczona'],
[4,'m_pes','Mąka z pestek dyni','#7a9a5a','z nasion dyni zwyczajnej lub olbrzymiej (Cucurbita pepo / maxima)'],
[4,'m_kon','Mąka konopna','#7a8a5a','z nasion konopi siewnych (Cannabis sativa)'],
[4,'m_sez','Mąka z sezamu','#eee2c4','z nasion sezamu indyjskiego (Sesamum indicum)'],
[4,'m_ner','Mąka z orzechów nerkowca','#ecdcbc','z nasion nanercza zachodniego (Anacardium occidentale)'],
[4,'m_mak','Mąka z orzechów macadamia','#f0e4c8','z owoców orzechowca makadamia (Macadamia integrifolia)'],
[4,'m_kas','Mąka z kasztanów jadalnych','#c8a880','z owoców kasztana jadalnego (Castanea sativa)'],
[4,'m_cza','Mąka z czarnuszki','#5a5258','z odtłuszczonych nasion czarnuszki siewnej (Nigella sativa)'],
[4,'m_wie','Mąka z wiesiołka','#8a7258','z nasion wiesiołka dwuletniego (Oenothera biennis)'],
[5,'m_ziem','Mąka / skrobia ziemniaczana','#fbfaf6','z bulw ziemniaka (Solanum tuberosum)'],
[5,'m_kasawa','Mąka z kasawy (manioku)','#f2ead8','z całego suszonego korzenia manioku jadalnego (Manihot esculenta)'],
[5,'m_tapioka','Mąka z tapioki','#fdfcf8','z wypłukanej czystej skrobi z korzenia manioku (Manihot esculenta)'],
[5,'m_kok','Mąka kokosowa','#f4eee0','z suszonego i odtłuszczonego miąższu kokosa (Cocos nucifera)'],
[5,'m_ban','Mąka z zielonych bananów (platanów)','#d8d0a8','z surowych, zielonych owoców banana rajskiego (Musa × paradisiaca)'],
[5,'m_bat','Mąka ze słodkich ziemniaków (bataty)','#e8a868','z bulw wilca ziemniaczanego (Ipomoea batatas)'],
[5,'m_arr','Mąka Arrowroot (maranta)','#fafaf5','z kłączy maranty trzcinowej (Maranta arundinacea)'],
[5,'m_taro','Mąka Taro','#c8b8c8','z bulw kolokazji jadalnej (Colocasia esculenta)'],
[5,'m_jam','Mąka z jamu (Dioscorea)','#b890b8','z bulw pochrzynu (Dioscorea alata)'],
[5,'m_zol','Mąka z żołędzi','#a07a4a','z odgoryczonych owoców dębu szypułkowego lub bezszypułkowego (Quercus robur / petraea)'],
[5,'m_chl','Mąka z miąższu chlebowca','#e2d8a8','z owoców chlebowca właściwego (Artocarpus altilis)'],
[5,'m_kar','Mąka z chleba świętojańskiego (karob)','#7a4a30','ze zmielonych strąków szarańczyna strąkowego (Ceratonia siliqua)'],
[6,'m_jab','Mąka jabłkowa','#c8945a','z wysuszonych wytłoków jabłek (Malus domestica)'],
[6,'m_roza','Mąka z dzikiej róży','#d8603a','z suszonych owoców róży dzikiej (Rosa canina)'],
[6,'m_rok','Mąka z rokitnika','#e8a030','z suszonych owoców rokitnika zwyczajnego (Hippophae rhamnoides)'],
[6,'m_aro','Mąka z aronii','#6a3058','z wytłoków aronii czarnoowocowej (Aronia melanocarpa)'],
[6,'m_win','Mąka z nasion winogron','#7a4444','z odtłuszczonych nasion winorośli właściwej (Vitis vinifera)'],
[6,'m_dyn','Mąka z dyni (warzywna)','#f0a040','z suszonego miąższu dyni (Cucurbita)'],
[6,'m_bur','Mąka z buraka','#b03060','z suszonego korzenia buraka ćwikłowego (Beta vulgaris)'],
[6,'m_kal','Mąka z kalafiora','#ece6cc','z suszonych różyczek kalafiora (Brassica oleracea var. botrytis)'],
];
const FLOURS=FL.map(([cat,id,n,col,src,note])=>{item(id,n,col,'flour',{cat,src,note});return id});

// ---------- RECEPTURY ----------
const RECIPES=[];
function R(m,verb,inp,out,t){RECIPES.push({id:RECIPES.length,m,verb,in:inp,out,t:t||M[m].t})}
// łańcuch liniowy: L(start,[[maszyna,czynność,idWyjścia,nazwa|null,ileWe,ileWy,czas?],...])
function L(start,steps){let cur=start;steps.forEach(([m,verb,id,name,a,b,t])=>{
  if(name&&!ITEMS[id]) item(id,name,ITEMS[cur].col,'mid');
  R(m,verb,{[cur]:a||1},{[id]:b||1},t); cur=id;});}
function it(id,name,from){ if(!ITEMS[id]) item(id,name,ITEMS[from].col,'mid'); }

// 1. glutenowe: linie obróbki od kombajnu. Każdy krok to osobna maszyna; po kroku ziarno zmienia przymiotnik,
// a to, co maszyna oddzieli, wychodzi obok jako osobny przedmiot (produkty uboczne i odpady).
// A pszenice chlebowe na mąkę · B twarde na semolinę · C żyto i pszenżyto (sporysz) · D oplewione (łuszczarka) · E jęczmień (kasza, słód, pasza)
[['sloma','Słoma','#d8c27a'],['poslad','Poślad','#b89a60'],['zan_gr','Zanieczyszczenia grube','#8a7650'],['odsiew','Odsiew','#9a8a6a'],['plewy_pyl','Plewy z pyłem','#c8b48a'],
 ['pyl','Pył zbożowy','#b0a490'],['metal','Zanieczyszczenia metalowe','#7a7a80'],['kamienie','Kamienie i grudki ziemi','#7a6a5a'],['fr_kr','Frakcja krótka (kąkol, wyka)','#5a4a3a'],
 ['fr_dl','Frakcja długa (owies, jęczmień)','#c8b070'],['lekkie','Ziarno lekkie','#c8b488'],['porazone','Ziarno porażone i przebarwione','#8a6a5a'],['sporysz','Sklerocja sporyszu','#3a2a30'],
 ['odp_obr','Odpad z obierania','#b8946a'],['plewy','Plewy (łuska)','#d8c48a'],['osci','Ości','#d0c080'],['luska_j','Łuska jęczmienna','#c8b07a'],['maczka','Mączka paszowa','#d8c8a0'],['kielki','Kiełki słodowe','#c8a870']
].forEach(([id,n,col])=>item(id,n,col,'by',{img:'otreby'}));
// gatunek: [dopełniacz do nazw, linia]; GIMG: pokrewna grafika ziarna, dopóki gatunek nie ma własnej
const GL={psz:['pszenicy','A'],zbi:['pszenicy zbitej','A'],ind:['pszenicy indyjskiej','A'],
 dur:['pszenicy twardej','B'],kho:['Khorasan','B'],pol:['pszenicy polskiej','B'],per:['pszenicy perskiej','B'],trd:['tritordeum','B'],
 zyt:['żyta','C'],pzy:['pszenżyta','C'],ork:['orkiszu','D'],pla:['płaskurki','D'],sam:['samopszy','D'],jec:['jęczmienia','E']};
const GLINE={A:'A: pszenica chlebowa, przemiał na mąkę',B:'B: przemiał na semolinę, staranne sortowanie',C:'C: obowiązkowe usuwanie sporyszu',D:'D: ziarno w plewach, łuszczarka',E:'E: jęczmień na kaszę, słód albo paszę'};
const GIMG={zbi:'psz',ind:'psz',pol:'dur',per:'kho',trd:'dur'};
function gs(m,verb,from,id,name,a,b,by,t,img){if(!ITEMS[id])item(id,name,ITEMS[from].col,'mid',{img});R(m,verb,{[from]:a},Object.assign({[id]:b},by||{}),t);return id}
const prod=(id,n,col,img)=>item(id,n,col,'prod',{img});
Object.entries(GL).forEach(([k,[gen,ln]])=>{
  const Z='Ziarno '+gen,K='Kłoski '+gen,zimg='z_'+(GIMG[k]||k),D=ln==='D';
  let cur='k_'+k,form=D?K:Z,img=D?'p_'+k:zimg;ITEMS[cur].img=img;ITEMS[cur].line=ln;
  const st=(m,verb,suf,adj,by,t,a=8,b=8)=>cur=gs(m,verb,cur,k+'_'+suf,form+' '+adj,a,b,by,t,img);
  if(ln==='E') st('osc','Odościanie','os','odoszczone',{osci:1});
  st('czw','Czyszczenie wstępne','cw','wstępnie oczyszczone',{zan_gr:1,odsiew:1,poslad:1,plewy_pyl:1});
  st('sus','Suszenie','sw','wysuszone');
  st('sil',ln==='E'?'Odpoczynek w magazynie':'Przechowywanie i dojrzewanie',D?'pr':'dj',D?'przechowywane':ln==='E'?'po odpoczynku':'dojrzałe pożniwnie',null,ln==='E'?28:20);
  if(D){
    st('sep','Odsiewanie z aspiracją','od','odsiane',{zan_gr:1,odsiew:1,pyl:1});
    st('mag','Separacja magnetyczna','bm','bez metalu',{metal:1});
    st('odk','Odkamienianie','bk','bez kamieni',{kamienie:1});
    // łuszczarka z aspiratorem: ziarno, plewy i kłoski nieobłuszczone, które wracają do łuszczarki (samopsza trzyma najmocniej)
    const zl=k+'_zl',kn=k+'_kn',hard=k==='sam';
    item(zl,Z+' obłuszczone',ITEMS[cur].col,'mid',{img:'z_'+k});item(kn,K+' nieobłuszczone',ITEMS[cur].col,'mid',{img:'p_'+k});
    R('lus','Łuszczenie z plew',{[cur]:4},{[zl]:hard?2:3,[kn]:hard?2:1,plewy:1});
    R('lus','Ponowne łuszczenie kłosków',{[kn]:2},{[zl]:1,plewy:1});
    cur=zl;form=Z;img='z_'+k;
    if(k==='pla'){prod('farro','Farro perlato (płaskurka perłowana)','#d8c090','z_pla');R('per','Perłowanie',{[zl]:2},{farro:2,maczka:1})}
  } else {
    st('mag','Separacja magnetyczna','bm','bez metalu',{metal:1});
    st('sep','Odsiewanie z aspiracją','od','odsiane',{zan_gr:1,odsiew:1,pyl:1});
    st('odk','Odkamienianie','bk','bez kamieni',{kamienie:1});
  }
  st('try','Tryjerowanie','ws','wyselekcjonowane',{fr_kr:1,fr_dl:1});
  if(ln==='E'){
    st('kal','Kalibrowanie','kl','skalibrowane',{poslad:1});const kl=cur;
    gs('lus','Łuszczenie ścierne',kl,'jec_ls','Jęczmień łuszczony',4,3,{luska_j:1},null,'z_jec');
    R('zar','Mielenie',{jec_ls:2},{m_jec:1,otreby:1});
    prod('peczak','Pęczak','#e2cf9c','z_jec');R('per','Perłowanie',{jec_ls:2},{peczak:2,maczka:1});
    prod('kasza_jl','Kasza jęczmienna łamana','#d8c490','z_jec');R('kra','Łamanie pęczaku',{peczak:2},{kasza_jl:2});
    prod('kasza_jp','Kasza jęczmienna perłowa','#ecdcb0','z_jec');R('plr','Polerowanie',{kasza_jl:2},{kasza_jp:2,maczka:1});
    prod('kasza_jd','Kasza perłowa drobna','#eee0b8','z_jec');prod('kasza_js','Kasza perłowa średnia','#ecdcb0','z_jec');prod('kasza_jg','Kasza perłowa gruba','#e6d4a4','z_jec');
    R('sit','Przesiewanie kaszy',{kasza_jp:3},{kasza_jd:1,kasza_js:1,kasza_jg:1,maczka:1});
    prod('platki_j','Płatki jęczmienne','#e8d8a8','otreby');R('plt','Parowanie i płatkowanie',{jec_ls:2},{platki_j:2});
    gs('kad','Moczenie w kadzi zalewnej',kl,'jec_nm','Jęczmień namoczony (namok)',4,4,null,10,'z_jec');
    gs('kie','Kiełkowanie','jec_nm','slod_z','Słód zielony',4,4,null,null,'z_jec');
    item('slod_js','Słód jasny suszony','#e0c070','mid',{img:'z_jec'});item('slod_cs','Słód ciemny suszony','#7a4a2a','mid',{img:'z_jec'});
    R('ssl','Suszenie na słód jasny',{slod_z:2},{slod_js:2});R('ssl','Prażenie na słód ciemny',{slod_z:2},{slod_cs:2},14);
    prod('slod_j','Słód jasny','#e0c070','z_jec');prod('slod_c','Słód ciemny','#7a4a2a','z_jec');
    R('okw','Odkiełkowywanie',{slod_js:2},{slod_j:2,kielki:1});R('okw','Odkiełkowywanie',{slod_cs:2},{slod_c:2,kielki:1});
    prod('sruta_j','Śruta jęczmienna','#cdb888','otreby');prod('gniot_j','Jęczmień gnieciony','#d8c48c','z_jec');
    R('srt','Śrutowanie na paszę',{[kl]:2},{sruta_j:2});R('srt','Gniecenie',{[kl]:2},{gniot_j:2});
    return;
  }
  if(ln==='C') st('stg','Oddzielanie sporyszu na stole','sg','po stole grawitacyjnym',{sporysz:1,lekkie:1},null,8,7);
  st('sor','Sortowanie optyczne','oc','oczyszczone',ln==='C'?{porazone:1,sporysz:1}:{porazone:1},null,8,ln==='B'?6:7);
  st('obr',ln==='B'?'Intensywne obieranie':'Obieranie','ob','obierane',{odp_obr:1});
  st('naw','Nawilżanie','nw','nawilżone');
  st('odl','Odleżenie','kd','kondycjonowane',null,ln==='B'?6:ln==='C'?5:12);
  R('zar',ln==='B'?'Przemiał na semolinę':'Przemiał',{[cur]:2},{['m_'+k]:1,otreby:1});
});
// pszenżyto w dużej części idzie na paszę: po czyszczeniu wystarczy śrutownik
prod('sruta_pzy','Śruta pszenżytnia','#c8b080','otreby');R('srt','Śrutowanie na paszę',{pzy_od:2},{sruta_pzy:2});
L('k_owi',[['mlo','Młócenie','p_owi','Owies w plewach',1,2],['lus','Odplewianie','z_owi','Ziarno owsa'],['pra','Stabilizacja termiczna','z_owis','Owies stabilizowany'],['zar','Mielenie','m_owi',null,2,1]]);
// 2. bezglutenowe (owies sam nie ma glutenu)
L('k_owc',[['mlo','Młócenie','p_owc','Owies certyfikowany w plewach',1,2],['lus','Odplewianie','z_owc','Ziarno owsa certyfikowanego'],['pra','Stabilizacja termiczna','z_owcs','Owies certyfikowany stabilizowany'],['mbg','Mielenie na czystej linii','m_owc',null,2,1]]);
L('k_ryz',[['mlo','Młócenie','ryz_nl','Ryż niełuskany',1,2],['lus','Łuskanie','ryz_br','Ryż brązowy']]);
it('ryz_bi','Ryż biały','ryz_br'); ITEMS.ryz_bi.col='#f4efe0'; R('lus','Polerowanie',{ryz_br:1},{ryz_bi:1,otreby:1});
R('zar','Mielenie',{ryz_bi:2},{m_ryzb:1}); R('zar','Mielenie pełnoziarniste',{ryz_br:2},{m_ryzbr:1});
L('k_rkl',[['mlo','Młócenie','rkl_nl','Ryż kleisty niełuskany',1,2],['lus','Łuskanie','rkl_br','Ryż kleisty brązowy'],['lus','Polerowanie','rkl_bi','Ryż kleisty biały'],['kad','Moczenie','rkl_m','Namoczony ryż kleisty'],['zar','Mielenie na mokro','rkl_masa','Masa ryżowa',2,1],['sus','Suszenie','m_mochi']]);
L('kolby',[['mlo','Obrywanie ziarna z kolb','z_kuk','Ziarno kukurydzy',1,3]]); R('zar','Mielenie',{z_kuk:2},{m_kuk:1});
it('nixt','Nixtamal','z_kuk'); R('koc','Nikstamalizacja w wodzie wapiennej',{z_kuk:2,wapno:1},{nixt:2},8);
L('nixt',[['kad','Płukanie z wapna','nixt_p','Nixtamal wypłukany'],['sus','Suszenie','nixt_s','Nixtamal suszony'],['zar','Mielenie','m_masa',null,2,1]]);
L('n_gry',[['lus','Łuskanie','kasza_g','Kasza gryczana niepalona']]); R('zar','Mielenie',{kasza_g:2},{m_gry:1});
L('kasza_g',[['pra','Palenie','kasza_gp','Kasza gryczana palona']]); R('zar','Mielenie',{kasza_gp:2},{m_gry:1});
L('k_pro',[['mlo','Młócenie','p_pro','Proso w łusce',1,2],['lus','Łuskanie','kasza_j','Kasza jaglana'],['zar','Mielenie','m_jag',null,2,1]]);
L('k_ama',[['mlo','Młócenie','n_ama','Nasiona szarłatu',1,2],['zar','Mielenie','m_ama',null,2,1]]);
L('k_qui',[['mlo','Młócenie','n_qui','Nasiona komosy',1,2],['kad','Płukanie saponin','n_quip','Komosa wypłukana'],['sus','Suszenie','n_quis','Komosa suszona'],['zar','Mielenie','m_qui',null,2,1]]);
L('k_tef',[['mlo','Młócenie','n_tef','Ziarenka teffu',1,2],['zar','Mielenie','m_tef',null,2,1]]);
L('k_sor',[['mlo','Młócenie','p_sor','Sorgo w łusce',1,2],['lus','Obłuskiwanie','z_sor','Ziarno sorgo'],['zar','Mielenie','m_sor',null,2,1]]);
L('k_rag',[['mlo','Młócenie','z_rag','Ziarno ragi',1,2],['zar','Mielenie','m_rag',null,2,1]]);
L('k_baj',[['mlo','Młócenie','z_baj','Ziarno prosa perłowego',1,2],['zar','Mielenie','m_baj',null,2,1]]);
L('k_fon',[['mlo','Młócenie','p_fon','Fonio w łusce',1,2],['lus','Łuskanie','z_fon','Ziarno fonio'],['zar','Mielenie','m_fon',null,2,1]]);
L('k_dry',[['mlo','Młócenie','dry_s','Dziki ryż surowy',1,2],['pra','Prażenie (parching)','dry_p','Dziki ryż prażony'],['lus','Łuskanie','z_dry','Ziarno dzikiego ryżu'],['zar','Mielenie','m_dry',null,2,1]]);
// 3. strączkowe
L('s_cie',[['mlo','Młócenie','n_cie','Nasiona ciecierzycy',1,2],['lus','Łuskanie i dzielenie','cie_dal','Chana dal'],['zar','Mielenie','m_cie',null,2,1]]);
L('s_soc',[['mlo','Młócenie','n_soc','Nasiona soczewicy',1,2]]); R('zar','Mielenie',{n_soc:2},{m_soc_z:1});
L('n_soc',[['lus','Łuskanie','soc_l','Soczewica czerwona łuskana']]); ITEMS.soc_l.col='#e88a50'; R('zar','Mielenie',{soc_l:2},{m_soc_c:1});
L('s_soj',[['mlo','Młócenie','n_soj','Ziarna soi',1,2],['pra','Prażenie (inaktywacja enzymów)','soj_p','Soja prażona'],['lus','Łuskanie','soj_l','Soja łuskana'],['zar','Mielenie','m_soj',null,2,1]]);
L('s_gro',[['mlo','Młócenie','n_gro','Nasiona grochu',1,2],['lus','Łuskanie i dzielenie','gro_l','Groch łuskany połówki'],['zar','Mielenie','m_gro',null,2,1]]);
L('s_bob',[['mlo','Młócenie','n_bob','Nasiona bobu',1,2],['lus','Łuskanie','bob_l','Bób łuskany'],['zar','Mielenie','m_bob',null,2,1]]);
L('s_lub',[['mlo','Młócenie','n_lub','Nasiona łubinu',1,2],['lus','Łuskanie','lub_l','Łubin łuskany'],['zar','Mielenie','m_lub',null,2,1]]);
L('s_fas',[['mlo','Młócenie','n_fas','Nasiona fasoli',1,2],['pra','Podprażanie','fas_p','Fasola podprażona'],['zar','Mielenie','m_fas',null,2,1]]);
L('s_mun',[['mlo','Młócenie','n_mun','Nasiona mung',1,2],['lus','Łuskanie i dzielenie','mun_d','Mung dal'],['zar','Mielenie','m_mun',null,2,1]]);
L('s_ura',[['mlo','Młócenie','n_ura','Nasiona urad',1,2],['lus','Łuskanie i dzielenie','ura_d','Urad dal'],['zar','Mielenie','m_ura',null,2,1]]);
ITEMS.ura_d.col='#ece6d6';
// 4. orzechy i oleiste
L('mig_lup',[['lup','Łupanie','mig','Migdały ze skórką']]); R('zar','Mielenie na zimno',{mig:2},{m_mig:1});
L('mig',[['koc','Blanszowanie i obieranie ze skórki','mig_b','Migdały blanszowane']]); ITEMS.mig_b.col='#f0e2c8'; R('zar','Mielenie na zimno',{mig_b:2},{m_mig:1});
L('wl_lup',[['lup','Łupanie','wl','Orzechy włoskie łuskane']]); it('wl_mak','Makuch z orzechów włoskich','wl');
R('pre','Tłoczenie oleju',{wl:2},{wl_mak:1,olej:1}); R('zar','Mielenie makuchu',{wl_mak:1},{m_wl:1});
L('las_lup',[['lup','Łupanie','las','Orzechy laskowe łuskane'],['pra','Prażenie','las_p','Orzechy laskowe prażone'],['zar','Mielenie na zimno','m_las',null,2,1]]);
L('ara_lup',[['lup','Łupanie','ara','Orzeszki ziemne'],['pra','Prażenie','ara_p','Orzeszki prażone']]); it('ara_mak','Makuch arachidowy','ara');
R('pre','Tłoczenie oleju',{ara_p:2},{ara_mak:1,olej:1}); R('zar','Mielenie makuchu',{ara_mak:1},{m_ara:1});
L('kosz',[['mlo','Wykruszanie nasion','n_slo','Nasiona słonecznika',1,3],['lus','Łuskanie','slo_l','Słonecznik łuskany']]); it('slo_mak','Makuch słonecznikowy','slo_l');
R('pre','Tłoczenie oleju',{slo_l:2},{slo_mak:1,olej:1}); R('zar','Mielenie makuchu',{slo_mak:1},{m_slo:1});
L('tor_len',[['mlo','Młócenie','siemie','Siemię lniane',1,2]]); it('len_mak','Makuch lniany','siemie');
R('zar','Mielenie (pełnotłusta)',{siemie:2},{m_len:1}); R('pre','Tłoczenie oleju',{siemie:2},{len_mak:1,olej:1}); R('zar','Mielenie makuchu (odtłuszczona)',{len_mak:1},{m_len:1});
it('pestki','Pestki dyni','dynia'); ITEMS.pestki.col='#e8dca0'; it('miazsz','Miąższ dyni','dynia');
R('obi','Drążenie dyni',{dynia:1},{pestki:2,miazsz:2});
L('pestki',[['sus','Suszenie','pestki_s','Pestki dyni suszone'],['lus','Łuskanie','pestki_l','Pestki dyni łuskane']]); ITEMS.pestki_l.col='#6a8a4a';
it('pes_mak','Makuch z pestek dyni','pestki_l'); R('pre','Tłoczenie oleju',{pestki_l:2},{pes_mak:1,olej:1}); R('zar','Mielenie makuchu',{pes_mak:1},{m_pes:1});
L('miazsz',[['sus','Suszenie','miazsz_s','Susz z dyni'],['zar','Mielenie','m_dyn',null,2,1]]);
L('k_kon',[['mlo','Młócenie','n_kon','Nasiona konopi',1,2]]); it('kon_mak','Makuch konopny','n_kon');
R('pre','Tłoczenie oleju',{n_kon:2},{kon_mak:1,olej:1}); R('zar','Mielenie makuchu',{kon_mak:1},{m_kon:1});
L('k_sez',[['mlo','Młócenie','n_sez','Nasiona sezamu',1,2],['kad','Moczenie','sez_m','Sezam namoczony'],['lus','Łuskanie','sez_l','Sezam łuskany']]); it('sez_mak','Makuch sezamowy','sez_l');
R('pre','Tłoczenie oleju',{sez_l:2},{sez_mak:1,olej:1}); R('zar','Mielenie makuchu',{sez_mak:1},{m_sez:1});
it('ner_lup','Nerkowce w łupinie','jab_nerk'); ITEMS.ner_lup.col='#8a7a5a';
R('obi','Odrywanie orzecha od jabłka',{jab_nerk:1},{ner_lup:1,sok:1});
L('ner_lup',[['pra','Prażenie łupin (usuwa urushiol)','ner_p','Nerkowce prażone w łupinie'],['lup','Łupanie','ner','Nerkowce'],['zar','Mielenie na zimno','m_ner',null,2,1]]);
ITEMS.ner.col='#ecdcbc';
L('mak_lup',[['lup','Łupanie bardzo twardej łupiny','mak','Orzechy makadamia']]); ITEMS.mak.col='#f0e4c8'; it('mak_mak','Makuch makadamia','mak');
R('pre','Tłoczenie oleju',{mak:2},{mak_mak:1,olej:1}); R('zar','Mielenie makuchu',{mak_mak:1},{m_mak:1});
L('kaszt',[['sus','Suszenie','kaszt_s','Kasztany suszone'],['lup','Łupanie','kaszt_l','Kasztany łuskane'],['zar','Mielenie','m_kas',null,2,1]]);
L('k_cza',[['mlo','Młócenie','n_cza','Nasiona czarnuszki',1,2]]); ITEMS.n_cza.col='#2a2628'; it('cza_mak','Makuch z czarnuszki','n_cza');
R('pre','Tłoczenie oleju',{n_cza:2},{cza_mak:1,olej:1}); R('zar','Mielenie makuchu',{cza_mak:1},{m_cza:1});
L('k_wie',[['mlo','Młócenie','n_wie','Nasiona wiesiołka',1,2]]); ITEMS.n_wie.col='#6a5040'; it('wie_mak','Makuch z wiesiołka','n_wie');
R('pre','Tłoczenie oleju',{n_wie:2},{wie_mak:1,olej:1}); R('zar','Mielenie makuchu',{wie_mak:1},{m_wie:1});
// 5. skrobie i bulwy
L('ziem',[['plu','Tarcie i wypłukiwanie skrobi','skr_z','Mleczko skrobiowe',2,1],['sus','Suszenie','m_ziem']]);
L('man',[['obi','Obieranie','man_ob','Maniok obrany']]); ITEMS.man_ob.col='#efe4cc';
L('man_ob',[['kad','Moczenie (usuwa związki cyjanogenne)','man_m','Maniok namoczony'],['sus','Suszenie','man_s','Maniok suszony'],['zar','Mielenie','m_kasawa',null,2,1]]);
L('man_ob',[['plu','Tarcie i wypłukiwanie skrobi','skr_m','Mleczko z manioku',2,1],['sus','Suszenie','m_tapioka']]);
it('kok_m','Miąższ kokosa','kokos'); ITEMS.kok_m.col='#f4eee0';
R('lup','Łupanie i wyjmowanie miąższu',{kokos:1},{kok_m:2});
L('kok_m',[['obi','Wiórkowanie','kok_w','Wiórki kokosowe'],['sus','Suszenie','kok_ws','Wiórki suszone']]); it('kok_mak','Odtłuszczone wiórki','kok_ws');
R('pre','Tłoczenie oleju kokosowego',{kok_ws:2},{kok_mak:1,olej:1}); R('zar','Mielenie',{kok_mak:1},{m_kok:1});
L('banan',[['obi','Obieranie i krojenie','ban_pl','Plastry zielonego banana'],['sus','Suszenie','ban_s','Susz bananowy'],['zar','Mielenie','m_ban',null,2,1]]);
L('batat',[['obi','Obieranie i krojenie','bat_pl','Plastry batata'],['sus','Suszenie','bat_s','Susz z batata'],['zar','Mielenie','m_bat',null,2,1]]);
L('mar_kl',[['plu','Tarcie i wypłukiwanie skrobi','skr_mar','Mleczko z maranty',2,1],['sus','Suszenie','mar_s','Surowa skrobia maranty'],['sit','Przesiewanie','m_arr']]);
L('taro',[['obi','Obieranie i krojenie','taro_pl','Plastry taro'],['koc','Blanszowanie (rozkład szczawianów)','taro_b','Taro blanszowane'],['sus','Suszenie','taro_s','Susz z taro'],['zar','Mielenie','m_taro',null,2,1]]);
L('jam',[['obi','Obieranie i krojenie','jam_pl','Plastry jamu'],['sus','Suszenie','jam_s','Susz z jamu'],['zar','Mielenie','m_jam',null,2,1]]);
L('zol',[['lup','Łupanie','zol_l','Żołędzie łuskane'],['zar','Śrutowanie','zol_sr','Śruta żołędziowa'],['kad','Ługowanie garbników','zol_lg','Śruta odgoryczona',1,1,10],['sus','Suszenie','zol_s','Śruta żołędziowa suszona'],['sit','Przesiewanie','m_zol']]);
L('chleb',[['obi','Obieranie i krojenie','chl_pl','Plastry chlebowca'],['sus','Suszenie','chl_s','Susz z chlebowca'],['zar','Mielenie','m_chl',null,2,1]]);
it('kar_m','Miąższ strąków karobu','karob');
R('obi','Wypestkowanie strąków',{karob:1},{kar_m:1,nas_kar:1});
L('kar_m',[['pra','Prażenie','kar_p','Karob prażony'],['zar','Mielenie','m_kar',null,2,1]]);
// 6. owocowe i warzywne
it('jab_w','Wytłoki jabłkowe','jab'); ITEMS.jab_w.col='#b88a4a';
R('pre','Tłoczenie soku',{jab:3},{jab_w:2,sok:1});
L('jab_w',[['sus','Suszenie','jab_ws','Wytłoki jabłkowe suszone'],['zar','Mielenie','m_jab',null,2,1]]);
L('roza',[['sus','Suszenie','roza_s','Owoce róży suszone'],['zar','Śrutowanie','roza_sr','Śruta z dzikiej róży'],['sit','Odsiewanie włosków i pestek','m_roza']]);
L('rok',[['sus','Suszenie','rok_s','Owoce rokitnika suszone'],['zar','Mielenie','m_rok',null,2,1]]);
it('aro_w','Wytłoki aroniowe','aro'); R('pre','Tłoczenie soku',{aro:3},{aro_w:2,sok:1});
L('aro_w',[['sus','Suszenie','aro_ws','Wytłoki aroniowe suszone'],['zar','Mielenie','m_aro',null,2,1]]);
it('win_w','Wytłoki winogronowe','wino'); R('pre','Tłoczenie soku',{wino:3},{win_w:2,sok:1});
L('win_w',[['sit','Oddzielanie pestek','pes_win','Pestki winogron',2,1],['sus','Suszenie','pes_ws','Pestki winogron suszone']]); ITEMS.pes_win.col='#6a4a3a'; ITEMS.pes_ws.col='#6a4a3a';
it('win_mak','Makuch z pestek winogron','pes_ws'); R('pre','Tłoczenie oleju',{pes_ws:2},{win_mak:1,olej:1}); R('zar','Mielenie makuchu',{win_mak:1},{m_win:1});
L('burak',[['obi','Obieranie i krojenie','bur_pl','Plastry buraka'],['sus','Suszenie','bur_s','Susz z buraka'],['zar','Mielenie','m_bur',null,2,1]]);
L('kalaf',[['obi','Dzielenie na różyczki','kal_r','Różyczki kalafiora',1,2],['sus','Suszenie','kal_s','Susz z kalafiora'],['zar','Mielenie','m_kal',null,2,1]]);

const BYM={}; RECIPES.forEach(r=>{Object.keys(r.out).forEach(o=>{(BYM[o]=BYM[o]||[]).push(r)})});

// ---------- KOLEJNOŚĆ ROZWOJU: jak w Księdze mąk ----------
// Najpierw zboża glutenowe, potem bezglutenowe, strączkowe, orzechy i oleiste, skrobie, na końcu owocowe i warzywne.
// W obrębie działu łatwiejsze uprawy wcześniej. Z tej kolejności wynikają poziomy, ceny nasion, maszyn i mąk.
(()=>{const catOf={};FL.forEach(([cat,id])=>{const c=chainOf(id).find(s=>s.crop);if(c){const k=c.crop.id;catOf[k]=Math.min(catOf[k]||9,cat)}});
  const ord=CROPS.slice().sort((a,b)=>(catOf[a.id]||9)-(catOf[b.id]||9)||a.lvl-b.lvl||CROPS.indexOf(a)-CROPS.indexOf(b));
  ord.forEach((c,i)=>{const nl=1+Math.floor(i*19/(ord.length-1));
    c.p=Math.round(8*Math.pow(1.15,nl-1)*Math.sqrt(c.y/4)*(c.r?4:1)); c.g=c.r?c.g0:Math.round(c.g0*(1+0.025*(nl-1))); c.lvl=nl; c.cat=catOf[c.id]||6;});
  // maszyna jest do kupienia od poziomu pierwszej mąki, która jej potrzebuje
  const need={};FL.forEach(([,id])=>{const ch=chainOf(id),c=ch.find(s=>s.crop),lv=c?c.crop.lvl:1;ch.filter(s=>s.r).forEach(s=>{need[s.r.m]=Math.min(need[s.r.m]||99,lv)})});
  MACH.forEach(x=>{if(x[3]===0)return;const ln=MLINE.has(x[0]),lv=Math.max(ln?1:2,need[x[0]]||x[5]);x[5]=lv;x[3]=Math.round((ln?150*Math.pow(1.3,lv-1):300*Math.pow(1.27,lv-1))/50)*50;M[x[0]].lv=lv;M[x[0]].p=x[3]});
})();

// ---------- WARTOŚCI ----------
const VAL={wapno:3,otreby:2,olej:6,sok:4,nas_kar:5,sloma:0.8,poslad:1.5,zan_gr:0.3,odsiew:0.4,plewy_pyl:0.3,pyl:0.2,metal:0.5,kamienie:0.2,fr_kr:0.6,fr_dl:0.9,lekkie:0.8,porazone:0.3,sporysz:0.2,odp_obr:0.8,plewy:0.7,osci:0.2,luska_j:0.5,maczka:1.2,kielki:1.5};
CROPS.forEach(c=>{const base= c.r ? c.p/(c.y*5)+c.r*0.04 : c.p/c.y*1.25+c.g*0.04; VAL[c.out]=base*(1+0.035*(c.lvl-1));});
for(let pass=0;pass<14;pass++) RECIPES.forEach(r=>{
  const ins=Object.entries(r.in); if(ins.some(([k])=>VAL[k]==null)) return;
  const outs=Object.entries(r.out); const mains=outs.filter(([k])=>ITEMS[k].kind!=='by');
  if(!mains.length||mains.every(([k])=>VAL[k]!=null)) return;
  const cost=ins.reduce((s,[k,q])=>s+VAL[k]*q,0)+r.t*0.45;
  const by=outs.filter(([k])=>ITEMS[k].kind==='by').reduce((s,[k,q])=>s+VAL[k]*q,0);
  const units=mains.reduce((s,[,q])=>s+q,0);
  mains.forEach(([k])=>{if(VAL[k]==null)VAL[k]=Math.max(0.5,(cost*1.22-by*0.5)/units)});
});
// cena mąki trzyma się poziomu z Księgi; trudniejszy łańcuch daje najwyżej +60%, prostszy −25%
// gotowe produkty (kasze, słód, płatki, śruta) wyceniane tak jak mąki: od poziomu uprawy, nie od długości łańcucha
const PRICE={};[...FLOURS,...Object.keys(ITEMS).filter(i=>ITEMS[i].kind==='prod')].forEach(f=>{const c=chainOf(f).find(s=>s.crop),T=10*Math.pow(1.12,(c?c.crop.lvl:1)-1);PRICE[f]=Math.max(3,Math.round(T*Math.min(1.6,Math.max(0.75,VAL[f]*0.95/T))))});
// INCOME: ogólny mnożnik zarobków ze sprzedaży (sklep, skup, zamówienia)
const INCOME=0.75;
function price(id){const v=VAL[id]||1,k=ITEMS[id].kind;
  if(k==='flour'||k==='prod') return Math.max(2,Math.round(PRICE[id]*INCOME));
  if(k==='raw') return Math.max(1,Math.round(v*0.85*INCOME));
  return Math.max(1,Math.round(v*INCOME));}

// wartości liczone są od czasów bazowych, potem gra je wydłuża
CROPS.forEach(c=>{c.g*=TG;c.r*=TG}); RECIPES.forEach(r=>r.t*=TM);

// roślina -> mąki, do których prowadzi
const FWD={}; RECIPES.forEach(r=>Object.keys(r.in).forEach(i=>{(FWD[i]=FWD[i]||new Set());Object.keys(r.out).forEach(o=>FWD[i].add(o))}));
function floursFrom(id,seen=new Set()){ if(seen.has(id))return[];seen.add(id);let out=[];
  if(ITEMS[id].kind==='flour')out.push(id);(FWD[id]||[]).forEach(n=>out=out.concat(floursFrom(n,seen)));return out;}
CROPS.forEach(c=>c.flours=[...new Set(floursFrom(c.out))]);
// półprodukty i plony zawsze tańsze od mąk, do których prowadzą
Object.keys(ITEMS).forEach(id=>{const k=ITEMS[id].kind;if(k==='flour'||k==='supply'||k==='by'||VAL[id]==null)return;const fl=floursFrom(id);if(!fl.length)return;const cap=Math.min(...fl.map(f=>PRICE[f]))*(k==='raw'?0.45:0.8);if(VAL[id]>cap)VAL[id]=cap});

// pełny łańcuch produkcji danej mąki (pierwsza ścieżka)
function chainOf(id){const steps=[],seen=new Set();
  (function walk(x){if(seen.has(x)||x==='wapno')return;seen.add(x);const it=ITEMS[x];
    if(it.kind==='raw'){steps.push({crop:CR[it.crop]});return}
    const r=(BYM[x]||[])[0];if(!r)return;Object.keys(r.in).forEach(walk);steps.push({r,out:x});})(id);return steps;}
