// Aura Fields — logika, interfejs i niebo nad gospodarstwem. Wymaga data.js.
(()=>{
'use strict';
// wersja gry: podbija ją skrypt release.ps1 przy każdym wydaniu
const VERSION='1.3.0';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const rand=n=>Math.floor(Math.random()*n), pick=a=>a[rand(a.length)];
const fmtT=s=>{if(!isFinite(s))return '—';s=Math.max(0,Math.ceil(s));if(s<60)return s+' s';if(s<3600)return Math.floor(s/60)+' min '+String(s%60).padStart(2,'0')+' s';return Math.floor(s/3600)+' h '+Math.floor(s%3600/60)+' min'};
const fmtZ=n=>Math.floor(n).toLocaleString('pl-PL')+' zł';
const plural=(n,a,b,c)=>n===1?a:(n%10>=2&&n%10<=4&&(n%100<12||n%100>14))?b:c;

// ---------- KALENDARZ I POGODA ----------
const DAY=600, SD=3; // sekundy na dobę gry, dni na porę roku
const SEASONS=[
 {n:'Wiosna',m:1.15,hill:[96,150,64],msg:'Nadeszła wiosna. Można znów siać na polu, a wszystko rośnie 15% szybciej.'},
 {n:'Lato',m:1,hill:[122,146,52],msg:'Nadeszło lato. W upały pomaga nawadnianie.'},
 {n:'Jesień',m:0.9,hill:[164,112,52],msg:'Nadeszła jesień. Drzewa i krzewy dają +1 owoc, ale to ostatnia pora na zbiory przed zimą.'},
 {n:'Zima',m:0,hill:[214,222,230],msg:'Nadeszła zima. Pod gołym niebem nic nie rośnie i nie można siać. Szklarnia pracuje normalnie.'}];
const WEATHER={
 slonce:{n:'Pogodnie',m:1,d:''},
 pochm:{n:'Pochmurno',m:1,d:''},
 deszcz:{n:'Deszcz',m:1.25,d:'Deszcz: uprawy pod gołym niebem rosną 25% szybciej.'},
 upal:{n:'Upał',m:0.75,d:'Upał: uprawy bez nawadniania rosną 25% wolniej.'},
 snieg:{n:'Śnieg',m:1,d:''},
 mroz:{n:'Mróz',m:1,d:''}};
const WX_BY_SEASON=[['slonce','slonce','deszcz','deszcz','pochm'],['slonce','slonce','upal','upal','deszcz','pochm'],['pochm','deszcz','deszcz','slonce','pochm'],['snieg','snieg','mroz','pochm']];

// ---------- ULEPSZENIA ----------
// id, nazwa, opis, maks., koszt bazowy, mnożnik ceny, wymagany poziom (start), +poziom na każdy kolejny stopień
const RES=[
 ['log','Zasobniki','Większe kosze przy maszynach: +3 miejsca w kolejce każdej maszyny.',15,250,1.55,1,1],
 ['agro','Agronomia','Płodozmian i nawożenie: wszystkie uprawy rosną o 8% szybciej.',10,400,1.7,2,2],
 ['maint','Konserwacja maszyn','Smar, pasy i łożyska: wszystkie maszyny pracują o 6% szybciej.',10,450,1.7,2,2],
 ['lada','Lada sklepowa','Dłuższa wystawa: +1 miejsce na towar w sklepie.',9,300,1.65,1,2],
 ['szyld','Szyld i ogłoszenia','Więcej przechodniów zagląda do sklepu: +10% klientów.',10,400,1.7,2,2],
 ['ceny','Worki z nadrukiem','Ładne opakowania: ceny w sklepie +4%.',10,500,1.75,3,2],
 ['bulk','Hurt nasion','Nasiona kupowane workami: −6% ceny nasion.',6,500,1.8,3,2],
 ['kontrakt','Umowy hurtowe','Lepsze warunki: zamówienia płacą +6%.',10,800,1.8,4,2],
 ['cierp','Terminowe dostawy','Odbiorcy dają więcej czasu: zamówienia są ważne o 20% dłużej.',5,700,1.9,4,3],
 ['tablica','Tablica zamówień','Więcej odbiorców naraz: +1 miejsce na zamówienia.',4,1500,2.4,5,4],
 ['fame','Opowieści o młynie','Ludzie o tobie mówią: +6% zdobywanej renomy.',8,900,2,5,2],
 ['seed','Selekcja nasion','Nasiona kwalifikowane: każdy zbiór daje +1 sztukę plonu.',5,900,2.3,4,3],
 ['school','Szkolenia','Kursy rolnicze: +10% punktów doświadczenia.',5,1000,2,6,3],
];
const WORK=[ // id, nazwa, opis, koszt, wymagany poziom
 ['parobek','Parobek','Sam zbiera dojrzałe plony ze wszystkich poletek.',2000,5],
 ['siewca','Siewca','Po każdym zbiorze sieje na poletku tę samą roślinę jednoroczną, jeśli pora roku i kasa pozwalają.',3500,7],
 ['kupiec','Kupiec','Dokłada towar na wystawę sklepu, dostarcza pełne zamówienia i oddaje produkty uboczne do skupu.',8000,12],
];
const MILLER_MAX=5, millerCost=k=>Math.round(5000*Math.pow(1.8,k)), millerReq=k=>8+2*k;
const ENVCOST={pole:0,mokre:500,szklarnia:1200}, ENVREQ={pole:1,mokre:9,szklarnia:4};
const SOILMAX=6, SPRCOST=400;
const BUYERS=['Piekarnia „Pod Kłosem”','Cukiernia Wiśniewskich','Bar mleczny „Jutrzenka”','Pierogarnia u Haliny','Bistro bezglutenowe','Pracownia makaronu','Sklep ze zdrową żywnością','Szkolna stołówka','Pizzeria „Forno”','Restauracja indyjska „Tandur”','Taqueria „El Maíz”','Herbaciarnia „Mochi”','Piekarnia rzemieślnicza „Zakwas”','Naleśnikarnia „Gryczana”','Sklep keto „Bez Cukru”'];

// ---------- STAN ----------
const KEY='mlyn-poletko-v3';
let S, dirty=true, lastReal=Date.now(), lastRender=0, stageCache=[], silent=false;
const newPlot=()=>({env:'pole',crop:null,prog:0,need:0,h:0,soil:0,spr:false,last:null});
function newState(){
  const m={}; MACH.forEach(x=>m[x[0]]={owned:x[3]===0});
  // hala na start: czyszczalnia wstępna i żarna; resztę linii zboża dokupuje się w Sklepie
  const hall=newHall();hall.cells['1,1']=newCell('czw',0);hall.cells['9,1']=newCell('zar',0);
  const s={v:3,t:DAY*0.1,coins:100,earned:0,xp:0,lvl:1,speed:1,tab:'pola',cat:0,onlyAvail:true,selM:'mlo',
    plots:Array.from({length:6},newPlot),inv:{},m,made:{},orders:[],dem:{},hot:null,day:-1,wx:'slonce',fc:[],
    res:{},work:{},auto:{},millers:[],ach:{},goal:0,st:{harv:0,sold:0,flourSold:0,orders:0,crafted:0,planted:0,planned:0,cust:0},sound:true,seen:Date.now(),
    pop:{l:1,p:0,sd:0},shop:[],nextOrd:null,mk:2,halls:[hall],hall:0,hq:5,mag:[],mp:{},rv:2,rk:RKEYS};
  // gospodarstwo na start: pszenica gotowa do zbioru, żyto w połowie
  Object.assign(s.plots[0],{crop:'pszenica',prog:CR.pszenica.g,need:CR.pszenica.g,last:'pszenica'});
  Object.assign(s.plots[1],{crop:'zyto',prog:CR.zyto.g*0.45,need:CR.zyto.g,last:'zyto'});
  return s;
}
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.v===3)return s}catch(e){}return null}
function save(){if(!S)return;S.seen=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function repair(s){ // uzupełnia brakujące pola
  const oldR=s.rv!==2,oldRk=s.rk;
  const oldMk=s.mk==null&&s.st;
  const d=newState(); for(const k in d) if(s[k]===undefined) s[k]=d[k];
  if(oldMk) migrateMarket(s);
  if(!s.pop||typeof s.pop!=='object') s.pop={l:1,p:0,sd:0};
  if(!Array.isArray(s.shop)) s.shop=[];
  s.orders=(s.orders||[]).filter(o=>o&&Array.isArray(o.lines));
  for(const k in d.st) if(s.st[k]===undefined) s.st[k]=0;
  MACH.forEach(x=>{if(!s.m[x[0]])s.m[x[0]]={owned:x[3]===0,n:x[3]===0?1:0}});
  // przejście na hale: liczba egzemplarzy z dawnego „kupiona”, a surowce ze starych kolejek wracają do spiżarni
  MACH.forEach(x=>{const m=s.m[x[0]];if(m.n==null&&(m.q||m.run||m.lvl!=null))m.n=m.owned?1:0;
    [...(m.q||[]).map(r=>({r})),...(m.run||[])].forEach(j=>{const r=RECIPES[j.r];if(r)Object.entries(r.in).forEach(([i,q])=>{s.inv[i]=(s.inv[i]||0)+q})});delete m.q;delete m.run});
  if(!Array.isArray(s.halls)||!s.halls.length)s.halls=[newHall()];
  if(!s.halls[s.hall])s.hall=0;
  s.halls.forEach(h=>{h.w=HALL_W;h.items=h.items||{};h.cells=h.cells||{};for(const k in h.cells){const c=h.cells[k];c.q=c.q||[];c.run=c.run||[]}});
  if(oldR) migrateLines(s); else remapRecipes(s,oldRk||LEGACY_K);
  s.rk=RKEYS;
  purgeUnknown(s);
  s.millers=(s.millers||[]).map(ml=>({at:ml.at||null,off:!!ml.off}));
  // każdy egzemplarz dostaje poziom swojego typu, a niepostawione egzemplarze trafiają do magazynu
  if(!Array.isArray(s.mag))s.mag=[];
  MACH.forEach(x=>{const m=s.m[x[0]],lv=m.lvl||1;let placed=0;
    s.halls.forEach(h=>{for(const k in h.cells){const c=h.cells[k];if(c.m===x[0]){placed++;if(c.lvl==null)c.lvl=lv}}});
    if(m.n!=null){for(let i=placed;i<m.n;i++)s.mag.push({m:x[0],lvl:lv});delete m.n}delete m.lvl});
  s.halls.forEach(h=>{for(const k in h.cells){const c=h.cells[k];if(!c.lvl)c.lvl=1;if(c.lvl<MLV_AUTO)c.auto=false}});
  delete s.lines;delete s.lineHide;delete s.lineFold;
  s.plots.forEach(p=>{const n=newPlot();for(const k in n) if(p[k]===undefined) p[k]=n[k]});
  s.speed=1; if(!M[s.selM]) s.selM='mlo';
  if(!Array.isArray(s.shelf)){s.shelves=SHELF_START;s.shelf=Array(SHELF_START*SHELF_W).fill(null);s._arrange=true}
  if(!s.shelves) s.shelves=Math.max(1,Math.ceil(s.shelf.length/SHELF_W));
  while(s.shelf.length<s.shelves*SHELF_W) s.shelf.push(null);
  if(s.shelf.length>s.shelves*SHELF_W) s.shelf.length=s.shelves*SHELF_W;
  if(!s.rot||typeof s.rot!=='object') s.rot={};
  if(!s.slotRule||typeof s.slotRule!=='object') s.slotRule={};
  if(!Array.isArray(s.shelfKind)) s.shelfKind=[];
  if(s.autoPlace===undefined) s.autoPlace=true;
  if(!Array.isArray(s.shelfPos)) s.shelfPos=[];
  return s;}

// linie obróbki zbóż (wersja 1.4): stare półprodukty zbóż glutenowych zamieniamy na odpowiedniki z nowych linii,
// a partie w maszynach przepisujemy na te same receptury pod nowymi numerami (albo zwracamy wkład do spiżarni)
const LEGACY_R=["mlo:k_psz1>z_psz2","zar:z_psz2>m_psz1+otreby1","mlo:k_dur1>z_dur2","zar:z_dur2>m_dur1","mlo:k_ork1>p_ork2","lus:p_ork1>z_ork1","zar:z_ork2>m_ork1","mlo:k_pla1>p_pla2","lus:p_pla1>z_pla1","zar:z_pla2>m_pla1","mlo:k_sam1>p_sam2","lus:p_sam1>z_sam1","zar:z_sam2>m_sam1","mlo:k_kho1>z_kho2","zar:z_kho2>m_kho1","mlo:k_zyt1>z_zyt2","zar:z_zyt2>m_zyt1+otreby1","mlo:k_pzy1>z_pzy2","zar:z_pzy2>m_pzy1","mlo:k_jec1>p_jec2","lus:p_jec1>z_jec1","zar:z_jec2>m_jec1","mlo:k_owi1>p_owi2","lus:p_owi1>z_owi1","pra:z_owi1>z_owis1","zar:z_owis2>m_owi1","mlo:k_owc1>p_owc2","lus:p_owc1>z_owc1","pra:z_owc1>z_owcs1","mbg:z_owcs2>m_owc1","mlo:k_ryz1>ryz_nl2","lus:ryz_nl1>ryz_br1","lus:ryz_br1>ryz_bi1+otreby1","zar:ryz_bi2>m_ryzb1","zar:ryz_br2>m_ryzbr1","mlo:k_rkl1>rkl_nl2","lus:rkl_nl1>rkl_br1","lus:rkl_br1>rkl_bi1","kad:rkl_bi1>rkl_m1","zar:rkl_m2>rkl_masa1","sus:rkl_masa1>m_mochi1","mlo:kolby1>z_kuk3","zar:z_kuk2>m_kuk1","koc:z_kuk2+wapno1>nixt2","kad:nixt1>nixt_p1","sus:nixt_p1>nixt_s1","zar:nixt_s2>m_masa1","lus:n_gry1>kasza_g1","zar:kasza_g2>m_gry1","pra:kasza_g1>kasza_gp1","zar:kasza_gp2>m_gry1","mlo:k_pro1>p_pro2","lus:p_pro1>kasza_j1","zar:kasza_j2>m_jag1","mlo:k_ama1>n_ama2","zar:n_ama2>m_ama1","mlo:k_qui1>n_qui2","kad:n_qui1>n_quip1","sus:n_quip1>n_quis1","zar:n_quis2>m_qui1","mlo:k_tef1>n_tef2","zar:n_tef2>m_tef1","mlo:k_sor1>p_sor2","lus:p_sor1>z_sor1","zar:z_sor2>m_sor1","mlo:k_rag1>z_rag2","zar:z_rag2>m_rag1","mlo:k_baj1>z_baj2","zar:z_baj2>m_baj1","mlo:k_fon1>p_fon2","lus:p_fon1>z_fon1","zar:z_fon2>m_fon1","mlo:k_dry1>dry_s2","pra:dry_s1>dry_p1","lus:dry_p1>z_dry1","zar:z_dry2>m_dry1","mlo:s_cie1>n_cie2","lus:n_cie1>cie_dal1","zar:cie_dal2>m_cie1","mlo:s_soc1>n_soc2","zar:n_soc2>m_soc_z1","lus:n_soc1>soc_l1","zar:soc_l2>m_soc_c1","mlo:s_soj1>n_soj2","pra:n_soj1>soj_p1","lus:soj_p1>soj_l1","zar:soj_l2>m_soj1","mlo:s_gro1>n_gro2","lus:n_gro1>gro_l1","zar:gro_l2>m_gro1","mlo:s_bob1>n_bob2","lus:n_bob1>bob_l1","zar:bob_l2>m_bob1","mlo:s_lub1>n_lub2","lus:n_lub1>lub_l1","zar:lub_l2>m_lub1","mlo:s_fas1>n_fas2","pra:n_fas1>fas_p1","zar:fas_p2>m_fas1","mlo:s_mun1>n_mun2","lus:n_mun1>mun_d1","zar:mun_d2>m_mun1","mlo:s_ura1>n_ura2","lus:n_ura1>ura_d1","zar:ura_d2>m_ura1","lup:mig_lup1>mig1","zar:mig2>m_mig1","koc:mig1>mig_b1","zar:mig_b2>m_mig1","lup:wl_lup1>wl1","pre:wl2>wl_mak1+olej1","zar:wl_mak1>m_wl1","lup:las_lup1>las1","pra:las1>las_p1","zar:las_p2>m_las1","lup:ara_lup1>ara1","pra:ara1>ara_p1","pre:ara_p2>ara_mak1+olej1","zar:ara_mak1>m_ara1","mlo:kosz1>n_slo3","lus:n_slo1>slo_l1","pre:slo_l2>slo_mak1+olej1","zar:slo_mak1>m_slo1","mlo:tor_len1>siemie2","zar:siemie2>m_len1","pre:siemie2>len_mak1+olej1","zar:len_mak1>m_len1","obi:dynia1>pestki2+miazsz2","sus:pestki1>pestki_s1","lus:pestki_s1>pestki_l1","pre:pestki_l2>pes_mak1+olej1","zar:pes_mak1>m_pes1","sus:miazsz1>miazsz_s1","zar:miazsz_s2>m_dyn1","mlo:k_kon1>n_kon2","pre:n_kon2>kon_mak1+olej1","zar:kon_mak1>m_kon1","mlo:k_sez1>n_sez2","kad:n_sez1>sez_m1","lus:sez_m1>sez_l1","pre:sez_l2>sez_mak1+olej1","zar:sez_mak1>m_sez1","obi:jab_nerk1>ner_lup1+sok1","pra:ner_lup1>ner_p1","lup:ner_p1>ner1","zar:ner2>m_ner1","lup:mak_lup1>mak1","pre:mak2>mak_mak1+olej1","zar:mak_mak1>m_mak1","sus:kaszt1>kaszt_s1","lup:kaszt_s1>kaszt_l1","zar:kaszt_l2>m_kas1","mlo:k_cza1>n_cza2","pre:n_cza2>cza_mak1+olej1","zar:cza_mak1>m_cza1","mlo:k_wie1>n_wie2","pre:n_wie2>wie_mak1+olej1","zar:wie_mak1>m_wie1","plu:ziem2>skr_z1","sus:skr_z1>m_ziem1","obi:man1>man_ob1","kad:man_ob1>man_m1","sus:man_m1>man_s1","zar:man_s2>m_kasawa1","plu:man_ob2>skr_m1","sus:skr_m1>m_tapioka1","lup:kokos1>kok_m2","obi:kok_m1>kok_w1","sus:kok_w1>kok_ws1","pre:kok_ws2>kok_mak1+olej1","zar:kok_mak1>m_kok1","obi:banan1>ban_pl1","sus:ban_pl1>ban_s1","zar:ban_s2>m_ban1","obi:batat1>bat_pl1","sus:bat_pl1>bat_s1","zar:bat_s2>m_bat1","plu:mar_kl2>skr_mar1","sus:skr_mar1>mar_s1","sit:mar_s1>m_arr1","obi:taro1>taro_pl1","koc:taro_pl1>taro_b1","sus:taro_b1>taro_s1","zar:taro_s2>m_taro1","obi:jam1>jam_pl1","sus:jam_pl1>jam_s1","zar:jam_s2>m_jam1","lup:zol1>zol_l1","zar:zol_l1>zol_sr1","kad:zol_sr1>zol_lg1","sus:zol_lg1>zol_s1","sit:zol_s1>m_zol1","obi:chleb1>chl_pl1","sus:chl_pl1>chl_s1","zar:chl_s2>m_chl1","obi:karob1>kar_m1+nas_kar1","pra:kar_m1>kar_p1","zar:kar_p2>m_kar1","pre:jab3>jab_w2+sok1","sus:jab_w1>jab_ws1","zar:jab_ws2>m_jab1","sus:roza1>roza_s1","zar:roza_s1>roza_sr1","sit:roza_sr1>m_roza1","sus:rok1>rok_s1","zar:rok_s2>m_rok1","pre:aro3>aro_w2+sok1","sus:aro_w1>aro_ws1","zar:aro_ws2>m_aro1","pre:wino3>win_w2+sok1","sit:win_w2>pes_win1","sus:pes_win1>pes_ws1","pre:pes_ws2>win_mak1+olej1","zar:win_mak1>m_win1","obi:burak1>bur_pl1","sus:bur_pl1>bur_s1","zar:bur_s2>m_bur1","obi:kalaf1>kal_r2","sus:kal_r1>kal_s1","zar:kal_s2>m_kal1"];
const LEG_ITEM={z_psz:'k_psz',z_dur:'k_dur',z_kho:'k_kho',z_zyt:'k_zyt',z_pzy:'k_pzy',p_ork:'k_ork',p_pla:'k_pla',p_sam:'k_sam',z_ork:'ork_zl',z_pla:'pla_zl',z_sam:'sam_zl',p_jec:'k_jec',z_jec:'jec_ls',z_pol:'k_pol',z_per:'k_per',z_zbi:'k_zbi',z_ind:'k_ind',z_trd:'k_trd'};
const rSig=r=>{const e=o=>Object.entries(o).map(([k,q])=>k+q).join('+');return r.m+':'+e(r.in)+'>'+e(r.out)};
const legIn=sg=>sg.split(':')[1].split('>')[0].split('+').map(t=>{const m=t.match(/^(.*?)(\d+)$/);return [m[1],+m[2]]});
function migrateLines(s){const cv=i=>LEG_ITEM[i]||i,SIG={};RECIPES.forEach(r=>{SIG[rSig(r)]=r.id});
  const mv=o=>{if(!o)return;Object.keys(o).forEach(k=>{const n=cv(k);if(n!==k){o[n]=(o[n]||0)+o[k];delete o[k]}})};
  mv(s.inv);(s.halls||[]).forEach(h=>{for(const k in (h.items||{}))mv(h.items[k])});
  ['shelf','tray'].forEach(a=>{if(!Array.isArray(s[a]))return;const seen=new Set();s[a]=s[a].map(x=>{x=x&&cv(x);if(x&&seen.has(x))return null;if(x)seen.add(x);return x})});
  (s.shop||[]).forEach(x=>{if(x&&x.k)x.k=cv(x.k)});
  const map=id=>{const sg=LEGACY_R[id];return sg!=null&&SIG[sg]!=null?SIG[sg]:null};
  (s.halls||[]).forEach(h=>{for(const key in (h.cells||{})){const c=h.cells[key],back=[];
    c.q=(c.q||[]).filter(q=>{const n=map(q.r);if(n!=null){q.r=n;return true}back.push([q.r,q.n]);return false});
    c.run=(c.run||[]).filter(j=>{const n=map(j.r);if(n!=null){j.r=n;return true}back.push([j.r,1]);return false});
    back.forEach(([r,n])=>{const sg=LEGACY_R[r];if(sg)legIn(sg).forEach(([i,q])=>{i=cv(i);if(ITEMS[i])s.inv[i]=(s.inv[i]||0)+q*n})});
    c.pin=c.pin!=null?map(c.pin):null;c.last=c.last!=null?map(c.last):null}});
  s.rv=2}
// klucz receptury: maszyna, wejścia i główne wyjścia (bez ilości i odpadów); po kresce wejście z ilościami do zwrotu
const rKey=r=>r.m+':'+Object.keys(r.in).sort().join('+')+'>'+Object.keys(r.out).filter(o=>ITEMS[o].kind!=='by').sort().join('+')+'|'+Object.entries(r.in).map(([i,q])=>i+':'+q).join('+');
const RKEYS=RECIPES.map(rKey);
// klucze receptur z wersji sprzed zapisywania kluczy (linie zbożowe 1.4, pierwsza wersja)
const LEGACY_K=["czw:k_psz>psz_cw|k_psz:8","sus:psz_cw>psz_sw|psz_cw:8","sil:psz_sw>psz_dj|psz_sw:8","mag:psz_dj>psz_bm|psz_dj:8","sep:psz_bm>psz_od|psz_bm:8","odk:psz_od>psz_bk|psz_od:8","try:psz_bk>psz_ws|psz_bk:8","sor:psz_ws>psz_oc|psz_ws:8","obr:psz_oc>psz_ob|psz_oc:8","naw:psz_ob>psz_nw|psz_ob:8","odl:psz_nw>psz_kd|psz_nw:8","zar:psz_kd>m_psz|psz_kd:2","czw:k_zbi>zbi_cw|k_zbi:8","sus:zbi_cw>zbi_sw|zbi_cw:8","sil:zbi_sw>zbi_dj|zbi_sw:8","mag:zbi_dj>zbi_bm|zbi_dj:8","sep:zbi_bm>zbi_od|zbi_bm:8","odk:zbi_od>zbi_bk|zbi_od:8","try:zbi_bk>zbi_ws|zbi_bk:8","sor:zbi_ws>zbi_oc|zbi_ws:8","obr:zbi_oc>zbi_ob|zbi_oc:8","naw:zbi_ob>zbi_nw|zbi_ob:8","odl:zbi_nw>zbi_kd|zbi_nw:8","zar:zbi_kd>m_zbi|zbi_kd:2","czw:k_ind>ind_cw|k_ind:8","sus:ind_cw>ind_sw|ind_cw:8","sil:ind_sw>ind_dj|ind_sw:8","mag:ind_dj>ind_bm|ind_dj:8","sep:ind_bm>ind_od|ind_bm:8","odk:ind_od>ind_bk|ind_od:8","try:ind_bk>ind_ws|ind_bk:8","sor:ind_ws>ind_oc|ind_ws:8","obr:ind_oc>ind_ob|ind_oc:8","naw:ind_ob>ind_nw|ind_ob:8","odl:ind_nw>ind_kd|ind_nw:8","zar:ind_kd>m_ind|ind_kd:2","czw:k_dur>dur_cw|k_dur:8","sus:dur_cw>dur_sw|dur_cw:8","sil:dur_sw>dur_dj|dur_sw:8","mag:dur_dj>dur_bm|dur_dj:8","sep:dur_bm>dur_od|dur_bm:8","odk:dur_od>dur_bk|dur_od:8","try:dur_bk>dur_ws|dur_bk:8","sor:dur_ws>dur_oc|dur_ws:8","obr:dur_oc>dur_ob|dur_oc:8","naw:dur_ob>dur_nw|dur_ob:8","odl:dur_nw>dur_kd|dur_nw:8","zar:dur_kd>m_dur|dur_kd:2","czw:k_kho>kho_cw|k_kho:8","sus:kho_cw>kho_sw|kho_cw:8","sil:kho_sw>kho_dj|kho_sw:8","mag:kho_dj>kho_bm|kho_dj:8","sep:kho_bm>kho_od|kho_bm:8","odk:kho_od>kho_bk|kho_od:8","try:kho_bk>kho_ws|kho_bk:8","sor:kho_ws>kho_oc|kho_ws:8","obr:kho_oc>kho_ob|kho_oc:8","naw:kho_ob>kho_nw|kho_ob:8","odl:kho_nw>kho_kd|kho_nw:8","zar:kho_kd>m_kho|kho_kd:2","czw:k_pol>pol_cw|k_pol:8","sus:pol_cw>pol_sw|pol_cw:8","sil:pol_sw>pol_dj|pol_sw:8","mag:pol_dj>pol_bm|pol_dj:8","sep:pol_bm>pol_od|pol_bm:8","odk:pol_od>pol_bk|pol_od:8","try:pol_bk>pol_ws|pol_bk:8","sor:pol_ws>pol_oc|pol_ws:8","obr:pol_oc>pol_ob|pol_oc:8","naw:pol_ob>pol_nw|pol_ob:8","odl:pol_nw>pol_kd|pol_nw:8","zar:pol_kd>m_pol|pol_kd:2","czw:k_per>per_cw|k_per:8","sus:per_cw>per_sw|per_cw:8","sil:per_sw>per_dj|per_sw:8","mag:per_dj>per_bm|per_dj:8","sep:per_bm>per_od|per_bm:8","odk:per_od>per_bk|per_od:8","try:per_bk>per_ws|per_bk:8","sor:per_ws>per_oc|per_ws:8","obr:per_oc>per_ob|per_oc:8","naw:per_ob>per_nw|per_ob:8","odl:per_nw>per_kd|per_nw:8","zar:per_kd>m_per|per_kd:2","czw:k_trd>trd_cw|k_trd:8","sus:trd_cw>trd_sw|trd_cw:8","sil:trd_sw>trd_dj|trd_sw:8","mag:trd_dj>trd_bm|trd_dj:8","sep:trd_bm>trd_od|trd_bm:8","odk:trd_od>trd_bk|trd_od:8","try:trd_bk>trd_ws|trd_bk:8","sor:trd_ws>trd_oc|trd_ws:8","obr:trd_oc>trd_ob|trd_oc:8","naw:trd_ob>trd_nw|trd_ob:8","odl:trd_nw>trd_kd|trd_nw:8","zar:trd_kd>m_trd|trd_kd:2","czw:k_zyt>zyt_cw|k_zyt:8","sus:zyt_cw>zyt_sw|zyt_cw:8","sil:zyt_sw>zyt_dj|zyt_sw:8","mag:zyt_dj>zyt_bm|zyt_dj:8","sep:zyt_bm>zyt_od|zyt_bm:8","odk:zyt_od>zyt_bk|zyt_od:8","try:zyt_bk>zyt_ws|zyt_bk:8","stg:zyt_ws>zyt_sg|zyt_ws:8","sor:zyt_sg>zyt_oc|zyt_sg:8","obr:zyt_oc>zyt_ob|zyt_oc:8","naw:zyt_ob>zyt_nw|zyt_ob:8","odl:zyt_nw>zyt_kd|zyt_nw:8","zar:zyt_kd>m_zyt|zyt_kd:2","czw:k_pzy>pzy_cw|k_pzy:8","sus:pzy_cw>pzy_sw|pzy_cw:8","sil:pzy_sw>pzy_dj|pzy_sw:8","mag:pzy_dj>pzy_bm|pzy_dj:8","sep:pzy_bm>pzy_od|pzy_bm:8","odk:pzy_od>pzy_bk|pzy_od:8","try:pzy_bk>pzy_ws|pzy_bk:8","stg:pzy_ws>pzy_sg|pzy_ws:8","sor:pzy_sg>pzy_oc|pzy_sg:8","obr:pzy_oc>pzy_ob|pzy_oc:8","naw:pzy_ob>pzy_nw|pzy_ob:8","odl:pzy_nw>pzy_kd|pzy_nw:8","zar:pzy_kd>m_pzy|pzy_kd:2","czw:k_ork>ork_cw|k_ork:8","sus:ork_cw>ork_sw|ork_cw:8","sil:ork_sw>ork_pr|ork_sw:8","sep:ork_pr>ork_od|ork_pr:8","mag:ork_od>ork_bm|ork_od:8","odk:ork_bm>ork_bk|ork_bm:8","lus:ork_bk>ork_kn+ork_zl|ork_bk:4","lus:ork_kn>ork_zl|ork_kn:2","try:ork_zl>ork_ws|ork_zl:8","sor:ork_ws>ork_oc|ork_ws:8","obr:ork_oc>ork_ob|ork_oc:8","naw:ork_ob>ork_nw|ork_ob:8","odl:ork_nw>ork_kd|ork_nw:8","zar:ork_kd>m_ork|ork_kd:2","czw:k_pla>pla_cw|k_pla:8","sus:pla_cw>pla_sw|pla_cw:8","sil:pla_sw>pla_pr|pla_sw:8","sep:pla_pr>pla_od|pla_pr:8","mag:pla_od>pla_bm|pla_od:8","odk:pla_bm>pla_bk|pla_bm:8","lus:pla_bk>pla_kn+pla_zl|pla_bk:4","lus:pla_kn>pla_zl|pla_kn:2","per:pla_zl>farro|pla_zl:2","try:pla_zl>pla_ws|pla_zl:8","sor:pla_ws>pla_oc|pla_ws:8","obr:pla_oc>pla_ob|pla_oc:8","naw:pla_ob>pla_nw|pla_ob:8","odl:pla_nw>pla_kd|pla_nw:8","zar:pla_kd>m_pla|pla_kd:2","czw:k_sam>sam_cw|k_sam:8","sus:sam_cw>sam_sw|sam_cw:8","sil:sam_sw>sam_pr|sam_sw:8","sep:sam_pr>sam_od|sam_pr:8","mag:sam_od>sam_bm|sam_od:8","odk:sam_bm>sam_bk|sam_bm:8","lus:sam_bk>sam_kn+sam_zl|sam_bk:4","lus:sam_kn>sam_zl|sam_kn:2","try:sam_zl>sam_ws|sam_zl:8","sor:sam_ws>sam_oc|sam_ws:8","obr:sam_oc>sam_ob|sam_oc:8","naw:sam_ob>sam_nw|sam_ob:8","odl:sam_nw>sam_kd|sam_nw:8","zar:sam_kd>m_sam|sam_kd:2","osc:k_jec>jec_os|k_jec:8","czw:jec_os>jec_cw|jec_os:8","sus:jec_cw>jec_sw|jec_cw:8","sil:jec_sw>jec_dj|jec_sw:8","mag:jec_dj>jec_bm|jec_dj:8","sep:jec_bm>jec_od|jec_bm:8","odk:jec_od>jec_bk|jec_od:8","try:jec_bk>jec_ws|jec_bk:8","kal:jec_ws>jec_kl|jec_ws:8","lus:jec_kl>jec_ls|jec_kl:4","zar:jec_ls>m_jec|jec_ls:2","per:jec_ls>peczak|jec_ls:2","kra:peczak>kasza_jl|peczak:2","plr:kasza_jl>kasza_jp|kasza_jl:2","sit:kasza_jp>kasza_jd+kasza_jg+kasza_js|kasza_jp:3","plt:jec_ls>platki_j|jec_ls:2","kad:jec_kl>jec_nm|jec_kl:4","kie:jec_nm>slod_z|jec_nm:4","ssl:slod_z>slod_js|slod_z:2","ssl:slod_z>slod_cs|slod_z:2","okw:slod_js>slod_j|slod_js:2","okw:slod_cs>slod_c|slod_cs:2","srt:jec_kl>sruta_j|jec_kl:2","srt:jec_kl>gniot_j|jec_kl:2","srt:pzy_od>sruta_pzy|pzy_od:2","mlo:k_owi>p_owi|k_owi:1","lus:p_owi>z_owi|p_owi:1","pra:z_owi>z_owis|z_owi:1","zar:z_owis>m_owi|z_owis:2","mlo:k_owc>p_owc|k_owc:1","lus:p_owc>z_owc|p_owc:1","pra:z_owc>z_owcs|z_owc:1","mbg:z_owcs>m_owc|z_owcs:2","mlo:k_ryz>ryz_nl|k_ryz:1","lus:ryz_nl>ryz_br|ryz_nl:1","lus:ryz_br>ryz_bi|ryz_br:1","zar:ryz_bi>m_ryzb|ryz_bi:2","zar:ryz_br>m_ryzbr|ryz_br:2","mlo:k_rkl>rkl_nl|k_rkl:1","lus:rkl_nl>rkl_br|rkl_nl:1","lus:rkl_br>rkl_bi|rkl_br:1","kad:rkl_bi>rkl_m|rkl_bi:1","zar:rkl_m>rkl_masa|rkl_m:2","sus:rkl_masa>m_mochi|rkl_masa:1","mlo:kolby>z_kuk|kolby:1","zar:z_kuk>m_kuk|z_kuk:2","koc:wapno+z_kuk>nixt|z_kuk:2+wapno:1","kad:nixt>nixt_p|nixt:1","sus:nixt_p>nixt_s|nixt_p:1","zar:nixt_s>m_masa|nixt_s:2","lus:n_gry>kasza_g|n_gry:1","zar:kasza_g>m_gry|kasza_g:2","pra:kasza_g>kasza_gp|kasza_g:1","zar:kasza_gp>m_gry|kasza_gp:2","mlo:k_pro>p_pro|k_pro:1","lus:p_pro>kasza_j|p_pro:1","zar:kasza_j>m_jag|kasza_j:2","mlo:k_ama>n_ama|k_ama:1","zar:n_ama>m_ama|n_ama:2","mlo:k_qui>n_qui|k_qui:1","kad:n_qui>n_quip|n_qui:1","sus:n_quip>n_quis|n_quip:1","zar:n_quis>m_qui|n_quis:2","mlo:k_tef>n_tef|k_tef:1","zar:n_tef>m_tef|n_tef:2","mlo:k_sor>p_sor|k_sor:1","lus:p_sor>z_sor|p_sor:1","zar:z_sor>m_sor|z_sor:2","mlo:k_rag>z_rag|k_rag:1","zar:z_rag>m_rag|z_rag:2","mlo:k_baj>z_baj|k_baj:1","zar:z_baj>m_baj|z_baj:2","mlo:k_fon>p_fon|k_fon:1","lus:p_fon>z_fon|p_fon:1","zar:z_fon>m_fon|z_fon:2","mlo:k_dry>dry_s|k_dry:1","pra:dry_s>dry_p|dry_s:1","lus:dry_p>z_dry|dry_p:1","zar:z_dry>m_dry|z_dry:2","mlo:s_cie>n_cie|s_cie:1","lus:n_cie>cie_dal|n_cie:1","zar:cie_dal>m_cie|cie_dal:2","mlo:s_soc>n_soc|s_soc:1","zar:n_soc>m_soc_z|n_soc:2","lus:n_soc>soc_l|n_soc:1","zar:soc_l>m_soc_c|soc_l:2","mlo:s_soj>n_soj|s_soj:1","pra:n_soj>soj_p|n_soj:1","lus:soj_p>soj_l|soj_p:1","zar:soj_l>m_soj|soj_l:2","mlo:s_gro>n_gro|s_gro:1","lus:n_gro>gro_l|n_gro:1","zar:gro_l>m_gro|gro_l:2","mlo:s_bob>n_bob|s_bob:1","lus:n_bob>bob_l|n_bob:1","zar:bob_l>m_bob|bob_l:2","mlo:s_lub>n_lub|s_lub:1","lus:n_lub>lub_l|n_lub:1","zar:lub_l>m_lub|lub_l:2","mlo:s_fas>n_fas|s_fas:1","pra:n_fas>fas_p|n_fas:1","zar:fas_p>m_fas|fas_p:2","mlo:s_mun>n_mun|s_mun:1","lus:n_mun>mun_d|n_mun:1","zar:mun_d>m_mun|mun_d:2","mlo:s_ura>n_ura|s_ura:1","lus:n_ura>ura_d|n_ura:1","zar:ura_d>m_ura|ura_d:2","lup:mig_lup>mig|mig_lup:1","zar:mig>m_mig|mig:2","koc:mig>mig_b|mig:1","zar:mig_b>m_mig|mig_b:2","lup:wl_lup>wl|wl_lup:1","pre:wl>wl_mak|wl:2","zar:wl_mak>m_wl|wl_mak:1","lup:las_lup>las|las_lup:1","pra:las>las_p|las:1","zar:las_p>m_las|las_p:2","lup:ara_lup>ara|ara_lup:1","pra:ara>ara_p|ara:1","pre:ara_p>ara_mak|ara_p:2","zar:ara_mak>m_ara|ara_mak:1","mlo:kosz>n_slo|kosz:1","lus:n_slo>slo_l|n_slo:1","pre:slo_l>slo_mak|slo_l:2","zar:slo_mak>m_slo|slo_mak:1","mlo:tor_len>siemie|tor_len:1","zar:siemie>m_len|siemie:2","pre:siemie>len_mak|siemie:2","zar:len_mak>m_len|len_mak:1","obi:dynia>miazsz+pestki|dynia:1","sus:pestki>pestki_s|pestki:1","lus:pestki_s>pestki_l|pestki_s:1","pre:pestki_l>pes_mak|pestki_l:2","zar:pes_mak>m_pes|pes_mak:1","sus:miazsz>miazsz_s|miazsz:1","zar:miazsz_s>m_dyn|miazsz_s:2","mlo:k_kon>n_kon|k_kon:1","pre:n_kon>kon_mak|n_kon:2","zar:kon_mak>m_kon|kon_mak:1","mlo:k_sez>n_sez|k_sez:1","kad:n_sez>sez_m|n_sez:1","lus:sez_m>sez_l|sez_m:1","pre:sez_l>sez_mak|sez_l:2","zar:sez_mak>m_sez|sez_mak:1","obi:jab_nerk>ner_lup|jab_nerk:1","pra:ner_lup>ner_p|ner_lup:1","lup:ner_p>ner|ner_p:1","zar:ner>m_ner|ner:2","lup:mak_lup>mak|mak_lup:1","pre:mak>mak_mak|mak:2","zar:mak_mak>m_mak|mak_mak:1","sus:kaszt>kaszt_s|kaszt:1","lup:kaszt_s>kaszt_l|kaszt_s:1","zar:kaszt_l>m_kas|kaszt_l:2","mlo:k_cza>n_cza|k_cza:1","pre:n_cza>cza_mak|n_cza:2","zar:cza_mak>m_cza|cza_mak:1","mlo:k_wie>n_wie|k_wie:1","pre:n_wie>wie_mak|n_wie:2","zar:wie_mak>m_wie|wie_mak:1","plu:ziem>skr_z|ziem:2","sus:skr_z>m_ziem|skr_z:1","obi:man>man_ob|man:1","kad:man_ob>man_m|man_ob:1","sus:man_m>man_s|man_m:1","zar:man_s>m_kasawa|man_s:2","plu:man_ob>skr_m|man_ob:2","sus:skr_m>m_tapioka|skr_m:1","lup:kokos>kok_m|kokos:1","obi:kok_m>kok_w|kok_m:1","sus:kok_w>kok_ws|kok_w:1","pre:kok_ws>kok_mak|kok_ws:2","zar:kok_mak>m_kok|kok_mak:1","obi:banan>ban_pl|banan:1","sus:ban_pl>ban_s|ban_pl:1","zar:ban_s>m_ban|ban_s:2","obi:batat>bat_pl|batat:1","sus:bat_pl>bat_s|bat_pl:1","zar:bat_s>m_bat|bat_s:2","plu:mar_kl>skr_mar|mar_kl:2","sus:skr_mar>mar_s|skr_mar:1","sit:mar_s>m_arr|mar_s:1","obi:taro>taro_pl|taro:1","koc:taro_pl>taro_b|taro_pl:1","sus:taro_b>taro_s|taro_b:1","zar:taro_s>m_taro|taro_s:2","obi:jam>jam_pl|jam:1","sus:jam_pl>jam_s|jam_pl:1","zar:jam_s>m_jam|jam_s:2","lup:zol>zol_l|zol:1","zar:zol_l>zol_sr|zol_l:1","kad:zol_sr>zol_lg|zol_sr:1","sus:zol_lg>zol_s|zol_lg:1","sit:zol_s>m_zol|zol_s:1","obi:chleb>chl_pl|chleb:1","sus:chl_pl>chl_s|chl_pl:1","zar:chl_s>m_chl|chl_s:2","obi:karob>kar_m|karob:1","pra:kar_m>kar_p|kar_m:1","zar:kar_p>m_kar|kar_p:2","pre:jab>jab_w|jab:3","sus:jab_w>jab_ws|jab_w:1","zar:jab_ws>m_jab|jab_ws:2","sus:roza>roza_s|roza:1","zar:roza_s>roza_sr|roza_s:1","sit:roza_sr>m_roza|roza_sr:1","sus:rok>rok_s|rok:1","zar:rok_s>m_rok|rok_s:2","pre:aro>aro_w|aro:3","sus:aro_w>aro_ws|aro_w:1","zar:aro_ws>m_aro|aro_ws:2","pre:wino>win_w|wino:3","sit:win_w>pes_win|win_w:2","sus:pes_win>pes_ws|pes_win:1","pre:pes_ws>win_mak|pes_ws:2","zar:win_mak>m_win|win_mak:1","obi:burak>bur_pl|burak:1","sus:bur_pl>bur_s|bur_pl:1","zar:bur_s>m_bur|bur_s:2","obi:kalaf>kal_r|kalaf:1","sus:kal_r>kal_s|kal_r:1","zar:kal_s>m_kal|kal_s:2"];
function remapRecipes(s,old){if(!Array.isArray(old)||(old.length===RKEYS.length&&old.every((k,i)=>k===RKEYS[i])))return;
  const NEW={};RKEYS.forEach((k,i)=>{NEW[k.split('|')[0]]=i});
  const map=id=>{const k=old[id];return k!=null&&NEW[k.split('|')[0]]!=null?NEW[k.split('|')[0]]:null};
  const back=(id,n,p)=>{const k=old[id];if(!k)return;const ins=k.split('|')[1].split('+').map(t=>t.split(':'));ins.forEach(([i,q])=>{if(ITEMS[i])s.inv[i]=(s.inv[i]||0)+(p||+q*n)})};
  (s.halls||[]).forEach(h=>{for(const key in (h.cells||{})){const c=h.cells[key];
    c.q=(c.q||[]).filter(q=>{const n=map(q.r);if(n!=null&&RECIPES[n].m===c.m){q.r=n;return true}back(q.r,q.n,q.p);return false});
    c.run=(c.run||[]).filter(j=>{const n=map(j.r);if(n!=null&&RECIPES[n].m===c.m){j.r=n;return true}back(j.r,1,j.p);return false});
    c.pin=c.pin!=null?map(c.pin):null;c.last=c.last!=null?map(c.last):null}})}
// przedmioty, których gra już nie zna, znikają z zapisu (zamiast psuć widoki)
function purgeUnknown(s){for(const k in s.inv)if(!ITEMS[k])delete s.inv[k];
  (s.halls||[]).forEach(h=>{for(const key in (h.items||{})){const o=h.items[key];for(const k in o)if(!ITEMS[k])delete o[k];if(!Object.keys(o).length)delete h.items[key]}
    for(const key in (h.cells||{})){const c=h.cells[key];c.q=(c.q||[]).filter(q=>RECIPES[q.r]&&RECIPES[q.r].m===c.m);c.run=(c.run||[]).filter(j=>RECIPES[j.r]&&RECIPES[j.r].m===c.m)}});
  ['shelf','tray'].forEach(a=>{if(Array.isArray(s[a]))s[a]=s[a].map(x=>x&&ITEMS[x]?x:null)});
  if(Array.isArray(s.shop))s.shop=s.shop.filter(x=>!x||!x.k||ITEMS[x.k])}

// stary targ (ceny w spiżarni, stragan) -> sklep, zamówienia i renoma
function migrateMarket(s){const r=s.res||{},cost=(b,m,l)=>{let t=0;for(let i=0;i<l;i++)t+=Math.round(b*Math.pow(m,i));return t};
  let back=cost(800,2.1,r.order||0)+cost(600,1.9,r.loyal||0);
  if(r.contract) r.kontrakt=Math.min(10,r.contract); if(r.trade) r.ceny=Math.min(10,r.trade);
  ['order','loyal','contract','trade'].forEach(k=>delete r[k]);
  const made=Object.keys(s.made||{}).length;
  s.pop={l:Math.max(1,Math.min(8,1+Math.floor(made/3)+Math.floor((s.st.orders||0)/8))),p:0,sd:0};
  s.orders=[];s.shop=[];s.dem={};s.mk=2;
  if(back){s.coins+=back;s._refund=back}}
const inv=id=>S.inv[id]||0;
function add(id,q){S.inv[id]=inv(id)+q; if(S.inv[id]<=0) delete S.inv[id];}
const res=k=>S.res[k]||0;
const nMade=()=>Object.keys(S.made).length;
const xpNeed=l=>Math.round(70*Math.pow(1.38,l-1));
const dayN=()=>Math.floor(S.t/DAY);
const seasonOfDay=d=>Math.floor(d/SD)%4;
const seasonN=()=>seasonOfDay(dayN());
const yearN=()=>Math.floor(dayN()/(SD*4))+1;
const hourF=()=>(6+(S.t%DAY)/DAY*24)%24;
const clock=()=>{const h=hourF();return String(Math.floor(h)).padStart(2,'0')+':'+String(Math.floor((h%1)*6)*10).padStart(2,'0')};
const working=k=>!!S.work[k]&&S.auto[k]!==false;
function toSeason(k){if(seasonN()===k)return 0;let d=(Math.floor(dayN()/SD)+1)*SD;while(seasonOfDay(d)!==k)d+=SD;return d*DAY-S.t}
const fmtG=s=>{const d=Math.floor(s/DAY),h=Math.floor(s%DAY/DAY*24);return (d?d+' '+plural(d,'dzień','dni','dni')+' ':'')+h+' h'};

// ---------- UPRAWY ----------
const compatible=(c,env)=>c.env===env||(env==='szklarnia'&&c.env==='pole');
const unlocked=c=>S.lvl>=c.lvl;
const outdoor=p=>p.env!=='szklarnia';
const frozen=p=>outdoor(p)&&seasonN()===3;
function envMul(p){ if(!outdoor(p)) return 1; const s=seasonN(); if(s===3) return 0;
  let w=WEATHER[S.wx].m; if(S.wx==='upal'&&p.spr) w=1; return SEASONS[s].m*w;}
const plotRate=p=>(1+0.08*res('agro'))*(p.spr?1.2:1)*envMul(p);
function plotYield(p,cid){const c=CR[cid||p.crop]; let y=c.y+res('seed')+Math.round(c.y*0.2*p.soil); if(c.r&&seasonN()===2) y+=1; return y;}
const seedCost=c=>Math.max(1,Math.round(c.p*(1-0.06*res('bulk'))));
const soilCost=p=>Math.round(150*Math.pow(2.1,p.soil));
const plotCost=()=>Math.round(150*Math.pow(1.38,S.plots.length-6));
const isReady=p=>p.crop&&p.prog>=p.need;
const ENVIMG={pole:'pole',mokre:'mokre',szklarnia:'szklarnia'};
// zastępcze grafiki dla nowych upraw: uprawa -> pokrewna uprawa, przedmiot -> pokrewny przedmiot
const CART={polska:'durum',perska:'khorasan',zbita:'pszenica',indyjska:'pszenica',tritordeum:'durum'}, IART={};
[['pol','dur'],['per','kho'],['zbi','psz'],['ind','psz'],['trd','dur']].forEach(([a,b])=>['k_','z_','m_'].forEach(p=>IART[p+a]=p+b));
function plotImgSrc(p){
  if(!p.crop) return 'plots/'+ENVIMG[p.env]+(seasonN()===3?'-zima':'')+'.webp';
  const c=CR[p.crop],st=isReady(p)?3:(c.r&&p.h>0)?4:p.prog/p.need<0.3?1:2;
  return 'plots/'+(CART[c.id]||c.id)+'-'+st+(seasonN()===3&&p.env!=='szklarnia'?'-zima':'')+'.webp';}
const plotImg=p=>`<img class="pimg" src="${plotImgSrc(p)}" alt="" decoding="async" draggable="false">`;
const cropThumb=id=>`<img class="pimg sasz" src="items/sasz_${CART[id]||id}.webp" alt="" loading="lazy" decoding="async" draggable="false">`;
function stage(p){if(isReady(p))return 3;if(p.h>0)return 2;const f=p.prog/p.need;return f<.15?0:f<.5?1:2}

function plant(i,cid,quiet){const p=S.plots[i],c=CR[cid]; if(!p||!c||p.crop||!compatible(c,p.env)||!unlocked(c)||frozen(p)) return false;
  const cost=seedCost(c); if(S.coins<cost) return false;
  S.coins-=cost; spendFeed(cost,'Nasiona: '+c.n); Object.assign(p,{crop:cid,prog:0,need:c.g,h:0,last:cid}); S.st.planted++; stageCache[i]=-1; dirty=true;
  if(!quiet) snd('plant'); return true;}
function harvest(i,auto){const p=S.plots[i]; if(!isReady(p)) return 0; const c=CR[p.crop], y=plotYield(p);
  add(c.out,y); S.st.harv+=y; if(c.grp==='Zboża glutenowe') add('sloma',Math.max(1,Math.round(y/4))); gainXP(y); gainFeed(c.out,y,auto?'Parobek zebrał':'Zbiór z poletka');
  if(c.r){p.prog=0;p.need=c.r;p.h++} else {p.crop=null;p.h=0; if(working('siewca')&&p.last) plant(i,p.last,true)}
  if(!auto) snd('pop');
  dirty=true; return y;}

// ---------- MASZYNY ----------
// poziom ma każdy egzemplarz maszyny: 1–10 to tempo (+20% na poziom) i stanowiska (2. od 4, 3. od 8),
// poziom 11 nie przyspiesza, tylko odblokowuje tryb ciągły
const MLVMAX=11, MLV_AUTO=11;
const mSpeed=l=>(1+0.2*(Math.min(l,10)-1))*(1+0.06*res('maint'));
const mSlots=l=>l>=8?3:l>=4?2:1;
const mTier=(id,l)=>{let n=M[id].n;(MTIER[id]||[]).forEach(([lv,nm])=>{if(l>=lv)n=nm});return n};
const tierUp=(id,l)=>{const t=(MTIER[id]||[]).find(([lv])=>lv===l);return t?` · staje się: ${t[1]}`:''};
const upDesc=l=>l===MLV_AUTO?'odblokowuje tryb ciągły':l===4?'+20% tempa i drugie stanowisko':l===8?'+20% tempa i trzecie stanowisko':'+20% tempa';
const qMax=()=>6+3*res('log');
const mUpCost=c=>Math.round(Math.max(300,M[c.m].p)*0.8*Math.pow(1.7,c.lvl-1)/10)*10;
const allMach=()=>[...S.mag,...S.halls.flatMap(h=>Object.values(h.cells))];
const canDo=r=>Math.min(...Object.entries(r.in).map(([k,q])=>Math.floor(inv(k)/q)));
const outMain=r=>Object.keys(r.out).find(k=>ITEMS[k].kind!=='by')||Object.keys(r.out)[0];
// ---------- PRZETWÓRNIA: HALE Z MASZYNAMI NA KRATKACH ----------
// Hala to siatka kratek: 11 wszerz, od 3 do 12 rzędów (kolejne rzędy się dokupuje); hal może być kilka.
// Maszyna stoi na jednej kratce i ma kierunek: bierze towar z kratki przed sobą (wejście) i wyrzuca produkt
// razem z produktem ubocznym na kratkę za sobą (wyjście). Wyjście jednej maszyny może być wejściem następnej.
// Towar leży na kratkach i nie liczy się do spiżarni. Partie wkłada gracz (+1, +5, max z kratki wejścia);
// w trybie ciągłym maszyna dobiera je sama, a przydzielony młynarz dokłada towar ze spiżarni i odnosi mąkę.
// Poziom maszyny (tempo, stanowiska) dotyczy wszystkich jej egzemplarzy.
const HALL_W=11, HALL_H0=3, HALL_HMAX=12;
const DV=[[1,0],[0,1],[-1,0],[0,-1]];          // kierunek wyjścia: 0 w prawo, 1 w dół, 2 w lewo, 3 w górę
const hk=(x,y)=>x+','+y, hxy=s=>s.split(',').map(Number);
const RBY={};RECIPES.forEach(r=>(RBY[r.m]=RBY[r.m]||[]).push(r));
const newHall=()=>({w:HALL_W,h:HALL_H0,cells:{},items:{}});
const newCell=(m,dir,lvl)=>({m,dir,lvl:lvl||1,q:[],run:[],auto:false,pin:null});
const HL=()=>S.halls[S.hall]||S.halls[0];
const hin=(h,x,y)=>x>=0&&y>=0&&x<h.w&&y<h.h;
const inXY=(c,x,y)=>{const [dx,dy]=DV[c.dir];return [x-dx,y-dy]};
const outXY=(c,x,y)=>{const [dx,dy]=DV[c.dir];return [x+dx,y+dy]};
const rowCost=h=>Math.round(1000*Math.pow(1.5,h.h-HALL_H0)/100)*100;
const hallCost=()=>15000*Math.pow(2,S.halls.length-1);
const mPlaced=id=>S.halls.reduce((a,h)=>a+Object.values(h.cells).filter(c=>c.m===id).length,0);
const mStock=(id,l)=>S.mag.filter(x=>x.m===id&&(l==null||x.lvl===l)).length;
const mCount=id=>mPlaced(id)+mStock(id);
const mBuyCost=id=>{const k=mCount(id);return k===0?M[id].p:Math.round(Math.max(300,M[id].p)*Math.pow(1.5,k-1)/50)*50};
const sumQ=o=>{let s=0;for(const k in o)s+=o[k];return s};
const mLoadC=c=>c.run.length+c.q.reduce((a,b)=>a+b.n,0);
const hallBusy=()=>S.halls.reduce((a,h)=>a+Object.values(h.cells).filter(c=>c.run.length).length,0);
function putH(h,key,id,q){const it=h.items[key]||(h.items[key]={});it[id]=(it[id]||0)+q;dirty=true}
function takeH(h,key,id,q){const it=h.items[key];if(!it||!it[id])return 0;const n=Math.min(q,it[id]);it[id]-=n;if(!it[id])delete it[id];if(!Object.keys(it).length)delete h.items[key];dirty=true;return n}
// receptura z tego, co leży na wejściu (przypięta, jeśli gracz ją wybrał)
const rOk=(c,r)=>(c.pin==null?!r.pinOnly:r.id===c.pin)&&(!r.minL||c.lvl>=r.minL);
const pickR=(c,it)=>(RBY[c.m]||[]).filter(r=>rOk(c,r)).find(r=>Object.entries(r.in).every(([i,q])=>(it[i]||0)>=q));
// niepełna partia: receptura z jednym wejściem, a na kratce leży go mniej, niż potrzeba na całą partię
const inQ=r=>Object.values(r.in)[0];
// czas zadania: niepełna partia trwa proporcjonalnie krócej (najmniej ćwierć)
const jobT=j=>{const r=RECIPES[j.r];return j.p?r.t*Math.max(.25,j.p/inQ(r)):r.t};
const pickPart=(c,it)=>(RBY[c.m]||[]).filter(r=>rOk(c,r)).find(r=>{const e=Object.entries(r.in);return e.length===1&&e[0][1]>1&&(it[e[0][0]]||0)>0});
function feedable(h,key){const c=h.cells[key],[x,y]=hxy(key),[ix,iy]=inXY(c,x,y);if(!hin(h,ix,iy)||h.cells[hk(ix,iy)])return {r:null,n:0};
  const it=h.items[hk(ix,iy)]||{},r=pickR(c,it);if(r)return {r,n:Math.min(...Object.entries(r.in).map(([i,q])=>Math.floor((it[i]||0)/q)))};
  const p=pickPart(c,it);return p?{r:null,n:0,part:{r:p,have:it[Object.keys(p.in)[0]],need:inQ(p)}}:{r:null,n:0}}
// włożenie do maszyny partii z kratki wejścia (najwyżej tyle, ile zmieści jej kolejka)
function feedM(h,key,want,quiet){const c=h.cells[key],{r,n,part}=feedable(h,key),room=qMax()-mLoadC(c);
  // ręcznie (nie w trybie ciągłym) resztka idzie jako niepełna partia: mniej produktu, krótszy czas
  if((!r||!n)&&part&&!quiet&&room>0){const pr=part.r,i=Object.keys(pr.in)[0],[x,y]=hxy(key);takeH(h,hk(...inXY(c,x,y)),i,part.have);
    c.q.push({r:pr.id,n:1,p:part.have});c.last=pr.id;dirty=true;toast(`Niepełna partia: ${part.have} z ${part.need} szt.`);return 1}
  if(!r||!n){if(!quiet)toast('Przed maszyną nie leży nic, co ona przerabia (albo za mało na jedną partię).');return 0}
  if(room<=0){if(!quiet)toast('Maszyna ma pełną kolejkę. Większe zasobniki kupisz w Sklepie.');return 0}
  const k=Math.min(n,room,want==='max'?n:+want),[x,y]=hxy(key),ik=hk(...inXY(c,x,y));
  Object.entries(r.in).forEach(([i,q])=>takeH(h,ik,i,q*k));
  const last=c.q[c.q.length-1];if(last&&last.r===r.id&&!last.p)last.n+=k;else c.q.push({r:r.id,n:k});c.last=r.id;dirty=true;return k}
// gotowa partia: produkt i uboczny na kratkę wyjścia; nie da się, gdy wyjście jest poza halą albo stoi tam maszyna
function jobOut(h,c,x,y,r,p){const [ox,oy]=outXY(c,x,y),ok=hk(ox,oy);if(!hin(h,ox,oy)||h.cells[ok])return false;const f=p?p/inQ(r):1;
  Object.entries(r.out).forEach(([o,q])=>{const ch=r.ch&&r.ch[o]!=null?r.ch[o]:null;
    if(ch!=null){if(Math.random()>=ch*f)return}else if(p){q=ITEMS[o].kind==='by'?(Math.random()<f?q:0):Math.max(1,Math.round(q*f));if(!q)return}putH(h,ok,o,q);
    if(ITEMS[o].kind==='prod'){S.mp[o]=(S.mp[o]||0)+q}
    if(ITEMS[o].kind==='flour'){const first=!S.made[o];S.made[o]=(S.made[o]||0)+q;gainXP(first?25:3*q);if(first){toast(`Nowa mąka w księdze: ${ITEMS[o].n}`,'gold');snd('level')}}});
  S.st.crafted++;return true}
function hallStep(d){S.halls.forEach(h=>{for(const key in h.cells){const c=h.cells[key],[x,y]=hxy(key),sp=mSpeed(c.lvl),sl=mSlots(c.lvl);
  if((c.auto&&c.lvl>=MLV_AUTO)||millerOf(h,key)) feedM(h,key,'max',true);
  while(c.run.length<sl&&c.q.length){const q=c.q[0];c.run.push({r:q.r,prog:0,p:q.p});if(!--q.n)c.q.shift();dirty=true}
  c.block=false;
  for(let i=0;i<c.run.length;i++){let left=d*sp,guard=0;
    while(left>0&&guard++<500){const j=c.run[i],r=RECIPES[j.r],T=j.p?r.t*Math.max(.25,j.p/inQ(r)):r.t,rem=T-j.prog;
      if(left<rem){j.prog+=left;break}
      j.prog=T;left-=rem;
      if(!jobOut(h,c,x,y,r,j.p)){c.block=true;break}
      dirty=true;
      if(c.q.length){const q=c.q[0];c.run[i]={r:q.r,prog:0,p:q.p};if(!--q.n)c.q.shift()}
      else {c.run.splice(i,1);i--;break}}}}})}
// młynarz przydzielony do maszyny: dokłada jej towar ze spiżarni i odnosi do spiżarni to, co z niej wyszło
// (chyba że za maszyną stoi następna, wtedy wyjście jest jej wejściem); maszyna z młynarzem dobiera partie sama
const millerOf=(h,key)=>S.millers.find(ml=>!ml.off&&ml.at&&S.halls[ml.at.h]===h&&ml.at.key===key);
function feedsMachine(h,key){const [x,y]=hxy(key);for(const k2 in h.cells){const c=h.cells[k2],[a,b]=hxy(k2),[ix,iy]=inXY(c,a,b);if(ix===x&&iy===y)return true}return false}
function millerStep(){S.millers.forEach(ml=>{if(ml.off||!ml.at)return;const h=S.halls[ml.at.h],c=h&&h.cells[ml.at.key];if(!c){ml.at=null;return}
  const [x,y]=hxy(ml.at.key),[ix,iy]=inXY(c,x,y),[ox,oy]=outXY(c,x,y),ik=hk(ix,iy),ok=hk(ox,oy);
  // co dokładać: przypięta receptura, ostatnio robiona albo pierwsza, na którą jest coś w spiżarni
  const r=c.pin!=null?RECIPES[c.pin]:c.last!=null&&RECIPES[c.last].m===c.m?RECIPES[c.last]:(RBY[c.m]||[]).find(r=>Object.keys(r.in).every(i=>inv(i)>0||i==='wapno'));
  if(r&&hin(h,ix,iy)&&!h.cells[ik])Object.entries(r.in).forEach(([i,q])=>{const want=q*qMax(),have=(h.items[ik]||{})[i]||0;if(have>=want)return;
    if(i==='wapno'&&inv('wapno')<want-have&&S.coins>=15){S.coins-=15;add('wapno',5);spendFeed(15,'Młynarz kupił wapno')}
    const n=Math.min(want-have,inv(i));if(n>0){add(i,-n);putH(h,ik,i,n)}});
  if(hin(h,ox,oy)&&!h.cells[ok]&&!feedsMachine(h,ok)){const it=h.items[ok];if(it)Object.keys(it).forEach(i=>{const n=takeH(h,ok,i,it[i]);if(n)add(i,n)})}})}
function placeM(h,key,id,dir,lvl){if(h.cells[key]||sumQ(h.items[key])){toast('Maszyna potrzebuje wolnej kratki (bez towaru).');return false}
  // z magazynu bierzemy egzemplarz o wskazanym poziomie (albo najwyższym)
  let i=-1;S.mag.forEach((x,j)=>{if(x.m===id&&(lvl==null||x.lvl===lvl)&&(i<0||x.lvl>S.mag[i].lvl))i=j});
  if(i<0){toast('Nie masz tej maszyny w magazynie. Kupisz ją w Sklepie.');return false}
  const it=S.mag.splice(i,1)[0];h.cells[key]=newCell(id,dir,it.lvl);snd('drop_jar');dirty=true;return true}
function moveM(h,from,to){if(from===to)return false;const c=h.cells[from];if(!c)return false;if(h.cells[to]||sumQ(h.items[to])){toast('Tu się nie zmieści.');return false}
  delete h.cells[from];h.cells[to]=c;S.millers.forEach(ml=>{if(ml.at&&S.halls[ml.at.h]===h&&ml.at.key===from)ml.at.key=to});dirty=true;return true}
// zwrot wkładu z maszyny: na kratkę wejścia, a gdy jej nie ma, do spiżarni
function refundM(h,key,c,list){const [x,y]=hxy(key),[ix,iy]=inXY(c,x,y),ik=hk(ix,iy),back=hin(h,ix,iy)&&!h.cells[ik];
  list.forEach(([r,n,p])=>Object.entries(RECIPES[r].in).forEach(([i,q])=>{const k=p||q*n;if(back)putH(h,ik,i,k);else add(i,k)}))}
function stashM(h,key){const c=h.cells[key];if(!c)return;refundM(h,key,c,[...c.q.map(q=>[q.r,q.n,q.p]),...c.run.map(j=>[j.r,1,j.p])]);delete h.cells[key];S.mag.push({m:c.m,lvl:c.lvl||1});
  S.millers.forEach(ml=>{if(ml.at&&S.halls[ml.at.h]===h&&ml.at.key===key)ml.at=null});dirty=true}
function unqueueM(h,key){const c=h.cells[key];if(!c||!c.q.length)return;refundM(h,key,c,c.q.map(q=>[q.r,q.n,q.p]));c.q=[];dirty=true}
function collectH(h,key){const it=h.items[key];if(!it)return 0;let n=0;Object.keys(it).forEach(i=>{const q=takeH(h,key,i,it[i]);if(q){add(i,q);n+=q}});return n}
// zaznaczona maszyna albo kratka: cały połączony łańcuch maszyn z ich wejściami i wyjściami
function chainSet(h,key){const set=new Set();if(!key)return set;const mach=Object.keys(h.cells);
  const io=k2=>{const c=h.cells[k2],[x,y]=hxy(k2);return [hk(...inXY(c,x,y)),hk(...outXY(c,x,y))]};
  const ms=new Set(),st=h.cells[key]?[key]:mach.filter(m=>io(m).includes(key));
  while(st.length){const m=st.pop();if(ms.has(m))continue;ms.add(m);const [i,o]=io(m);mach.forEach(m2=>{if(ms.has(m2))return;const [i2,o2]=io(m2);if(i2===o||o2===i)st.push(m2)})}
  ms.forEach(m=>{set.add(m);io(m).forEach(k=>set.add(k))});return set}

// kroki z Księgi mąk (do sprawdzania, czego brakuje do danej mąki)
const PLANC={};
const planSteps=f=>PLANC[f]||(PLANC[f]=chainOf(f).filter(s=>s.r).map(s=>s.r));
function chainProblem(f){const steps=planSteps(f); const miss=[...new Set(steps.filter(r=>!S.m[r.m].owned).map(r=>M[r.m].n))];
  if(miss.length) return 'Brak maszyny: '+miss.join(', ');
  const crop=chainOf(f).find(s=>s.crop)?.crop; if(crop&&!unlocked(crop)) return `Uprawa „${crop.n}” od poziomu ${crop.lvl}`;
  if(crop&&!haveEnv(crop.env)) return `Uprawa wymaga: ${ENV[crop.env].toLowerCase()}`;
  return '';}
// ---------- RYNEK: sklep, zamówienia i renoma młyna ----------
// Renoma rośnie dzięki zadowolonym klientom i wykonanym zamówieniom. Od niej zależy,
// ilu klientów zagląda do sklepu, ile kupują, ile zamówień przychodzi i jak są duże.
const POP_MAX=20;
const POP_NAMES=['Nieznany młyn','Młyn z sąsiedztwa','Znany we wsi','Polecany w gminie','Ulubiony w okolicy','Znany w powiecie','Marka z powiatu','Dostawca miasteczka','Znany w regionie','Ceniony w regionie',
 'Marka regionalna','Dostawca miasta','Znany w województwie','Ceniony w województwie','Marka z tradycją','Znany w kraju','Ceniony w kraju','Marka krajowa','Młyn z renomą','Legenda młynarstwa'];
const popNeed=L=>Math.round(200*Math.pow(1.3,L-1));
const popUnit=L=>popNeed(L)/(3+L); // tyle renomy daje jedno zwykłe, pełne zamówienie
const popL=()=>S.pop.l;
// sklep daje dziennie najwyżej tyle renomy co 0,6 zamówienia; na start więcej, żeby szybciej przyszły zamówienia
const shopCap=()=>popL()<2?3:0.6;
function popAdd(v,src){const L0=S.pop.l,P=S.pop;
  const pts=v*popUnit(P.l)*(v>0?1+0.06*res('fame'):1); P.p+=pts;
  while(P.l<POP_MAX&&P.p>=popNeed(P.l)){P.p-=popNeed(P.l);P.l++}
  if(P.l>=POP_MAX) P.p=Math.min(P.p,popNeed(POP_MAX));
  while(P.p<0&&P.l>1){P.l--;P.p+=popNeed(P.l)}
  if(P.p<0) P.p=0;
  if(P.l>L0){toast(`Renoma ${P.l}: ${POP_NAMES[P.l-1]}. ${popPerk(P.l)}`,'gold');snd('level')}
  else if(P.l<L0) toast(`Renoma spadła do poziomu ${P.l}.`);
  const r=Math.round(pts); if(r) feed('pop|'+src,STAR,r,'renomy',src,false,pts>0?'pop':'spend');
  dirty=true;}
function popPerk(L){const a=[];
  if(L===2) a.push('Przychodzą pierwsze zamówienia');
  if(orderSlotsAt(L)>orderSlotsAt(L-1)&&L>2) a.push('więcej zamówień naraz');
  if(orderTypes(L)>orderTypes(L-1)) a.push(`zamówienia do ${orderTypes(L)} rodzajów mąki`);
  if(custMaxQAt(L)>custMaxQAt(L-1)) a.push(`klienci kupują do ${custMaxQAt(L)} szt.`);
  if(!a.length) a.push('więcej klientów i lepiej płatne zamówienia');
  const s=a.join(', ');return s[0].toUpperCase()+s.slice(1)+'.';}

// --- sklep: wystawa z towarem, klienci przychodzą sami
const shopSlots=()=>3+res('lada');
const PM=[{n:'Taniej',p:0.85,a:1.6},{n:'Zwykle',p:1,a:1},{n:'Drożej',p:1.3,a:0.55}];
const APPEAL={flour:1,mid:.6,raw:.5,by:.4};
const shopMul=()=>1+0.04*res('ceny');
const shopPrice=(id,pm)=>Math.max(1,Math.round(price(id)*PM[pm==null?1:pm].p*shopMul()*(S.hot===id?1.4:1)));
const unitPrice=id=>shopPrice(id,1);
const skupPrice=id=>Math.max(1,Math.floor(price(id)*0.5));
const canSkup=id=>ITEMS[id].kind==='raw'||ITEMS[id].kind==='by';
const custMaxQAt=L=>1+Math.floor(L/5), custMaxQ=()=>custMaxQAt(popL());
const wares=()=>S.shop.filter(x=>x&&x.q>0);
const wareW=x=>(APPEAL[ITEMS[x.k].kind]||.4)*PM[x.pm].a*(S.hot===x.k?2.5:1);
// klientów na sekundę: rośnie z renomą, szyldem i liczbą rodzajów na wystawie
function custRate(){const w=wares().reduce((s,x)=>s+wareW(x),0); if(!w) return 0;
  return (1/62.5)*(1+0.1*(popL()-1))*(1+0.1*res('szyld'))*Math.pow(w,0.6);}
const SALES=[];
function customer(){const ws=wares(); if(!ws.length) return;
  const w=ws.map(wareW); let t=Math.random()*w.reduce((a,b)=>a+b,0),j=0; while(j<w.length-1&&t>w[j]){t-=w[j];j++}
  const x=ws[j],it=ITEMS[x.k],q=Math.min(x.q,1+rand(custMaxQ())),v=shopPrice(x.k,x.pm)*q;
  x.q-=q; earn(v,'Sklep: '+it.n); S.st.sold+=q; S.st.cust++; if(it.kind==='flour') S.st.flourSold+=q; gainXP(Math.ceil(v/15));
  const g=Math.min((it.kind==='flour'?0.12:0.04)*(popL()<2?1.7:1),shopCap()-S.pop.sd); if(g>0){S.pop.sd+=g;popAdd(g,'Zadowoleni klienci')}
  if(!silent){SALES.unshift({k:x.k,q,v,t:S.t});if(SALES.length>6)SALES.pop();if(S.tab==='targ')snd('sale')}
  if(!x.q&&!silent&&S.tab!=='targ') toast(`Wyprzedane w sklepie: ${it.n}`);
  dirty=true;}
function shopStep(d){const r=custRate(); if(!r) return;
  if(S.custT==null) S.custT=-Math.log(1-Math.random())/r;
  S.custT-=d; let g=0; while(S.custT<=0&&g++<50){customer(); const r2=custRate(); if(!r2){S.custT=null;break} S.custT+=-Math.log(1-Math.random())/r2}}
// wystaw towar: do slotu z tym samym towarem, do wskazanego albo pierwszego wolnego
function listWare(k,n,slot){n=Math.min(inv(k),n); if(n<=0||ITEMS[k].kind==='supply') return 0; padShop();
  let i=S.shop.findIndex(x=>x&&x.k===k);
  if(i<0){i=slot!=null&&!S.shop[slot]?slot:S.shop.findIndex(x=>!x); if(i<0){toast('Wystawa w sklepie jest pełna. Zdejmij coś albo kup dłuższą ladę w Sklepie.');return 0} S.shop[i]={k,q:0,pm:1,t:0}}
  const x=S.shop[i]; add(k,-n); x.q+=n; x.t=Math.max(x.t||0,x.q); dirty=true; return n;}
function unlistWare(i){const x=S.shop[i]; if(!x) return; if(x.q) add(x.k,x.q); S.shop[i]=null; placeItems(); dirty=true;}
function padShop(){const n=shopSlots(); while(S.shop.length<n) S.shop.push(null);}
function skup(k,n){n=Math.min(n,inv(k)); if(n<=0||!canSkup(k)) return 0; const v=skupPrice(k)*n;
  add(k,-n); earn(v,`Skup: ${n}× ${ITEMS[k].n}`); S.st.sold+=n; gainXP(Math.ceil(v/25)); return v;}

// --- zamówienia: duże ilości mąk, które już robisz, czasem z „nowościami”
const orderSlotsAt=L=>L<2?0:Math.min(9,1+Math.floor(L/3));
const orderSlots=()=>orderSlotsAt(popL())+(popL()<2?0:res('tablica'));
const orderTypes=L=>1+Math.floor((L-1)/3);
const orderMul=L=>(1.25+0.035*L)*(1+0.06*res('kontrakt'));
const orderLife=L=>DAY*(3+0.25*L)*(1+0.2*res('cierp'));
const BUYERS_BIG=['Sieć piekarni „Złoty Kłos”','Hurtownia „Spichlerz”','Hotel „Pod Lipami”','Fabryka makaronu „Nitka”','Zakłady cukiernicze „Wawrzyn”','Kuchnia szpitala miejskiego','Sieć restauracji „Strawa”','Eksporter „Polska Mąka”','Catering lotniczy','Sieć sklepów „Natura”'];
function lineQ(f,L,extra){const s=Math.min(1.5,Math.max(0.55,Math.pow(30/price(f),0.4)));
  let q=(4+2.3*L)*s*(0.75+Math.random()*0.5); if(extra) q*=0.35;
  q=Math.max(3,Math.round(q)); return q>20?Math.round(q/5)*5:q;}
function haveEnv(env){return S.plots.some(p=>p.env===env||(env==='pole'&&p.env==='szklarnia'))}
function feasible(id,seen){seen=seen||new Set(); if(id==='wapno') return true; const it=ITEMS[id];
  if(it.kind==='raw'){const c=CR[it.crop];return haveEnv(c.env)&&unlocked(c)}
  if(seen.has(id)) return false; seen.add(id);
  return (BYM[id]||[]).some(r=>S.m[r.m].owned&&Object.keys(r.in).every(i=>feasible(i,new Set(seen))));}
function genOrder(){const L=popL(),made=FLOURS.filter(f=>S.made[f]); if(!made.length) return null;
  // częściej zamawiane są mąki, które robisz najwięcej
  const nCore=Math.min(made.length,orderTypes(L)),pool=made.slice(),lines=[];
  while(lines.length<nCore){const w=pool.map(f=>Math.sqrt(S.made[f])),t=Math.random()*w.reduce((a,b)=>a+b,0);let j=0,c=w[0];while(c<t&&j<pool.length-1)c+=w[++j];
    const f=pool.splice(j,1)[0];lines.push({f,q:lineQ(f,L)})}
  const cand=FLOURS.filter(f=>!S.made[f]&&feasible(f));
  let nx=cand.length&&Math.random()<0.5?1:0; if(nx&&L>=8&&cand.length>1&&Math.random()<0.4) nx=2;
  for(let k=0;k<nx;k++){const f=cand.splice(rand(cand.length),1)[0];lines.push({f,q:lineQ(f,L,true),x:1})}
  const mul=orderMul(L),val=ls=>ls.reduce((s,x)=>s+price(x.f)*x.q*(x.x?1.4:1),0);
  const pay=Math.round(val(lines)*mul),core=Math.round(val(lines.filter(x=>!x.x))*mul);
  return {lines,pay,core,w:0.8+0.2*nCore+0.3*nx,xp:Math.round(Math.sqrt(pay)*3),who:pick(L>=8&&Math.random()<0.6?BUYERS_BIG:BUYERS),
    exp:S.t+orderLife(L)*(0.85+Math.random()*0.3),no:1000+rand(9000)};}
function orderTick(){const n=orderSlots();
  for(let i=S.orders.length-1;i>=0;i--) if(S.t>S.orders[i].exp){const o=S.orders.splice(i,1)[0];
    if(!silent){popAdd(-0.35,'Przepadło zamówienie');toast(`Przepadło zamówienie: ${o.who}`)} dirty=true}
  if(S.orders.length>=n){S.nextOrd=null;return}
  if(S.nextOrd==null) S.nextOrd=S.t+(S.orders.length?DAY*(0.3+0.4*Math.random())/(1+0.04*popL()):DAY*0.08);
  if(S.t>=S.nextOrd){S.nextOrd=null;const o=genOrder();if(o){S.orders.push(o);if(!silent)toast(`Nowe zamówienie: ${o.who}, ${fmtZ(o.pay)}`);dirty=true}}}
const haveLines=ls=>ls.every(x=>inv(x.f)>=x.q);
const hasExtra=o=>o.lines.some(x=>x.x);
const canFull=o=>haveLines(o.lines);
const canCore=o=>hasExtra(o)&&haveLines(o.lines.filter(x=>!x.x));
const canDeliver=o=>canFull(o)||canCore(o);
function deliver(i,mode,auto){const o=S.orders[i]; if(!o) return false; const full=mode!=='core'||!hasExtra(o);
  const ls=full?o.lines:o.lines.filter(x=>!x.x); if(!haveLines(ls)) return false;
  ls.forEach(x=>add(x.f,-x.q)); earn(full?o.pay:o.core,(auto?'Kupiec: ':'Zamówienie: ')+o.who,'gold');
  gainXP(full?o.xp:Math.round(o.xp*0.6)); S.st.orders++; S.st.flourSold+=ls.reduce((s,x)=>s+x.q,0); if(full) S.st.bigOrder=Math.max(S.st.bigOrder||0,o.pay);
  S.orders.splice(i,1);
  if(full) popAdd(o.w,'Zamówienie wykonane'); else popAdd(-0.25,'Zamówienie bez nowości');
  if(!auto) snd('coin'); dirty=true; return true;}
function declineOrder(i){if(!S.orders[i]) return; S.orders.splice(i,1); popAdd(-0.2,'Odrzucone zamówienie'); dirty=true;}
function earn(n,src,cls){S.coins+=n;S.earned+=n;dirty=true; if(src) coinFeed(n,src,cls)}

// ---------- POSTĘP ----------
function gainXP(n){S.xp+=n*(1+0.1*res('school'));
  while(S.xp>=xpNeed(S.lvl)){S.xp-=xpNeed(S.lvl);S.lvl++;const bonus=10*S.lvl;earn(bonus,`Awans na poziom ${S.lvl}`,'gold');
    const un=CROPS.filter(c=>c.lvl===S.lvl).map(c=>c.n), um=MACH.filter(x=>x[5]===S.lvl).map(x=>x[1]);
    toast(`Poziom ${S.lvl}!${un.length?' Nowe nasiona: '+un.join(', ')+'.':''}${um.length?' Do kupienia: '+um.join(', ')+'.':''}`,'gold');snd('level');dirty=true;}}
const catDone=c=>FLOURS.filter(f=>ITEMS[f].cat===c).every(f=>S.made[f]);
const ACH=[
 ['h1','Pierwszy kłos','Zbierz pierwszy plon.',()=>S.st.harv>=1,5],
 ['h500','Pełne sąsieki','Zbierz łącznie 500 sztuk plonów.',()=>S.st.harv>=500,100],
 ['h3000','Spichlerz po dach','Zbierz łącznie 3000 sztuk plonów.',()=>S.st.harv>=3000,500],
 ['f1','Pierwszy worek','Wyprodukuj pierwszą mąkę.',()=>nMade()>=1,10],
 ['f10','Dziesięć worków','Zbierz 10 różnych mąk w Księdze.',()=>nMade()>=10,80],
 ['f25','Ćwierć księgi','Zbierz 25 różnych mąk.',()=>nMade()>=25,300],
 ['f50','Młynarz z dyplomem','Zbierz 50 różnych mąk.',()=>nMade()>=50,1000],
 ['f70','Wszystkie mąki świata',`Zapełnij całą Księgę: ${FLOURS.length} mąk.`,()=>nMade()>=FLOURS.length,5000],
 ...CATS.slice(1).map((c,i)=>['cat'+(i+1),'Komplet: '+c.toLowerCase(),'Wszystkie mąki z działu „'+c+'”.',()=>catDone(i+1),150+i*100]),
 ['c1k','Pierwszy tysiąc','Zarób łącznie 1 000 zł.',()=>S.earned>=1000,30],
 ['c10k','Bogaty gospodarz','Zarób łącznie 10 000 zł.',()=>S.earned>=10000,200],
 ['c100k','Potentat zbożowy','Zarób łącznie 100 000 zł.',()=>S.earned>=100000,1500],
 ['c1m','Milioner z młyna','Zarób łącznie 1 000 000 zł.',()=>S.earned>=1e6,10000],
 ['o10','Zaufany dostawca','Zrealizuj 10 zamówień.',()=>S.st.orders>=10,60],
 ['o50','Młyn z renomą','Zrealizuj 50 zamówień.',()=>S.st.orders>=50,300],
 ['o200','Dostawca całego miasta','Zrealizuj 200 zamówień.',()=>S.st.orders>=200,1500],
 ['p12','Gospodarstwo','Miej 12 poletek.',()=>S.plots.length>=12,100],
 ['p24','Latyfundium','Miej 24 poletka.',()=>S.plots.length>=24,1500],
 ['gh','Pod szkłem','Zbuduj szklarnię.',()=>S.plots.some(p=>p.env==='szklarnia'),40],
 ['wet','Ryżowisko','Zalej pole ryżowe.',()=>S.plots.some(p=>p.env==='mokre'),40],
 ['orch','Sadownik','Miej jednocześnie 5 drzew lub krzewów.',()=>S.plots.filter(p=>p.crop&&CR[p.crop].r).length>=5,200],
 ['soil','Czarnoziem','Ulepsz glebę poletka do najwyższego poziomu.',()=>S.plots.some(p=>p.soil>=SOILMAX),400],
 ['mall','Pełna przetwórnia','Kup wszystkie maszyny.',()=>MACH.every(x=>S.m[x[0]].owned),800],
 ['m5','Dobry mechanik','Ulepsz maszynę do poziomu 5.',()=>allMach().some(c=>c.lvl>=5),150],
 ['m10','Mistrz mechaniki','Ulepsz maszynę do poziomu 10.',()=>allMach().some(c=>c.lvl>=10),1000],
 ['crew','Pełna załoga','Zatrudnij parobka, siewcę, kupca i pięciu młynarzy.',()=>WORK.every(w=>S.work[w[0]])&&S.millers.length>=MILLER_MAX,2000],
 ['lvl10','Gospodarz pełną gębą','Osiągnij 10. poziom.',()=>S.lvl>=10,300],
 ['lvl20','Dziedzic','Osiągnij 20. poziom.',()=>S.lvl>=20,3000],
 ['winter','Przezimowanie','Doczekaj drugiej wiosny.',()=>dayN()>=SD*4,150],
 ['pop6','Znany w powiecie','Zdobądź renomę 6.',()=>S.pop.l>=6,300],
 ['pop12','Dostawca miasta','Zdobądź renomę 12.',()=>S.pop.l>=12,2500],
 ['pop20','Legenda młynarstwa','Zdobądź najwyższą renomę.',()=>S.pop.l>=POP_MAX,15000],
 ['cust500','Stali bywalcy','Obsłuż 500 klientów w sklepie.',()=>S.st.cust>=500,400],
 ['big10k','Wielki kontrakt','Zrealizuj jedno zamówienie warte co najmniej 10 000 zł.',()=>S.st.bigOrder>=10000,1000],
 ['masa','Woda wapienna','Wyprodukuj mąkę Masa Harina.',()=>!!S.made.m_masa,80],
 ['gf','Czysta linia','Wyprodukuj certyfikowaną mąkę owsianą bezglutenową.',()=>!!S.made.m_owc,120],
];
const GOALS=[
 ['Zbierz dojrzałą pszenicę. Kliknij świecące poletko.',()=>S.st.harv>=1,10],
 ['Zasiej coś na wolnym poletku.',()=>S.st.planted>=1,10],
 ['Oczyść ziarno: w Przetwórni przeciągnij je ze spiżarni przed Czyszczalnię wstępną i kliknij +1.',()=>S.st.crafted>=1,15],
 ['Złóż w hali linię pszenną (brakujące maszyny są w Sklepie) i zmiel pierwszą mąkę na Żarnach.',()=>nMade()>=1,20],
 ['Wystaw mąkę w sklepie na Targu i poczekaj na klienta.',()=>S.st.flourSold>=1||S.st.orders>=1,25],
 ['Osiągnij 2. poziom gospodarza.',()=>S.lvl>=2,30],
 ['Kup Łuszczarkę w zakładce Sklep.',()=>S.m.lus.owned,40],
 ['Ulepsz Czyszczalnię wstępną albo Żarna do poziomu 2 (prawy przycisk na maszynie).',()=>allMach().some(c=>(c.m==='czw'||c.m==='zar'||c.m==='mlo')&&c.lvl>=2),50],
 ['Użyźnij glebę: prawy przycisk na poletku.',()=>S.plots.some(p=>p.soil>0),40],
 ['Zdobądź renomę 2 i zrealizuj 5 zamówień na Targu.',()=>S.st.orders>=5,80],
 ['Zbuduj szklarnię, zanim przyjdzie zima.',()=>S.plots.some(p=>p.env==='szklarnia'),120],
 ['Wyprodukuj 10 różnych mąk.',()=>nMade()>=10,200],
 ['Zatrudnij parobka.',()=>!!S.work.parobek,150],
 ['Zatrudnij młynarza i przydziel go do maszyny (prawy przycisk na maszynie).',()=>S.millers.some(m=>m.at),250],
 ['Wyprodukuj 25 różnych mąk.',()=>nMade()>=25,500],
 ['Wyprodukuj 50 różnych mąk.',()=>nMade()>=50,1500],
 ['Zapełnij całą Księgę mąk.',()=>nMade()>=FLOURS.length,5000],
];
function checkProgress(){
  ACH.forEach(([id,n,,f,rw])=>{if(!S.ach[id]&&f()){S.ach[id]=Math.round(S.t);earn(rw,'Osiągnięcie: '+n,'gold');snd('level')}});
  const g=GOALS[S.goal]; if(g&&g[1]()){earn(g[2],'Cel wykonany','gold');gainXP(Math.round(g[2]/3));S.goal++;snd('coin');dirty=true}}

// ---------- CZAS ----------
function newDay(quiet){const first=S.day<0; S.day=dayN(); const s=seasonN();
  S.wx=S.fc&&S.fc.length?S.fc.shift():pick(WX_BY_SEASON[s]); S.fc=S.fc||[];
  while(S.fc.length<3) S.fc.push(pick(WX_BY_SEASON[seasonOfDay(S.day+1+S.fc.length)]));
  S.pop.sd=0; const mk=FLOURS.filter(f=>S.made[f]),pool=mk.length>2?mk:FLOURS.filter(f=>feasible(f)); S.hot=pick(pool.length?pool:FLOURS.slice(0,10));
  if(!quiet&&!first){ if(S.day%SD===0) toast(SEASONS[s].msg,'gold');
    else if(seasonOfDay(S.day+1)===3&&s!==3) toast('Jutro zaczyna się zima. Zbierz, co zdążysz, i przenieś siew do szklarni.','gold');
    else if(WEATHER[S.wx].d) toast(WEATHER[S.wx].d);}
  dirty=true;}
function step(d,quiet){const pd=dayN(); S.t+=d; if(dayN()!==pd||S.day<0) newDay(quiet);
  S.plots.forEach((p,i)=>{if(!p.crop) return;
    if(p.prog<p.need){p.prog=Math.min(p.need,p.prog+d*plotRate(p)); if(p.prog>=p.need) dirty=true;}
    const s=stage(p); if(stageCache[i]!==s){stageCache[i]=s;dirty=true}});
  hallStep(d);
  orderTick(); shopStep(d);
  if(working('parobek')) S.plots.forEach((p,i)=>{if(isReady(p)) harvest(i,true)});
  placeItems();
  millerStep();
  if(working('kupiec')){for(let i=0;i<S.orders.length;i++) if(canFull(S.orders[i])&&deliver(i,'full',true)) i--;
    S.shop.forEach(x=>{if(x&&x.q<(x.t||0)&&inv(x.k)>0){const n=Math.min(inv(x.k),x.t-x.q);add(x.k,-n);x.q+=n;dirty=true}});
    Object.keys(S.inv).forEach(k=>{if(ITEMS[k].kind==='by'&&inv(k)>=5) skup(k,inv(k))});}
}
function advance(total,quiet){let left=total; placeItems(); while(left>1e-9){if(pantryStuck())return; const d=Math.min(2,left); left-=d; step(d,quiet);}}

// ---------- DŹWIĘK ----------
let AC=null, gest=false;
// odgłosy akcji i tło każdego miejsca są w sound.js
function snd(type){ if(!S||!S.sound||!gest||silent) return; if(window.AuraSound) AuraSound.fx(type);}
function sndUpdate(){if(!window.AuraSound||!gest||!S)return;const run={};S.halls.forEach(h=>{for(const k in h.cells){const c=h.cells[k];if(c.run.length)run[c.m]=(run[c.m]||0)+c.run.length}})
  AuraSound.update({on:!!S.sound,bg:S.bgSound!==false,vols:vols(),tab:S.tab,wx:S.wx,season:seasonN(),hour:hourF(),run})}
// głośności kanałów 0..1 (ogólna, akcje, otoczenie, maszyny, targ, muzyka); stare zapisy: vol i amb
const VOLS=[['all','Ogólna'],['fx','Efekty akcji'],['amb','Otoczenie i pogoda'],['mach','Maszyny'],['crowd','Gwar na targu'],['music','Muzyka w sklepie']];
function vols(){if(!S.vols){S.vols={all:S.vol==null?.7:S.vol,fx:1,amb:S.amb===false?0:1,mach:1,crowd:1,music:1}}return S.vols}
// rodzaj odgłosu towaru: worek (mąki), ziarno albo słoik (płyny, mleczka, zaopatrzenie)
const itemSnd=k=>{const it=ITEMS[k];if(!it)return 'grain';if(it.kind==='flour')return 'sack';if(it.kind==='supply'||k==='olej'||k==='sok'||SHAPE_WET.test(it.n))return 'jar';return 'grain'};

// ---------- GRAFIKA ----------
const G='#6fa64a',D='#4c7d33',BR='#6a4a2e';
const svgw=(inner,vb='0 0 64 56')=>`<svg viewBox="${vb}" aria-hidden="true">${inner}</svg>`;
const FR=[[-8,-4],[6,-6],[-2,4],[9,3],[-11,4],[2,-11],[-6,10],[8,-12]];
function art(kind,s,col){
  const gr='<ellipse cx="32" cy="50" rx="24" ry="3.5" fill="#000" opacity=".3"/>';
  if(s===0) return svgw(gr+`<path d="M18 50 Q32 40 46 50Z" fill="#3a2c1f"/><path d="M24 47 q8 -5 16 0" stroke="#4a3828" stroke-width="1.2" fill="none"/><circle cx="29" cy="46.5" r="1.8" fill="${col}"/><circle cx="35" cy="47" r="1.6" fill="${col}"/><path d="M32 45 q-1 -4 1 -6" stroke="${G}" stroke-width="1.4" fill="none"/>`);
  let o='';
  if(kind==='zboze'){const h=[0,12,24,34][s];for(let i=0;i<6;i++){const x=12+i*8,sw=(i-2.5)*2,top=50-h-(i%2)*3;
    o+=`<path d="M${x} 50 Q${x+sw/2} ${50-h/2} ${x+sw} ${top}" stroke="${s===3?'#b89a48':G}" stroke-width="1.8" fill="none"/>`;
    if(s>=2)o+=`<ellipse cx="${x+sw}" cy="${top-4}" rx="2.6" ry="${s===3?7:5}" fill="${s===3?col:'#9cc45e'}" transform="rotate(${sw*3} ${x+sw} ${top-4})"/>`;
    if(s===3)o+=`<path d="M${x+sw} ${top-10} l${sw/2} -5" stroke="${col}" stroke-width=".8"/>`;}}
  else if(kind==='kwiat'){const h=[0,10,22,32][s];[[20,0],[32,4],[44,-2]].forEach(([x,dh])=>{const top=50-h-dh;
    o+=`<path d="M${x} 50 L${x} ${top}" stroke="${G}" stroke-width="2"/><ellipse cx="${x-4}" cy="${50-h*0.45}" rx="4" ry="1.8" fill="${G}" transform="rotate(-25 ${x-4} ${50-h*0.45})"/><ellipse cx="${x+4}" cy="${50-h*0.65}" rx="3.5" ry="1.6" fill="${D}" transform="rotate(25 ${x+4} ${50-h*0.65})"/>`;
    if(s>=2)o+=`<circle cx="${x}" cy="${top}" r="${s===3?5.5:3}" fill="${s===3?col:'#9cc45e'}"/><circle cx="${x}" cy="${top}" r="${s===3?2:1}" fill="#3a2a1a" opacity=".5"/>`;});}
  else if(kind==='straczek'){const r=[0,6,11,14][s];o+=`<ellipse cx="32" cy="${50-r*0.75}" rx="${r*1.35}" ry="${r}" fill="${G}"/><ellipse cx="26" cy="${50-r*0.9}" rx="${r*0.6}" ry="${r*0.55}" fill="${D}" opacity=".6"/><ellipse cx="39" cy="${50-r*1.1}" rx="${r*0.5}" ry="${r*0.45}" fill="#86bb58" opacity=".7"/>`;
    if(s===3)[[22,40],[30,35],[38,40],[44,36],[34,44]].forEach(([x,y],i)=>o+=`<rect x="${x}" y="${y}" width="3.5" height="10" rx="1.8" fill="${col}" transform="rotate(${i*14-20} ${x} ${y})"/>`);}
  else if(kind==='bulwa'||kind==='warzywo'){const h=[0,8,15,18][s];for(let i=0;i<5;i++){const a=-60+i*30;
    o+=`<ellipse cx="32" cy="${50-h/2}" rx="${h*0.28+1}" ry="${h/2+1}" fill="${i%2?G:D}" transform="rotate(${a} 32 50)"/>`;}
    if(kind==='bulwa'&&s===3)o+=`<ellipse cx="24" cy="50" rx="7" ry="4.5" fill="${col}"/><ellipse cx="40" cy="50.5" rx="6" ry="4" fill="${col}"/><ellipse cx="32" cy="51.5" rx="4" ry="2.6" fill="${col}"/>`;
    if(kind==='warzywo'&&s>=2){const r=s===3?11:6;o+=`<circle cx="32" cy="${50-r}" r="${r}" fill="${s===3?col:'#9cc45e'}"/><path d="M26 ${50-r} q6 -3 12 0" stroke="rgba(0,0,0,.25)" stroke-width="1.4" fill="none"/><path d="M32 ${50-2*r} q2 -3 4 -3" stroke="${D}" stroke-width="2" fill="none"/>`;}}
  else if(kind==='krzew'){const r=[0,7,13,16][s];o+=`<circle cx="${32-r*0.5}" cy="${50-r*0.8}" r="${r*0.8}" fill="${D}"/><circle cx="${32+r*0.5}" cy="${50-r*0.8}" r="${r*0.8}" fill="${D}"/><circle cx="32" cy="${50-r*1.15}" r="${r*0.9}" fill="${G}"/>`;
    if(s===3)FR.slice(0,7).forEach(([dx,dy])=>o+=`<circle cx="${32+dx}" cy="${50-r+dy*0.8}" r="2.3" fill="${col}"/>`);}
  else if(kind==='drzewo'){const h=[0,10,15,17][s],r=[0,6,13,17][s],cy=50-h-r+5;
    o+=`<path d="M30 50 L30.5 ${50-h} L33.5 ${50-h} L34 50Z" fill="${BR}"/><circle cx="32" cy="${cy}" r="${r}" fill="${D}"/><circle cx="${32-r*0.35}" cy="${cy-r*0.25}" r="${r*0.7}" fill="${G}"/><circle cx="${32+r*0.45}" cy="${cy-r*0.1}" r="${r*0.45}" fill="#7db456" opacity=".7"/>`;
    if(s===3)FR.forEach(([dx,dy])=>o+=`<circle cx="${32+dx}" cy="${cy+dy}" r="2.4" fill="${col}"/>`);}
  else if(kind==='palma'){const h=[0,12,22,28][s],tx=36,ty=50-h;
    o+=`<path d="M30 50 Q28 ${50-h/2} ${tx} ${ty}" stroke="${BR}" stroke-width="3.5" fill="none"/>`;
    const L=[0,8,14,17][s];[[-1,.3],[-.6,-.8],[0,-1],[.7,-.7],[1,.35]].forEach(([dx,dy])=>o+=`<path d="M${tx} ${ty} q${dx*L*0.6} ${dy*L-4} ${dx*L} ${dy*L+4}" stroke="${G}" stroke-width="3" fill="none" stroke-linecap="round"/>`);
    if(s===3)[[-3,4],[2,5],[-.5,8]].forEach(([dx,dy])=>o+=`<circle cx="${tx+dx}" cy="${ty+dy}" r="3.4" fill="${col}"/>`);}
  return svgw(gr+o);
}
const SNOWCAP='<g fill="#eef3f7" opacity=".9"><ellipse cx="20" cy="50" rx="9" ry="2.6"/><ellipse cx="40" cy="50.5" rx="10" ry="2.4"/></g>';
function sack(col){return svgw(`<ellipse cx="16" cy="29.5" rx="10" ry="1.8" fill="#000" opacity=".3"/><path d="M10 9 Q16 6 22 9 L21 12 Q27 16 26.5 24 Q26 29 16 29 Q6 29 5.5 24 Q5 16 11 12Z" fill="${col}" stroke="rgba(0,0,0,.45)" stroke-width="1"/><path d="M10.5 12 Q16 14 21.5 12" stroke="#6a4a2e" stroke-width="1.6" fill="none"/><path d="M12 20 q4 2 8 0" stroke="rgba(0,0,0,.18)" stroke-width="1" fill="none"/><path d="M9 16 q-1.5 5 0 9" stroke="rgba(255,255,255,.35)" stroke-width="1.4" fill="none"/>`,'0 0 32 32')}
// ikona przedmiotu dobrana do tego, czym on jest
const SHAPE_WET=/Mleczko|Masa ryżowa|amoczon|Nixtamal$|Nixtamal wypłukany|odgoryczona/;
const SHAPE_SLICE=/Plastry|Wiórki|Różyczki|Susz |Miąższ/;
const imgSvg=src=>`<svg viewBox="0 0 32 32" aria-hidden="true"><image href="${src}" width="32" height="32"/></svg>`;
const iSrc=id=>'items/'+((ITEMS[id]&&ITEMS[id].img)||IART[id]||id)+'.webp';
const itemSvg=id=>imgSvg(iSrc(id));
function itemSvgOld(id){const it=ITEMS[id],c=it.col;
  if(it.kind==='flour') return sack(c);
  if(it.kind==='raw') return art(CR[it.crop].kind,3,c);
  if(it.kind==='supply') return svgw(`<ellipse cx="16" cy="29" rx="9" ry="1.8" fill="#000" opacity=".3"/><rect x="10" y="6" width="12" height="4" rx="1.5" fill="#8a6a40"/><path d="M8 10h16v15a3 3 0 0 1-3 3H11a3 3 0 0 1-3-3z" fill="${c}" stroke="rgba(0,0,0,.4)"/><rect x="11" y="15" width="10" height="7" rx="1" fill="#fff" opacity=".55"/>`,'0 0 32 32');
  if(id==='olej'||id==='sok') return svgw(`<ellipse cx="16" cy="29.5" rx="7" ry="1.6" fill="#000" opacity=".3"/><path d="M13 5h6v5l3 4v13a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V14l3-4z" fill="${c}" stroke="rgba(0,0,0,.45)"/><rect x="12.5" y="3" width="7" height="3" rx="1" fill="#6a4a2e"/><path d="M12 17v8" stroke="rgba(255,255,255,.4)" stroke-width="1.6" stroke-linecap="round"/>`,'0 0 32 32');
  if(SHAPE_WET.test(it.n)) return svgw(`<ellipse cx="16" cy="28" rx="11" ry="2.2" fill="#000" opacity=".3"/><path d="M4 14h24a12 12 0 0 1-24 0z" fill="#8a6a46" stroke="rgba(0,0,0,.35)"/><ellipse cx="16" cy="14" rx="12" ry="3.6" fill="${c}"/><ellipse cx="12" cy="13.4" rx="4" ry="1" fill="#fff" opacity=".4"/>`,'0 0 32 32');
  if(SHAPE_SLICE.test(it.n)) return svgw(`<ellipse cx="16" cy="28" rx="12" ry="2.2" fill="#000" opacity=".3"/><g stroke="rgba(0,0,0,.35)"><ellipse cx="10" cy="21" rx="7" ry="5" fill="${c}"/><ellipse cx="21" cy="19" rx="7" ry="5" fill="${c}"/><ellipse cx="15" cy="12" rx="6.5" ry="4.6" fill="${c}"/></g><g fill="rgba(255,255,255,.25)"><ellipse cx="9" cy="20" rx="3" ry="1.4"/><ellipse cx="14" cy="11" rx="2.6" ry="1.2"/></g>`,'0 0 32 32');
  return svgw(`<ellipse cx="16" cy="27.5" rx="13" ry="2.6" fill="#000" opacity=".3"/><path d="M3 26 Q16 3 29 26Z" fill="${c}" stroke="rgba(0,0,0,.35)"/><g fill="rgba(0,0,0,.2)"><circle cx="12" cy="20" r="1.2"/><circle cx="18" cy="16" r="1.2"/><circle cx="21" cy="22" r="1.2"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="24" r="1"/></g><path d="M8 22 Q12 13 16 8" stroke="rgba(255,255,255,.35)" stroke-width="1.5" fill="none"/>`,'0 0 32 32');}
const icon=(id,cls)=>`<span class="ico ${cls||''}">${itemSvg(id)}</span>`;
const COIN=svgw(`<circle cx="16" cy="17" r="12" fill="#8a6418"/><circle cx="16" cy="15.5" r="12" fill="#ecbc4c" stroke="#8a6418" stroke-width="1.5"/><circle cx="16" cy="15.5" r="8.5" fill="none" stroke="#c99a30" stroke-width="1.2"/><text x="16" y="19.6" text-anchor="middle" font-size="10.5" font-weight="800" fill="#7a5410" font-family="Georgia,serif">zł</text>`,'0 0 32 32');
const DROP='<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M6 1 C6 1 2 6 2 8 a4 4 0 0 0 8 0 C10 6 6 1 6 1Z" fill="#5aa3cc"/></svg>';
const STAR='<svg class="star" viewBox="0 0 32 32" aria-hidden="true"><path d="M16 3l3.9 8.1 8.9 1.1-6.6 6.1 1.7 8.8L16 22.8 8.1 27.1l1.7-8.8-6.6-6.1 8.9-1.1z" fill="#ecbc4c" stroke="#8a6418" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const LOCK='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" stroke-width="2"/></svg>';
const MEDAL=(on)=>`<svg class="medal" viewBox="0 0 34 34" aria-hidden="true"><path d="M10 2h5l2 9-5 1zM24 2h-5l-2 9 5 1z" fill="${on?'#b5473a':'#555'}"/><circle cx="17" cy="21" r="10" fill="${on?'#eab94a':'#6a6a6a'}" stroke="${on?'#8a6418':'#444'}" stroke-width="2"/><path d="M17 15l1.8 3.8 4.1.4-3.1 2.8.9 4-3.7-2.1-3.7 2.1.9-4-3.1-2.8 4.1-.4z" fill="${on?'#fff4cf':'#888'}"/></svg>`;
const WXI={ // małe ikony pogody 24×24
 slonce:'<circle cx="12" cy="12" r="5" fill="#f2c94c"/><g stroke="#f2c94c" stroke-width="2" stroke-linecap="round"><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/></g>',
 pochm:'<ellipse cx="13" cy="14" rx="8" ry="5" fill="#b9c0c8"/><circle cx="9" cy="12" r="4.5" fill="#cfd5db"/>',
 deszcz:'<ellipse cx="13" cy="10" rx="8" ry="5" fill="#9aa4ae"/><g stroke="#5aa3cc" stroke-width="2" stroke-linecap="round"><path d="M8 17l-1 4M13 17l-1 4M18 17l-1 4"/></g>',
 upal:'<circle cx="12" cy="11" r="6" fill="#f08a3c"/><g stroke="#e3734a" stroke-width="1.6" fill="none"><path d="M5 20q2-2 4 0t4 0 4 0 4 0"/></g>',
 snieg:'<ellipse cx="13" cy="10" rx="8" ry="5" fill="#cfd5db"/><g fill="#fff"><circle cx="8" cy="18" r="1.6"/><circle cx="13" cy="20" r="1.6"/><circle cx="18" cy="18" r="1.6"/></g>',
 mroz:'<g stroke="#8fd0c4" stroke-width="2" stroke-linecap="round"><path d="M12 3v18M4 7.5l16 9M4 16.5l16-9"/></g>'};
const SEAICO=[
 '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z" fill="#8cc45a"/><path d="M5 19l9-9" stroke="#2f4a1c" stroke-width="1.4" stroke-linecap="round"/>',
 WXI.slonce,
 '<path d="M12 2.5l1.8 4 4.2-1.2-1.1 4.2 4.1 1.9-4.1 1.9 1.1 4.2-4.2-1.2-1.8 4-1.8-4-4.2 1.2 1.1-4.2-4.1-1.9 4.1-1.9-1.1-4.2 4.2 1.2z" fill="#d9813a"/><path d="M12 11v10.5" stroke="#7a3e14" stroke-width="1.4" stroke-linecap="round"/>',
 '<g stroke="#cfe8f6" stroke-width="1.9" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10"/><path d="M9.3 3.6L12 6l2.7-2.4M9.3 20.4L12 18l2.7 2.4"/></g>'];
const SEAFILE=['wiosna','lato','jesien','zima'];
const seaIcon=k=>`<svg class="wxi" viewBox="0 0 24 24" aria-hidden="true"><image href="ui/pora-${SEAFILE[k]}.webp" width="24" height="24"/></svg>`;
const lico=p=>`<svg class="bico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICO={sprout:'<path d="M12 21V11M12 11c0-4 3-6 7-6 0 4-3 6-7 6zM12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5z"/>',
 sickle:'<path d="M4 20l5-5M9 15c-2-6 2-11 9-11-4 2-6 5-5 10"/>',
 bag:'<path d="M8 6h8l-1 3c2 1.5 3 4 3 6.5C18 19 15.5 21 12 21s-6-2-6-5.5C6 13 7 10.5 9 9z"/><path d="M9 6l1-2h4l1 2"/>',
 clock:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'};
const WXFILE={slonce:'pogodnie',pochm:'pochmurno',deszcz:'deszcz',upal:'upal',snieg:'snieg',mroz:'mroz'};
const wxIcon=w=>`<svg class="wxi" viewBox="0 0 24 24" aria-hidden="true"><image href="ui/pogoda-${WXFILE[w]}.webp" width="24" height="24"/></svg>`;
const TABICO={ // ikony zakładek, rysowane kolorem tekstu
 pola:'<path d="M12 21V11M12 11c0-4 3-6 7-6 0 4-3 6-7 6zM12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5z"/><path d="M4 21h16"/>',
 prz:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="1.8"/><path d="M12 5v14M5 12h14M7.1 7.1l9.8 9.8M16.9 7.1l-9.8 9.8"/><path d="M18.5 14.7L21.2 15.8M14.7 18.5L15.8 21.2M9.3 18.5L8.2 21.2M5.5 14.7L2.8 15.8M5.5 9.3L2.8 8.2M9.3 5.5L8.2 2.8M14.7 5.5L15.8 2.8M18.5 9.3L21.2 8.2" stroke-width="2.4"/>',
 spiz:'<path d="M8 4h8l-1 3c3 2 4 5 4 8 0 4-3 6-7 6s-7-2-7-6c0-3 1-6 4-8z"/><path d="M9 7h6"/>',
 targ:'<path d="M3 9l2-5h14l2 5M3 9h18M3 9c0 2 4 2 4 0 0 2 5 2 5 0 0 2 5 2 5 0 0 2 4 2 4 0M5 11v9h14v-9"/><path d="M10 20v-5h4v5"/>',
 ulep:'<path d="M12 19V5M6 11l6-6 6 6"/><path d="M5 21h14"/>',
 ksiega:'<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6v14"/>',
 kron:'<circle cx="12" cy="14" r="6"/><path d="M9 3h6l-1 5h-4zM12 11v3l2 1"/>'};
const tabIcon=k=>`<svg class="tico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${TABICO[k]}</svg>`;
// ilustracje maszyn: części z klasami spin/shake/chop/press/steam ruszają się, gdy maszyna pracuje
const MART={
 mlo:`<rect x="5" y="22" width="38" height="18" rx="2" fill="#7a4e2e"/><rect x="5" y="38" width="38" height="3" fill="#4a2e1a"/><circle cx="11" cy="43" r="3" fill="#333"/><circle cx="37" cy="43" r="3" fill="#333"/><g class="spin" style="transform-origin:24px 22px"><circle cx="24" cy="22" r="11" fill="#a87a4a" stroke="#3a2414" stroke-width="2"/><path d="M24 11v22M13 22h22M16 14l16 16M32 14L16 30" stroke="#3a2414" stroke-width="2"/></g><path d="M34 6h11l-4 9h-6z" fill="#eab94a"/>`,
 zar:`<ellipse cx="24" cy="36" rx="19" ry="7" fill="#6a6058"/><ellipse cx="24" cy="33" rx="19" ry="7" fill="#8a8078"/><g class="spin" style="transform-origin:24px 24px"><circle cx="24" cy="24" r="15" fill="#a59c92" stroke="#5a524a" stroke-width="2"/><path d="M24 9v30M9 24h30M13 13l22 22M35 13L13 35" stroke="#7a7068" stroke-width="1.2"/><circle cx="24" cy="24" r="3.5" fill="#4a2e1a"/></g><path d="M24 4v8" stroke="#4a2e1a" stroke-width="3"/>`,
 lus:`<path d="M11 4h26l-7 13H18z" fill="#c9a36a"/><rect x="9" y="17" width="30" height="24" rx="3" fill="#5f7048"/><g class="spin" style="transform-origin:24px 29px"><circle cx="24" cy="29" r="8" fill="#d8d0b0"/><path d="M24 21v16M16 29h16" stroke="#555" stroke-width="2"/></g><rect x="39" y="31" width="6" height="4" fill="#c9a36a"/>`,
 sus:`<rect x="10" y="6" width="28" height="34" rx="2" fill="#6a5040"/><rect x="13" y="10" width="22" height="26" fill="#2a1e16"/><path d="M13 16h22M13 23h22M13 30h22" stroke="#c9a36a" stroke-width="2"/><g class="steam"><path d="M18 46q2-3 0-5M24 46q2-3 0-5M30 46q2-3 0-5" stroke="#e3734a" stroke-width="2" fill="none"/></g>`,
 obi:`<rect x="5" y="30" width="38" height="9" rx="3" fill="#b08050"/><circle cx="14" cy="30" r="5" fill="#d03a30"/><circle cx="20" cy="31" r="3.5" fill="#e07a20"/><g class="chop" style="transform-origin:41px 15px"><path d="M14 27 L40 14 L42 18 L17 29z" fill="#cfd6dc"/><rect x="38" y="11" width="9" height="5" rx="2" fill="#4a2e1a" transform="rotate(-25 42 13)"/></g>`,
 pra:`<rect x="7" y="38" width="34" height="5" fill="#3a2a1a"/><g class="spin" style="transform-origin:24px 22px"><circle cx="24" cy="22" r="13" fill="#5a3a24" stroke="#a87a4a" stroke-width="2"/><circle cx="24" cy="22" r="3" fill="#a87a4a"/><path d="M24 9v6M24 29v6M11 22h6M31 22h6" stroke="#a87a4a" stroke-width="2"/></g><g class="steam"><path d="M14 46q2-3 0-6M24 46q2-3 0-6M34 46q2-3 0-6" stroke="#e3734a" stroke-width="2.2" fill="none"/></g>`,
 kad:`<path d="M7 18h34l-4 25H11z" fill="#8a5a34"/><path d="M8 26h32M10 36h28" stroke="#4a2e1a" stroke-width="2"/><ellipse cx="24" cy="18" rx="17" ry="4.5" fill="#5aa3cc"/><g class="shake"><ellipse cx="20" cy="17.5" rx="4" ry="1.2" fill="#9ccbe3"/><circle cx="29" cy="18" r="1.4" fill="#cde"/></g>`,
 sit:`<g class="shake"><rect x="6" y="14" width="36" height="12" rx="2" fill="#a07a4a"/><path d="M10 17h28M10 20h28M10 23h28M14 15v10M20 15v10M26 15v10M32 15v10" stroke="#5a3a24" stroke-width="1"/></g><path d="M10 26l-3 16M38 26l3 16" stroke="#4a2e1a" stroke-width="2.5"/><circle cx="20" cy="33" r="1.4" fill="#f1e7d4"/><circle cx="26" cy="37" r="1.4" fill="#f1e7d4"/><circle cx="23" cy="41" r="1.4" fill="#f1e7d4"/>`,
 lup:`<rect x="6" y="36" width="36" height="7" rx="2" fill="#5a4a3a"/><g class="press"><path d="M10 8l14 15 14-15" stroke="#9aa0a6" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></g><circle cx="24" cy="30" r="5.5" fill="#8a6a40"/><path d="M21 29q3-3 6 0" stroke="#5a3a20" stroke-width="1.2" fill="none"/>`,
 koc:`<path d="M8 20h32v8a16 14 0 0 1-32 0z" fill="#3a3a40"/><rect x="6" y="18" width="36" height="4" rx="2" fill="#55555c"/><ellipse cx="24" cy="20" rx="15" ry="2.5" fill="#e8e8e0"/><path d="M14 44h20" stroke="#e3734a" stroke-width="3"/><g class="steam"><path d="M17 14q3-4 0-8M24 14q3-4 0-8M31 14q3-4 0-8" stroke="#cfd6dc" stroke-width="2" fill="none"/></g>`,
 plu:`<rect x="18" y="16" width="26" height="24" rx="3" fill="#4f6a7a"/><rect x="21" y="20" width="20" height="14" fill="#5aa3cc"/><g class="spin" style="transform-origin:14px 26px"><circle cx="14" cy="26" r="10" fill="none" stroke="#8a5a34" stroke-width="2.5"/><path d="M14 16v20M4 26h20M7 19l14 14M21 19L7 33" stroke="#8a5a34" stroke-width="2"/></g>`,
 pre:`<rect x="8" y="4" width="4" height="40" fill="#4a2e1a"/><rect x="36" y="4" width="4" height="40" fill="#4a2e1a"/><rect x="8" y="4" width="32" height="5" fill="#6a4a2e"/><g class="press"><rect x="23" y="2" width="2.5" height="14" fill="#9aa0a6"/><rect x="13" y="16" width="22" height="5" fill="#8a6a40"/></g><rect x="13" y="28" width="22" height="12" fill="#7a3a7a"/><rect x="12" y="40" width="24" height="4" fill="#6a4a2e"/>`,
 mbg:`<ellipse cx="24" cy="36" rx="19" ry="7" fill="#4f6a48"/><ellipse cx="24" cy="33" rx="19" ry="7" fill="#6a8a5a"/><g class="spin" style="transform-origin:24px 24px"><circle cx="24" cy="24" r="15" fill="#c8d8b8" stroke="#4f6a48" stroke-width="2"/><path d="M24 9v30M9 24h30" stroke="#8aa878" stroke-width="1.2"/></g><path d="M18 30L30 18" stroke="#2f5a2a" stroke-width="2.5"/><path d="M24 15c-3 4-3 8 0 13 3-5 3-9 0-13z" fill="#e0b53a" opacity=".9"/>`,
};
// nowe maszyny mają na razie grafikę pokrewnej maszyny
const MIMG={czw:'sit',sil:'kad',mag:'sit',sep:'sit',odk:'sit',try:'mlo',stg:'sit',sor:'obi',obr:'lus',naw:'kad',odl:'kad',osc:'mlo',kal:'sit',per:'lus',kra:'obi',plr:'lus',plt:'pre',kie:'kad',ssl:'sus',okw:'sit',srt:'zar'};
const mSrc=(id,on)=>'machines/'+(MIMG[id]||id)+(on?'-praca':'')+'.webp';
const mart=(id,cls,on)=>`<span class="mart ${cls||''}"><img src="${mSrc(id,on)}" alt="" decoding="async" draggable="false"></span>`;
const person=id=>`<span class="mart pers"><img src="people/${id}.webp" alt="" decoding="async" draggable="false"></span>`;
const MILLER_ART=person('mlynarz');

// ---------- PASEK ZDOBYCZY ----------
// Każda zdobycz pojawia się z boku ekranu; te same zdobycze z tego samego źródła sumują się w jednym kafelku.
const FEED={};
function feed(key,ico,q,name,src,money,cls){
  if(silent) return; const box=$('#feed'); if(!box) return;
  const fmt=v=>(v<0?'−':'+')+(money?Math.abs(Math.round(v)).toLocaleString('pl-PL')+' zł':Math.abs(v));
  let f=FEED[key];
  if(f&&f.el.isConnected&&!f.el.classList.contains('out')){f.q+=q;f.el.querySelector('.fq').textContent=fmt(f.q);
    f.el.classList.remove('bump');void f.el.offsetWidth;f.el.classList.add('bump');clearTimeout(f.t);box.prepend(f.el);}
  else{const el=document.createElement('div');el.className='fd '+(cls||'');
    el.innerHTML=`<span class="fi">${ico}</span><span class="fx"><span class="fl1"><b class="fq">${fmt(q)}</b>${name?` <span class="fn">${esc(name)}</span>`:''}</span><small>${esc(src)}</small></span>`;
    box.prepend(el);f=FEED[key]={el,q};}
  f.t=setTimeout(()=>{f.el.classList.add('out');setTimeout(()=>{f.el.remove();if(FEED[key]===f)delete FEED[key]},450)},3400);
  while(box.children.length>7) box.lastElementChild.remove();
}
const gainFeed=(id,q,src)=>feed('i|'+id+'|'+src,itemSvg(id),q,ITEMS[id].n,src,false,ITEMS[id].kind==='flour'?'flour':'');
const coinFeed=(n,src,cls)=>feed('c|'+src,COIN,n,'',src,true,cls||'coin');
const spendFeed=(n,src)=>feed('s|'+src,COIN,-n,'',src,true,'spend');

// ---------- INTERFEJS ----------
function toast(msg,cls){if(silent)return;const el=document.createElement('div');el.className='toast '+(cls||'');el.textContent=msg;$('#toasts').appendChild(el);
  setTimeout(()=>el.remove(),cls?4500:2600); const all=$('#toasts').children; while(all.length>3) all[0].remove();}
const TABS=[['pola','Pola'],['prz','Przetwórnia'],['spiz','Spiżarnia'],['targ','Targ'],['ulep','Sklep']];

const resDef=id=>RES.find(x=>x[0]===id);
const resCost=id=>{const r=resDef(id);return Math.round(r[4]*Math.pow(r[5],res(id)))};
const resReq=id=>{const r=resDef(id);return r[6]+r[7]*res(id)};
const resAvail=id=>{const r=resDef(id);return res(id)<r[3]&&S.lvl>=resReq(id)&&S.coins>=resCost(id)};

function hudTick(){if(S.tab==="targ")bgMarket();
  $('#coins').textContent=fmtZ(S.coins);
  $('#clock').innerHTML=`<b>${SEASONS[seasonN()].n}, dzień ${dayN()%SD+1}/${SD}</b><span>${clock()} · ${WEATHER[S.wx].n} · rok ${yearN()}</span>`;
  $('#lvlLbl').textContent='Poziom '+S.lvl; $('#xpTxt').textContent=`${Math.floor(S.xp)} / ${xpNeed(S.lvl)} PD`;
  $('#xpbar').style.width=Math.min(100,S.xp/xpNeed(S.lvl)*100)+'%';
  $('#coll').textContent=nMade()+'/'+FLOURS.length; $('#achc').textContent=Object.keys(S.ach).length+'/'+ACH.length;
}
const goalMin=()=>S.goalMin!=null?S.goalMin:innerWidth<600; // na telefonie cel domyślnie zwinięty
// tło targu: pora roku, a noc przenika się z dniem jak niebo
let bgMk='';
function bgMarket(){const s=BG_SEASON[seasonN()];if(s!==bgMk){bgMk=s;const d=$('.bgmk.day'),n=$('.bgmk.night');if(d)d.style.backgroundImage=`url(bg/targ-${s}-dzien.webp)`;if(n)n.style.backgroundImage=`url(bg/targ-${s}-noc.webp)`}
  const h=hourF();let L=h>=5&&h<=20?Math.sin(Math.PI*(h-5)/15):0;L=Math.min(1,L*1.7);document.body.style.setProperty('--night',(1-L).toFixed(3))}
function render(){
  dirty=false; lastRender=performance.now();
  hudTick();
  const ready=S.plots.filter(isReady).length;
  const busy=hallBusy();
  const deliverable=S.orders.filter(canFull).length;
  const affordable=RES.filter(r=>resAvail(r[0])).length;
  $('#tabs').innerHTML=TABS.map(([k,n])=>{let b='';if(k==='pola'&&ready)b=ready;if(k==='prz'&&busy)b=busy;if(k==='targ'&&deliverable)b=deliverable;if(k==='ulep'&&affordable)b=affordable;
    return `<button data-act="tab" data-v="${k}" class="${S.tab===k?'on':''}" ${S.tab===k?'aria-current="page"':''}>${tabIcon(k)}<span>${n}</span>${b?`<span class="badge">${b}</span>`:''}</button>`}).join('');
  const g=GOALS[S.goal];
  document.querySelectorAll('.hud [data-v]').forEach(b=>b.classList.toggle('on',S.tab===b.dataset.v));
  const gm=goalMin();
  $('#goal').innerHTML=g?`<div class="goal ${gm?'min':''}"><span class="gico">${lico(ICO.sprout)}</span><button class="gl" data-act="goalmin" title="${gm?'Pokaż cel':'Zwiń'}">Cel ${S.goal+1} z ${GOALS.length}<span aria-hidden="true">${gm?'▴':'▾'}</span></button><span class="gt">${esc(g[0])}</span><span class="gr">${COIN}+${g[2]} zł</span></div>`:'';
  const sy=window.scrollY,keep=[...document.querySelectorAll('[data-keep]')].map(el=>[el.dataset.keep,el.scrollTop]);
  // zachowaj fokus klawiatury mimo przebudowy widoku
  const ae=document.activeElement, fk=ae&&ae.dataset&&ae.dataset.act&&$('#view').contains(ae)?'[data-act]'+Object.entries(ae.dataset).map(([k,v])=>`[data-${k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}="${CSS.escape(v)}"]`).join(''):null;
  document.body.dataset.tab=S.tab;bgMarket();document.documentElement.classList.toggle("nosb",S.tab==="prz");
  {const st=pantryStuck(),pb=$('#pausebar');if(pb){pb.hidden=!st;if(st)pb.innerHTML=`<b>Gra wstrzymana</b><span>W spiżarni zabrakło miejsca na nowe towary. Rozłóż je na półki albo wyrzuć do kosza.</span>${S.tab!=='spiz'?'<button class="btn sm pri" data-act="gospiz">Do spiżarni</button>':''}`}}
  $('#view').innerHTML=({pola:vPola,prz:vPrz,spiz:vSpiz,targ:vTarg,ulep:vUlep,ksiega:vKsiega,kron:vKron})[S.tab]();
  {const h2=$('#view').querySelector('.sechead h2');if(h2&&TABICO[S.tab])h2.insertAdjacentHTML('afterbegin',`<svg class="h2ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${TABICO[S.tab]}</svg>`)}
  if(fk){const el=$('#view').querySelector(fk);if(el)el.focus({preventScroll:true})}
  if(Math.abs(window.scrollY-sy)>2) window.scrollTo(0,sy);
  // przewijane okienka (szuflada spiżarni, Do rozłożenia) zostają tam, gdzie gracz je przewinął
  keep.forEach(([k,t])=>{const el=document.querySelector(`[data-keep="${k}"]`);if(el)el.scrollTop=t});
  if(sheetMode==='plot') drawSheet(); else if(sheetMode==='seeds') drawSeeds(); else if(sheetMode==='list') drawList(); else if(sheetMode==='mach') drawMach(); else if(BOOKM.includes(sheetMode)) bookDraw();
  progress();
}
function progress(){
  document.querySelectorAll('[data-pp]').forEach(el=>{const p=S.plots[+el.dataset.pp];if(p&&p.crop)el.style.width=Math.min(100,p.prog/p.need*100)+'%'});
  document.querySelectorAll('[data-pl]').forEach(el=>{const p=S.plots[+el.dataset.pl];if(!p||!p.crop)return;const r=plotRate(p);el.textContent=r>0?fmtT((p.need-p.prog)/r):'stoi (zima)'});
  const hjob=el=>{const [hi,key]=el.split(':'),c=S.halls[+hi]&&S.halls[+hi].cells[key];return c&&c.run[0]?[c,c.run[0]]:null};
  document.querySelectorAll('[data-hj]').forEach(el=>{const x=hjob(el.dataset.hj);if(x)el.style.width=Math.min(100,x[1].prog/jobT(x[1])*100)+'%'});
  document.querySelectorAll('[data-ht]').forEach(el=>{const x=hjob(el.dataset.ht);if(x)el.textContent=fmtT((jobT(x[1])-x[1].prog)/mSpeed(x[0].lvl))});
  document.querySelectorAll('[data-meta]').forEach(el=>{el.textContent=fmtT(mEta(el.dataset.meta))});
  document.querySelectorAll('[data-ot]').forEach(el=>{const o=S.orders[+el.dataset.ot];if(o)el.textContent=fmtT(o.exp-S.t)});
  document.querySelectorAll('[data-no]').forEach(el=>{el.textContent=S.nextOrd!=null?fmtT(S.nextOrd-S.t):'chwilę'});
  const yf=((S.t/DAY)%(SD*4))/(SD*4); document.querySelectorAll('[data-yr]').forEach(el=>el.style.left=(yf*100)+'%');
  document.querySelectorAll('[data-ts]').forEach(el=>{const s=toSeason(+el.dataset.ts);el.textContent=s?`${fmtG(s)} (${fmtT(s)})`:'trwa'});
}
function soilHtml(p){return `<span class="soil" title="Gleba ${p.soil}/${SOILMAX}${p.spr?', nawadnianie':''}">${Array.from({length:SOILMAX},(_,l)=>`<i class="${p.soil>l?'on':''}"></i>`).join('')}${p.spr?DROP:''}</span>`}
// kafelki składników: ile potrzeba i ile masz
function ingChips(obj,mult,check){return Object.entries(obj).map(([k,q])=>{const need=q*(mult||1),have=inv(k),lack=check&&have<need;
  return `<span class="ichip ${lack?'lack':''}">${icon(k)}<span class="it"><b>${need}×</b> ${esc(ITEMS[k].n)}${check?`<small>masz ${have}</small>`:'<small class="inm">w maszynie</small>'}</span></span>`}).join('')}
function outChips(obj,mult){return Object.entries(obj).map(([k,q])=>`<span class="ichip out ${ITEMS[k].kind==='by'?'by':''}">${icon(k)}<span class="it"><b>+${q*(mult||1)}</b> ${esc(ITEMS[k].n)}<small>masz ${inv(k)}</small></span></span>`).join('')}
const ARROW='<span class="arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
function ioTxt(obj){return Object.entries(obj).map(([k,q])=>`${q}× <em>${esc(ITEMS[k].n)}</em>`).join(' + ')}

function calendar(){
  const s=seasonN(), d=dayN();
  const segs=SEASONS.map((x,k)=>`<div class="seg s${k} ${k===s?'now':''}">${seaIcon(k)}<span class="st"><b>${x.n}</b><span>${k===3?'pole stoi':x.m===1?'normalnie':(x.m>1?'+':'−')+Math.round(Math.abs(x.m-1)*100)+'% wzrostu'}</span></span></div>`).join('');
  const fc=[S.wx,...S.fc].slice(0,4).map((w,k)=>`<div class="fcd ${k?'':'now'}">${wxIcon(w)}<span><b>${k===0?'Dziś':k===1?'Jutro':k===2?'Pojutrze':'Za 3 dni'}</b>${WEATHER[w].n}</span></div>`).join('');
  const next=(s+1)%4;
  return `<div class="cal"><div class="year"><div class="segs">${segs}</div><i class="mark" data-yr></i></div>
   <div class="calinfo"><span>${seaIcon(s)}${SEASONS[s].n}, dzień ${d%SD+1} z ${SD}. ${SEASONS[next].n} za <b class="num" data-ts="${next}"></b>.</span>${s!==3?`<span class="${s===2?'warn':''}">${seaIcon(3)}Zima za <b class="num" data-ts="3"></b>.</span>`:`<span class="warn">${seaIcon(0)}Na polu nie można siać. Wiosna za <b class="num" data-ts="0"></b>.</span>`}</div>
   <div class="fcs">${fc}</div>
   ${WEATHER[S.wx].d?`<p class="more">${WEATHER[S.wx].d}</p>`:''}</div>`;
}

function sowBar(){if(!sowSel)return '';const c=CR[sowSel],free=sowFree(sowSel),cost=seedCost(c);
  return `<div class="sowbar"><span class="sv">${cropThumb(c.id)}</span><div class="si"><b>Siejesz: ${esc(c.n)}</b><small>${cost} zł za poletko · ${free?`${free} ${plural(free,'wolne poletko pasuje','wolne poletka pasują','wolnych poletek pasuje')}. Kliknij je albo przeciągnij po nich myszą.`:'Nie ma wolnych pasujących poletek.'}</small></div>
    <div class="sbtns">${free>1&&!c.r?`<button class="btn sm pri" data-act="plantall" data-c="${c.id}" ${S.coins<cost?'disabled':''}>Na wszystkie wolne ×${free}</button>`:''}<button class="btn sm" data-act="sowpick">Zmień nasiona</button><button class="btn sm" data-act="sowend">Gotowe</button></div></div>`}
function vPola(){
  const ready=S.plots.filter(isReady).length, empty=S.plots.filter(p=>!p.crop).length;
  const canRe=S.plots.some(p=>!p.crop&&p.last&&CR[p.last]&&compatible(CR[p.last],p.env)&&!frozen(p)&&S.coins>=seedCost(CR[p.last]));
  let h=`<div class="sec"><div class="sechead"><h2>Poletka</h2></div>
  ${calendar()}
  <div class="toolbar"><button class="btn pri harv" data-act="harvestall" ${ready?'':'disabled'}>${lico(ICO.sickle)}Zbierz wszystko${ready?` (${ready})`:''}</button>
   <button class="btn ${sowSel?'on':''}" data-act="sowpick">${lico(ICO.bag)}Siew</button>
   <button class="btn" data-act="replant" ${canRe?'':'disabled'}>${lico(ICO.sprout)}Obsiej wolne tym, co rosło</button>
   <span class="sp">${lico(ICO.sprout)}${empty} ${plural(empty,'wolne','wolne','wolnych')} z ${S.plots.length}${working('parobek')?' · parobek zbiera':''}${working('siewca')?' · siewca sieje':''}</span></div>${sowBar()}<div class="plots ${sowSel?'sowing':''}">`;
  S.plots.forEach((p,i)=>{const fz=frozen(p);
    if(!p.crop){h+=`<button class="plot empty env-${p.env} ${fz?'winter':''} ${sowSel?(sowable(p,sowSel)?'sowok':'sowno'):''}" data-act="plot" data-i="${i}"><span class="ptop"><span class="tag">${ENV[p.env]}</span>${soilHtml(p)}</span><span class="art">${plotImg(p)}${fz?'<svg class="flake" viewBox="0 0 24 24" aria-hidden="true">'+WXI.mroz+'</svg>':'<span class="plus">+</span>'}</span><span class="pfoot"><span class="pn">${lico(ICO.sprout)}${fz?'Zima':'Wolne'}</span><span class="ps">${fz?'Siew dopiero wiosną':p.last?'Ostatnio: '+esc(CR[p.last].n):'Kliknij, by zasiać'}</span></span></button>`;return}
    const c=CR[p.crop],s=stage(p),rd=isReady(p);
    h+=`<button class="plot env-${p.env} ${rd?'ready':''} ${fz&&!rd?'winter':''}" data-act="plot" data-i="${i}" aria-label="${esc(c.n)}${rd?', gotowe do zbioru':''}">
      <span class="ptop"><span class="tag">${c.r?KIND[c.kind]:ENV[p.env]}</span>${soilHtml(p)}</span><span class="art">${plotImg(p)}</span>
      <span class="pfoot"><span class="pn">${lico(ICO.sprout)}${esc(c.n)}</span>
      <span class="ps">${rd?`<span>Zbierz ${plotYield(p)}×</span>`:`<span>${fz?'uśpione':p.h?'owocuje':'rośnie'}</span><span class="num" data-pl="${i}"></span>`}</span>
      <span class="pbar"><i data-pp="${i}" style="width:${Math.min(100,p.prog/p.need*100)}%"></i></span></span></button>`;});
  const pc=plotCost(); if(S.plots.length<24) h+=`<button class="plot buy" data-act="buyplot" ${S.coins<pc?'disabled':''}><span class="plus">+</span><strong>Nowe poletko</strong><span class="num price">${COIN}${fmtZ(pc)}</span><span class="more">${S.plots.length} z 24</span></button>`;
  return h+`</div></div>`;
}

// ---------- PRZETWÓRNIA: wspólne pomocnicze ----------
const RING_C=2*Math.PI*26;
function ring(pct,attr){return `<svg class="ring" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="26" class="rbg"/><circle cx="30" cy="30" r="26" class="rfg" ${attr||''} style="stroke-dasharray:${RING_C.toFixed(2)};stroke-dashoffset:${(RING_C*(1-pct)).toFixed(2)}"/></svg>`}
// slot przedmiotu jak w ekwipunku: ikona, w rogu ilość na partię, na dole zapas
function slot(id,{tag,count,cls,title}={}){return `<span class="slot ${cls||''}" title="${esc(title||ITEMS[id].n)}">${itemSvg(id)}${tag!=null?`<i class="tag">${tag}</i>`:''}${count!=null?`<b class="cnt">${count}</b>`:''}</span>`}
// ile mąki f wyjdzie z zapasów (pierwsza ścieżka z Księgi); pend: także z tego, co jest w maszynach i kolejkach
function canMake(f,pend){const v={...S.inv};
  if(pend)S.halls.forEach(h=>{for(const k in h.items)for(const i in h.items[k])v[i]=(v[i]||0)+h.items[k][i];
    for(const k in h.cells){const c=h.cells[k],o=(r,n)=>{for(const x in RECIPES[r].out)v[x]=(v[x]||0)+RECIPES[r].out[x]*n};c.q.forEach(q=>o(q.r,q.n));c.run.forEach(j=>o(j.r,1))}});
  for(const s of chainOf(f)){if(!s.r)continue;const r=s.r;let n=Infinity;for(const i in r.in)n=Math.min(n,Math.floor((v[i]||0)/r.in[i]));
    if(!n||n===Infinity)continue;for(const i in r.in)v[i]-=n*r.in[i];for(const o in r.out)v[o]=(v[o]||0)+n*r.out[o]}
  return Math.floor(v[f]||0)}
const POTICO='<svg class="bico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h11M11 7l5 5-5 5"/><path d="M19 5v14"/></svg>';
const potChipF=f=>{const n=canMake(f,true);return `<i class="fp ${n?'':'zero'}" title="${esc(ITEMS[f].n)}: łącznie ${n}, czyli worki w spiżarni (${inv(f)}) i wszystko, co z zapasów i maszyn da się jeszcze na nią przerobić">${itemSvg(f)}<b class="num">${n}</b></i>`};
const potChip=f=>{const n=Math.max(0,canMake(f,true)-inv(f));return `<span class="pot ${n?'':'zero'}" title="${esc(ITEMS[f].n)}: z zapasów w spiżarni i tego, co jest w maszynach, zrobisz jeszcze ${n} (gotowe worki: ${inv(f)})">${POTICO}<b class="num">${n}</b></span>`};
// uprawy w kolejności Księgi mąk: dział i kolejność pierwszej mąki, do której prowadzą
const BOOK_CROPS=(()=>{const out=[],seen=new Set();FLOURS.forEach(f=>{const c=chainOf(f).find(s=>s.crop);if(c&&!seen.has(c.crop.id)){seen.add(c.crop.id);out.push(c.crop)}});
  CROPS.forEach(c=>{if(!seen.has(c.id))out.push(c)});return out})();
const BOOK_GROUPS=CATS.slice(1).map((n,i)=>[n,BOOK_CROPS.filter(c=>(c.cat||6)===i+1)]).filter(x=>x[1].length);
function lineParts(f){const ch=chainOf(f);return {steps:ch.filter(s=>s.r),crop:ch.find(s=>s.crop)?.crop}}
// ---------- PRZETWÓRNIA: WIDOK HALI ----------
// Kolor mówi o roli kratki: zielony wejście i praca, pomarańczowy wyjście, złoty zaznaczenie i cel upuszczenia,
// czerwony problem, bursztynowe kreskowanie: leży coś, czego maszyna nie przerobi.
let hSel=null, hHover=null, hRot=0, carry=null, hDrag=null, pdOpen=false;
const hqty=()=>S.hq==null?5:S.hq;
const fmtQ=q=>q>=10000?Math.floor(q/1000)+' tys.':String(q);
// stos rośnie z ilością (plony): 1–9 jedna ikona, 10–99 trzy, 100–999 pięć, od 1000 kopiec
function pile(id,q){const n=ITEMS[id].kind==='raw'?(q<10?1:q<100?3:q<1000?5:7):1;
  return `<span class="pile p${n}">${Array.from({length:n},()=>`<img src="${iSrc(id)}" alt="" draggable="false">`).join('')}</span>`}
const stackHtml=(key,id,q,half)=>`<span class="hs ${half?'half':''}" draggable="true" data-hdrag="c:${key}:${id}" data-k="${key}" data-id="${id}" title="${esc(ITEMS[id].n)}: ${q}. Przeciągnij albo kliknij, żeby przenieść">${pile(id,q)}<b class="hq">${fmtQ(q)}</b></span>`;
function machHtml(h,key,c){const fd=feedable(h,key),q=c.q.reduce((a,b)=>a+b.n,0),sl=mSlots(c.lvl),work=c.run.length>0,ml=millerOf(h,key),auto=(c.auto&&c.lvl>=MLV_AUTO)||!!ml;
  const [x,y]=hxy(key),ik=hk(...inXY(c,x,y)),st=c.block?'block':work?'work':fd.n?'ready':fd.part?'part':sumQ(h.items[ik])?'nope':'idle';
  const j=c.run[0],t=j?(j.p?RECIPES[j.r].t*Math.max(.25,j.p/inQ(RECIPES[j.r])):RECIPES[j.r].t):1;
  return {st,html:`<div class="hm" draggable="true" data-hdrag="m:${key}" title="${esc(mTier(c.m,c.lvl))}${j?': '+esc(RECIPES[j.r].verb):''}">
    <span class="thr" style="--d:${c.dir*90}deg"><span class="tis">${Array.from({length:sl},(_,i)=>`<i class="${c.run[i]?'on':''}"></i>`).join('')}</span><i class="to"></i></span>
    <span class="mplate"><img src="${mSrc(c.m,work&&!c.block)}" alt="" draggable="false"></span>
    ${q?`<em class="bl q" title="Partie czekające w maszynie">${q}</em>`:auto?`<em class="bl a" title="${ml?'Młynarz dokłada towar i maszyna dobiera partie sama':'Tryb ciągły: maszyna sama dobiera partie z wejścia'}">∞</em>`:''}
    ${c.block?'<em class="br r" title="Wyjście jest poza halą albo stoi na nim maszyna">!</em>':st==='nope'?'<em class="br y" title="Przed maszyną leży coś, czego ona nie przerobi">?</em>':st==='part'?`<em class="br y" title="Za mało na pełną partię (${fd.part.have} z ${fd.part.need}). +1 przerobi to jako niepełną partię">${fd.part.have}</em>`:''}
    <b class="mn">${esc(M[c.m].n)}${c.lvl>1?` <small>${c.lvl}</small>`:''}</b>
    ${work&&!c.block?`<span class="mpr"><span class="mbar"><i data-hj="${S.hall}:${key}" style="width:${Math.min(100,j.prog/t*100)}%"></i></span><b class="num" data-ht="${S.hall}:${key}">${fmtT((t-j.prog)/mSpeed(c.lvl))}</b></span>`:`<span class="ms">${c.block?'wyjście zajęte':st==='nope'?'nie przerobi':st==='part'?`za mało: ${fd.part.have}/${fd.part.need}`:st==='ready'?'gotowa':ml?'młynarz':'czeka'}</span>`}
    ${auto?'':`<span class="hbtn"><button data-act="hfeed" data-k="${key}" data-q="1" ${fd.n||fd.part?'':'disabled'} ${!fd.n&&fd.part?`title="Niepełna partia: ${fd.part.have} z ${fd.part.need} szt."`:''}>+1</button><button data-act="hfeed" data-k="${key}" data-q="5" ${fd.n?'':'disabled'}>+5</button><button data-act="hfeed" data-k="${key}" data-q="max" ${fd.n?'':'disabled'} title="Włóż wszystko, co leży przed maszyną (${fd.n} ${plural(fd.n,'partia','partie','partii')})">max</button></span>`}
  </div>`}}
function vPrz(){const h=HL();if(hSel&&!h.cells[hSel]&&!h.items[hSel])hSel=null;const chain=chainSet(h,hSel);
  // role kratek: wejścia i wyjścia maszyn (kierunek do szewronów)
  const IN={},OUT={},BAD={},FULL={};
  for(const key in h.cells){const c=h.cells[key],[x,y]=hxy(key),i=hk(...inXY(c,x,y)),o=hk(...outXY(c,x,y));
    (IN[i]=IN[i]||[]).push(c.dir);(OUT[o]=OUT[o]||[]).push(c.dir);if(c.block)FULL[o]=1;if(!c.run.length&&!feedable(h,key).n&&sumQ(h.items[i]))BAD[i]=1}
  const allM=S.halls.reduce((a,x)=>a+Object.keys(x.cells).length,0),busy=hallBusy();
  let g='';
  for(let y=0;y<h.h;y++)for(let x=0;x<h.w;x++){const key=hk(x,y),c=h.cells[key],it=h.items[key],cls=['hc'];let inner='';
    if(IN[key])cls.push('in');if(OUT[key])cls.push('out');if(BAD[key])cls.push('nope');if(FULL[key])cls.push('full');
    if(hSel===key)cls.push('sel');if(chain.size)cls.push(chain.has(key)?'ch':'dim');
    (IN[key]||[]).forEach(d=>inner+=`<span class="chev ci" style="--d:${d*90}deg"></span>`);
    (OUT[key]||[]).forEach(d=>inner+=`<span class="chev co" style="--d:${d*90}deg"></span>`);
    if(c){const m=machHtml(h,key,c);cls.push('m','st-'+m.st);inner+=m.html}
    else if(it&&sumQ(it)){const ids=Object.keys(it);
      inner+=ids.length===1?`<span class="hitems">${stackHtml(key,ids[0],it[ids[0]])}<span class="hname">${esc(ITEMS[ids[0]].n)}</span></span>`
        :`<span class="hitems two">${ids.slice(0,2).map(i=>stackHtml(key,i,it[i],true)).join('')}${ids.length>2?`<em class="hmore">+${ids.length-2}</em>`:''}</span>`}
    g+=`<div class="${cls.join(' ')}" data-act="hcell" data-click="1" data-k="${key}">${inner}</div>`}
  const rc=rowCost(h);
  const add=h.h>=HALL_HMAX?`<div class="hrow max">Hala ma największy rozmiar</div>`:`<button class="hrow ${S.coins<rc?'poor':''}" data-act="hrow" ${S.coins<rc?'disabled':''}><span>+ Nowy rząd</span><b>${fmtZ(rc)}</b></button>`;
  const ml=S.millers.length?`<div class="hmills">${S.millers.map((m,k)=>{const at=m.at&&S.halls[m.at.h]&&S.halls[m.at.h].cells[m.at.key];
    return `<span class="hmill ${m.off?'off':at?'on':''}">${MILLER_ART}<span><b>Młynarz ${k+1}</b><small>${m.off?'ma wolne':at?`${esc(M[at.m].n)} · hala ${m.at.h+1}`:'wolny: prawy przycisk na maszynie'}</small></span><button class="btn sm" data-act="millerOff" data-k="${k}">${m.off?'Do pracy':'Wolne'}</button></span>`}).join('')}</div>`:'';
  const cr=carry?carryInfo():'';
  return `<div class="sec hallsec">${trayDock()}<div class="hallmain"><div class="sechead"><h2>Przetwórnia</h2>
    <div class="htabs">${S.halls.map((x,i)=>`<button class="htab ${i===S.hall?'on':''}" data-act="hall" data-i="${i}">Hala ${i+1} <small>${x.w}×${x.h}</small></button>`).join('')}<button class="htab add ${S.coins<hallCost()?'poor':''}" data-act="newhall">+ Nowa hala <b>${fmtZ(hallCost())}</b></button></div></div>
    <p class="more">${busy} z ${allM} ${plural(allM,'maszyny','maszyn','maszyn')} pracuje. Przeciągnij towar ze spiżarni (prawa krawędź) przed maszynę i włóż partie przyciskami +1, +5, max. Maszynę chwytasz i przeciągasz, <span class="kbd">R</span> obraca, prawy przycisk to opcje, podwójne kliknięcie to szczegóły. Shift i przeciąganie po kilku kratkach rozkłada towar po równo.</p>
    ${ml}${cr}
    <div class="hwrap"><div class="hboard ${chain.size?'chain':''}" style="--cols:${h.w}">${g}</div></div>${add}</div></div>
    ${magBar()}${pantryDrawer()}`}
function carryInfo(){const c=carry,n=c.k==='p'?Math.min(hqty()==='max'?inv(c.id):hqty(),inv(c.id)):c.k==='c'?(()=>{const have=(HL().items[c.key]||{})[c.id]||0;return Math.min(hqty()==='max'?have:hqty(),have)})():1;
  const what=c.k==='s'||c.k==='m'?`${mart(c.id||HL().cells[c.key].m)}<b>${esc(M[c.id||HL().cells[c.key].m].n)}</b>`:`${icon(c.id)}<b>${esc(ITEMS[c.id].n)} ×${n}</b>`;
  return `<div class="hcarry">${what}<span>${c.k==='s'?'Kliknij wolną kratkę, żeby postawić. R obraca.':c.k==='m'?'Kliknij wolną kratkę, żeby przenieść.':'Kliknij kratkę albo maszynę. Kliknięcie spiżarni odkłada towar z powrotem.'}</span><button class="btn sm" data-act="hcancel">Anuluj</button></div>`}
// magazyn: kupione, a jeszcze nie postawione maszyny
function magBar(){const grp=[];MACH.forEach(([id])=>{[...new Set(S.mag.filter(x=>x.m===id).map(x=>x.lvl))].sort((a,b)=>b-a).forEach(l=>grp.push([id,l]))});const ids=grp;
  return `<div class="magbar"><div class="mlbl"><b>Magazyn</b><small>${ids.length?'przeciągnij maszynę na halę':'pusty'}</small></div>${ids.length?ids.map(([id,l])=>`<button class="mtile ${carry&&carry.k==='s'&&carry.id===id&&carry.lvl===l?'on':''}" draggable="true" data-hdrag="s:${id}:${l}" data-act="spick" data-click="1" data-id="${id}" data-v="${l}" title="${esc(M[id].d)}">${mart(id)}<span>${esc(M[id].n)}${l>1?` · poz. ${l}`:''}</span><b>${mStock(id,l)}</b></button>`).join(''):`<span class="mempty">Kupione maszyny pojawią się tutaj. Kupisz je w <button class="lnk" data-act="tab" data-v="ulep">Sklepie</button>.</span>`}</div>`}
// „Do rozłożenia” na stałe po lewej stronie hali (nie przewija się z halą): tu trafiają świeże plony
function trayDock(){ensureShelfPos();const n=S.tray.filter(k=>k&&inv(k)>0).length,stuck=pantryStuck();
  return `<aside class="tdock ${stuck?'bad':''}" data-hback="1" data-keep="tdock" title="Do rozłożenia: świeże plony i towar bez miejsca na półce. Przeciągnij do hali albo z hali tutaj."><b class="tdl">Do rozłożenia <span class="num">${n}/${TRAY_N}</span></b>
    ${S.tray.map(k=>k&&inv(k)>0?`<span class="pd-s full" draggable="true" data-hdrag="p:${k}" data-id="${k}" title="${esc(ITEMS[k].n)}: ${inv(k)}">${itemSvg(k)}<b>${inv(k)}</b><small>${esc(ITEMS[k].n)}</small></span>`:'<span class="pd-s"></span>').join('')}<button class="pd-bin" data-hbin="1" data-act="hbin" data-click="1" title="Kosz: przeciągnij tu towar, żeby go wyrzucić">${TRASH}<span>Kosz</span></button></aside>`}
// szuflada spiżarni przy prawej krawędzi: te same półki co w zakładce Spiżarnia
function pantryDrawer(){ensureShelfPos();const q=hqty();
  const sl=k=>{if(!k||hold(k)<=0)return '<span class="pd-s"></span>';const n=inv(k);
    return n?`<span class="pd-s full" draggable="true" data-hdrag="p:${k}" data-id="${k}" title="${esc(ITEMS[k].n)}: ${n}">${itemSvg(k)}<b>${n}</b><small>${esc(ITEMS[k].n)}</small></span>`
      :`<span class="pd-s dim" title="${esc(ITEMS[k].n)}: wszystko na wystawie w sklepie">${itemSvg(k)}<b>0</b><small>${esc(ITEMS[k].n)}</small></span>`};
  const tray=S.tray.filter(k=>k&&inv(k)>0);
  return `<aside class="pdrawer ${S.pdPin?'open pinned':''}" data-pdrawer="1"><button class="pdh" data-act="pdtoggle" title="${S.pdPin?'Zamknij spiżarnię':'Otwórz spiżarnię'}">Spiżarnia${S.pdPin?' ✕':''}</button><div class="pan"><div class="pin" data-keep="pdrawer">
    <div class="pdtop"><b>Spiżarnia</b><span class="pdq">Przenoś: ${[1,5,'max'].map(v=>`<button class="${q===v?'on':''}" data-act="hq" data-v="${v}">${v}</button>`).join('')}</span></div>
    <p class="more">Przeciągnij towar do hali albo kliknij go, a potem kratkę. Prawy przycisk kładzie go od razu przed maszyną. Z hali odkładasz tu przeciągnięciem. Kosz jest pod „Do rozłożenia” obok hali.</p>
    ${shelfOrder().map(s=>`<div class="pd-sh"><span class="pd-l">${esc((S.shelfNames||[])[s]||`Półka ${s+1}`)}</span><div class="pd-g">${S.shelf.slice(s*SHELF_W,(s+1)*SHELF_W).map(sl).join('')}</div></div>`).join('')}
  </div></div></aside>`}
// upuszczenie towaru albo maszyny na kratkę hali
const dropQ=(e,have)=>{const q=e&&e.shiftKey?'max':e&&e.altKey?1:hqty();return Math.min(q==='max'?have:q,have)};
function hallDrop(key,src,e){const h=HL(),c=h.cells[key];let tk=key;
  if(src.k==='s'){if(c){toast('Tu już stoi maszyna.');return false}const ok=placeM(h,key,src.id,hRot,src.lvl);if(ok){hSel=key;if(mStock(src.id,src.lvl)<1&&carry)carry=null}return ok}
  if(src.k==='m'){const ok=moveM(h,src.key,key);if(ok){hSel=key;snd('click')}return ok}
  if(c){const [x,y]=hxy(key),[ix,iy]=inXY(c,x,y);if(!hin(h,ix,iy)||h.cells[hk(ix,iy)]){toast('Ta maszyna nie ma wolnej kratki wejścia.');return false}tk=hk(ix,iy)}
  if(src.k==='p'){const n=dropQ(e,inv(src.id));if(!n){toast('Tego już nie ma w spiżarni.');return false}add(src.id,-n);putH(h,tk,src.id,n);snd('drop_'+itemSnd(src.id));return true}
  if(src.k==='c'){if(src.key===tk)return false;const n=dropQ(e,(h.items[src.key]||{})[src.id]||0);if(!n)return false;takeH(h,src.key,src.id,n);putH(h,tk,src.id,n);snd('drop_'+itemSnd(src.id));return true}
  return false}
// kosz w szufladzie: wyrzuca towar ze spiżarni albo z hali (ilość jak przy przenoszeniu)
function hallTrash(src,e){const h=HL();let n=0;
  if(src.k==='p'){n=dropQ(e,inv(src.id));if(n)add(src.id,-n)}else if(src.k==='c'){n=dropQ(e,(h.items[src.key]||{})[src.id]||0);if(n)takeH(h,src.key,src.id,n)}
  if(n){feed('trash|'+src.id,itemSvg(src.id),-n,ITEMS[src.id].n,'Wyrzucone do kosza',false,'spend');snd('trash');placeItems()}}
function hallSpot(h,id){const io=new Set();for(const k in h.cells){const c=h.cells[k],[x,y]=hxy(k);io.add(hk(...inXY(c,x,y)));io.add(hk(...outXY(c,x,y)))}
  let same=null,free=null,any=null;
  for(let y=0;y<h.h;y++)for(let x=0;x<h.w;x++){const k=hk(x,y);if(h.cells[k])continue;const it=h.items[k];
    if(it&&it[id]&&Object.keys(it).length===1&&!io.has(k)){same=same||k;continue}if(sumQ(it))continue;if(!io.has(k))free=free||k;else any=any||k}
  return same||free||any}

function toHall(id,n){const h=HL(),k=hallSpot(h,id);if(!k){toast('W hali nie ma wolnego miejsca. Dokup rząd.');return 0}n=Math.min(n,inv(id));if(!n)return 0;
  add(id,-n);putH(h,k,id,n);snd('drop_'+itemSnd(id));toast(`${ITEMS[id].n} ×${n} w hali ${S.hall+1}`);return n}
function hallBack(src,e){const h=HL();if(src.k!=='c')return;const n=dropQ(e,(h.items[src.key]||{})[src.id]||0);if(!n)return;takeH(h,src.key,src.id,n);add(src.id,n);snd('drop_'+itemSnd(src.id))}
// ---------- MENU POD PRAWYM PRZYCISKIEM ----------
// Wspólny wygląd: nagłówek z obrazkiem tego, co kliknięto, potem grupy czynności; każda czynność ma ikonę.
const CI={up:'<path d="M12 19V6M6 11l6-6 6 6"/>',check:'<path d="M5 12.5l4.5 4.5L19 7"/>',rotate:'<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/>',
 collect:'<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',auto:'<path d="M7 9a3 3 0 1 0 0 6c2.5 0 7.5-6 10-6a3 3 0 1 1 0 6c-2.5 0-7.5-6-10-6z"/>',
 miller:'<path d="M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM5 20c1-4 4-6 7-6s6 2 7 6"/>',close:'<path d="M6 6l12 12M18 6L6 18"/>',
 stash:'<path d="M4 8l8-4 8 4v8l-8 4-8-4z"/><path d="M4 8l8 4 8-4M12 12v8"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>',
 book:'<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v14c-3-1-6-1-8 1-2-2-5-2-8-1z"/><path d="M12 6v14"/>',put:'<path d="M4 12h11M11 7l5 5-5 5"/><path d="M20 5v14"/>',
 hall:'<path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"/>',pick:'<circle cx="12" cy="12" r="3"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/>',
 trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',pin:'<path d="M12 16v5M8 3h8l-1 6 3 3H6l3-3z"/>',block:'<circle cx="12" cy="12" r="8"/><path d="M6.5 17.5l11-11"/>',
 tray:'<path d="M4 13l2-8h12l2 8M4 13v6h16v-6M4 13h5l1 2h4l1-2h5"/>',shelf:'<path d="M3 10h18M3 19h18M5 10V6h4v4M11 19v-5h3v5M15 10V5h4v5"/>',
 pencil:'<path d="M4 20l4-1L19 8l-3-3L5 16z"/><path d="M14 7l3 3"/>',soil:'<path d="M12 20v-8M12 12c0-4-3-6-7-6 0 4 3 6 7 6zM12 12c0-4 3-7 7-7 0 4-3 7-7 7"/>',
 water:'<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',house:'<path d="M4 11l8-7 8 7M6 10v10h12V10"/>',
 back:'<path d="M10 6l-6 6 6 6M4 12h16"/>',cog:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'};
const ci=n=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${CI[n]||''}</svg>`;
// head: {img|ic, t, s}; groups: tablice czynności {a, v, at, ic|img, t, s, dis, tone}; chips: rząd „Księga” z ikonami towarów
function ctxShow(head,groups,x,y,common,right){const m=$('#ctx');if(!m)return;
  const btn=o=>o.chips?`<div class="ctxchips"><span class="cl">${ci('book')}${o.t||'Księga'}</span>${o.chips.map(i=>`<button class="cchip" data-act="bitem" data-id="${i}" title="Księga: ${esc(ITEMS[i].n)}">${itemSvg(i)}</button>`).join('')}</div>`
    :`<button class="ctxi ${o.tone||''}" ${o.a?`data-act="${o.a}"`:''} ${common||''} ${o.v!=null?`data-v="${o.v}" data-id="${o.v}"`:''} ${o.at||''} ${o.dis?'disabled':''}><span class="ci ${o.img?'im':''}">${o.img||ci(o.ic)}</span><span class="ct"><b>${o.t}</b>${o.s?`<small>${o.s}</small>`:''}</span></button>`;
  m.innerHTML=`<div class="ctxh2"><span class="hi">${head.img||ci(head.ic)}</span><span class="ct"><b>${esc(head.t)}</b>${head.s?`<small>${head.s}</small>`:''}</span></div>`+groups.filter(g=>g&&g.length).map(g=>`<div class="ctxg">${g.map(btn).join('')}</div>`).join('');
  m.hidden=false;ctxOpen=true;const w=m.offsetWidth,hh=m.offsetHeight;
  m.style.left=Math.max(8,Math.min(right?x-w:x,innerWidth-w-8))+'px';m.style.top=Math.max(8,Math.min(y,innerHeight-hh-8))+'px'}
const bookItem=i=>ITEMS[i].kind==='raw'?{a:'bcrop',at:`data-c="${ITEMS[i].crop}"`,ic:'book',t:'Księga',s:CR[ITEMS[i].crop].n,tone:'book'}:{a:'bitem',at:`data-id="${i}"`,ic:'book',t:'Księga',s:ITEMS[i].n,tone:'book'};
// menu na kratce hali: maszyna albo leżący towar
function showHallCtx(key,x,y){const h=HL(),c=h.cells[key],it=h.items[key];
  if(c){const [cx,cy]=hxy(key),ok=hk(...outXY(c,cx,cy)),has=sumQ(h.items[ok])>0,ml=millerOf(h,key),qn=hqty(),up=mUpCost(c),work=[],put=[],more=[];
    work.push(c.lvl<MLVMAX?{a:'hup',ic:'up',t:`Ulepsz do poziomu ${c.lvl+1}`,s:`${upDesc(c.lvl+1)}${tierUp(c.m,c.lvl+1)} · ${fmtZ(up)}`,dis:S.coins<up,tone:'gold'}:{ic:'check',t:`Poziom ${MLVMAX}`,s:'maksymalny',dis:true});
    work.push({a:'hcollect',ic:'collect',t:'Odbierz produkt',s:has?`${sumQ(h.items[ok])} szt. do spiżarni`:'na wyjściu nic nie leży',dis:!has});
    work.push(c.lvl>=MLV_AUTO?{a:'hauto',ic:'auto',t:c.auto?'Wyłącz tryb ciągły':'Włącz tryb ciągły',s:'sama dobiera partie z wejścia'}:{ic:'auto',t:'Tryb ciągły',s:`od poziomu ${MLV_AUTO} maszyny`,dis:true});
    if(ml)work.push({a:'hmill',ic:'close',t:`Zabierz młynarza ${S.millers.indexOf(ml)+1}`});
    else S.millers.forEach((mm,k)=>{if(!mm.off)work.push({a:'hmill',v:k,ic:'miller',t:`Przydziel młynarza ${k+1}`,s:mm.at?'przejdzie od innej maszyny':'dokłada towar i odnosi produkt'})});
    Object.keys(S.inv).filter(i=>inv(i)>0&&(RBY[c.m]||[]).some(r=>r.in[i])).sort((a,b)=>inv(b)-inv(a)).slice(0,4).forEach(i=>put.push({a:'hput',v:i,img:itemSvg(i),t:`Połóż przed: ${esc(ITEMS[i].n)}`,s:`ze spiżarni ${qn==='max'?'wszystko':'×'+qn} · masz ${inv(i)}`}));
    more.push({a:'hrot',ic:'rotate',t:'Obróć',s:'klawisz R'},{a:'hinfo',ic:'cog',t:'Szczegóły i ulepszenia',s:'podwójne kliknięcie'},{a:'bmach',at:`data-m="${c.m}"`,ic:'book',t:'Księga',s:esc(M[c.m].n),tone:'book'});
    ctxShow({img:mart(c.m),t:mTier(c.m,c.lvl),s:`${mTier(c.m,c.lvl)!==M[c.m].n?esc(M[c.m].n)+' · ':''}poziom ${c.lvl} z ${MLVMAX}`},[work,put,more,[{a:'hstash',ic:'stash',t:'Odeślij do magazynu',s:'zwolni kratkę',tone:'danger'}]],x,y,`data-k="${key}"`)}
  else if(it&&sumQ(it)){const ids=Object.keys(it),more=[];
    if(ids.length>1)more.push({a:'hbackall',ic:'collect',t:'Wszystko do spiżarni',s:`${sumQ(it)} szt.`});
    more.push({chips:ids});
    ctxShow({ic:'hall',t:'Kratka hali',s:`${ids.length} ${plural(ids.length,'rodzaj','rodzaje','rodzajów')} towaru · ${sumQ(it)} szt.`},[ids.map(i=>({a:'hback1',v:i,img:itemSvg(i),t:esc(ITEMS[i].n),s:`${it[i]} szt. · odłóż do spiżarni`})),more],x,y,`data-k="${key}"`)}}
// menu na towarze w szufladzie spiżarni: połóż przed maszyną, która go przerabia, albo wskaż kratkę
function showPantryCtx(id,x,y){const h=HL(),qn=hqty(),put=[];
  for(const key in h.cells){const c=h.cells[key];if(!(RBY[c.m]||[]).some(r=>r.in[id]))continue;const [a,b]=hxy(key);put.push({a:'hput',v:id,at:`data-k="${key}"`,img:mart(c.m),t:`Połóż przed: ${esc(M[c.m].n)}`,s:`kratka ${a+1}, ${b+1}`})}
  ctxShow({img:itemSvg(id),t:ITEMS[id].n,s:`w spiżarni ${inv(id)} · przenosisz ${qn==='max'?'wszystko':qn}`},
    [put,[{a:'tohallp',v:id,ic:'hall',t:'Przenieś do hali',s:`${qn==='max'?'wszystko':qn+' szt.'} na wolne miejsce`},{a:'ppick',v:id,ic:'pick',t:'Wskaż kratkę w hali…',s:'kliknij potem kratkę albo maszynę'}],[bookItem(id)]],x,y,'',true)}
// ścieżka ulepszeń: wersje maszyny (skale urządzeń) i co daje każdy poziom; cur = obecny poziom egzemplarza
const upCostAt=(m,l)=>Math.round(Math.max(300,M[m].p)*0.8*Math.pow(1.7,l-2)/10)*10;
const lvDesc=l=>l===1?`${mSlots(1)} stanowisko · tempo ×${mSpeed(1).toFixed(1).replace('.',',')}`:l===MLV_AUTO?'tryb ciągły: maszyna sama dobiera partie z wejścia':`${upDesc(l)} · tempo ×${mSpeed(l).toFixed(1).replace('.',',')}`;
function upTree(m,cur,key){const t=MTIER[m]||[[1,M[m].n]];
  return `<div class="utree">${t.map(([a,n],j)=>{const b=j+1<t.length?t[j+1][0]-1:MLVMAX,st=cur==null?'':cur>b?'done':cur>=a?'now':'';
    let rows='';for(let l=a;l<=b;l++){const c=l>1?upCostAt(m,l):0,nx=cur!=null&&l===cur+1;
      rows+=`<li class="${cur!=null&&l<=cur?'u-done':''} ${l===cur?'u-cur':''} ${nx?'u-next':''} ${l===MLV_AUTO?'u-auto':''}"><i class="dot">${l}</i><span class="d">${lvDesc(l)}</span>${l>1?`<em class="num">${fmtZ(c)}</em>`:'<em>start</em>'}${nx&&key?`<button class="btn sm pri" data-act="hup" data-k="${key}" ${S.coins<c?'disabled':''}>Ulepsz</button>`:''}</li>`}
    const note=t[j][2];return `<section class="ut ${st}"><header>${mart(m,'',st==='now')}<span><b>${esc(n)}</b><small>${a===b?`poziom ${a}`:`poziomy ${a}–${b}`}${j?' · maszyna przeistacza się':''}${note?` · <em class="unote">${esc(note)}</em>`:''}</small></span>${st==='now'?'<span class="tag">teraz</span>':''}</header><ol>${rows}</ol></section>`}).join('<div class="ujoin">↓</div>')}</div>`}
// okno szczegółów maszyny: co robi teraz, sterowanie i ścieżka ulepszeń (bez listy wszystkich receptur)
let machKey=null;
function openMach(key){machKey=key;sheetMode='mach';sheetPlot=-1;drawMach();$('#sheet').hidden=false;$('#panel').scrollTop=0}
function drawMach(){const h=HL(),c=h.cells[machKey];if(!c){closeSheet();return}const panel=$('#panel'),sc=panel.scrollTop,[x,y]=hxy(machKey),ik=hk(...inXY(c,x,y)),ok=hk(...outXY(c,x,y)),fd=feedable(h,machKey),q=c.q.reduce((a,b)=>a+b.n,0),ml=millerOf(h,machKey);
  const list=key=>{const it=h.items[key]||{},ids=Object.keys(it);return ids.length?ids.map(i=>`<div class="mrow" data-act="bitem" data-id="${i}" data-click="1" title="Księga: ${esc(ITEMS[i].n)}">${icon(i)}<span>${esc(ITEMS[i].n)}</span><b class="num">${it[i]}</b></div>`).join(''):'<p class="more">pusto</p>'};
  // wybór receptury tylko wtedy, gdy to, co leży na wejściu, da się przerobić na kilka sposobów
  const inIt=h.items[ik]||{},alts=(RBY[c.m]||[]).filter(r=>Object.keys(r.in).every(i=>inIt[i]));
  const j=c.run[0],tn=mTier(c.m,c.lvl);
  panel.innerHTML=`<div class="ph"><div class="mph">${mart(c.m,'',c.run.length&&!c.block)}<div><h2>${esc(tn)}</h2><p>${tn!==M[c.m].n?esc(M[c.m].n)+' · ':''}poziom ${c.lvl} z ${MLVMAX} · ${mSlots(c.lvl)} ${plural(mSlots(c.lvl),'stanowisko','stanowiska','stanowisk')} · tempo ×${mSpeed(c.lvl).toFixed(2)}</p></div></div><span class="phb"><button class="btn sm" data-act="bmach" data-m="${c.m}">${ci('book')} Księga</button><button class="btn sm" data-act="close">Zamknij</button></span></div>
   <div class="mnow"><div class="mst ${c.block?'bad':c.run.length?'on':''}">${c.block?'Wyjście zajęte: produkt nie ma gdzie wyjść.':j?`Pracuje: <b>${esc(RECIPES[j.r].verb)}</b> · ${c.run.length} z ${mSlots(c.lvl)} ${plural(mSlots(c.lvl),'stanowiska','stanowisk','stanowisk')}${q?` · w kolejce ${q}`:''}`:fd.n?`Gotowa: przed nią leży towar na ${fd.n} ${plural(fd.n,'partię','partie','partii')}.`:fd.part?`Za mało na pełną partię: leży ${fd.part.have} z ${fd.part.need} szt. „+1” przerobi to jako niepełną partię (mniej produktu, krótszy czas).`:'Czeka na towar.'}${ml?` · pracuje tu Młynarz ${S.millers.indexOf(ml)+1}`:''}</div>
   <div class="mgrid2"><div><h3>Wejście</h3>${hin(h,...inXY(c,x,y))?list(ik):'<p class="more">poza halą</p>'}</div><div><h3>Wyjście</h3>${hin(h,...outXY(c,x,y))?list(ok):'<p class="more">poza halą</p>'}</div></div>
   ${alts.length>1||c.pin!=null?`<h3>Co robić z tym, co leży na wejściu</h3><div class="malts"><button class="mrec ${c.pin==null?'on':''}" data-act="hpin" data-k="${machKey}" data-v="${c.pin==null?-1:c.pin}">Sama wybiera</button>${alts.map(r=>{const lk=r.minL&&c.lvl<r.minL;return `<button class="mrec ${c.pin===r.id?'on':''}" data-act="hpin" data-k="${machKey}" data-v="${r.id}" ${lk?'disabled':''}>${esc(r.verb)}: ${Object.keys(r.out).filter(o=>ITEMS[o].kind!=='by').map(o=>esc(ITEMS[o].n)).join(', ')}${lk?` <small>od poz. ${r.minL} (${esc(mTier(c.m,r.minL))})</small>`:''}</button>`}).join('')}</div>`:''}
   <div class="mbtns"><button class="btn" data-act="hfeed" data-k="${machKey}" data-q="1" ${fd.n||fd.part?'':'disabled'}>${!fd.n&&fd.part?`+1 niepełna (${fd.part.have}/${fd.part.need})`:'+1'}</button><button class="btn" data-act="hfeed" data-k="${machKey}" data-q="5" ${fd.n?'':'disabled'}>+5</button><button class="btn" data-act="hfeed" data-k="${machKey}" data-q="max" ${fd.n?'':'disabled'}>max${fd.n?' ('+fd.n+')':''}</button>${q?`<button class="btn" data-act="hunq" data-k="${machKey}">Wyjmij kolejkę na wejście</button>`:''}</div>
   <div class="mbtns"><button class="btn" data-act="hrot" data-k="${machKey}">${ci('rotate')} Obróć</button><button class="btn" data-act="hcollect" data-k="${machKey}" ${sumQ(h.items[ok])?'':'disabled'}>${ci('collect')} Odbierz produkt</button>
     <label class="mtog ${c.lvl<MLV_AUTO?'off':''}"><input type="checkbox" data-act="hauto" data-k="${machKey}" ${c.auto&&c.lvl>=MLV_AUTO?'checked':''} ${c.lvl<MLV_AUTO?'disabled':''}> Tryb ciągły <small>${c.lvl<MLV_AUTO?`od poziomu ${MLV_AUTO}`:'sama dobiera partie'}</small></label>
     <button class="btn warn" data-act="hstash" data-k="${machKey}">${ci('stash')} Do magazynu</button></div></div>
   <h3 class="cph">Ścieżka ulepszeń</h3><p class="more">Każdy poziom przyspiesza maszynę. Na zaznaczonych progach maszyna przeistacza się w kolejne, większe urządzenie.</p>${upTree(c.m,c.lvl,machKey)}`;
  panel.scrollTop=sc}

const ioPlain=obj=>Object.entries(obj).map(([k,q])=>`${q}× ${ITEMS[k].n}`).join(' + ');

// ---------- SPIŻARNIA: PÓŁKI, MIEJSCA DO ROZŁOŻENIA I REGUŁY MIEJSC ----------
// Każdy rodzaj towaru zajmuje jedno miejsce. Nowe towary trafiają do „Do rozłożenia” (TRAY_N miejsc), a gracz
// rozkłada je na półki. Gdy coś się tam nie zmieści, gra stoi, aż gracz zrobi miejsce albo wyrzuci towar do kosza.
// Towar, którego ubyło do zera, znika z miejsca (chyba że miejsce jest przypięte do niego).
const SHELF_W=8, SHELF_START=4, SHELF_MAX=30, ROT_EVERY=120, GRID_W=16, TRAY_N=8;
const shelfCost=()=>Math.round(250*Math.pow(1.3,S.shelves-SHELF_START));
const ITEM_ORDER={};(()=>{let n=0;FLOURS.forEach(f=>{chainOf(f).forEach(s=>{const id=s.crop?s.crop.out:s.out;if(ITEM_ORDER[id]==null)ITEM_ORDER[id]=n++});if(ITEM_ORDER[f]==null)ITEM_ORDER[f]=n++});Object.keys(ITEMS).forEach(k=>{if(ITEM_ORDER[k]==null)ITEM_ORDER[k]=n++})})();
const byOrder=(a,b)=>ITEM_ORDER[a]-ITEM_ORDER[b];
// --- położenie półek na ścianie (zostaje z zapisu; nowe półki stają na pierwszym wolnym miejscu)
function shelfAt(x,y,skip){for(let s=0;s<S.shelves;s++){if(s===skip)continue;const p=S.shelfPos[s];if(p&&p.y===y&&x<p.x+SHELF_W&&p.x<x+SHELF_W)return s}return -1}
function freeSpot(){for(let y=0;y<200;y++)for(const x of [0,SHELF_W])if(shelfAt(x,y)<0)return {x,y};return {x:0,y:0}}
function ensureShelfPos(){S.shelfPos=S.shelfPos||[];for(let s=0;s<S.shelves;s++)if(!S.shelfPos[s]){S.shelfPos[s]=null;S.shelfPos[s]=freeSpot()}S.shelfPos.length=S.shelves;
  if(!Array.isArray(S.tray)) S.tray=Array(TRAY_N).fill(null); while(S.tray.length<TRAY_N) S.tray.push(null);}
const shelfOrder=()=>Array.from({length:S.shelves},(_,s)=>s).sort((a,b)=>S.shelfPos[a].y-S.shelfPos[b].y||S.shelfPos[a].x-S.shelfPos[b].x);
const slotOrder=()=>shelfOrder().flatMap(s=>Array.from({length:SHELF_W},(_,j)=>s*SHELF_W+j));
// --- reguły miejsc: 'pin' = zawsze ten towar, 'block' = zawsze puste
const rule=i=>S.slotRule[i];
// towar wystawiony w sklepie dalej ma swoje miejsce w spiżarni (z niebieskim licznikiem)
const shopQ=k=>{const x=S.shop.find(x=>x&&x.k===k);return x?x.q:0};
const hold=k=>inv(k)+shopQ(k);
function slotOpen(i){const r=rule(i);if(r==='block'||r==='pin')return false;const cur=S.shelf[i];return !(cur&&hold(cur)>0)}
function findSlot(){const ord=slotOrder();let i=ord.find(j=>!S.shelf[j]&&slotOpen(j));if(i==null)i=ord.find(j=>S.shelf[j]&&slotOpen(j));return i==null?-1:i}
const findTray=()=>{let j=S.tray.findIndex(x=>!x);if(j<0)j=S.tray.findIndex(x=>x&&!hold(x));return j};
const placed=()=>new Set([...S.shelf,...S.tray]);
function overflowItems(){const on=placed();return Object.keys(S.inv).filter(k=>inv(k)>0&&!on.has(k)).sort(byOrder)}
function placeItems(){ensureShelfPos();
  S.tray=S.tray.map(k=>k&&hold(k)>0?k:null);
  S.shelf=S.shelf.map((k,i)=>k&&(hold(k)>0||rule(i)==='pin')?k:null);
  const on=placed(),keys=new Set([...Object.keys(S.inv),...S.shop.filter(x=>x&&x.q>0).map(x=>x.k)]);
  for(const k of keys){if(hold(k)<=0||on.has(k))continue;
    const j=findTray(); if(j>=0){S.tray[j]=k;on.add(k);dirty=true}}}
// towar, który właśnie wrócił do spiżarni (np. z hali), najpierw trafia na swoje miejsce; dopiero to, co się nie zmieści, wstrzymuje grę
const pantryStuck=()=>{ensureShelfPos();placeItems();return overflowItems().length>0};
function trash(k){const q=inv(k);if(!q)return;S.inv[k]=0;delete S.rot[k];
  const i=S.shelf.indexOf(k);if(i>=0&&rule(i)!=='pin')S.shelf[i]=null;const j=S.tray.indexOf(k);if(j>=0)S.tray[j]=null;
  if(pSel===k){pSel=null;pMove=false}
  feed('trash|'+k,itemSvg(k),-q,ITEMS[k].n,'Wyrzucone do kosza',false,'spend');snd('trash');placeItems();dirty=true;save()}
let lastFloorWarn=0;
function spoilFloor(d){const on=placed();let any=false;
  for(const k of Object.keys(S.inv)){if(on.has(k)||S.inv[k]<=0){delete S.rot[k];continue}
    S.rot[k]=(S.rot[k]||0)+d; if(S.rot[k]>=ROT_EVERY){S.rot[k]=0;const loss=Math.max(1,Math.floor(inv(k)*0.05));add(k,-loss);any=true;
      feed('rot|'+k,itemSvg(k),-loss,ITEMS[k].n,'Zepsuło się, brak miejsca w spiżarni',false,'spend')}}
  if(any){dirty=true;const now=performance.now();if(now-lastFloorWarn>60000){lastFloorWarn=now;toast('W spiżarni brakuje miejsca i towary się psują. Dokup półkę albo wystaw nadmiar w sklepie.')}}}
// skąd jest towar: {where:'shelf'|'tray'|'out', i}
function locate(k){let i=S.shelf.indexOf(k);if(i>=0)return {where:'shelf',i};i=S.tray.indexOf(k);if(i>=0)return {where:'tray',i};return {where:'out',i:-1}}
function moveToShelf(k,to){const sh=S.shelf;if(to<0||to>=sh.length)return false;
  if(rule(to)==='block'){toast('To miejsce ma zostać puste.');return false}
  if(rule(to)==='pin'&&sh[to]!==k){toast(`To miejsce jest zawsze dla: ${ITEMS[sh[to]].n}.`);return false}
  const src=locate(k),other=sh[to]&&hold(sh[to])>0?sh[to]:null;
  if(src.where==='shelf'){if(src.i===to)return false;sh[to]=k;sh[src.i]=rule(src.i)==='pin'?null:other;if(rule(src.i)==='pin'){delete S.slotRule[src.i];S.slotRule[to]='pin'}}
  else if(src.where==='tray'){sh[to]=k;S.tray[src.i]=other}
  else sh[to]=k;
  snd('drop_'+itemSnd(k));dirty=true;return true}
function moveToTray(k,j){if(j==null||j<0){j=findTray();if(j<0){toast('Miejsce „Do rozłożenia” jest pełne.');return false}}
  const src=locate(k),other=S.tray[j]&&hold(S.tray[j])>0?S.tray[j]:null;
  if(src.where==='tray'){if(src.i===j)return false;S.tray[j]=k;S.tray[src.i]=other;snd('drop_'+itemSnd(k));dirty=true;return true}
  if(other){toast('To miejsce do rozłożenia jest zajęte.');return false}
  if(src.where==='shelf'){S.shelf[src.i]=null;if(rule(src.i)==='pin')delete S.slotRule[src.i]}
  S.tray[j]=k;snd('drop_'+itemSnd(k));dirty=true;return true}
function toShelf(k){const i=findSlot();if(i<0){toast('Na półkach nie ma wolnego miejsca.');return false}return moveToShelf(k,i)}
// --- interfejs
let pSel=null, pMove=false, dragKey=null, dragging=false, ptrDown=false, ctxOpen=false;
const PIN='<svg class="mark-pin" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 1h4l-.5 4 2.5 2.5V9H8.7L8 15l-.7-6H4V7.5L6.5 5z" fill="currentColor"/></svg>';
const TRASH='<svg class="trash" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>';
const BLOCK='<svg class="mark-block" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><path d="M6.5 17.5l11-11" stroke="currentColor" stroke-width="2"/></svg>';
// slot: na półce data-i, w „Do rozłożenia” data-t, poza miejscami data-o
function pslotHtml(k,attr,r){
  if(r==='block') return `<button class="pslot blocked" ${attr} data-click="1" title="Miejsce zawsze puste. Prawy przycisk: opcje">${BLOCK}</button>`;
  if(!k) return `<button class="pslot empty ${pMove?'target':''}" ${attr} data-click="1" title="Wolne miejsce. Prawy przycisk: opcje"></button>`;
  const q=inv(k),sq=shopQ(k),it=ITEMS[k],cls=[it.kind];
  if(!q&&!sq) cls.push('ghost'); if(pSel===k) cls.push('sel'); if(pMove&&pSel!==k) cls.push('target'); if(r==='pin') cls.push('pinned');
  return `<button class="pslot ${cls.join(' ')}" ${attr} data-click="1" draggable="true" data-dk="${k}" title="${esc(it.n)}: ${q} w spiżarni${sq?`, ${sq} na wystawie w sklepie`:''}${r==='pin'?' · zawsze tutaj':''}. Prawy przycisk: opcje">${itemSvg(k)}${q||!sq?`<b class="cnt">${q}</b>`:''}${sq?`<b class="shopq">${sq}</b>`:''}<span class="pn">${esc(it.n)}</span>${r==='pin'?PIN:''}</button>`;}
function vSpiz(){
  ensureShelfPos();
  const sh=S.shelf, over=overflowItems(), sc=shelfCost(), blocked=sh.filter((_,i)=>rule(i)==='block').length, used=sh.filter(k=>k&&hold(k)>0).length;
  const rows=Math.max(...Array.from({length:S.shelves},(_,s)=>S.shelfPos[s].y))+1;
  let h=`<div class="sec pantry"><div class="sechead"><h2>Spiżarnia</h2><button class="btn sm pri" data-act="buyshelf" ${S.coins<sc||S.shelves>=SHELF_MAX?'disabled':''}>Dokup półkę · ${fmtZ(sc)}</button></div>
   <div class="pstat"><span class="pill ${used>=sh.length-blocked?'bad':''}">Na półkach ${used} / ${sh.length-blocked}</span></div>`;
  if(pSel&&hold(pSel)>0){const k=pSel,q=inv(k),it=ITEMS[k],sup=it.kind==='supply',loc=locate(k),onShop=S.shop.find(x=>x&&x.k===k);
    h+=`<div class="pbar-sel">${slot(k,{count:q})}<div class="pst"><b>${esc(it.n)}</b><small>${sup?'zaopatrzenie':`w sklepie ${unitPrice(k)} zł / szt.`}${onShop?` · <span class="shopt">na wystawie ${onShop.q}</span>`:''}${S.hot===k?' · <span class="up">poszukiwana dziś</span>':''}${pMove?' · <b class="up">kliknij miejsce na półce albo w „Do rozłożenia”</b>':''}</small></div>
      <div class="pacts">${onShop?`<button class="btn sm" data-act="unlistk" data-k="${k}">Zdejmij z wystawy</button>`:''}${!sup&&q?`<button class="btn sm pri" data-act="list" data-k="${k}" data-n="all" title="Przenieś cały zapas na wystawę w sklepie">Wystaw w sklepie</button>${q>10?`<button class="btn sm" data-act="list" data-k="${k}" data-n="10">Wystaw 10</button>`:''}`:''}${canSkup(k)&&q?`<button class="btn sm" data-act="skup" data-k="${k}" data-n="${q}" title="Skup płaci od ręki, ale połowę ceny">Skup · ${fmtZ(skupPrice(k)*q)}</button>`:''}
       <button class="btn sm ${pMove?'on':''}" data-act="pmove">${pMove?'Anuluj':'Przenieś'}</button>${loc.where==='shelf'?`<button class="btn sm" data-act="ctxtray" data-k="${k}">Do rozłożenia</button>`:`<button class="btn sm" data-act="ctxshelf" data-k="${k}">Na półkę</button>`}<button class="btn sm warn" data-act="ptrash" data-k="${k}" title="Wyrzuć cały zapas (${q})">${TRASH} Do kosza</button><button class="btn sm" data-act="pdesel" aria-label="Zamknij">✕</button></div></div>`;}
  else {pSel=null;pMove=false}
  h+=`<p class="more">Kliknij towar, żeby wystawić go w sklepie albo przenieść, albo przeciągnij go myszą. Prawy przycisk na miejscu albo nazwie półki (na telefonie przytrzymanie) daje opcje i zmianę nazwy półki. <span class="shopt">Niebieska liczba</span> to towar wystawiony w sklepie.</p></div>
   <div class="wallwrap"><div class="wall" style="--rows:${rows}">${shelfOrder().map(s=>{const p=S.shelfPos[s];return `<div class="shelf" style="grid-column:${p.x+1}/span ${SHELF_W};grid-row:${p.y+1}"><span class="slabel" data-sh="${s}" title="Prawy przycisk: zmień nazwę">${esc((S.shelfNames||[])[s]||`Półka ${s+1}`)}</span><div class="slots8">${sh.slice(s*SHELF_W,(s+1)*SHELF_W).map((k,j)=>pslotHtml(k,`data-act="pslot" data-i="${s*SHELF_W+j}"`,rule(s*SHELF_W+j))).join('')}</div></div>`}).join('')}</div></div>
   <div class="tray ${over.length?'rot':''}"><div class="trayhead"><h3>Do rozłożenia <span class="more num">${S.tray.filter(k=>k&&hold(k)>0).length} / ${TRAY_N}</span></h3><p>${over.length?`<b class="bad">Gra wstrzymana.</b> Nie mieści się ${over.length} ${plural(over.length,'towar','towary','towarów')}. Rozłóż towary na półki, wystaw je w sklepie albo wyrzuć do kosza.`:'Tu trafia wszystko, co nowe. Przeciągnij towar na półkę albo do kosza.'}</p></div>
    <div class="traygrid">${S.tray.map((k,j)=>pslotHtml(k&&hold(k)>0?k:null,`data-act="pslot" data-t="${j}"`,null)).join('')}<button class="pslot bin ${pMove?'target':''}" data-act="pbin" data-bin="1" title="Kosz: przeciągnij tu towar, żeby go wyrzucić">${TRASH}<span class="pn">Kosz</span></button></div>
    ${over.length?`<div class="overrow"><span class="lbl">Nie mieści się · gra stoi</span><div class="traygrid">${over.map(k=>pslotHtml(k,`data-act="pslot" data-o="${k}"`,null)).join('')}</div></div>`:''}</div>`;
  return h;
}
// --- menu pod prawym przyciskiem
// menu poletka pod prawym przyciskiem: gleba, nawadnianie, przebudowa
let ctxAt=null;
function showPlotCtx(i,x,y){const p=S.plots[i];if(!p)return;ctxAt={plot:i,x,y};
  const sc=soilCost(p),at=`data-i="${i}"`,care=[],build=[];
  care.push(p.soil<SOILMAX?{a:'psoil',at,dis:S.coins<sc,ic:'soil',t:`Użyźnij glebę: ${p.soil} → ${p.soil+1}`,s:`+20% plonu · ${fmtZ(sc)}`,tone:'gold'}:{ic:'check',t:'Gleba na maksimum',s:`${SOILMAX} / ${SOILMAX}`,dis:true});
  care.push(p.spr?{ic:'check',t:'Nawadnianie działa',s:'+20% tempa, chroni przed upałem',dis:true}:{a:'pspr',at,dis:S.coins<SPRCOST,ic:'water',t:'Zamontuj nawadnianie',s:`+20% tempa · ${fmtZ(SPRCOST)}`});
  Object.keys(ENV).filter(e=>e!==p.env).forEach(e=>{const lk=S.lvl<ENVREQ[e];
    build.push({a:'penv',at:`${at} data-e="${e}"`,dis:!!p.crop||lk||S.coins<ENVCOST[e],ic:'house',t:`Przebuduj na: ${ENV[e].toLowerCase()}`,s:p.crop?'najpierw zbierz albo usuń roślinę':lk?`od poziomu ${ENVREQ[e]}`:ENVCOST[e]?fmtZ(ENVCOST[e]):'za darmo'})});
  ctxShow({img:p.crop?cropThumb(p.crop):ci('soil'),t:`Poletko ${i+1}${p.crop?' · '+CR[p.crop].n:''}`,s:`${ENV[p.env]} · gleba ${p.soil}/${SOILMAX}`},
    [care,build,p.crop?[{a:'bcrop',at:`data-c="${p.crop}"`,ic:'book',t:'Księga',s:esc(CR[p.crop].n),tone:'book'}]:[]],x,y)}
const replot=()=>{render();if(ctxAt&&ctxAt.plot!=null)showPlotCtx(ctxAt.plot,ctxAt.x,ctxAt.y)};
function hideCtx(){ctxAt=null;const m=$('#ctx');if(m)m.hidden=true;ctxOpen=false}
function showCtx(el,x,y){let head=null;const mv=[],rl=[],sh=[],bad=[];
  const k=el.dataset.i!=null?S.shelf[+el.dataset.i]:el.dataset.dk;
  if(el.dataset.i!=null){const i=+el.dataset.i,r=rule(i),s=Math.floor(i/SHELF_W),q=k?hold(k):0;
    head={img:k?itemSvg(k):ci(r==='block'?'block':'shelf'),t:r==='block'?'Miejsce zawsze puste':k?ITEMS[k].n:'Puste miejsce',s:`${esc((S.shelfNames||[])[s]||`Półka ${s+1}`)}${k?` · ${inv(k)} szt.`:''}`};
    if(k&&r!=='pin') rl.push({a:'ctxpin',at:`data-i="${i}"`,ic:'pin',t:'Zawsze tutaj',s:'To miejsce zostaje dla tego towaru'});
    if(r!=='block') rl.push({a:'ctxblock',at:`data-i="${i}"`,ic:'block',t:'Zawsze puste',s:'Nic tu nie trafi'});
    if(r) rl.push({a:'ctxclear',at:`data-i="${i}"`,ic:'close',t:'Usuń regułę',s:r==='pin'?'Zdejmij przypięcie':'Zdejmij blokadę'});
    if(k&&q) mv.push({a:'ctxtray',at:`data-k="${k}"`,ic:'tray',t:'Odłóż do rozłożenia'});
    sh.push({a:'ctxname',at:`data-s="${s}"`,ic:'pencil',t:'Zmień nazwę półki',s:esc((S.shelfNames||[])[s]||`Półka ${s+1}`)})}
  else if(el.dataset.sh!=null){const s=+el.dataset.sh;head={ic:'shelf',t:(S.shelfNames||[])[s]||`Półka ${s+1}`,s:'półka w spiżarni'};sh.push({a:'ctxname',at:`data-s="${s}"`,ic:'pencil',t:'Zmień nazwę półki'})}
  else {if(!k){hideCtx();return}head={img:itemSvg(k),t:ITEMS[k].n,s:`${inv(k)} szt.`};
    mv.push({a:'ctxshelf',at:`data-k="${k}"`,ic:'shelf',t:'Odłóż na półkę',s:'na pierwsze wolne miejsce'});
    if(el.dataset.o!=null) mv.push({a:'ctxtray',at:`data-k="${k}"`,ic:'tray',t:'Do rozłożenia'})}
  if(k&&inv(k)>0){const qn=hqty();mv.unshift({a:'tohall',at:`data-k="${k}" data-q="${qn}"`,ic:'hall',t:'Przenieś do hali',s:`${qn==='max'?'wszystko':qn+' szt.'} na wolne miejsce w hali ${S.hall+1}`},{a:'tohall',at:`data-k="${k}" data-q="max"`,ic:'put',t:'Przenieś wszystko do hali',s:`${inv(k)} szt.`});
    bad.push({a:'ptrash',at:`data-k="${k}"`,ic:'trash',t:'Wyrzuć do kosza',s:`cały zapas: ${inv(k)}`,tone:'danger'})}
  if(!mv.length&&!rl.length&&!sh.length){hideCtx();return}
  ctxShow(head,[mv,rl,sh,k?[bookItem(k)]:[],bad],x,y)}

let declineArm=-1, listQ='all';
function vTarg(){padShop();
  const L=popL(),need=popNeed(L),P=S.pop,full=L>=POP_MAX,cr=custRate(),os=orderSlots();
  const perks=[['Klient',cr?`co ~${fmtT(1/cr)}`:'pusta wystawa'],['Kupuje',`1–${custMaxQ()} szt.`],['Zamówienia',L<2?'od renomy 2':`do ${os} naraz`],['Rodzaje mąk',`do ${orderTypes(L)}`],['Premia',`+${Math.round((orderMul(L)-1)*100)}%`]];
  let h=`<div class="sec"><div class="fame"><div class="fbadge">${STAR}<b class="num">${L}</b></div>
   <div class="fbody"><span class="gl">Renoma młyna</span><b class="fname">${POP_NAMES[L-1]}</b>
    <span class="track"><i style="width:${full?100:Math.min(100,P.p/need*100)}%"></i></span>
    <small class="more">${full?'Najwyższa renoma w kraju.':`${Math.floor(P.p)} / ${need} · dalej: ${esc(popPerk(L+1))}`}</small></div>
   <dl class="fperks">${perks.map(([a,b])=>`<div><dt>${a}</dt><dd>${b}</dd></div>`).join('')}</dl></div>
   <p class="more fhint">Renomy przybywa za klientów w sklepie (najwyżej ${Math.round(shopCap()*popUnit(L))} dziennie) i za wykonane zamówienia. Zamówienie bez nowości, odrzucone albo przeterminowane trochę jej odbiera.</p></div>`;
  // sklep
  const used=S.shop.filter(Boolean).length;
  h+=`<div class="sec"><div class="sechead"><h2>Sklep <span class="more num">${used} / ${S.shop.length}</span></h2><p>Wystaw towar, a klienci sami go kupią. Częściej zaglądają, gdy na wystawie jest więcej rodzajów.</p></div>
   ${S.hot?`<div class="hot">${icon(S.hot)}<div><span class="more">Dziś wszyscy pytają o</span> <b>${esc(ITEMS[S.hot].n)}</b><p>Na wystawie schodzi 2,5× częściej i o 40% drożej, do końca dnia. Masz ${inv(S.hot)}.</p></div></div>`:''}<div class="stall">`;
  S.shop.forEach((x,i)=>{
    if(!x){h+=`<button class="ware add" data-act="listopen" data-s="${i}"><span class="plus">+</span>Wystaw towar</button>`;return}
    const it=ITEMS[x.k],pin=inv(x.k);
    h+=`<div class="ware ${x.q?'':'out'}"><div class="wtop">${slot(x.k,{count:x.q})}<div class="wn"><b>${esc(it.n)}</b><small><span class="num">${shopPrice(x.k,x.pm)} zł</span> / szt.${S.hot===x.k?' · <span class="up">dziś ×1,4</span>':''}</small><small>${x.q?'':'<span class="down">wyprzedane</span> · '}w spiżarni ${pin}</small></div>
      <button class="wx" data-act="unlist" data-s="${i}" title="Zdejmij z wystawy (towar wraca do spiżarni)" aria-label="Zdejmij">✕</button></div>
     <div class="seg-switch pms">${PM.map((p,j)=>`<button data-act="pm" data-s="${i}" data-v="${j}" class="${x.pm===j?'on':''}" title="${j===0?'Klienci kupują częściej':j===2?'Klienci kupują rzadziej':'Zwykła cena'}">${p.n}</button>`).join('')}</div>
     <div class="wbtn"><button class="btn sm" data-act="restock" data-s="${i}" data-n="10" ${pin?'':'disabled'}>+10</button><button class="btn sm" data-act="restock" data-s="${i}" data-n="${pin}" ${pin?'':'disabled'}>+ wszystko (${pin})</button></div></div>`});
  const nextL=res('lada')<resDef('lada')[3];
  if(nextL) h+=`<button class="ware lock" data-act="tab" data-v="ulep"><span class="plus">${LOCK}</span>Więcej miejsca: Lada sklepowa w Sklepie</button>`;
  h+=`</div>${SALES.length?`<div class="sales"><span class="gl">Ostatnio</span>${SALES.map(s=>`<span class="sale">${icon(s.k)}<b>${s.q}×</b> ${fmtZ(s.v)}</span>`).join('')}</div>`:''}</div>`;
  // zamówienia
  h+=`<div class="sec"><div class="sechead"><h2>Zamówienia <span class="more num">${S.orders.length} / ${os}</span></h2><p>Duże zamówienia na mąki, które już robisz. Pozycje oznaczone jako nowość możesz pominąć: zapłacą mniej i trochę spadnie renoma.</p></div>`;
  if(L<2) h+=`<p class="empty-note">Zamówienia przyjdą, gdy młyn zdobędzie renomę 2 („${POP_NAMES[1]}”). Wystaw mąkę w sklepie, a zadowoleni klienci rozniosą wieść.</p>`;
  else if(!nMade()) h+=`<p class="empty-note">Odbiorcy czekają, aż zmielisz pierwszą mąkę.</p>`;
  else {h+=`<div class="orders">`;
    S.orders.forEach((o,i)=>{const fu=canFull(o),co=canCore(o),ex=hasExtra(o);
      h+=`<div class="order ${fu?'can':co?'part':''}"><div class="oh"><span class="who">${esc(o.who)}</span><span class="ono">nr ${o.no}</span>
        <button class="ox ${declineArm===i?'arm':''}" data-act="decline" data-i="${i}" title="Odrzuć zamówienie (trochę renomy)">${declineArm===i?'Odrzucić?':'✕'}</button></div>
      ${o.lines.map(x=>`<div class="what ${x.x?'extra':''}">${icon(x.f)}<span>${x.q}× ${esc(ITEMS[x.f].n)}${x.x?'<em class="nov">nowość · można pominąć</em>':''}</span><span class="have ${inv(x.f)>=x.q?'ok':''}">${inv(x.f)}/${x.q}</span></div>`).join('')}
      <div class="ometa"><span>+${Math.round(o.w*popUnit(L))} renomy · +${o.xp} PD</span><span>Ważne <b class="num" data-ot="${i}"></b></span></div>
      <div class="ft"><span class="pay">${fmtZ(o.pay)}</span><button class="btn ${fu?'pri':''} sm" data-act="deliver" data-i="${i}" ${fu?'':'disabled'}>Dostarcz</button></div>
      ${ex?`<div class="ft2"><button class="btn sm" data-act="deliver" data-i="${i}" data-m="core" ${co?'':'disabled'}>Bez nowości · ${fmtZ(o.core)}</button><small class="down">−renoma</small></div>`:''}</div>`});
    if(S.orders.length<os) h+=`<div class="order wait"><span class="more">Następne zamówienie za</span><b class="num" data-no></b></div>`;
    h+=`</div>`}
  h+=`</div><div class="sec"><div class="sechead"><h2>Zaopatrzenie</h2></div><div class="shop">
    <div class="item"><div class="ih">${icon('wapno')}<h3>Wapno spożywcze</h3></div><p>Wodorotlenek wapnia do nikstamalizacji kukurydzy na Masa Harina. Masz ${inv('wapno')}.</p><div class="ft"><span class="num">5 szt. · 15 zł</span><button class="btn sm" data-act="wapno" ${S.coins<15?'disabled':''}>Kup</button></div></div>
  </div></div>`;
  return h;
}
// arkusz: co wystawić w sklepie
function openList(s){sheetMode='list';sheetPlot=s;drawList();$('#sheet').hidden=false;$('#panel').scrollTop=0}
function drawList(){const s=sheetPlot,ids=Object.keys(S.inv).filter(k=>inv(k)>0&&ITEMS[k].kind!=='supply').sort(byOrder);
  const grp=[['flour','Mąki'],['mid','Półprodukty'],['raw','Plony'],['by','Produkty uboczne']];
  let h=`<div class="ph"><div><h2>Co wystawić?</h2><p>Towar przechodzi ze spiżarni na wystawę. Zdjęty wraca do spiżarni.</p></div><button class="btn sm" data-act="close">Zamknij</button></div>
   <div class="lqrow"><span class="more">Ile wystawić:</span><div class="seg-switch">${[['10','10'],['25','25'],['50','50'],['all','Wszystko']].map(([v,n])=>`<button data-act="listq" data-v="${v}" class="${listQ===v?'on':''}">${n}</button>`).join('')}</div></div>`;
  if(!ids.length) h+=`<p class="empty-note">Spiżarnia jest pusta.</p>`;
  grp.forEach(([k,n])=>{const g=ids.filter(i=>ITEMS[i].kind===k);if(!g.length)return;
    h+=`<div class="grp">${n}</div><div class="lgrid">${g.map(i=>`<button class="lpick" data-act="listk" data-k="${i}">${slot(i,{count:inv(i)})}<span><b>${esc(ITEMS[i].n)}</b><small>${shopPrice(i,1)} zł / szt.${S.shop.some(x=>x&&x.k===i)?' · już na wystawie':''}</small></span></button>`).join('')}</div>`});
  $('#panel').innerHTML=h;}

function lvdots(l,mx){return `<span class="lvdots ${mx>10?'dense':''}">${Array.from({length:mx},(_,k)=>`<i class="${k<l?'on':''}"></i>`).join('')}</span>`}
function vUlep(){
  let h=`<div class="sec"><div class="sechead"><h2>Pracownicy</h2><p>Zatrudnieni raz pracują na stałe. Każdego możesz wysłać na wolne i z powrotem wezwać do pracy.</p></div><div class="shop">`;
  WORK.forEach(([id,n,d,c,lv])=>{const has=S.work[id],on=working(id);
    h+=`<div class="item ${has?'has':''}"><div class="ih">${person(id)}<h3>${n}</h3></div><p>${d}</p><div class="ft">${has?`<span class="owned">${on?'Pracuje':'Ma wolne'}</span><button class="btn sm ${on?'':'ok'}" data-act="toggleW" data-w="${id}">${on?'Daj wolne':'Wezwij do pracy'}</button>`
      :S.lvl<lv?`<span class="req">Od poziomu ${lv}</span><span class="num">${fmtZ(c)}</span>`:`<span class="num">${fmtZ(c)}</span><button class="btn sm pri" data-act="hire" data-w="${id}" ${S.coins<c?'disabled':''}>Zatrudnij</button>`}</div></div>`});
  const mk=S.millers.length, mc=millerCost(mk), mr=millerReq(mk);
  h+=`<div class="item ${mk?'has':''}"><div class="ih">${MILLER_ART}<h3>Młynarze</h3><span style="margin-left:auto">${lvdots(mk,MILLER_MAX)}</span></div><p>Młynarza przydzielasz do maszyny w Przetwórni (prawy przycisk na maszynie). Dokłada jej towar ze spiżarni, maszyna sama dobiera partie, a to, co wyjdzie na końcu łańcucha, młynarz odnosi do spiżarni.</p>
    <div class="ft">${mk>=MILLER_MAX?'<span class="owned">Komplet</span>':S.lvl<mr?`<span class="req">${mk?'Kolejny':'Pierwszy'} od poziomu ${mr}</span><span class="num">${fmtZ(mc)}</span>`:`<span class="num">${fmtZ(mc)}</span><button class="btn sm pri" data-act="hireMiller" ${S.coins<mc?'disabled':''}>Zatrudnij ${mk?'kolejnego':''}</button>`}</div></div>`;
  h+=`</div></div><div class="sec"><div class="sechead"><h2>Usprawnienia</h2><p>Działają na całe gospodarstwo. Każdy kolejny stopień kosztuje więcej i wymaga wyższego poziomu gospodarza.</p></div><div class="shop">`;
  RES.forEach(([id,n,d,mx])=>{const l=res(id),c=resCost(id),rq=resReq(id);
    h+=`<div class="item ${l>=mx?'has':''}"><div class="ih"><h3>${n}</h3><span class="more num" style="margin-left:auto">${l}/${mx}</span></div>${lvdots(l,mx)}<p>${d}</p>
    <div class="ft">${l>=mx?'<span class="owned">Ukończone</span>':S.lvl<rq?`<span class="req">Następny stopień od poziomu ${rq}</span><span class="num">${fmtZ(c)}</span>`:`<span class="num">${fmtZ(c)}</span><button class="btn sm pri" data-act="research" data-r="${id}" ${S.coins<c?'disabled':''}>Wdroż stopień ${l+1}</button>`}</div></div>`});
  h+=`</div></div><div class="sec"><div class="sechead"><h2>Maszyny</h2><p>Kupiona maszyna czeka w magazynie w Przetwórni, skąd stawiasz ją w hali. Każdą możesz mieć w kilku egzemplarzach. Ulepszasz je w Przetwórni (prawy przycisk na maszynie), każdy egzemplarz osobno: +20% tempa na poziom, drugie stanowisko od poziomu 4, trzecie od 8, a poziom 11 odblokowuje tryb ciągły.</p></div><div class="shop">`;
  MACH.forEach(([id])=>{const mm=M[id],m=S.m[id],lk=S.lvl<mm.lv,n=mCount(id),bc=mBuyCost(id);
    h+=`<div class="item ${n?'has':''}"><div class="ih">${mart(id)}<div><h3>${mm.n}${n?` <span class="more num">×${n}</span>`:''}</h3>${n?`<small class="more">w halach ${mPlaced(id)} · w magazynie ${mStock(id)}</small>`:''}</div></div><p>${mm.d}</p>${(MTIER[id]||[]).length>1?`<p class="more tiers">Ulepszana staje się: ${MTIER[id].map(([l,n])=>l>1?`${n} (poz. ${l})`:n).join(' → ')}</p>`:''}
    <div class="ft">${lk?`<span class="req">Od poziomu ${mm.lv}</span><span class="num">${fmtZ(bc)}</span>`:`<span class="num">${fmtZ(bc)}</span><button class="btn sm ${n?'':'pri'}" data-act="buym" data-m="${id}" ${S.coins<bc?'disabled':''}>${n?'Kup kolejną':'Kup'}</button>`}</div>
    </div>`});
  const pc=plotCost();
  h+=`</div></div><div class="sec"><div class="sechead"><h2>Ziemia</h2></div><div class="shop">
    <div class="item"><h3>Nowe poletko</h3><p>Masz ${S.plots.length} z 24 poletek. Każde kolejne jest droższe.</p><div class="ft"><span class="num">${fmtZ(pc)}</span><button class="btn sm" data-act="buyplot" ${S.coins<pc||S.plots.length>=24?'disabled':''}>Kup</button></div></div>
    <div class="item"><h3>Półka w spiżarni</h3><p>Masz ${S.shelves} z ${SHELF_MAX} półek, czyli ${S.shelves*SHELF_W} miejsc na rodzaje towarów. Bez miejsca towar leży na podłodze i się psuje.</p><div class="ft"><span class="num">${fmtZ(shelfCost())}</span><button class="btn sm" data-act="buyshelf" ${S.coins<shelfCost()||S.shelves>=SHELF_MAX?'disabled':''}>Kup</button></div></div>
    <div class="item"><h3>Gleba, nawadnianie, szklarnie</h3><p>Kliknij prawym przyciskiem poletko w zakładce Pola (na telefonie przytrzymaj). Gleba ma ${SOILMAX} poziomów, każdy daje +20% plonu. Nawadnianie (${fmtZ(SPRCOST)}) przyspiesza wzrost o 20% i chroni przed upałem. Szklarnia: ${fmtZ(ENVCOST.szklarnia)} od poziomu ${ENVREQ.szklarnia}. Pole ryżowe: ${fmtZ(ENVCOST.mokre)} od poziomu ${ENVREQ.mokre}.</p></div>
  </div></div>`;
  return h;
}

// ---------- KSIĘGA: karty upraw, drzewo pokrewieństwa zbóż glutenowych ----------
// Księga pokazuje uprawy, a nie procesy. Kliknięcie uprawy otwiera jej kartę ze wszystkim, co z niej powstaje,
// pogrupowanym według rodzaju (dziś mąki i produkty uboczne, później kolejne rodzaje), więc lista może rosnąć.
const GCOL={A:'#e8a848',B:'#e5735c',D:'#6f9fe6',G:'#7cbc62',R:'#c48ed6',H:'#4cbcac',Hch:'#4cbcac'};
const genTok=s=>s.match(/Hch|[A-Z]/g)||[];
const genHtml=s=>genTok(s).map(t=>`<b style="color:${GCOL[t]}">${t==='Hch'?'H<sup>ch</sup>':t}</b>`).join('');
const PKIND=[['flour','Mąki i semoliny'],['prod','Gotowe produkty'],['by','Produkty uboczne i odpady']];
const madeN=i=>ITEMS[i].kind==='flour'?S.made[i]||0:(S.mp||{})[i]||0;
function cropProducts(c){const seen=new Set(),out=[];(function w(id){if(seen.has(id))return;seen.add(id);const k=ITEMS[id].kind;if(id!==c.out&&(k==='flour'||k==='prod'||k==='by'))out.push(id);(FWD[id]||[]).forEach(w)})(c.out);return out}
const CPROD={};const cropMain=c=>CPROD[c.id]||(CPROD[c.id]=cropProducts(c).filter(i=>ITEMS[i].kind!=='by'));
const cropCard=c=>{const lk=!unlocked(c),fl=cropMain(c),mn=fl.filter(f=>madeN(f)).length,gi=CINFO[c.id]||{};
  return `<button class="cc ${lk?'lk':''} ${mn?'made':''}" data-act="bcrop" data-c="${c.id}" data-click="1" title="${esc(c.n)}: kliknij, żeby zobaczyć, co z niej powstaje"><span class="cv">${cropThumb(c.id)}</span><span class="ct"><b>${esc(c.n)}</b><i>${esc(c.lat)}</i></span>${gi.g?`<span class="gen">${genHtml(gi.g)}</span>`:''}<span class="cp">${fl.map(f=>`<i class="${madeN(f)?'on':''}" title="${esc(ITEMS[f].n)}${madeN(f)?'':' (jeszcze nie)'}">${itemSvg(f)}</i>`).join('')}</span>${lk?`<span class="clk">od poz. ${c.lvl}</span>`:''}</button>`};
// drzewo: [x, y, rodzaj, tytuł, podpis, genom]; rodzaj crop bierze nazwę i genom z uprawy o tym samym kluczu
const TREE_N={
 root:[350,30,'root','Wspólny przodek Triticum i Aegilops','ok. 3–7 mln lat temu'],
 lT:[170,86,'lbl','Triticum'],lA:[530,86,'lbl','Aegilops (kozieniec)'],
 boe:[80,140,'wild','T. boeoticum','samopsza dzika','AA'],ura:[235,140,'wild','T. urartu','dawca genomu A','AA'],
 spe:[420,140,'wild','Ae. speltoides','krewny dawcy B','BB'],tau:[640,140,'wild','Ae. tauschii','dawca genomu D','DD'],
 samopsza:[80,222,'crop'],
 x1:[330,292,'x'],dco:[330,336,'wild','T. dicoccoides','płaskurka dzika','AABB'],
 x2:[560,292,'x'],ara:[560,336,'wild','T. araraticum','dzika, Timofiejewa','AAGG'],
 plaskurka:[330,412,'crop'],tim:[560,412,'out','T. timopheevii','pszenica Timofiejewa','AAGG'],
 par:[330,488,'ext','T. parvicoccum †','pierwsza nagoziarnista','AABB'],
 durum:[200,560,'crop'],
 tur:[70,640,'out','T. turgidum','pszenica angielska','AABB'],aet:[205,640,'out','T. aethiopicum','pszenica etiopska','AABB'],
 polska:[340,640,'crop'],khorasan:[475,640,'crop'],perska:[640,640,'crop'],
 x3:[780,712,'x'],pszenica:[780,755,'crop'],
 x4:[557,800,'x'],orkisz:[557,845,'crop'],zbita:[780,845,'crop'],indyjska:[940,845,'crop']};
// krawędzie: [od, do, styl]; e:Y łamana przez wysokość Y, u w górę, d przerywana (prawdopodobne)
const TREE_E=[['root','lT'],['root','lA'],['lT','boe'],['lT','ura'],['lA','spe'],['lA','tau'],
 ['boe','samopsza'],['ura','x1'],['spe','x1'],['x1','dco'],['ura','x2'],['spe','x2'],['x2','ara'],['ara','tim'],
 ['dco','plaskurka'],['plaskurka','par'],['par','durum'],['durum','tur'],['durum','aet'],['durum','polska'],['durum','khorasan'],
 ['par','perska','e:524'],['par','x3','e:524'],['tau','x3'],['x3','pszenica'],['pszenica','perska','ud'],
 ['pszenica','x4'],['plaskurka','x4','e:450'],['x4','orkisz'],['pszenica','zbita'],['pszenica','indyjska']];
const TNW=128,TNH=46,TSHORT={khorasan:'Pszenica khorasan',jeczmien:'Jęczmień',zyto:'Żyto',durum:'Pszenica twarda'};
const tName=k=>{const n=TREE_N[k];return n[2]==='crop'?(TSHORT[k]||CR[k].n):n[3]};
const tOff=k=>{const t=TREE_N[k][2];return t==='x'?6:t==='lbl'?8:t==='root'?20:TNH/2};
// rodzice uprawy na drzewie (przez węzeł krzyżówki): do opisu pochodzenia w karcie uprawy
function treeParents(k){const p=TREE_E.filter(e=>e[1]===k&&!/u/.test(e[2]||'')).map(e=>e[0]);
  return p.flatMap(x=>TREE_N[x][2]==='x'?TREE_E.filter(e=>e[1]===x).map(e=>e[0]):[x]).filter(x=>!['lbl','root'].includes(TREE_N[x][2]))}
function treeHtml(){
  const P=k=>TREE_N[k];let s='';
  [[110,160,'2n = 14 · diploidy'],[270,420,'4n = 28 · tetraploidy'],[690,195,'6n = 42 · heksaploidy']].forEach(([y,h,t],i)=>{s+=`<rect class="tband b${i}" x="-34" y="${y}" width="1084" height="${h}"/><text class="tbl" transform="translate(-14,${y+h/2}) rotate(-90)">${t}</text>`});
  TREE_E.forEach(([a,b,st=''])=>{const A=P(a),B=P(b);let dd;
    if(st.startsWith('e:')){const y=parseInt(st.slice(2));dd=`M${A[0]} ${A[1]+tOff(a)} V${y} H${B[0]} V${B[1]-tOff(b)}`}
    else if(st==='h')dd=`M${A[0]+TNW/2} ${A[1]} H${B[0]-tOff(b)}`;
    else if(st.includes('u')){const y1=A[1]-tOff(a),y2=B[1]+tOff(b),m=(y1+y2)/2;dd=`M${A[0]} ${y1} C${A[0]} ${m} ${B[0]} ${m} ${B[0]} ${y2}`}
    else{const y1=A[1]+tOff(a),y2=B[1]-tOff(b),m=(y1+y2)/2;dd=`M${A[0]} ${y1} C${A[0]} ${m} ${B[0]} ${m} ${B[0]} ${y2}`}
    s+=`<path class="te ${st.includes('d')?'dash':''} ${st.endsWith('f')?'far':''}" d="${dd}"/>`});
  for(const k in TREE_N){const [x,y,t,ti,sub,gn]=TREE_N[k];
    if(t==='x'){s+=`<circle class="tx" cx="${x}" cy="${y}" r="6"/>`;continue}
    if(t==='lbl'){s+=`<text class="tlbl" x="${x}" y="${y+4}">${ti}</text>`;continue}
    if(t==='root'){s+=`<g class="tn root" transform="translate(${x},${y})"><rect x="-120" y="-20" width="240" height="40" rx="20"/><text class="t1" y="-2">${ti}</text><text class="t2" y="13">${sub}</text></g>`;continue}
    const c=t==='crop'?CR[k]:null,lk=c&&!unlocked(c),mn=c?c.flours.filter(f=>S.made[f]).length:0,G=c?(CINFO[k]||{}).g:gn;
    const st=c?c.lat.replace(/^Triticum /,'T. ').replace(/^Hordeum /,'H. ').replace(/^Secale /,'S. '):sub,gt=genTok(G||''),gw=gt.reduce((a,b)=>a+(b==='Hch'?14:7),10);
    s+=`<g class="tn ${t} ${lk?'lk':''} ${mn?'made':''}" transform="translate(${x},${y})" ${c?`data-act="bcrop" data-c="${k}" data-click="1"`:''}><title>${esc(c?c.n+(lk?` (od poziomu ${c.lvl})`:'')+': kliknij, żeby zobaczyć szczegóły':ti+', '+sub+(t==='out'?' · uprawiana, ale nie ma jej w grze':t==='ext'?' · wymarła':' · forma dzika'))}</title><rect x="${-TNW/2}" y="${-TNH/2}" width="${TNW}" height="${TNH}" rx="9"/><text class="t1" y="-3">${esc(tName(k))}</text><text class="t2" y="13">${esc(st)}</text>`;
    if(G)s+=`<g class="gb" transform="translate(${TNW/2-4},${-TNH/2})"><rect x="${-gw}" y="-8" width="${gw}" height="15" rx="7.5"/><text x="-4" y="3.5">${gt.map(z=>z==='Hch'?`<tspan fill="${GCOL[z]}">H</tspan><tspan fill="${GCOL[z]}" font-size="7" dy="-3">ch</tspan><tspan dy="3"></tspan>`:`<tspan fill="${GCOL[z]}">${z}</tspan>`).join('')}</text></g>`;
    s+='</g>'}
  return `<div class="tree"><svg viewBox="-34 0 1084 892" role="img" aria-label="Drzewo pokrewieństwa pszenic">${s}</svg></div>
  <div class="tleg"><span><i class="lg wild"></i>forma dzika</span><span><i class="lg crop"></i>uprawa w grze (kliknij)</span><span><i class="lg out"></i>uprawiana, nie ma jej w grze</span><span><i class="lg ext"></i>wymarła</span><span><i class="lg x"></i>krzyżówka, połączenie genomów</span><span><i class="lg ln"></i>pochodzenie</span><span><i class="lg ln dash"></i>prawdopodobne</span><span class="gens">${['A','B','D','G'].map(z=>`<b style="color:${GCOL[z]}">${z==='Hch'?'H<sup>ch</sup>':z}</b>`).join(' ')} genomy</span></div>`}

function vKsiega(){
  const made=nMade(),N=FLOURS.length,bv=S.bookView||'grid';
  let h=`<div class="sec"><div class="prog"><span class="big">${made}<small> / ${N} mąk</small></span><span class="track"><i style="width:${made/N*100}%"></i></span></div>
  <div class="chips">${CATS.map((c,i)=>`<button class="chip ${S.cat===i?'on':''}" data-act="cat" data-v="${i}">${i?c:'Wszystkie'} <span class="num">${i?FLOURS.filter(f=>ITEMS[f].cat===i&&S.made[f]).length+'/'+FLOURS.filter(f=>ITEMS[f].cat===i).length:''}</span></button>`).join('')}</div></div>`;
  BOOK_GROUPS.forEach(([gname,list])=>{const cat=CATS.indexOf(gname);if(S.cat&&S.cat!==cat)return;
    h+=`<section class="bsec"><div class="bsh"><h3>${esc(gname)}</h3><span class="more num">${list.length} ${plural(list.length,'uprawa','uprawy','upraw')}</span>${cat===1?`<div class="seg-switch">${[['grid','Karty'],['tree','Drzewo pszenic']].map(([v,n])=>`<button data-act="bview" data-v="${v}" class="${bv===v?'on':''}">${n}</button>`).join('')}</div>`:''}</div>
    ${cat===1&&bv==='tree'?treeHtml()+`<div class="grp">Pozostałe zboża glutenowe</div><div class="cbook">${list.filter(c=>!TREE_N[c.id]).map(cropCard).join('')}</div>`:`<div class="cbook">${list.map(cropCard).join('')}</div>`}</section>`});
  return h;
}
// karta uprawy: opis, uprawa, pochodzenie i wszystko, co z niej powstaje
// karty Księgi: uprawa (informacje albo drzewo produkcji), przedmiot, maszyna; „Wróć” cofa do poprzedniej karty
let bookCrop=null,bookItemId=null,bookMachId=null,cropTab='info',bookHist=[];
const BOOKM=['crop','item','bmach'];
const bookCur=()=>sheetMode==='crop'?['crop',bookCrop]:sheetMode==='item'?['item',bookItemId]:sheetMode==='bmach'?['bmach',bookMachId]:null;
function bookOpen(mode,id){const cur=bookCur();if(cur&&!(cur[0]===mode&&cur[1]===id))bookHist.push(cur);else if(!cur)bookHist=[];
  if(mode==='crop')bookCrop=id;else if(mode==='item')bookItemId=id;else bookMachId=id;
  sheetMode=mode;sheetPlot=-1;bookDraw();$('#sheet').hidden=false;$('#panel').scrollTop=0}
const bookDraw=()=>sheetMode==='crop'?drawCrop():sheetMode==='item'?drawItem():drawMachBook();
const openCrop=id=>bookOpen('crop',id),openItem=id=>ITEMS[id].kind==='raw'?bookOpen('crop',ITEMS[id].crop):bookOpen('item',id),openMachBook=id=>bookOpen('bmach',id);
function bookBack(){const p=bookHist.pop();if(!p){closeSheet();return}sheetMode=p[0];if(p[0]==='crop')bookCrop=p[1];else if(p[0]==='item')bookItemId=p[1];else bookMachId=p[1];bookDraw();$('#panel').scrollTop=0}
const bookHead=(img,t,s)=>`<div class="ph"><div class="mph">${img}<div><h2>${t}</h2><p>${s}</p></div></div><span class="phb">${bookHist.length?`<button class="btn sm" data-act="bback">${ci('back')} Wróć</button>`:''}<button class="btn sm" data-act="close">Zamknij</button></span></div>`;
// odpady (maszyna je oddziela) i produkty uboczne, które się do czegoś przydają
const WASTE=new Set(['zan_gr','odsiew','plewy_pyl','pyl','metal','kamienie','fr_kr','fr_dl','lekkie','porazone','sporysz','osci']);
const kindName=i=>{const it=ITEMS[i];return WASTE.has(i)?'Odpad':it.kind==='flour'?(/^Semolina/.test(it.n)?'Semolina':'Mąka'):({raw:'Plon',mid:'Półprodukt',prod:'Gotowy produkt',by:'Produkt uboczny',supply:'Zaopatrzenie'})[it.kind]||''};
const RIN={};RECIPES.forEach(r=>Object.keys(r.in).forEach(i=>(RIN[i]=RIN[i]||[]).push(r)));
// wszystko, co da się dostać z danej uprawy (do pytania „z jakich upraw pochodzi ten przedmiot”)
const CREACH={};const reach=c=>{if(CREACH[c.id])return CREACH[c.id];const s=new Set();(function w(i){if(s.has(i))return;s.add(i);(FWD[i]||[]).forEach(w)})(c.out);if(c.grp==='Zboża glutenowe')s.add('sloma');return CREACH[c.id]=s};
const cropsOf=i=>CROPS.filter(c=>reach(c).has(i));
const cchips=list=>`<div class="cchips">${list.map(c=>`<button class="cpick" data-act="bcrop" data-c="${c.id}" data-click="1" title="${esc(c.n)}">${cropThumb(c.id)}<span>${esc(c.n)}</span></button>`).join('')}</div>`;
const ichip=i=>`<button class="ipick" data-act="bitem" data-id="${i}" data-click="1" title="${esc(ITEMS[i].n)}">${itemSvg(i)}<span>${esc(ITEMS[i].n)}</span></button>`;
// drzewo produkcji: od plonu w dół; każdy węzeł to maszyna i to, co z niej wyszło, odpady małymi ikonkami obok
const shortN=i=>{const a=ITEMS[i].adj;return a?a[0].toUpperCase()+a.slice(1):ITEMS[i].n};
function ptNode(id,r,seen,by){const it=ITEMS[id],end=it.kind==='flour'||it.kind==='prod',again=seen.has(id);seen.add(id);
  const w=by||(r?Object.keys(r.out).filter(o=>ITEMS[o].kind==='by'):[]);
  const kids=again?[]:(RIN[id]||[]).flatMap(r2=>Object.keys(r2.out).filter(o=>ITEMS[o].kind!=='by').map(o=>[o,r2]));
  return `<li><div class="ptn ${end?'end':''} ${again?'again':''} ${r?'':'root'}" data-act="bitem" data-id="${id}" data-click="1" title="${esc(it.n)}${r?` · ${esc(M[r.m].n)}: ${esc(r.verb)}`:''}${again?' · ten sam przedmiot jest wyżej w drzewie':''}">
    ${r?`<span class="ptm" title="${esc(M[r.m].n)}">${mart(r.m)}</span>`:''}<span class="pti">${itemSvg(id)}</span><span class="ptt"><b>${again?'↺ ':''}${esc(r?shortN(id):it.n)}</b><small>${r?esc(M[r.m].n):'zbiór z pola'}</small>${w.length?`<span class="ptw">${w.map(o=>`<i title="${kindName(o)}: ${esc(ITEMS[o].n)}">${itemSvg(o)}</i>`).join('')}</span>`:''}</span></div>
    ${kids.length?`<ul>${kids.map(([o,r2])=>ptNode(o,r2,seen)).join('')}</ul>`:''}</li>`}
const prodTree=c=>`<div class="ptree"><ul class="pt">${ptNode(c.out,null,new Set(),c.grp==='Zboża glutenowe'?['sloma']:[])}</ul></div>`;

function drawCrop(){const c=CR[bookCrop];if(!c){closeSheet();return}const panel=$('#panel'),sc=panel.scrollTop,gi=CINFO[c.id]||{},lk=!unlocked(c),pr=cropProducts(c);
  const par=TREE_N[c.id]?treeParents(c.id):[],pn=k=>TREE_N[k][2]==='crop'?CR[k].n:TREE_N[k][3]+' ('+TREE_N[k][4]+')';
  const facts=[['Dział',CATS[c.cat]||c.grp],['Gdzie rośnie',ENV[c.env]],['Wzrost',fmtT(c.g)+(c.r?`, potem co ${fmtT(c.r)}`:'')],['Plon',`${c.y}× ${ITEMS[c.out].n}`],['Nasiona',`${seedCost(c)} zł`],['Dostępna',lk?`od poziomu ${c.lvl}`:'już teraz']];
  if(gi.g)facts.push(['Genom',`<span class="gen">${genHtml(gi.g)}</span>`]);if(gi.pro)facts.push(['Białko glutenowe',gi.pro]);
  if(par.length)facts.push(['Pochodzenie',par.map(pn).join(' × ')]);
  const ln=ITEMS[c.out].line;if(ln)facts.push(['Linia obróbki',GLINE[ln]]);
  let h=bookHead(`<span class="cv">${cropThumb(c.id)}</span>`,esc(c.n),`<i>${esc(c.lat)}</i>`)+`<div class="seg-switch ctabs">${[['info','Informacje'],['tree','Drzewo produkcji']].map(([v,n])=>`<button data-act="ctab" data-v="${v}" class="${cropTab===v?'on':''}">${n}</button>`).join('')}</div>`;
  if(cropTab==='tree'){
    h+=`<p class="more">Od plonu w dół: każdy węzeł to maszyna i to, co z niej wychodzi. Rozgałęzienia to różne drogi, złote ramki to gotowe produkty i mąki, a małe ikonki pod nazwą to odpady i produkty uboczne. Kliknij węzeł, żeby otworzyć jego kartę.</p>${prodTree(c)}`;
    panel.innerHTML=h;panel.scrollTop=sc;return}
  const fl0=c.flours[0],path=fl0?chainOf(fl0).filter(s=>s.r).map(s=>s.r.m):[];
  h+=`<div class="cinfo"><div>${gi.d?`<p class="cdesc">${esc(gi.d)}</p>`:''}<dl class="cfacts">${facts.map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>
  ${lk?'':`<button class="btn pri sm" data-act="sowsel" data-c="${c.id}">Siej: ${seedCost(c)} zł</button>`}</div></div>
  ${ln&&path.length?`<h3 class="cph">Maszyny po kolei, do: ${esc(ITEMS[fl0].n)}</h3><div class="mpath">${path.map((m,i)=>`${i?'<span class="ar">→</span>':''}<span class="mp ${mCount(m)?'':'no'}" data-act="bmach" data-m="${m}" data-click="1" title="${esc(M[m].n)}${mCount(m)?'':': nie masz jej jeszcze'}">${mart(m)}<small>${esc(M[m].n)}</small></span>`).join('')}</div>`:''}
  <h3 class="cph">Co z tej uprawy otrzymasz <span class="more num">${pr.length}</span></h3>`;
  PKIND.forEach(([k,n])=>{const l=pr.filter(i=>ITEMS[i].kind===k);if(!l.length)return;
    h+=`<div class="grp">${n}</div><div class="ptiles">${l.map(i=>{const m=madeN(i),fl=k!=='by';return `<div class="ptile ${!fl||m?'on':''} ${WASTE.has(i)?'waste':''}" data-act="bitem" data-id="${i}" data-click="1" title="${esc(ITEMS[i].src||ITEMS[i].n)}">${itemSvg(i)}<span><b>${esc(ITEMS[i].n)}</b><small>${fl?(m?`wyprodukowano ${m}`:'jeszcze nie'):`${kindName(i).toLowerCase()} · masz ${inv(i)}`} · ${unitPrice(i)} zł</small></span></div>`}).join('')}</div>`});
  panel.innerHTML=h;panel.scrollTop=sc}

// karta przedmiotu: czym jest, skąd się bierze (maszyna, czynność, uprawy) i do czego służy
function drawItem(){const id=bookItemId,it=ITEMS[id];if(!it){closeSheet();return}const panel=$('#panel'),sc=panel.scrollTop,kn=kindName(id),waste=WASTE.has(id);
  const facts=[['Rodzaj',kn],['Cena w sklepie',`${unitPrice(id)} zł / szt.`],['W spiżarni',`${inv(id)} szt.`]];
  if(it.kind==='flour')facts.push(['Wyprodukowano',S.made[id]||0]);if(it.kind==='prod')facts.push(['Wyprodukowano',(S.mp||{})[id]||0]);
  let h=bookHead(`<span class="cv">${itemSvg(id)}</span>`,esc(it.n),`<span class="kb ${waste?'w':it.kind}">${kn}</span>${it.src?' '+esc(it.src):''}`)+`<dl class="cfacts">${facts.map(([a,b])=>`<dt>${a}</dt><dd>${b}</dd>`).join('')}</dl>`;
  if(waste)h+=`<p class="wnote">${ci('trash')}<span>To odpad: maszyna oddziela go od ziarna podczas obróbki. Możesz go sprzedać za ${unitPrice(id)} zł albo wyrzucić do kosza.</span></p>`;
  else if(it.kind==='by')h+=`<p class="wnote by">${ci('collect')}<span>Produkt uboczny: powstaje przy okazji obróbki i da się go sprzedać.</span></p>`;
  // skąd: zbiór (słoma) i receptury, które go dają, pogrupowane wg maszyny
  const from=BYM[id]||[],gm={};from.forEach(r=>{(gm[r.m]=gm[r.m]||{verbs:new Set(),ins:new Set()});gm[r.m].verbs.add(r.verb);Object.keys(r.in).forEach(i=>gm[r.m].ins.add(i))});
  h+=`<h3 class="cph">${waste||it.kind==='by'?'Z czego wypada':'Skąd się bierze'}</h3>`;
  if(id==='sloma')h+=`<div class="srcrow"><span class="sm">${ci('soil')}</span><div><b>Zbiór kombajnem</b><small>zostaje po zbiorze każdego zboża glutenowego</small></div></div>`;
  Object.entries(gm).forEach(([m,g])=>{const crops=[...new Set([...g.ins].flatMap(i=>cropsOf(i)))],ins=[...g.ins];
    h+=`<div class="srcrow"><span class="sm" data-act="bmach" data-m="${m}" data-click="1" title="Księga: ${esc(M[m].n)}">${mart(m)}</span><div><b>${esc(M[m].n)}</b><small>${[...g.verbs].map(esc).join(', ')}${ins.length>3?` · z ${ins.length} różnych półproduktów`:''}</small>
      ${ins.length<=3?`<div class="ichips">${ins.map(ichip).join('')}</div>`:''}${crops.length?`<small class="cfrom">Z upraw (${crops.length}):</small>${cchips(crops)}`:''}</div></div>`});
  if(!from.length&&id!=='sloma')h+=`<p class="more">${it.kind==='supply'?'Kupuje się go: młynarz dokupi go sam.':'Nie powstaje w żadnej maszynie.'}</p>`;
  const use=RIN[id]||[];
  if(use.length){h+=`<h3 class="cph">Do czego służy</h3>`;use.forEach(r=>{h+=`<div class="srcrow"><span class="sm" data-act="bmach" data-m="${r.m}" data-click="1">${mart(r.m)}</span><div><b>${esc(M[r.m].n)}</b><small>${esc(r.verb)}</small><div class="ichips">${Object.keys(r.out).map(ichip).join('')}</div></div></div>`})}
  panel.innerHTML=h;panel.scrollTop=sc}

// karta maszyny: opis, ścieżka ulepszeń i uprawy, przy których jest potrzebna
function drawMachBook(){const m=bookMachId,mm=M[m];if(!mm){closeSheet();return}const panel=$('#panel'),sc=panel.scrollTop;
  const rs=RBY[m]||[],crops=[...new Set(rs.flatMap(r=>Object.keys(r.in).flatMap(i=>cropsOf(i))))],n=mCount(m);
  let h=bookHead(mart(m),esc(mm.n),`${n?`masz ${n} · w halach ${mPlaced(m)}, w magazynie ${mStock(m)}`:`w Sklepie od poziomu ${mm.lv} · ${fmtZ(mBuyCost(m))}`}`)+`<p class="cdesc">${esc(mm.d)}</p>
   <h3 class="cph">Ścieżka ulepszeń</h3><p class="more">Każdy egzemplarz ulepszasz osobno (prawy przycisk na maszynie w hali). Ceny dotyczą przejścia na dany poziom.</p>${upTree(m,null,null)}`;
  if(crops.length)h+=`<h3 class="cph">Potrzebna przy uprawach <span class="more num">${crops.length}</span></h3>${cchips(crops)}`;
  panel.innerHTML=h;panel.scrollTop=sc}

function vKron(){
  const nA=Object.keys(S.ach).length;
  const st=[['Czas gospodarowania',fmtT(S.t)],['Rok i pora',`${yearN()} · ${SEASONS[seasonN()].n}`],['Zarobione łącznie',fmtZ(S.earned)],['Zebrane plony',S.st.harv+' szt.'],['Partie z maszyn',S.st.crafted],['Renoma',`${S.pop.l} · ${POP_NAMES[S.pop.l-1]}`],['Klienci w sklepie',S.st.cust],['Sprzedane towary',S.st.sold+' szt.'],['Zamówienia',S.st.orders],['Mąki w księdze',`${nMade()} / ${FLOURS.length}`]];
  let h=`<div class="sec"><div class="sechead"><h2>Kronika gospodarstwa</h2></div><div class="kpis">${st.map(([a,b])=>`<div class="kpi"><span>${a}</span><b>${b}</b></div>`).join('')}</div></div>
  <div class="sec"><div class="sechead"><h2>Osiągnięcia <span class="more num">${nA}/${ACH.length}</span></h2><p>Każde osiągnięcie wypłaca nagrodę od razu.</p></div><div class="achs">`;
  ACH.forEach(([id,n,d,,rw])=>{const on=!!S.ach[id];h+=`<div class="ach ${on?'':'off'}">${MEDAL(on)}<div class="at"><b>${esc(n)}</b>${esc(d)} · <span class="num">${rw} zł</span></div></div>`});
  h+=`</div></div><div class="sec"><div class="sechead"><h2>Zapis gry</h2><p>Gra zapisuje się sama co kilka sekund. Zminimalizowana dalej pracuje, a po zamknięciu czas w gospodarstwie stoi. Kopia w pliku chroni postęp, gdy wyczyścisz dane przeglądarki albo przeniesiesz grę na inny komputer.</p></div>
   <div class="toolbar"><button class="btn pri" data-act="export">Zapisz kopię do pliku</button><button class="btn" data-act="import">Wczytaj kopię z pliku</button></div></div>
   <div class="sec"><div class="sechead"><h2>Ustawienia</h2><span class="more">Aura Fields · wersja ${VERSION}</span></div><div class="toolbar">
   <button class="btn" data-act="sound">${S.sound?'Wycisz dźwięki':'Włącz dźwięki'}</button>
   <button class="btn ${S.bgSound!==false?'on':''}" data-act="bgsound" ${S.sound?'':'disabled'} title="Czy dźwięk gra dalej, gdy zminimalizujesz okno gry">Dźwięk po zminimalizowaniu: ${S.bgSound!==false?'gra':'cichnie'}</button>
   </div><div class="vols">${VOLS.map(([k,n])=>`<label class="volr ${k==='all'?'main':''}"><span>${n}</span><input type="range" data-volk="${k}" min="0" max="100" value="${Math.round(vols()[k]*100)}" ${S.sound?'':'disabled'}><b class="num">${Math.round(vols()[k]*100)}%</b></label>`).join('')}</div><div class="toolbar">
   <button class="btn warn" data-act="reset">${resetArm?'Kliknij jeszcze raz, by skasować postęp':'Zacznij od nowa'}</button></div></div>`;
  return h;
}

// ---------- ARKUSZE ----------
let sheetPlot=-1, sheetMode=null, clearArm=false, resetArm=false, draft=null;
function openPlot(i){sheetPlot=i;sheetMode='plot';clearArm=false;drawSheet();$('#sheet').hidden=false;$('#panel').scrollTop=0}
function closeSheet(){$('#sheet').hidden=true;sheetPlot=-1;sheetMode=null}
// tryb siewu: wybrane nasiona sieje się klikaniem albo przeciąganiem po poletkach
let sowSel=null, sowPaint=false;
const sowable=(p,cid)=>!p.crop&&compatible(CR[cid],p.env)&&!frozen(p);
const sowFree=cid=>S.plots.filter(p=>sowable(p,cid)).length;
function sowAt(i,el){const p=S.plots[i];if(!sowSel||!p||p.crop)return false;const c=CR[sowSel];
  if(!compatible(c,p.env)){toast(`${c.n}: wymaga ${ENV[c.env].toLowerCase()}.`);return false}
  if(frozen(p)){toast('Ziemia jest zamarznięta, siew od wiosny.');return false}
  if(S.coins<seedCost(c)){toast('Brakuje pieniędzy na nasiona.');return false}
  if(!plant(i,sowSel,true))return false;snd('sow');
  if(el){el.classList.remove('sowok');el.classList.add('sown');const im=el.querySelector('.pimg');if(im)im.src=plotImgSrc(p);const pn=el.querySelector('.pn');if(pn)pn.lastChild.textContent=c.n}
  dirty=true;return true}
function sowStart(cid){sowSel=cid;closeSheet();S.tab='pola';render()}
function sowEnd(){sowSel=null;sowPaint=false;render()}
// karta nasiona; ref = poletko, do którego liczymy czas i plon (w oknie siewu: pierwsze pasujące)
function seedCard(c,ref,pick){const lk=!unlocked(c),cost=seedCost(c),af=S.coins>=cost,free=sowFree(c.id);
  const ok=pick?!!ref:compatible(c,ref.env),tW=ref&&outdoor(ref)&&seasonN()!==3?toSeason(3):Infinity;
  const est=ref?c.g/plotRate({...ref,crop:c.id}):c.g, late=ok&&!lk&&est>tW;
  const info=lk?`odblokujesz na poziomie ${c.lvl}`:!ok?`wymaga: ${ENV[c.env].toLowerCase()}`:`${fmtT(est)}${c.r?' · wieloletnia':''}${pick?` · wolne: ${free}`:''}`;
  const yld=ok&&!lk?`<span class="yld" title="Plon z jednego zbioru: ${plotYield(ref,c.id)}× ${esc(ITEMS[c.out].n)} (${price(c.out)} zł/szt. surowo)">${itemSvg(c.out)}<b class="num">${plotYield(ref,c.id)}</b></span>`:'';
  const fl=c.flours.slice(0,3),fpot=`<span class="fpots">${fl.map(f=>potChipF(f)).join('')}${c.flours.length>3?`<small>+${c.flours.length-3}</small>`:''}</span>`;
  const btns=pick?`<button class="btn sm ${!lk&&free?'pri':''}" data-act="sowsel" data-c="${c.id}" ${lk?'disabled':''} title="Wybierz i klikaj albo przeciągaj po poletkach">${cost} zł</button>${!lk&&!c.r&&free>1?`<button class="btn sm" data-act="plantall" data-c="${c.id}" ${af?'':'disabled'} title="Zasiej na wszystkich wolnych pasujących poletkach">×${free}</button>`:''}`
    :`<button class="btn sm ${ok&&af&&!lk?'pri':''}" data-act="plant" data-c="${c.id}" ${ok&&af&&!lk?'':'disabled'}>${cost} zł</button>${ok&&!lk&&free>1?`<button class="btn sm" data-act="sowsel" data-c="${c.id}" data-here="1" ${af?'':'disabled'} title="Zasiej tutaj i wybierz kolejne poletka">wiele</button>`:''}`;
  return `<div class="seed ${lk?'lock':ok?'':'off'} ${sowSel===c.id?'on':''}"><span class="sv">${cropThumb(c.id)}</span><div class="si"><b>${esc(c.n)}</b>
    <span>${info}</span>${late?'<br><span class="down">nie zdąży przed zimą, przezimuje uśpiona</span>':''}<span class="srow">${yld}${fpot}</span></div>
    <div class="sb">${btns}</div></div>`}
function openSeeds(){sheetMode='seeds';sheetPlot=-1;drawSeeds();$('#sheet').hidden=false;$('#panel').scrollTop=0}
function drawSeeds(){const panel=$('#panel'),sc=panel.scrollTop;
  let h=`<div class="ph"><div><h2>Siew</h2><p>Wybierz nasiona, a potem klikaj wolne poletka albo przeciągnij po nich myszą. Przycisk ×N sieje od razu na wszystkich wolnych pasujących. W kasie ${fmtZ(S.coins)}.</p></div><button class="btn sm" data-act="close">Zamknij</button></div>`;
  BOOK_GROUPS.forEach(([gr,list])=>{h+=`<div class="grp">${gr}</div><div class="seeds">`;
    list.forEach(c=>{const ref=S.plots.find(p=>sowable(p,c.id))||S.plots.find(p=>compatible(c,p.env));h+=seedCard(c,ref,true)});h+='</div>'});
  panel.innerHTML=h;panel.scrollTop=sc}
function drawSheet(){const i=sheetPlot,p=S.plots[i];if(!p)return;const panel=$('#panel'),sc=panel.scrollTop;let h='';
  const fz=frozen(p);
  if(p.crop){const c=CR[p.crop],rate=plotRate(p);
    h=`<div class="ph"><div><h2>${esc(c.n)}</h2><p><span class="lat">${esc(c.lat)}</span> · ${ENV[p.env]} · poletko ${i+1}</p></div><button class="btn sm" data-act="close">Zamknij</button></div>
    <div class="cur"><span class="sv">${plotImg(p)}</span><div class="si"><b>${isReady(p)?'Gotowe do zbioru':(fz?'Uśpione na zimę':p.h?'Odrasta po zbiorze':'Rośnie')+`: zostało <span class="num" data-pl="${i}"></span>`}</b><br><span class="more">Plon: ${plotYield(p)}× ${esc(ITEMS[c.out].n)} · tempo ×${rate.toFixed(2)}${c.r?` · owocuje co ${fmtT(c.r)}, zebrano ${p.h}×`:''}</span><span class="pbar"><i data-pp="${i}" style="width:${Math.min(100,p.prog/p.need*100)}%"></i></span></div></div>
    <p class="more" style="margin-top:12px">Prowadzi do: ${c.flours.map(f=>esc(ITEMS[f].n)).join(', ')}</p>
    <div class="envs">${isReady(p)?`<button class="btn pri" data-act="harvest1">Zbierz</button>`:''}<button class="btn warn" data-act="clear">${clearArm?'Na pewno? Kliknij ponownie':'Usuń roślinę z poletka'}</button></div>`;
  } else {
    const tW=outdoor(p)&&seasonN()!==3?toSeason(3):Infinity;
    h=`<div class="ph"><div><h2>${fz?'Zima na polu':'Co zasiać?'}</h2><p>Poletko ${i+1} · ${ENV[p.env]} · gleba ${p.soil}/${SOILMAX}${p.spr?' · nawadniane':''} · w kasie ${fmtZ(S.coins)}</p></div><button class="btn sm" data-act="close">Zamknij</button></div>
    ${fz?`<p class="empty-note">Ziemia jest zamarznięta. Siać pod gołym niebem możesz od wiosny, czyli za <b class="num" data-ts="0"></b>. W tym czasie możesz użyźnić glebę albo przebudować poletko na szklarnię.</p>`:''}<p class="more">Glebę, nawadnianie i przebudowę poletka znajdziesz pod prawym przyciskiem na poletku. „Wiele” sieje tutaj i pozwala od razu klikać kolejne poletka.</p>`;
    if(!fz) BOOK_GROUPS.forEach(([g,list])=>{h+=`<div class="grp">${g}</div><div class="seeds">`;
      list.forEach(c=>{h+=seedCard(c,p,false)});
      h+=`</div>`;});
  }
  panel.innerHTML=h; panel.scrollTop=sc; progress();}

function exportSave(){save();const blob=new Blob([JSON.stringify(S)],{type:'application/json'});const a=document.createElement('a');
  const d=new Date();a.href=URL.createObjectURL(blob);a.download=`aura-fields-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.json`;
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);toast('Kopia zapisu pobrana do pliku');}
function importSave(){const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';
  inp.onchange=()=>{const f=inp.files[0];if(!f)return;f.text().then(t=>{const s=JSON.parse(t);if(!s||s.v!==3||!s.plots)throw 0;
    S=repair(s);if(S._arrange){delete S._arrange;placeItems()}stageCache=[];closeSheet();save();render();toast('Wczytano zapis gry','gold')}).catch(()=>toast('To nie jest plik zapisu tej gry.'))};
  inp.click();}

// ---------- AKCJE ----------
function pay(c,src){if(S.coins<c)return false;S.coins-=c;dirty=true;if(src&&c){spendFeed(c,src);snd('buy')}return true}
const ACT={
 tab:d=>{S.tab=d.v;if(d.v!=='pola')sowSel=null;closeSheet();render();sndUpdate();window.scrollTo(0,0);if(d.v==='ksiega'||d.v==='kron')snd('page')},
 plot:(d,b)=>{const i=+d.i,p=S.plots[i];if(isReady(p)){harvest(i);render()}else if(!p.crop){if(sowSel){if(sowAt(i,b))sowPaint=true}else openSeeds()}else openPlot(i)},
 sowpick:()=>openSeeds(),
 sowend:()=>sowEnd(),
 sowsel:d=>{const here=d.here&&sheetPlot>=0?sheetPlot:-1;sowSel=d.c;if(here>=0)sowAt(here);closeSheet();S.tab='pola';render()},
 harvest1:()=>{harvest(sheetPlot);closeSheet();render()},
 plant:d=>{if(plant(sheetPlot,d.c)){closeSheet();render()}},
 plantall:d=>{let n=0;S.plots.forEach((p,i)=>{if(!p.crop&&compatible(CR[d.c],p.env)&&plant(i,d.c,true))n++});if(n)snd('sow');toast(n?`Zasiano ${n}× ${CR[d.c].n}`:'Brak wolnych pasujących poletek albo pieniędzy.');sowSel=null;closeSheet();render()},
 replant:()=>{let n=0;S.plots.forEach((p,i)=>{if(!p.crop&&p.last&&plant(i,p.last,n>0))n++});if(n)toast(`Obsiano ${n} ${plural(n,'poletko','poletka','poletek')}`);render()},
 clear:()=>{if(!clearArm){clearArm=true;drawSheet();return}const p=S.plots[sheetPlot];p.crop=null;p.h=0;closeSheet();render()},
 env:d=>{const p=S.plots[sheetPlot];if(p.crop||S.lvl<ENVREQ[d.e]||!pay(ENVCOST[d.e],'Przebudowa: '+ENV[d.e].toLowerCase()))return;p.env=d.e;render()},
 soil:()=>{const p=S.plots[sheetPlot];if(p.soil>=SOILMAX||!pay(soilCost(p),`Gleba, poletko ${sheetPlot+1}`))return;p.soil++;snd('plant');render()},
 spr:()=>{const p=S.plots[sheetPlot];if(p.spr||!pay(SPRCOST,'Zraszacz'))return;p.spr=true;render()},
 close:closeSheet,
 psoil:d=>{const i=+d.i,p=S.plots[i];if(!p||p.soil>=SOILMAX||!pay(soilCost(p),`Gleba, poletko ${i+1}`))return;p.soil++;snd('plant');replot()},
 pspr:d=>{const i=+d.i,p=S.plots[i];if(!p||p.spr||!pay(SPRCOST,'Zraszacz'))return;p.spr=true;snd('plant');replot()},
 penv:d=>{const i=+d.i,p=S.plots[i];if(!p||p.crop||S.lvl<ENVREQ[d.e]||!pay(ENVCOST[d.e],'Przebudowa: '+ENV[d.e].toLowerCase()))return;p.env=d.e;stageCache[i]=-1;snd('level');replot()},
 harvestall:()=>{let n=0;S.plots.forEach((p,i)=>n+=harvest(i,false));render()},
 buyplot:()=>{const c=plotCost();if(S.plots.length>=24||!pay(c,'Nowe poletko'))return;S.plots.push(newPlot());render()},
 pslot:d=>{hideCtx();
   const k=d.i!=null?S.shelf[+d.i]:d.t!=null?S.tray[+d.t]:d.o;
   if(pMove&&pSel){let ok=false;if(d.i!=null)ok=moveToShelf(pSel,+d.i);else if(d.t!=null)ok=moveToTray(pSel,+d.t);if(ok)pMove=false;render();return}
   pSel=k&&hold(k)>0&&pSel!==k?k:null;if(pSel)snd('pick_'+itemSnd(pSel));pMove=false;render()},
 pmove:()=>{pMove=!pMove;render()},
 ptrash:d=>{hideCtx();trash(d.k);render()},
 pbin:()=>{if(pMove&&pSel){trash(pSel);render();return}toast('Przeciągnij tu towar, żeby go wyrzucić.')},
 gospiz:()=>{S.tab='spiz';closeSheet();render();window.scrollTo(0,0)},
 pdesel:()=>{pSel=null;pMove=false;render()},
 ctxpin:d=>{hideCtx();const i=+d.i;if(S.shelf[i]){S.slotRule[i]='pin';toast(`${ITEMS[S.shelf[i]].n}: zawsze na tym miejscu`)}render()},
 ctxblock:d=>{hideCtx();const i=+d.i,k=S.shelf[i];if(k&&inv(k)>0){S.shelf[i]=null;delete S.slotRule[i];if(!moveToTray(k))placeItems()}S.shelf[i]=null;S.slotRule[i]='block';render()},
 ctxclear:d=>{hideCtx();const i=+d.i;delete S.slotRule[i];if(S.shelf[i]&&!inv(S.shelf[i]))S.shelf[i]=null;render()},
 ctxtray:d=>{hideCtx();moveToTray(d.k);pMove=false;render()},
 ctxshelf:d=>{hideCtx();toShelf(d.k);pMove=false;render()},
 buyshelf:()=>{if(S.shelves>=SHELF_MAX||!pay(shelfCost(),'Nowa półka w spiżarni'))return;S.shelves++;S.shelf.push(...Array(SHELF_W).fill(null));ensureShelfPos();placeItems();snd('level');render()},
 buym:d=>{const mm=M[d.m],c=mBuyCost(d.m);if(S.lvl<mm.lv||!pay(c,mm.n))return;const m=S.m[d.m];m.owned=true;S.mag.push({m:d.m,lvl:1});toast(`${mm.n} czeka w magazynie w Przetwórni`,'gold');snd('level');render()},
 hcell:d=>{const k=d.k;if(carry){const src=carry;if(hallDrop(k,src,null)){const h=HL();
     if(src.k==='m'||(src.k==='p'&&inv(src.id)<1)||(src.k==='c'&&!((h.items[src.key]||{})[src.id]))||(src.k==='s'&&mStock(src.id,src.lvl)<1))carry=null;save()}render();return}
   hSel=hSel===k?null:k;render()},
 hpick:d=>{if(carry){ACT.hcell(d);return}carry={k:'c',key:d.k,id:d.id};snd('pick_'+itemSnd(d.id));render()},
 ppick:d=>{hideCtx();if(carry&&carry.k==='c'){hallBack(carry,null);carry=null;save();render();return}carry={k:'p',id:d.id};if(!S.pdPin)pdOpen=false;snd('pick_'+itemSnd(d.id));render()},
 spick:d=>{const l=+d.v||null;carry=carry&&carry.k==='s'&&carry.id===d.id&&carry.lvl===l?null:{k:'s',id:d.id,lvl:l};render()},
 hcancel:()=>{carry=null;render()},
 hfeed:d=>{const n=feedM(HL(),d.k,d.q==='max'?'max':+d.q);if(n){snd('click');toast(`Włożono ${n} ${plural(n,'partię','partie','partii')}`)}if(sheetMode==='mach')drawMach();save();render()},
 hrow:()=>{const h=HL(),c=rowCost(h);if(h.h>=HALL_HMAX||!pay(c,'Nowy rząd w hali'))return;h.h++;snd('level');render()},
 newhall:()=>{const c=hallCost();if(!pay(c,'Nowa hala'))return;S.halls.push(newHall());S.hall=S.halls.length-1;hSel=null;snd('level');render()},
 hall:d=>{S.hall=+d.i;hSel=null;if(carry&&carry.k!=='p'&&carry.k!=='s')carry=null;render()},
 hrot:d=>{hideCtx();const c=HL().cells[d.k];if(c){c.dir=(c.dir+1)%4;dirty=true}if(sheetMode==='mach')drawMach();render()},
 hcollect:d=>{hideCtx();const h=HL(),c=h.cells[d.k];if(!c)return;const [x,y]=hxy(d.k),n=collectH(h,hk(...outXY(c,x,y)));if(n)toast(`Do spiżarni: ${n} szt.`);if(sheetMode==='mach')drawMach();render()},
 hauto:d=>{hideCtx();const c=HL().cells[d.k];if(c&&c.lvl>=MLV_AUTO){c.auto=!c.auto;dirty=true}if(sheetMode==='mach')drawMach();render()},
 hmill:d=>{hideCtx();const h=HL(),ml=millerOf(h,d.k);if(ml)ml.at=null;else{const m=S.millers[+d.v];if(m&&h.cells[d.k]){m.at={h:S.hall,key:d.k};m.off=false;S.st.planned++;toast(`Młynarz ${+d.v+1} pracuje przy maszynie: ${M[h.cells[d.k].m].n}`)}}if(sheetMode==='mach')drawMach();render()},
 hstash:d=>{hideCtx();stashM(HL(),d.k);if(hSel===d.k)hSel=null;if(sheetMode==='mach')closeSheet();toast('Maszyna wróciła do magazynu','gold');render()},
 hinfo:d=>{hideCtx();openMach(d.k)},
 hunq:d=>{unqueueM(HL(),d.k);drawMach();render()},
 hpin:d=>{const c=HL().cells[d.k];if(c)c.pin=(+d.v<0||c.pin===+d.v)?null:+d.v;drawMach();render()},
 hback1:d=>{hideCtx();const h=HL(),n=takeH(h,d.k,d.v,1e9);if(n)add(d.v,n);render()},
 hbackall:d=>{hideCtx();collectH(HL(),d.k);render()},
 hq:d=>{S.hq=d.v==='max'?'max':+d.v;render()},
 pdtoggle:()=>{S.pdPin=!S.pdPin;render()},
 tohall:d=>{hideCtx();toHall(d.k,d.q==='max'?inv(d.k):+d.q);save();render()},
 tohallp:d=>{hideCtx();const q=hqty();toHall(d.v,q==='max'?inv(d.v):q);save();render()},
 hput:d=>{hideCtx();const key=d.k;if(!key){carry={k:'p',id:d.v};render();return}hallDrop(key,{k:'p',id:d.v},null);save();render()},
 hup:d=>{hideCtx();const c=HL().cells[d.k];if(!c||c.lvl>=MLVMAX)return;const cost=mUpCost(c);if(!pay(cost,`${M[c.m].n}: poziom ${c.lvl+1}`))return;c.lvl++;snd('level');
   toast(c.lvl===MLV_AUTO?`${M[c.m].n}: tryb ciągły odblokowany`:`${M[c.m].n}: poziom ${c.lvl}`,'gold');if(sheetMode==='mach')drawMach();render()},
 hbin:()=>{if(carry&&(carry.k==='p'||carry.k==='c')){hallTrash(carry,null);carry=null;save();render();return}toast('Przeciągnij tu towar, żeby go wyrzucić.')},
 avail:()=>{S.onlyAvail=!S.onlyAvail;render()},
 deliver:d=>{declineArm=-1;deliver(+d.i,d.m);render()},
 decline:d=>{const i=+d.i;if(declineArm!==i){declineArm=i;render();setTimeout(()=>{if(declineArm===i){declineArm=-1;if(S.tab==='targ')render()}},3500);return}declineArm=-1;declineOrder(i);render()},
 pm:d=>{const x=S.shop[+d.s];if(x){x.pm=+d.v;S.custT=null}render()},
 restock:d=>{const x=S.shop[+d.s];if(x&&listWare(x.k,+d.n))snd('click');render()},
 unlist:d=>{unlistWare(+d.s);render()},
 unlistk:d=>{unlistWare(S.shop.findIndex(x=>x&&x.k===d.k));render()},
 listopen:d=>openList(+d.s),
 listq:d=>{listQ=d.v;drawList()},
 listk:d=>{const n=listQ==='all'?inv(d.k):+listQ;if(listWare(d.k,n,sheetPlot)){snd('click');closeSheet()}render()},
 list:d=>{if(listWare(d.k,d.n==='all'?inv(d.k):+d.n)){snd('click');toast(`Na wystawie: ${ITEMS[d.k].n}`)}render()},
 skup:d=>{if(skup(d.k,+d.n)){snd('coin');render()}},
 goalmin:()=>{S.goalMin=!goalMin();render()},
 ctxname:d=>{const s=+d.s,m=$('#ctx'),nm=(S.shelfNames||[])[s]||'';
   m.innerHTML=`<div class="ctxh">Nazwa półki</div><form class="ctxf" data-s="${s}"><input id="ctxIn" maxlength="30" value="${esc(nm)}" placeholder="Półka ${s+1}" aria-label="Nazwa półki"><button class="btn sm pri" type="submit">Zapisz</button></form>`;
   setTimeout(()=>{const i=$('#ctxIn');if(i){i.focus();i.select()}},40)},
 wapno:()=>{if(!pay(15,'Wapno spożywcze'))return;add('wapno',5);gainFeed('wapno',5,'Zakup na targu');render()},
 cat:d=>{S.cat=+d.v;render()},
 bview:d=>{S.bookView=d.v;snd('page');render()},
 bcrop:d=>{hideCtx();snd('page');openCrop(d.c)},
 bitem:d=>{hideCtx();snd('page');openItem(d.id)},
 bmach:d=>{hideCtx();snd('page');openMachBook(d.m)},
 bback:()=>{snd('page');bookBack()},
 ctab:d=>{cropTab=d.v;drawCrop()},
 hire:d=>{const w=WORK.find(x=>x[0]===d.w);if(S.work[d.w]||S.lvl<w[4]||!pay(w[3],w[1]))return;S.work[d.w]=true;S.auto[d.w]=true;toast(`${w[1]} zaczyna pracę`,'gold');snd('level');render()},
 hireMiller:()=>{const k=S.millers.length;if(k>=MILLER_MAX||S.lvl<millerReq(k)||!pay(millerCost(k),`Młynarz ${k+1}`))return;S.millers.push({at:null,off:false});toast(`Młynarz ${k+1} zaczyna pracę. Daj mu zlecenie w Przetwórni.`,'gold');snd('level');render()},
 toggleW:d=>{S.auto[d.w]=S.auto[d.w]===false;render()},
 research:d=>{const r=resDef(d.r);if(res(d.r)>=r[3]||S.lvl<resReq(d.r)||!pay(resCost(d.r),`${r[1]}: stopień ${res(d.r)+1}`))return;S.res[d.r]=res(d.r)+1;if(d.r==='lada')padShop();snd('level');render()},
 millerOff:d=>{const ml=S.millers[+d.k];if(ml){ml.off=!ml.off;dirty=true}render()},
 sound:()=>{S.sound=!S.sound;sndUpdate();render()},
 bgsound:()=>{S.bgSound=S.bgSound===false;sndUpdate();render()},
 export:exportSave, import:importSave,
 reset:()=>{if(!resetArm){resetArm=true;render();setTimeout(()=>{resetArm=false;if(S.tab==='kron')render()},4000);return}
   resetArm=false;silent=true;S=repair(newState());if(S._arrange)delete S._arrange;stageCache=[];advance(0.01,true);silent=false;save();render();toast('Nowa gra')},
};
// Mysz działa na wciśnięcie, bo widok odświeża się w trakcie gry i zwykły click mógłby przepaść.
let lastMouseAct=0;
function handle(e){const b=e.target.closest('[data-act]');if(!b||b.disabled)return false;const f=ACT[b.dataset.act];if(!f)return false;f(b.dataset,b,e);save();return true}
document.addEventListener('pointerdown',e=>{gest=true;ptrDown=true;
  if(e.pointerType!=='mouse'||e.button!==0) return;
  if(e.target.id==='sheet'){closeSheet();lastMouseAct=performance.now();return}
  const b=e.target.closest('[data-act]'); if(b&&b.dataset.click) return; // półki: zwykły klik, żeby dało się przeciągać
  if(handle(e)) lastMouseAct=performance.now();});
addEventListener('pointerup',()=>{ptrDown=false;if(sowPaint){sowPaint=false;save();render()}});
document.addEventListener('pointerover',e=>{if(!sowSel||!sowPaint||!(e.buttons&1))return;const b=e.target.closest&&e.target.closest('.plot.sowok');if(b)sowAt(+b.dataset.i,b)}); addEventListener('pointercancel',()=>{ptrDown=false});
// przeciąganie towarów: między półkami, „Do rozłożenia” i tym, co leży obok
document.addEventListener('dragstart',e=>{const b=e.target.closest&&e.target.closest('.pslot[data-dk]');if(!b)return;dragKey=b.dataset.dk;dragging=true;hideCtx();snd('pick_'+itemSnd(dragKey));
  e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',dragKey)}catch(_){}});
const dropSlot=t=>t.closest&&t.closest('.pslot[data-i],.pslot[data-t],.pslot[data-bin]');
document.addEventListener('dragover',e=>{if(dragKey&&dropSlot(e.target)){e.preventDefault();e.dataTransfer.dropEffect='move'}});
document.addEventListener('dragenter',e=>{const t=dropSlot(e.target);document.querySelectorAll('.pslot.over').forEach(x=>x!==t&&x.classList.remove('over'));if(t&&dragKey)t.classList.add('over')});
document.addEventListener('drop',e=>{const t=dropSlot(e.target);if(!t||!dragKey)return;e.preventDefault();
  if(t.dataset.bin) trash(dragKey); else if(t.dataset.i!=null) moveToShelf(dragKey,+t.dataset.i); else moveToTray(dragKey,+t.dataset.t);
  pSel=null;pMove=false;dragKey=null;dragging=false;save();render()});
document.addEventListener('dragend',()=>{if(dragging){dragKey=null;dragging=false;render()}});
// przetwórnia: przeciąganie towaru (ze spiżarni, między kratkami, z powrotem) i maszyn (z magazynu, po hali)
function dropOk(key,src){const h=HL(),c=h.cells[key];if(src.k==='s'||src.k==='m')return !(c&&key!==src.key)&&!sumQ(h.items[key]);
  if(c){const [x,y]=hxy(key),[ix,iy]=inXY(c,x,y);return hin(h,ix,iy)&&!h.cells[hk(ix,iy)]}return true}
document.addEventListener('dragstart',e=>{const s=e.target.closest&&e.target.closest('[data-hdrag]');if(!s)return;const p=s.dataset.hdrag.split(':');
  hSplit=[];splitMode=e.shiftKey||shiftOn;hDrag=p[0]==='c'?{k:'c',key:p[1],id:p[2]}:p[0]==='m'?{k:'m',key:p[1]}:p[0]==='s'?{k:'s',id:p[1],lvl:+p[2]||null}:{k:p[0],id:p[1]};dragging=true;carry=null;hideCtx();
  e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain','hala')}catch(_){}
  const d=$('#dimg'),h=HL();if(d){let src,n='';
    if(hDrag.k==='p'){src=iSrc(hDrag.id);n=dropQ(e,inv(hDrag.id))}else if(hDrag.k==='c'){src=iSrc(hDrag.id);n=dropQ(e,(h.items[hDrag.key]||{})[hDrag.id]||0)}
    else src=mSrc(hDrag.id||h.cells[hDrag.key].m);
    d.querySelector('img').src=src;const b=d.querySelector('b');b.textContent=n;b.hidden=n==='';try{e.dataTransfer.setDragImage(d,30,30)}catch(_){}}
  if(hDrag.k==='p'||hDrag.k==='c')snd('pick_'+itemSnd(hDrag.id))});
const hTarget=e=>e.target.closest&&(e.target.closest('.hc[data-k]')||e.target.closest('[data-hbin]')||e.target.closest('[data-pdrawer]')||e.target.closest('[data-hback]')||e.target.closest('.magbar'));
// rozkładanie: kratki zebrane podczas przeciągania z wciśniętym Shiftem (kolejność przejścia), każda najwyżej raz
// Shift wciśnięty przed chwyceniem albo w trakcie przeciągania (przeglądarki nie zawsze podają go w zdarzeniach przeciągania)
let hSplit=[],shiftOn=false,splitMode=false;
addEventListener('keydown',e=>{if(e.key==='Shift'){shiftOn=true;if(hDrag)splitMode=true}});addEventListener('keyup',e=>{if(e.key==='Shift')shiftOn=false});addEventListener('blur',()=>{shiftOn=false});
const splitTarget=key=>{const h=HL(),c=h.cells[key];if(!c)return key;const [x,y]=hxy(key),[ix,iy]=inXY(c,x,y),ik=hk(ix,iy);return hin(h,ix,iy)&&!h.cells[ik]?ik:null};
function splitDrop(src,keys){const h=HL(),have=src.k==='p'?inv(src.id):(h.items[src.key]||{})[src.id]||0,n=keys.length,each=Math.floor(have/n);
  if(!each){toast(`Za mało, żeby rozłożyć na ${n} ${plural(n,'kratkę','kratki','kratek')}.`);return}
  keys.forEach(k=>{if(src.k==='p')add(src.id,-each);else takeH(h,src.key,src.id,each);putH(h,k,src.id,each)});
  snd('drop_'+itemSnd(src.id));toast(`${ITEMS[src.id].n}: po ${each} na ${n} ${plural(n,'kratkę','kratki','kratek')}${have-each*n?`, ${have-each*n} zostaje`:''}`)}
document.addEventListener('dragover',e=>{if(!hDrag)return;const t=hTarget(e);
  if(e.shiftKey||shiftOn)splitMode=true;
  if(splitMode&&(hDrag.k==='p'||hDrag.k==='c')&&t&&t.dataset.k){const k=splitTarget(t.dataset.k);if(k&&k!==hDrag.key&&!hSplit.includes(k)){hSplit.push(k);const el=document.querySelector(`.hc[data-k="${k}"]`);if(el)el.classList.add('split')}}
  document.querySelectorAll('.hc.drop,.hc.nodrop').forEach(x=>x!==t&&x.classList.remove('drop','nodrop'));if(!t)return;e.preventDefault();
  if(t.dataset.hbin){t.classList.add('over');return}
  if(t.dataset.pdrawer)return;
  if(t.dataset.hback){t.classList.add('over');return}
  if(t.dataset.k){const ok=dropOk(t.dataset.k,hDrag);t.classList.toggle('drop',ok);t.classList.toggle('nodrop',!ok);e.dataTransfer.dropEffect=ok?'move':'none'}});
document.addEventListener('drop',e=>{if(!hDrag)return;e.preventDefault();const t=hTarget(e),src=hDrag,sp=hSplit;hDrag=null;hSplit=[];dragging=false;
  const spm=splitMode||e.shiftKey;splitMode=false;
  if(spm&&sp.length>1&&t&&t.dataset.k)splitDrop(src,sp);
  else if(t&&t.dataset.k)hallDrop(t.dataset.k,src,e);else if(t&&t.dataset.hbin)hallTrash(src,e);else if(t&&(t.dataset.pdrawer||t.dataset.hback))hallBack(src,e);
  else if(t&&t.classList.contains('magbar')&&src.k==='m'){stashM(HL(),src.key);toast('Maszyna wróciła do magazynu','gold')}
  pdOpen=false;save();render()});
document.addEventListener('dragend',()=>{hSplit=[];splitMode=false;if(hDrag){hDrag=null;dragging=false;pdOpen=false;render()}});
document.addEventListener('pointerover',e=>{if(!e.target.closest)return;const c=e.target.closest('.hc[data-k]');hHover=c?c.dataset.k:null;if(e.pointerType!=='mouse'||dragging)return;
  const d=null;if(false){pdOpen=false;document.querySelectorAll('[data-pdrawer].open').forEach(x=>x.classList.remove('open'))}});
document.addEventListener('dblclick',e=>{const c=e.target.closest&&e.target.closest('.hc[data-k]');if(c&&HL().cells[c.dataset.k])openMach(c.dataset.k)});
document.addEventListener('keydown',e=>{if(!S||S.tab!=='prz'||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;
  if(e.code==='KeyR'&&!e.ctrlKey&&!e.metaKey){if((carry&&carry.k==='s')||(hDrag&&hDrag.k==='s')){hRot=(hRot+1)%4;toast(['Nowa maszyna: wyjście w prawo','Nowa maszyna: wyjście w dół','Nowa maszyna: wyjście w lewo','Nowa maszyna: wyjście w górę'][hRot])}
    else{const h=HL(),k=hHover&&h.cells[hHover]?hHover:hSel&&h.cells[hSel]?hSel:null;if(k){h.cells[k].dir=(h.cells[k].dir+1)%4;dirty=true;render()}}}
  if(e.key==='Escape'&&!sheetMode){if(carry){carry=null;render()}else if(hSel){hSel=null;render()}}});
// menu pod prawym przyciskiem (na telefonie: przytrzymanie)
document.addEventListener('contextmenu',e=>{const hc=e.target.closest&&e.target.closest('.hc[data-k]');if(hc){e.preventDefault();showHallCtx(hc.dataset.k,e.clientX,e.clientY);return}
  const ps=e.target.closest&&e.target.closest('.pd-s.full[data-id]');if(ps){e.preventDefault();showPantryCtx(ps.dataset.id,e.clientX,e.clientY);return}
  const pl=e.target.closest&&e.target.closest('.plot[data-act="plot"]');if(pl){e.preventDefault();showPlotCtx(+pl.dataset.i,e.clientX,e.clientY);return}
  const s=e.target.closest&&e.target.closest('.pslot[data-act="pslot"],.slabel[data-sh]');if(!s)return;e.preventDefault();showCtx(s,e.clientX,e.clientY)});
document.addEventListener('pointerdown',e=>{if(ctxOpen&&!e.target.closest('#ctx'))hideCtx()},true);
addEventListener('scroll',()=>{if(ctxOpen)hideCtx()},{passive:true});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&ctxOpen)hideCtx()});
document.addEventListener('submit',e=>{const f=e.target.closest('.ctxf');if(!f)return;e.preventDefault();const s=+f.dataset.s,v=$('#ctxIn').value.trim().slice(0,30);
  S.shelfNames=S.shelfNames||[];S.shelfNames[s]=v||null;hideCtx();save();render()});
document.addEventListener('click',e=>{
  if(e.detail!==0&&performance.now()-lastMouseAct<800) return;
  if(e.target.id==='sheet'){closeSheet();return}
  handle(e);});
document.addEventListener('input',e=>{const k=e.target.dataset&&e.target.dataset.volk;if(!k)return;vols()[k]=+e.target.value/100;const b=e.target.nextElementSibling;if(b)b.textContent=e.target.value+'%';sndUpdate();dirty=false});
// po puszczeniu suwaka krótka próbka tego kanału
document.addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.volk;if(!k)return;save();if(k==='all'||k==='fx')snd('coin')});
document.addEventListener('keydown',e=>{gest=true;if(e.key==='Escape'){if(sheetMode)closeSheet();else if(sowSel)sowEnd()}});

// ---------- NIEBO ----------
const sky=$('#sky'), sx=sky.getContext('2d');
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
const STARS=Array.from({length:70},()=>[Math.random(),Math.random()*0.75,Math.random()*1.2+0.3,Math.random()*6]);
const clouds=Array.from({length:8},()=>({x:Math.random()*1.2-0.1,y:0.08+Math.random()*0.38,s:0.6+Math.random()*0.9,v:0.004+Math.random()*0.007}));
let parts=[], skyW=0, skyH=0, sail=0, lastSky=0;
const mixc=(a,b,t)=>a.map((v,i)=>Math.round(v+(b[i]-v)*t));
const rgb=(c,a)=>a==null?`rgb(${c[0]},${c[1]},${c[2]})`:`rgba(${c[0]},${c[1]},${c[2]},${a})`;
// tła z folderu bg/: {wiosna,lato,jesien,zima}-{dzien,noc}.webp (albo .png / .jpg)
// Gdy pliku brak, niebo rysuje się samo jak dotąd. Noc bez pliku = przyciemniony dzień.
const BG_SEASON=['wiosna','lato','jesien','zima'], BG={};
function bgImg(name){if(name in BG) return BG[name]; BG[name]=null; const ext=['webp','png','jpg'];
  (function next(k){if(k>=ext.length) return; const im=new Image(); im.onload=()=>{BG[name]=im}; im.onerror=()=>next(k+1); im.src='bg/'+name+'.'+ext[k];})(0);
  return null;}
BG_SEASON.forEach(s=>{bgImg(s+'-dzien');bgImg(s+'-noc')});
// rysuje obraz jak background-size:cover; pas nagłówka celuje w wiatrak (BG_FY wysokości obrazu)
const BG_FY=0.5;
function drawCover(im,W,H,a){const s=Math.max(W/im.width,H/im.height),w=im.width*s,h=im.height*s;
  const y=Math.min(0,Math.max(H-h,H/2-BG_FY*h));
  sx.globalAlpha=a; sx.drawImage(im,(W-w)/2,y,w,h); sx.globalAlpha=1;}
function drawBg(W,H,L,dusk,wet){const s=BG_SEASON[seasonN()],day=BG[s+'-dzien'],night=BG[s+'-noc'];
  if(!day&&!night) return false;
  if(day) drawCover(day,W,H,1); else drawCover(night,W,H,1);
  if(day&&L<1){ if(night) drawCover(night,W,H,1-L); else {sx.fillStyle=`rgba(8,10,26,${(1-L)*0.72})`;sx.fillRect(0,0,W,H)} }
  if(dusk>0){sx.fillStyle=`rgba(236,130,60,${dusk*0.22})`;sx.fillRect(0,0,W,H)}
  if(wet>0){sx.fillStyle=`rgba(70,76,90,${wet*0.35})`;sx.fillRect(0,0,W,H)}
  return true;}
function drawSky(ts){
  const dt=Math.min(0.1,(ts-lastSky)/1000||0); lastSky=ts;
  const r=sky.getBoundingClientRect(), dpr=Math.min(2,devicePixelRatio||1);
  if(r.width!==skyW||r.height!==skyH){skyW=r.width;skyH=r.height;sky.width=Math.round(skyW*dpr);sky.height=Math.round(skyH*dpr)}
  const W=skyW,H=skyH; if(!W||!H) return; sx.setTransform(dpr,0,0,dpr,0,0);
  const h=hourF(); let L=h>=5&&h<=20?Math.sin(Math.PI*(h-5)/15):0; L=Math.min(1,L*1.7);
  const dusk=L>0&&L<0.6?1-Math.abs(L-0.3)/0.3:0;
  const wet=S.wx==='deszcz'?0.65:S.wx==='pochm'?0.45:S.wx==='snieg'?0.5:0;
  if(drawBg(W,H,L,dusk,wet)){drawWeather(ts,dt,W,H);return}
  let top=mixc([10,14,30],[64,128,192],L), bot=mixc([26,28,48],[188,220,236],L);
  if(S.wx==='mroz') {top=mixc(top,[120,170,210],0.3*L);bot=mixc(bot,[220,236,246],0.4*L)}
  top=mixc(top,[100,108,120],wet*L); bot=mixc(bot,[150,156,164],wet*L);
  bot=mixc(bot,[236,140,72],dusk*0.75*(1-wet*0.6)); if(S.wx==='upal') bot=mixc(bot,[240,210,150],0.35*L);
  const gr=sx.createLinearGradient(0,0,0,H); gr.addColorStop(0,rgb(top)); gr.addColorStop(1,rgb(bot)); sx.fillStyle=gr; sx.fillRect(0,0,W,H);
  if(L<0.4){const a=(0.4-L)/0.4*(1-wet*0.8); STARS.forEach(([x,y,s,ph])=>{sx.fillStyle=`rgba(255,248,230,${a*(0.55+0.45*Math.sin(ts/700+ph))})`;sx.fillRect(x*W,y*H,s,s)})}
  if(h>=5&&h<=20){const f=(h-5)/15,x=W*0.06+f*W*0.88,y=H*0.92-Math.sin(Math.PI*f)*H*0.78;const sa=1-wet*0.7;
    const g2=sx.createRadialGradient(x,y,0,x,y,46);g2.addColorStop(0,`rgba(255,226,140,${0.55*sa})`);g2.addColorStop(1,'rgba(255,226,140,0)');sx.fillStyle=g2;sx.fillRect(x-46,y-46,92,92);
    sx.fillStyle=rgb(mixc([255,238,170],[255,170,90],dusk),sa);sx.beginPath();sx.arc(x,y,11,0,7);sx.fill();}
  else {const nf=((h-20+24)%24)/9,x=W*0.06+nf*W*0.88,y=H*0.9-Math.sin(Math.PI*nf)*H*0.7;
    sx.fillStyle='rgba(240,236,220,.92)';sx.beginPath();sx.arc(x,y,9,0,7);sx.fill();sx.fillStyle=rgb(top);sx.beginPath();sx.arc(x+4,y-3,8,0,7);sx.fill();}
  const nC=wet?8:S.wx==='upal'?2:5, cc=mixc([60,64,84],wet?[200,204,210]:[255,255,255],L);
  clouds.slice(0,nC).forEach(c=>{ if(!reduce) c.x+=c.v*dt*(wet?1.6:1); if(c.x>1.15){c.x=-0.15;c.y=0.08+Math.random()*0.38}
    const x=c.x*W,y=c.y*H,s=c.s*18; sx.fillStyle=rgb(cc,wet?0.85:0.7);
    sx.beginPath();sx.ellipse(x,y,s*1.6,s*0.55,0,0,7);sx.ellipse(x-s*0.7,y+s*0.1,s*0.9,s*0.45,0,0,7);sx.ellipse(x+s*0.5,y-s*0.3,s*0.9,s*0.6,0,0,7);sx.fill();});
  const sea=SEASONS[seasonN()], dark=0.22+0.78*L;
  const hillBack=mixc([18,20,26],sea.hill.map(v=>v*0.78),dark), hillFront=mixc([14,14,16],sea.hill,dark*0.85);
  sx.fillStyle=rgb(hillBack); sx.beginPath(); sx.moveTo(0,H);
  for(let x=0;x<=W;x+=8) sx.lineTo(x,H*0.66+Math.sin(x/140+1)*H*0.07+Math.sin(x/53)*H*0.025); sx.lineTo(W,H); sx.fill();
  const mx=W*0.8, my=H*0.66+Math.sin(mx/140+1)*H*0.07+Math.sin(mx/53)*H*0.025;
  const mc=mixc([12,10,10],[92,64,44],dark);
  sx.fillStyle=rgb(mc); sx.beginPath(); sx.moveTo(mx-7,my+2); sx.lineTo(mx-4.5,my-24); sx.lineTo(mx+4.5,my-24); sx.lineTo(mx+7,my+2); sx.fill();
  sx.beginPath(); sx.moveTo(mx-6,my-24); sx.lineTo(mx,my-31); sx.lineTo(mx+6,my-24); sx.fill();
  const busy=hallBusy()>0; if(!reduce) sail+=dt*(busy?1.6:0.35);
  if(L<0.35){sx.fillStyle='rgba(255,200,110,.85)';sx.fillRect(mx-1.5,my-14,3,4)}
  sx.save(); sx.translate(mx,my-25); sx.rotate(sail); sx.strokeStyle=rgb(mixc([30,26,22],[226,214,190],dark)); sx.lineWidth=2;
  for(let k=0;k<4;k++){sx.rotate(Math.PI/2);sx.beginPath();sx.moveTo(0,0);sx.lineTo(0,-19);sx.stroke();sx.fillStyle=rgb(mixc([30,26,22],[226,214,190],dark),0.55);sx.fillRect(1,-19,5,13)}
  sx.restore();
  sx.fillStyle=rgb(hillFront); sx.beginPath(); sx.moveTo(0,H);
  for(let x=0;x<=W;x+=8) sx.lineTo(x,H*0.82+Math.sin(x/210+3)*H*0.06); sx.lineTo(W,H); sx.fill();
  sx.strokeStyle=rgb(mixc(hillFront,[0,0,0],0.25)); sx.lineWidth=1;
  for(let x=-40;x<W+40;x+=22){sx.beginPath();sx.moveTo(x,H);sx.lineTo(x+30,H*0.84+Math.sin((x+30)/210+3)*H*0.06);sx.stroke()}
  drawWeather(ts,dt,W,H);
}
function drawWeather(ts,dt,W,H){
  if(!reduce&&(S.wx==='deszcz'||S.wx==='snieg')){const snow=S.wx==='snieg';
    while(parts.length<(snow?70:110)) parts.push({x:Math.random()*W,y:Math.random()*H,v:snow?18+Math.random()*16:260+Math.random()*120,w:Math.random()*6});
    sx.strokeStyle='rgba(200,220,240,.45)'; sx.fillStyle='rgba(255,255,255,.85)';
    parts.forEach(p=>{p.y+=p.v*dt;p.x+=(snow?Math.sin(ts/600+p.w)*12:-40)*dt; if(p.y>H){p.y=-5;p.x=Math.random()*W*1.1}
      if(snow){sx.fillRect(p.x,p.y,2,2)}else{sx.beginPath();sx.moveTo(p.x,p.y);sx.lineTo(p.x-3,p.y+9);sx.stroke()}});}
  else parts=[];
}
let lastSkyDraw=0;
function skyLoop(ts){const anim=!reduce&&(S&&(S.wx==='deszcz'||S.wx==='snieg')),gap=anim?33:500;
  if(!document.hidden&&S&&ts-lastSkyDraw>=gap){lastSkyDraw=ts;drawSky(ts)}
  requestAnimationFrame(skyLoop);}
addEventListener('resize',()=>{lastSkyDraw=0});

// ---------- PĘTLA ----------
let lastCheck=0;
// Póki gra jest otwarta (także zminimalizowana), czas liczy się z zegara ściennego: gdy przeglądarka
// zwalnia timery w tle, przy następnym tyknięciu gra nadrabia upływ, do 4 godzin naraz.
// Po zamknięciu gry czas stoi (start() niczego nie nadrabia).
let lastSave=Date.now();
function loop(){const wall=Date.now(),now=performance.now();const dt=Math.min(14400,Math.max(0,(wall-lastReal)/1000));lastReal=wall;
  if(dt>10){silent=true;advance(dt,true);silent=false;dirty=true} else advance(dt);
  if(now-lastCheck>1000){lastCheck=now;checkProgress()}
  if(wall-lastSave>4000){lastSave=wall;save()}
  if(document.hidden){if(S.bgSound!==false)sndUpdate();return} // w tle tylko liczymy (i gra dźwięk, jeśli gracz chce), bez rysowania
  sndUpdate();
  if(dirty&&now-lastRender>150&&!dragging&&!ptrDown) render(); else {progress();hudTick()}}
// tyknięcia z osobnego wątku: timery workera są w tle dławione dużo słabiej niż strony
function startTicker(){try{const src='setInterval(()=>postMessage(0),500)';
    const w=new Worker(URL.createObjectURL(new Blob([src],{type:'text/javascript'})));w.onmessage=()=>{if(document.hidden)loop()};w.onerror=()=>{};}catch(e){}
  setInterval(loop,200);}
function start(data){
  S=(data&&data.state)||load(); S=S?repair(S):repair(newState());
  if(S._arrange){delete S._arrange;placeItems()}
  silent=true;
  if(S.day<0) advance(0.01,true);
  // po zamknięciu gry czas stoi: nie nadrabiamy przerwy między uruchomieniami
  silent=false;
  if(S._refund){toast(`Targ działa teraz inaczej: sklep, zamówienia i renoma. Za wycofane usprawnienia dostajesz zwrot ${fmtZ(S._refund)}.`,'gold');delete S._refund}
  lastReal=Date.now();render();
  startTicker();
  addEventListener('beforeunload',save); document.addEventListener('visibilitychange',()=>{if(document.hidden)save();else{loop();dirty=true}});
  requestAnimationFrame(skyLoop);
  try{navigator.storage&&navigator.storage.persist&&navigator.storage.persist()}catch(e){}
  // w aplikacji (Tauri) pliki są lokalne i aktualizuje je instalator, więc bez service workera
  if('serviceWorker' in navigator&&/^https?:/.test(location.protocol)&&!window.__TAURI_INTERNALS__) navigator.serviceWorker.register('sw.js').catch(()=>{});
}
window.claude?.hot?.snapshot?.(()=>({state:S}));
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
})();
