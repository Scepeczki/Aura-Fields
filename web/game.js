// Aura Fields — logika, interfejs i niebo nad gospodarstwem. Wymaga data.js.
(()=>{
'use strict';
// wersja gry: podbija ją skrypt release.ps1 przy każdym wydaniu
const VERSION='1.2.0';
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
  const m={}; MACH.forEach(x=>m[x[0]]={owned:x[3]===0,lvl:1,q:[],run:[]});
  const s={v:3,t:DAY*0.1,coins:100,earned:0,xp:0,lvl:1,speed:1,tab:'pola',cat:0,onlyAvail:true,selM:'mlo',
    plots:Array.from({length:6},newPlot),inv:{},m,made:{},orders:[],dem:{},hot:null,day:-1,wx:'slonce',fc:[],
    res:{},work:{},auto:{},millers:[],ach:{},goal:0,st:{harv:0,sold:0,flourSold:0,orders:0,crafted:0,planted:0,planned:0,cust:0},sound:true,seen:Date.now(),
    pop:{l:1,p:0,sd:0},shop:[],nextOrd:null,mk:2};
  // gospodarstwo na start: pszenica gotowa do zbioru, żyto w połowie
  Object.assign(s.plots[0],{crop:'pszenica',prog:CR.pszenica.g,need:CR.pszenica.g,last:'pszenica'});
  Object.assign(s.plots[1],{crop:'zyto',prog:CR.zyto.g*0.45,need:CR.zyto.g,last:'zyto'});
  return s;
}
function load(){try{const s=JSON.parse(localStorage.getItem(KEY));if(s&&s.v===3)return s}catch(e){}return null}
function save(){if(!S)return;S.seen=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function repair(s){ // uzupełnia brakujące pola
  const oldMk=s.mk==null&&s.st;
  const d=newState(); for(const k in d) if(s[k]===undefined) s[k]=d[k];
  if(oldMk) migrateMarket(s);
  if(!s.pop||typeof s.pop!=='object') s.pop={l:1,p:0,sd:0};
  if(!Array.isArray(s.shop)) s.shop=[];
  s.orders=(s.orders||[]).filter(o=>o&&Array.isArray(o.lines));
  for(const k in d.st) if(s.st[k]===undefined) s.st[k]=0;
  MACH.forEach(x=>{if(!s.m[x[0]])s.m[x[0]]={owned:x[3]===0,lvl:1,q:[],run:[]}});
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
function plotImgSrc(p){
  if(!p.crop) return 'plots/'+ENVIMG[p.env]+(seasonN()===3?'-zima':'')+'.webp';
  const c=CR[p.crop],st=isReady(p)?3:(c.r&&p.h>0)?4:p.prog/p.need<0.5?1:2;
  return 'plots/'+c.id+'-'+st+'.webp';}
const plotImg=p=>`<img class="pimg" src="${plotImgSrc(p)}" alt="" decoding="async" draggable="false">`;
const cropThumb=(id,st)=>`<img class="pimg" src="plots/${id}-${st||3}.webp" alt="" loading="lazy" decoding="async" draggable="false">`;
function stage(p){if(isReady(p))return 3;if(p.h>0)return 2;const f=p.prog/p.need;return f<.15?0:f<.5?1:2}

function plant(i,cid,quiet){const p=S.plots[i],c=CR[cid]; if(!p||!c||p.crop||!compatible(c,p.env)||!unlocked(c)||frozen(p)) return false;
  const cost=seedCost(c); if(S.coins<cost) return false;
  S.coins-=cost; spendFeed(cost,'Nasiona: '+c.n); Object.assign(p,{crop:cid,prog:0,need:c.g,h:0,last:cid}); S.st.planted++; stageCache[i]=-1; dirty=true;
  if(!quiet) snd('plant'); return true;}
function harvest(i,auto){const p=S.plots[i]; if(!isReady(p)) return 0; const c=CR[p.crop], y=plotYield(p);
  add(c.out,y); S.st.harv+=y; gainXP(y); gainFeed(c.out,y,auto?'Parobek zebrał':'Zbiór z poletka');
  if(c.r){p.prog=0;p.need=c.r;p.h++} else {p.crop=null;p.h=0; if(working('siewca')&&p.last) plant(i,p.last,true)}
  if(!auto) snd('pop');
  dirty=true; return y;}

// ---------- MASZYNY ----------
const MLVMAX=10;
const mSpeed=id=>(1+0.2*(S.m[id].lvl-1))*(1+0.06*res('maint'));
const mSlots=id=>S.m[id].lvl>=8?3:S.m[id].lvl>=4?2:1;
const qMax=()=>6+3*res('log');
const mLoad=id=>S.m[id].q.length+S.m[id].run.length;
const mUpCost=id=>Math.round(Math.max(300,M[id].p)*0.8*Math.pow(1.7,S.m[id].lvl-1));
const canDo=r=>Math.min(...Object.entries(r.in).map(([k,q])=>Math.floor(inv(k)/q)));
const outMain=r=>Object.keys(r.out).find(k=>ITEMS[k].kind!=='by')||Object.keys(r.out)[0];
function enqueue(rid,n,quiet){const r=RECIPES[rid],id=r.m,m=S.m[id]; if(!m.owned) return 0; let k=0;
  while(k<n&&mLoad(id)<qMax()&&canDo(r)>=1){
    Object.entries(r.in).forEach(([i,q])=>add(i,-q));
    if(m.run.length<mSlots(id)) m.run.push({r:rid,prog:0}); else m.q.push(rid); k++;}
  if(!k&&!quiet) toast(mLoad(id)>=qMax()?'Kolejka tej maszyny jest pełna. Większe zasobniki kupisz w Ulepszeniach.':'Brakuje surowców.');
  dirty=true; return k;}
function clearQueue(id){const m=S.m[id];
  m.q.forEach(rid=>Object.entries(RECIPES[rid].in).forEach(([i,q])=>{add(i,q);gainFeed(i,q,'Zwrot z kolejki')})); m.q=[]; dirty=true;}
function complete(rid){const r=RECIPES[rid]; S.st.crafted++;
  Object.entries(r.out).forEach(([o,q])=>{add(o,q); gainFeed(o,q,M[r.m].n);
    if(ITEMS[o].kind==='flour'){const first=!S.made[o]; S.made[o]=(S.made[o]||0)+q; gainXP(first?25:3*q);
      S.millers.forEach(ml=>{if(ml.plan&&ml.plan.f===o) ml.plan.done+=q});
      if(first){toast(`Nowa mąka w księdze: ${ITEMS[o].n}`,'gold');snd('level')}}});
  dirty=true;}
function advMachine(id,d){const m=S.m[id], sp=mSpeed(id);
  while(m.run.length<mSlots(id)&&m.q.length) m.run.push({r:m.q.shift(),prog:0});
  for(let k=0;k<m.run.length;k++){let left=d*sp, job=m.run[k], guard=0;
    while(job&&left>0&&guard++<5000){const rem=RECIPES[job.r].t-job.prog;
      if(left>=rem){left-=rem; complete(job.r);
        if(m.q.length){job={r:m.q.shift(),prog:0};m.run[k]=job} else {m.run.splice(k,1);k--;job=null}}
      else {job.prog+=left;left=0}}}}
// czas do opróżnienia maszyny (w sekundach)
function mEta(id){const m=S.m[id],sp=mSpeed(id),sl=mSlots(id);let w=m.run.reduce((s,j)=>s+RECIPES[j.r].t-j.prog,0)+m.q.reduce((s,r)=>s+RECIPES[r].t,0);return w/sp/sl}

// ---------- MŁYNARZE: każdy prowadzi jedno zlecenie ----------
const PLANC={};
const planSteps=f=>PLANC[f]||(PLANC[f]=chainOf(f).filter(s=>s.r).map(s=>s.r));
const inMachine=(r)=>S.m[r.m].q.filter(x=>x===r.id).length+S.m[r.m].run.filter(j=>j.r===r.id).length;
function runPlanner(){
  S.millers.forEach(ml=>{const pl=ml.plan; if(ml.off||!pl||(pl.n&&pl.done>=pl.n)) return; const steps=planSteps(pl.f);
    for(let i=steps.length-1;i>=0;i--){const r=steps[i]; if(!S.m[r.m].owned) continue;
      if(mLoad(r.m)>=mSlots(r.m)+1) continue;
      if(i===steps.length-1&&pl.n&&pl.done+inMachine(r)*(r.out[pl.f]||1)>=pl.n) continue;
      if(r.in.wapno&&inv('wapno')<r.in.wapno&&S.coins>=3){S.coins-=3;add('wapno',1);spendFeed(3,'Młynarz kupił wapno')}
      if(canDo(r)>=1) enqueue(r.id,1,true);}});
  S.millers.forEach((ml,k)=>{const pl=ml.plan; if(pl&&pl.n&&pl.done>=pl.n){toast(`Młynarz ${k+1} skończył zlecenie: ${pl.n}× ${ITEMS[pl.f].n}`,'gold');ml.plan=null;dirty=true}});}
function chainProblem(f){const steps=planSteps(f); const miss=[...new Set(steps.filter(r=>!S.m[r.m].owned).map(r=>M[r.m].n))];
  if(miss.length) return 'Brak maszyny: '+miss.join(', ');
  const crop=chainOf(f).find(s=>s.crop)?.crop; if(crop&&!unlocked(crop)) return `Uprawa „${crop.n}” od poziomu ${crop.lvl}`;
  if(crop&&!haveEnv(crop.env)) return `Uprawa wymaga: ${ENV[crop.env].toLowerCase()}`;
  return '';}
function planStatus(ml){const pl=ml.plan; if(!pl) return 'Czeka na zlecenie'; if(ml.off) return 'Ma wolne';
  const pr=chainProblem(pl.f); if(pr) return pr; const steps=planSteps(pl.f);
  const busy=steps.some(r=>inMachine(r)>0), any=steps.some(r=>canDo(r)>=1);
  const crop=chainOf(pl.f).find(s=>s.crop)?.crop;
  if(!busy&&!any&&crop) return `Czeka na plon: ${ITEMS[crop.out].n}`;
  return 'Pracuje';}

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
  if(!silent){SALES.unshift({k:x.k,q,v,t:S.t});if(SALES.length>6)SALES.pop()}
  if(!x.q&&!silent&&S.tab!=='targ') toast(`Wyprzedane w sklepie: ${it.n}`);
  dirty=true;}
function shopStep(d){const r=custRate(); if(!r) return;
  if(S.custT==null) S.custT=-Math.log(1-Math.random())/r;
  S.custT-=d; let g=0; while(S.custT<=0&&g++<50){customer(); const r2=custRate(); if(!r2){S.custT=null;break} S.custT+=-Math.log(1-Math.random())/r2}}
// wystaw towar: do slotu z tym samym towarem, do wskazanego albo pierwszego wolnego
function listWare(k,n,slot){n=Math.min(inv(k),n); if(n<=0||ITEMS[k].kind==='supply') return 0; padShop();
  let i=S.shop.findIndex(x=>x&&x.k===k);
  if(i<0){i=slot!=null&&!S.shop[slot]?slot:S.shop.findIndex(x=>!x); if(i<0){toast('Wystawa w sklepie jest pełna. Zdejmij coś albo kup dłuższą ladę w Ulepszeniach.');return 0} S.shop[i]={k,q:0,pm:1,t:0}}
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
 ['f70','Wszystkie mąki świata','Zapełnij całą Księgę: 70 mąk.',()=>nMade()>=70,5000],
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
 ['m5','Dobry mechanik','Ulepsz maszynę do poziomu 5.',()=>MACH.some(x=>S.m[x[0]].lvl>=5),150],
 ['m10','Mistrz mechaniki','Ulepsz maszynę do poziomu 10.',()=>MACH.some(x=>S.m[x[0]].lvl>=10),1000],
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
 ['Wymłóć kłosy w Młocarni (zakładka Przetwórnia).',()=>S.st.crafted>=1,15],
 ['Zmiel pierwszą mąkę na Żarnach.',()=>nMade()>=1,20],
 ['Wystaw mąkę w sklepie na Targu i poczekaj na klienta.',()=>S.st.flourSold>=1||S.st.orders>=1,25],
 ['Osiągnij 2. poziom gospodarza.',()=>S.lvl>=2,30],
 ['Kup Łuszczarkę w zakładce Ulepszenia.',()=>S.m.lus.owned,40],
 ['Ulepsz Młocarnię albo Żarna do poziomu 2.',()=>S.m.mlo.lvl>=2||S.m.zar.lvl>=2,50],
 ['Użyźnij glebę: prawy przycisk na poletku.',()=>S.plots.some(p=>p.soil>0),40],
 ['Zdobądź renomę 2 i zrealizuj 5 zamówień na Targu.',()=>S.st.orders>=5,80],
 ['Zbuduj szklarnię, zanim przyjdzie zima.',()=>S.plots.some(p=>p.env==='szklarnia'),120],
 ['Wyprodukuj 10 różnych mąk.',()=>nMade()>=10,200],
 ['Zatrudnij parobka.',()=>!!S.work.parobek,150],
 ['Zatrudnij młynarza i daj mu zlecenie.',()=>S.millers.length>0&&S.st.planned>0,250],
 ['Wyprodukuj 25 różnych mąk.',()=>nMade()>=25,500],
 ['Wyprodukuj 50 różnych mąk.',()=>nMade()>=50,1500],
 ['Zapełnij całą Księgę mąk.',()=>nMade()>=70,5000],
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
  for(const id in S.m) if(S.m[id].owned) advMachine(id,d);
  orderTick(); shopStep(d);
  if(working('parobek')) S.plots.forEach((p,i)=>{if(isReady(p)) harvest(i,true)});
  placeItems(); spoilFloor(d);
  runPlanner();
  if(working('kupiec')){for(let i=0;i<S.orders.length;i++) if(canFull(S.orders[i])&&deliver(i,'full',true)) i--;
    S.shop.forEach(x=>{if(x&&x.q<(x.t||0)&&inv(x.k)>0){const n=Math.min(inv(x.k),x.t-x.q);add(x.k,-n);x.q+=n;dirty=true}});
    Object.keys(S.inv).forEach(k=>{if(ITEMS[k].kind==='by'&&inv(k)>=5) skup(k,inv(k))});}
}
function advance(total,quiet){let left=total; while(left>1e-9){const d=Math.min(2,left); left-=d; step(d,quiet);}}

// ---------- DŹWIĘK ----------
let AC=null, gest=false;
function snd(type){ if(!S||!S.sound||!gest||silent) return; try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==='suspended') AC.resume();
  const now=AC.currentTime; const tone=(f,t0,dur,vol,wave)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=wave||'triangle';o.frequency.setValueAtTime(f,now+t0);
    g.gain.setValueAtTime(0.0001,now+t0);g.gain.exponentialRampToValueAtTime(vol,now+t0+0.01);g.gain.exponentialRampToValueAtTime(0.0001,now+t0+dur);o.connect(g);g.connect(AC.destination);o.start(now+t0);o.stop(now+t0+dur+0.02);};
  if(type==='pop'){tone(520,0,.09,.12);tone(780,.05,.1,.08)}
  else if(type==='coin'){tone(1320,0,.08,.08,'square');tone(1760,.07,.18,.06,'square')}
  else if(type==='plant'){tone(220,0,.12,.12,'sine');tone(330,.06,.1,.06,'sine')}
  else if(type==='level'){[523,659,784,1047].forEach((f,i)=>tone(f,i*.08,.22,.08))}
  else if(type==='click'){tone(400,0,.04,.05,'sine')}
}catch(e){}}

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
function itemSvg(id){const it=ITEMS[id],c=it.col;
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
const seaIcon=k=>`<svg class="wxi" viewBox="0 0 24 24" aria-hidden="true">${SEAICO[k]}</svg>`;
const lico=p=>`<svg class="bico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
const ICO={sprout:'<path d="M12 21V11M12 11c0-4 3-6 7-6 0 4-3 6-7 6zM12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5z"/>',
 sickle:'<path d="M4 20l5-5M9 15c-2-6 2-11 9-11-4 2-6 5-5 10"/>',
 bag:'<path d="M8 6h8l-1 3c2 1.5 3 4 3 6.5C18 19 15.5 21 12 21s-6-2-6-5.5C6 13 7 10.5 9 9z"/><path d="M9 6l1-2h4l1 2"/>',
 clock:'<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'};
const wxIcon=w=>`<svg class="wxi" viewBox="0 0 24 24" aria-hidden="true">${WXI[w]}</svg>`;
const TABICO={ // ikony zakładek, rysowane kolorem tekstu
 pola:'<path d="M12 21V11M12 11c0-4 3-6 7-6 0 4-3 6-7 6zM12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5z"/><path d="M4 21h16"/>',
 prz:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1"/>',
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
const mart=(id,cls)=>`<span class="mart ${cls||''}"><svg viewBox="0 0 48 48" aria-hidden="true">${MART[id]}</svg></span>`;
const MILLER_ART=`<span class="mart"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="15" r="8" fill="#e8c8a0"/><path d="M15 12q9-9 18 0z" fill="#f1e7d4"/><rect x="15" y="9" width="18" height="4" rx="2" fill="#f1e7d4"/><path d="M10 44q2-18 14-18t14 18z" fill="#f1e7d4"/><path d="M18 30l6 6 6-6" stroke="#c9b597" stroke-width="2" fill="none"/><circle cx="21" cy="15" r="1" fill="#3a2a1a"/><circle cx="27" cy="15" r="1" fill="#3a2a1a"/></svg></span>`;

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
const TABS=[['pola','Pola'],['prz','Przetwórnia'],['spiz','Spiżarnia'],['targ','Targ'],['ulep','Ulepszenia']];

const resDef=id=>RES.find(x=>x[0]===id);
const resCost=id=>{const r=resDef(id);return Math.round(r[4]*Math.pow(r[5],res(id)))};
const resReq=id=>{const r=resDef(id);return r[6]+r[7]*res(id)};
const resAvail=id=>{const r=resDef(id);return res(id)<r[3]&&S.lvl>=resReq(id)&&S.coins>=resCost(id)};

function hudTick(){
  $('#coins').textContent=fmtZ(S.coins);
  $('#clock').innerHTML=`<b>${SEASONS[seasonN()].n}, dzień ${dayN()%SD+1}/${SD}</b><span>${clock()} · ${WEATHER[S.wx].n} · rok ${yearN()}</span>`;
  $('#lvlLbl').textContent='Poziom '+S.lvl; $('#xpTxt').textContent=`${Math.floor(S.xp)} / ${xpNeed(S.lvl)} PD`;
  $('#xpbar').style.width=Math.min(100,S.xp/xpNeed(S.lvl)*100)+'%';
  $('#coll').textContent=nMade()+'/'+FLOURS.length; $('#achc').textContent=Object.keys(S.ach).length+'/'+ACH.length;
}
const goalMin=()=>S.goalMin!=null?S.goalMin:innerWidth<600; // na telefonie cel domyślnie zwinięty
function render(){
  dirty=false; lastRender=performance.now();
  hudTick();
  const ready=S.plots.filter(isReady).length;
  const busy=Object.values(S.m).filter(m=>m.run.length).length;
  const deliverable=S.orders.filter(canFull).length;
  const affordable=RES.filter(r=>resAvail(r[0])).length;
  $('#tabs').innerHTML=TABS.map(([k,n])=>{let b='';if(k==='pola'&&ready)b=ready;if(k==='prz'&&busy)b=busy;if(k==='targ'&&deliverable)b=deliverable;if(k==='ulep'&&affordable)b=affordable;
    return `<button data-act="tab" data-v="${k}" class="${S.tab===k?'on':''}" ${S.tab===k?'aria-current="page"':''}>${tabIcon(k)}<span>${n}</span>${b?`<span class="badge">${b}</span>`:''}</button>`}).join('');
  const g=GOALS[S.goal];
  document.querySelectorAll('.hud [data-v]').forEach(b=>b.classList.toggle('on',S.tab===b.dataset.v));
  const gm=goalMin();
  $('#goal').innerHTML=g?`<div class="goal ${gm?'min':''}"><span class="gico">${lico(ICO.sprout)}</span><button class="gl" data-act="goalmin" title="${gm?'Pokaż cel':'Zwiń'}">Cel ${S.goal+1} z ${GOALS.length}<span aria-hidden="true">${gm?'▴':'▾'}</span></button><span class="gt">${esc(g[0])}</span><span class="gr">${COIN}+${g[2]} zł</span></div>`:'';
  const sy=window.scrollY;
  // zachowaj fokus klawiatury mimo przebudowy widoku
  const ae=document.activeElement, fk=ae&&ae.dataset&&ae.dataset.act&&$('#view').contains(ae)?'[data-act]'+Object.entries(ae.dataset).map(([k,v])=>`[data-${k.replace(/[A-Z]/g,c=>'-'+c.toLowerCase())}="${CSS.escape(v)}"]`).join(''):null;
  $('#view').innerHTML=({pola:vPola,prz:vPrz,spiz:vSpiz,targ:vTarg,ulep:vUlep,ksiega:vKsiega,kron:vKron})[S.tab]();
  {const h2=$('#view').querySelector('.sechead h2');if(h2&&TABICO[S.tab])h2.insertAdjacentHTML('afterbegin',`<svg class="h2ico" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${TABICO[S.tab]}</svg>`)}
  if(fk){const el=$('#view').querySelector(fk);if(el)el.focus({preventScroll:true})}
  if(Math.abs(window.scrollY-sy)>2) window.scrollTo(0,sy);
  if(sheetMode==='plot') drawSheet(); else if(sheetMode==='list') drawList(); else if(sheetMode==='lineadd') drawLineAdd();
  progress();
}
function progress(){
  document.querySelectorAll('[data-pp]').forEach(el=>{const p=S.plots[+el.dataset.pp];if(p&&p.crop)el.style.width=Math.min(100,p.prog/p.need*100)+'%'});
  document.querySelectorAll('[data-pl]').forEach(el=>{const p=S.plots[+el.dataset.pl];if(!p||!p.crop)return;const r=plotRate(p);el.textContent=r>0?fmtT((p.need-p.prog)/r):'stoi (zima)'});
  document.querySelectorAll('[data-mj]').forEach(el=>{const [id,k]=el.dataset.mj.split(':');const j=S.m[id]&&S.m[id].run[+k];if(!j)return;const t=RECIPES[j.r].t;
    if(el.tagName==='I') el.style.width=Math.min(100,j.prog/t*100)+'%'; else el.textContent=fmtT((t-j.prog)/mSpeed(id));});
  document.querySelectorAll('[data-rjw]').forEach(el=>{const [id,k]=el.dataset.rjw.split(':');el.style.width=(jobPct(id,+k)*100)+'%'});
  document.querySelectorAll('[data-rj]').forEach(el=>{const [id,k]=el.dataset.rj.split(':');el.style.strokeDashoffset=(RING_C*(1-jobPct(id,+k))).toFixed(2)});
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

function vPola(){
  const ready=S.plots.filter(isReady).length, empty=S.plots.filter(p=>!p.crop).length;
  const canRe=S.plots.some(p=>!p.crop&&p.last&&CR[p.last]&&compatible(CR[p.last],p.env)&&!frozen(p)&&S.coins>=seedCost(CR[p.last]));
  let h=`<div class="sec"><div class="sechead"><h2>Poletka</h2><p>Pole przyjmuje uprawy z naszego klimatu i zimą stoi. Pole ryżowe jest zalane wodą. W szklarni rośnie wszystko poza roślinami wodnymi, przez cały rok.</p></div>
  ${calendar()}
  <div class="toolbar"><button class="btn pri harv" data-act="harvestall" ${ready?'':'disabled'}>${lico(ICO.sickle)}Zbierz wszystko${ready?` (${ready})`:''}</button>
   <button class="btn" data-act="replant" ${canRe?'':'disabled'}>${lico(ICO.bag)}Obsiej wolne tym, co rosło</button>
   <span class="sp">${lico(ICO.sprout)}${empty} ${plural(empty,'wolne','wolne','wolnych')} z ${S.plots.length}${working('parobek')?' · parobek zbiera':''}${working('siewca')?' · siewca sieje':''}</span></div><div class="plots">`;
  S.plots.forEach((p,i)=>{const fz=frozen(p);
    if(!p.crop){h+=`<button class="plot empty env-${p.env} ${fz?'winter':''}" data-act="plot" data-i="${i}"><span class="ptop"><span class="tag">${ENV[p.env]}</span>${soilHtml(p)}</span><span class="art">${plotImg(p)}${fz?'<svg class="flake" viewBox="0 0 24 24" aria-hidden="true">'+WXI.mroz+'</svg>':'<span class="plus">+</span>'}</span><span class="pfoot"><span class="pn">${lico(ICO.sprout)}${fz?'Zima':'Wolne'}</span><span class="ps">${fz?'Siew dopiero wiosną':p.last?'Ostatnio: '+esc(CR[p.last].n):'Kliknij, by zasiać'}</span></span></button>`;return}
    const c=CR[p.crop],s=stage(p),rd=isReady(p);
    h+=`<button class="plot env-${p.env} ${rd?'ready':''} ${fz&&!rd?'winter':''}" data-act="plot" data-i="${i}" aria-label="${esc(c.n)}${rd?', gotowe do zbioru':''}">
      <span class="ptop"><span class="tag">${c.r?KIND[c.kind]:ENV[p.env]}</span>${soilHtml(p)}</span><span class="art">${plotImg(p)}</span>
      <span class="pfoot"><span class="pn">${lico(ICO.sprout)}${esc(c.n)}</span>
      <span class="ps">${rd?`<span>Zbierz ${plotYield(p)}×</span>`:`<span>${fz?'uśpione':p.h?'owocuje':'rośnie'}</span><span class="num" data-pl="${i}"></span>`}</span>
      <span class="pbar"><i data-pp="${i}" style="width:${Math.min(100,p.prog/p.need*100)}%"></i></span></span></button>`;});
  const pc=plotCost(); if(S.plots.length<24) h+=`<button class="plot buy" data-act="buyplot" ${S.coins<pc?'disabled':''}><span class="plus">+</span><strong>Nowe poletko</strong><span class="num price">${COIN}${fmtZ(pc)}</span><span class="more">${S.plots.length} z 24</span></button>`;
  return h+`</div></div>`;
}

function millersPanel(){
  if(!S.millers.length) return '';
  return `<div class="sec"><div class="sechead"><h3>Młynarze <span class="more num">${S.millers.length}/${MILLER_MAX}</span></h3><span class="more">Każdy młynarz prowadzi jedno zlecenie naraz.</span></div><div class="plans">${S.millers.map((ml,k)=>{const pl=ml.plan;
    return `<div class="plan ${pl&&!ml.off?'on':''}">${pl?icon(pl.f):MILLER_ART}<div class="pt"><b>Młynarz ${k+1}${pl?': '+esc(ITEMS[pl.f].n):''}</b><span>${pl?`${pl.done}/${pl.n||'∞'} · `:''}${esc(planStatus(ml))}</span>${pl&&pl.n?`<span class="pbar"><i style="width:${Math.min(100,pl.done/pl.n*100)}%"></i></span>`:''}</div>
    <div class="pbtns"><button class="btn sm ${pl?'':'pri'}" data-act="planopen" data-k="${k}">${pl?'Zmień':'Zleć'}</button>${pl?`<button class="btn sm warn" data-act="planstop" data-k="${k}">Stop</button>`:''}<button class="btn sm" data-act="millerOff" data-k="${k}">${ml.off?'Do pracy':'Wolne'}</button></div></div>`}).join('')}</div></div>`;
}
// ---------- PRZETWÓRNIA: LINIE PRODUKCYJNE ----------
// Linia to ścieżka od plonu do mąki. Kolejność ustala gracz (strzałki albo przeciąganie) i sama się nie zmienia.
// Gdy pojawi się surowiec dla nowej ścieżki, jej linia dopisuje się na końcu. Ukryte linie nie wracają same.
const RING_C=2*Math.PI*26;
const jobPct=(id,k)=>{const j=S.m[id].run[k];return j?Math.min(1,j.prog/RECIPES[j.r].t):0};
function ring(pct,attr){return `<svg class="ring" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="26" class="rbg"/><circle cx="30" cy="30" r="26" class="rfg" ${attr||''} style="stroke-dasharray:${RING_C.toFixed(2)};stroke-dashoffset:${(RING_C*(1-pct)).toFixed(2)}"/></svg>`}
// slot przedmiotu jak w ekwipunku: ikona, w rogu ilość na partię, na dole zapas
function slot(id,{tag,count,cls,title}={}){return `<span class="slot ${cls||''}" title="${esc(title||ITEMS[id].n)}">${itemSvg(id)}${tag!=null?`<i class="tag">${tag}</i>`:''}${count!=null?`<b class="cnt">${count}</b>`:''}</span>`}
function lineParts(f){const ch=chainOf(f);return {steps:ch.filter(s=>s.r),crop:ch.find(s=>s.crop)?.crop}}
function lineActive(f){const {steps,crop}=lineParts(f);
  return [crop?crop.out:null,...steps.map(s=>s.out)].some(i=>i&&i!==f&&inv(i)>0)||steps.some(s=>inMachine(s.r)>0)||S.millers.some(m=>m.plan&&m.plan.f===f);}
function syncLines(){if(!Array.isArray(S.lines))S.lines=[];if(!Array.isArray(S.lineHide))S.lineHide=[];if(!Array.isArray(S.lineFold))S.lineFold=[];
  FLOURS.forEach(f=>{if(!S.lines.includes(f)&&!S.lineHide.includes(f)&&lineActive(f))S.lines.push(f)});}
function moveLine(f,to){const a=S.lines,i=a.indexOf(f);if(i<0)return;a.splice(i,1);a.splice(Math.max(0,Math.min(a.length,to)),0,f);dirty=true}
const inQueue=r=>S.m[r.m].q.filter(x=>x===r.id).length;
function unqueue(rid){const r=RECIPES[rid],m=S.m[r.m],n=m.q.filter(x=>x===rid).length;if(!n)return;
  m.q=m.q.filter(x=>x!==rid);Object.entries(r.in).forEach(([i,q])=>{add(i,q*n);gainFeed(i,q*n,'Zwrot z kolejki')});dirty=true}
function lineMiller(f){const k=S.millers.findIndex(m=>m.plan&&m.plan.f===f);
  if(k>=0){const pl=S.millers[k].plan;return `<span class="lml ${S.millers[k].off?'off':''}" title="${esc(planStatus(S.millers[k]))}">${MILLER_ART}<span>Młynarz ${k+1}<small>${pl.done}/${pl.n||'∞'} · ${esc(planStatus(S.millers[k]))}</small></span><button class="btn sm" data-act="planopen" data-k="${k}" data-f="${f}">Zmień</button><button class="btn sm warn" data-act="planstop" data-k="${k}">Stop</button></span>`}
  if(!S.millers.length) return '';
  const free=S.millers.some(m=>!m.plan);
  return `<button class="btn sm ${free?'pri':''}" data-act="planopen" data-f="${f}" title="${free?'Wolny młynarz poprowadzi tę linię':'Wszyscy młynarze są zajęci, możesz któremuś zmienić zlecenie'}">Zleć młynarzowi</button>`;}
function vPrz(){syncLines();
  const own=MACH.filter(x=>S.m[x[0]].owned);
  const sumKind=k=>Object.keys(S.inv).filter(i=>ITEMS[i].kind===k).reduce((s,i)=>s+inv(i),0);
  const jobs=own.reduce((s,[id])=>s+mLoad(id),0), busy=own.filter(([id])=>S.m[id].run.length).length;
  let h=`<div class="sec"><div class="sechead"><h2>Przetwórnia</h2><button class="btn sm" data-act="laddopen">+ Dodaj linię</button></div>
   <div class="kpis"><div class="kpi"><span>Maszyny w pracy</span><b>${busy} / ${own.length}</b></div><div class="kpi"><span>Partie w kolejkach</span><b>${jobs}</b></div><div class="kpi"><span>Plony w spiżarni</span><b>${sumKind('raw')}</b></div><div class="kpi"><span>Półprodukty</span><b>${sumKind('mid')}</b></div><div class="kpi gold"><span>Worki mąki</span><b>${sumKind('flour')}</b></div></div>
   <p class="more">Przeciągnij linię za uchwyt ⠿, żeby zmienić kolejność. Strzałka zwija linię, ✕ ją usuwa (wróci przez „+ Dodaj linię”). Te same opcje są pod prawym przyciskiem na linii. Maszyny kupujesz w Ulepszeniach.</p></div>
   ${millersPanel()}`;
  if(!S.lines.length) h+=`<p class="empty-note">Nic nie czeka na przerobienie. Zbierz plony z poletek, a tu pojawią się ich linie do mąki. Możesz też dodać linię sam przyciskiem „+ Dodaj linię”.</p>`;
  const node=(k,last)=>`<span class="lnode ${last?'flour':''} ${inv(k)?'':'zero'}">${slot(k,{count:inv(k),cls:last?'gain':inv(k)?'ok':''})}<small>${esc(ITEMS[k].n)}</small></span>`;
  const step=r=>{const m=S.m[r.m],own=m.owned,n=canDo(r),q=inQueue(r),runs=m.run.map((j,i)=>j.r===r.id?i:-1).filter(i=>i>=0),k=runs.length?runs[0]:-1,sl=own?mSlots(r.m):0,extra=Object.keys(r.in).filter((x,i)=>i>0);
    // stanowiska maszyny: zielone = ten etap (z postępem), szare = inna partia, puste = wolne
    const sta=sl>1?`<span class="lsta" title="Stanowiska maszyny: ${m.run.length} z ${sl} zajęte">${Array.from({length:sl},(_,i)=>{const j=m.run[i];return j?(j.r===r.id?`<i class="on"><b data-rjw="${r.m}:${i}" style="width:${jobPct(r.m,i)*100}%"></b></i>`:'<i class="other"></i>'):'<i></i>'}).join('')}</span>`:'';
    return `<span class="lstep ${own?'':'miss'} ${k>=0?'busy':''}">
      <span class="lm" title="${esc(M[r.m].n)}: ${esc(r.verb)}">${k>=0?`<span class="ringwrap sm">${ring(jobPct(r.m,k),`data-rj="${r.m}:${k}"`)}${mart(r.m)}${runs.length>1?`<em class="lmx">×${runs.length}</em>`:''}</span>`:mart(r.m)}</span>${sta}
      <small>${esc(M[r.m].n)}${extra.map(x=>` + ${r.in[x]}× ${esc(ITEMS[x].n)}`).join('')}</small>
      ${k>=0||q?`<small class="lq">${runs.map(i=>`<b class="num" data-mj="${r.m}:${i}">${fmtT((r.t-m.run[i].prog)/mSpeed(r.m))}</b>`).join(' · ')}${q?` · ${q} w kolejce <button class="lx" data-act="lunq" data-r="${r.id}" title="Wyjmij z kolejki i zwróć surowce">✕</button>`:''}</small>`:''}
      ${own?`<span class="lbtn"><button class="btn sm" data-act="enq" data-r="${r.id}" data-n="1" ${n?'':'disabled'}>+1</button><button class="btn sm" data-act="enq" data-r="${r.id}" data-n="5" ${n?'':'disabled'}>+5</button><button class="btn sm" data-act="enq" data-r="${r.id}" data-n="999" ${n?'':'disabled'}>max${n>1?' '+n:''}</button></span>`:`<span class="req">brak maszyny</span>`}</span>`};
  h+=`<div class="lines">${S.lines.map((f,ix)=>{const {steps,crop}=lineParts(f);
    const fold=S.lineFold.includes(f),busy=steps.some(s=>S.m[s.r.m].run.some(j=>j.r===s.r.id)),last=steps.length?steps[steps.length-1].out:f;
    return `<div class="lrow ${fold?'fold':''}" data-line="${f}"><div class="lhead"><span class="lgrip" draggable="true" data-lf="${f}" title="Przeciągnij, żeby przestawić">⠿</span>
      <button class="lx lfold" data-act="lfold" data-f="${f}" title="${fold?'Rozwiń':'Zwiń'} linię" aria-expanded="${!fold}">${fold?'▸':'▾'}</button>${icon(f)}<b>${esc(ITEMS[f].n)}</b>
      ${fold?`<span class="lsum">${busy?'<i class="dot"></i>pracuje · ':''}masz ${inv(last)}</span>`:''}
      <span class="lmw">${lineMiller(f)}</span><button class="lx lhide" data-act="lhide" data-f="${f}" title="Usuń linię">✕</button></div>
      ${fold?'':`<div class="lpath">${crop?node(crop.out):''}${steps.map((s,i)=>`<span class="larr">${ARROW}</span>${step(s.r)}<span class="larr">${ARROW}</span>${node(s.out,i===steps.length-1)}`).join('')}</div>`}</div>`}).join('')}</div>`;
  return h;
}
// arkusz: dodaj linię dowolnej mąki
function openLineAdd(){sheetMode='lineadd';sheetPlot=-1;drawLineAdd();$('#sheet').hidden=false;$('#panel').scrollTop=0}
function drawLineAdd(){syncLines();
  let h=`<div class="ph"><div><h2>Dodaj linię</h2><p>Linia trafi na koniec listy. Szare mąki wymagają maszyny albo uprawy, której jeszcze nie masz.</p></div><button class="btn sm" data-act="close">Zamknij</button></div>`;
  CATS.slice(1).forEach((c,ci)=>{const fl=FLOURS.filter(f=>ITEMS[f].cat===ci+1&&!S.lines.includes(f));if(!fl.length)return;
    h+=`<div class="grp">${esc(c)}</div><div class="lgrid">${fl.map(f=>{const pr=chainProblem(f);return `<button class="lpick ${pr?'dim':''}" data-act="ladd" data-f="${f}" title="${esc(pr||ITEMS[f].src)}">${slot(f,{count:inv(f)})}<span><b>${esc(ITEMS[f].n)}</b><small>${pr?esc(pr):S.made[f]?'robiona':'jeszcze nie robiona'}${S.lineHide.includes(f)?' · usunięta':''}</small></span></button>`}).join('')}</div>`});
  $('#panel').innerHTML=h;}
const ioPlain=obj=>Object.entries(obj).map(([k,q])=>`${q}× ${ITEMS[k].n}`).join(' + ');

// ---------- SPIŻARNIA: PÓŁKI, MIEJSCA DO ROZŁOŻENIA I REGUŁY MIEJSC ----------
// Każdy rodzaj towaru zajmuje jedno miejsce. Nowe towary trafiają na pierwsze wolne miejsce na półkach,
// potem do „Do rozłożenia” (TRAY_N miejsc). Co się nie zmieści, leży obok i powoli się psuje.
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
  const on=placed(),keys=new Set([...Object.keys(S.inv),...S.shop.filter(x=>x&&x.q>0).map(x=>x.k)]);
  for(const k of keys){if(hold(k)<=0||on.has(k))continue;
    let i=findSlot(); if(i>=0){S.shelf[i]=k;on.add(k);dirty=true;continue}
    const j=findTray(); if(j>=0){S.tray[j]=k;on.add(k);dirty=true}}}
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
  dirty=true;return true}
function moveToTray(k,j){if(j==null||j<0){j=findTray();if(j<0){toast('Miejsce „Do rozłożenia” jest pełne.');return false}}
  const src=locate(k),other=S.tray[j]&&hold(S.tray[j])>0?S.tray[j]:null;
  if(src.where==='tray'){if(src.i===j)return false;S.tray[j]=k;S.tray[src.i]=other;dirty=true;return true}
  if(other){toast('To miejsce do rozłożenia jest zajęte.');return false}
  if(src.where==='shelf'){S.shelf[src.i]=null;if(rule(src.i)==='pin')delete S.slotRule[src.i]}
  S.tray[j]=k;dirty=true;return true}
function toShelf(k){const i=findSlot();if(i<0){toast('Na półkach nie ma wolnego miejsca.');return false}return moveToShelf(k,i)}
// --- interfejs
let pSel=null, pMove=false, dragKey=null, dragging=false, ptrDown=false, ctxOpen=false;
const PIN='<svg class="mark-pin" viewBox="0 0 16 16" aria-hidden="true"><path d="M6 1h4l-.5 4 2.5 2.5V9H8.7L8 15l-.7-6H4V7.5L6.5 5z" fill="currentColor"/></svg>';
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
       <button class="btn sm ${pMove?'on':''}" data-act="pmove">${pMove?'Anuluj':'Przenieś'}</button>${loc.where==='shelf'?`<button class="btn sm" data-act="ctxtray" data-k="${k}">Do rozłożenia</button>`:`<button class="btn sm" data-act="ctxshelf" data-k="${k}">Na półkę</button>`}<button class="btn sm" data-act="pdesel" aria-label="Zamknij">✕</button></div></div>`;}
  else {pSel=null;pMove=false}
  h+=`<p class="more">Kliknij towar, żeby wystawić go w sklepie albo przenieść, albo przeciągnij go myszą. Prawy przycisk na miejscu albo nazwie półki (na telefonie przytrzymanie) daje opcje i zmianę nazwy półki. <span class="shopt">Niebieska liczba</span> to towar wystawiony w sklepie.</p></div>
   <div class="wallwrap"><div class="wall" style="--rows:${rows}">${shelfOrder().map(s=>{const p=S.shelfPos[s];return `<div class="shelf" style="grid-column:${p.x+1}/span ${SHELF_W};grid-row:${p.y+1}"><span class="slabel" data-sh="${s}" title="Prawy przycisk: zmień nazwę">${esc((S.shelfNames||[])[s]||`Półka ${s+1}`)}</span><div class="slots8">${sh.slice(s*SHELF_W,(s+1)*SHELF_W).map((k,j)=>pslotHtml(k,`data-act="pslot" data-i="${s*SHELF_W+j}"`,rule(s*SHELF_W+j))).join('')}</div></div>`}).join('')}</div></div>
   <div class="tray ${over.length?'rot':''}"><div class="trayhead"><h3>Do rozłożenia <span class="more num">${S.tray.filter(k=>k&&hold(k)>0).length} / ${TRAY_N}</span></h3><p>${over.length?`Brakuje miejsca dla ${over.length} ${plural(over.length,'towaru','towarów','towarów')}: leżą obok i co ${ROT_EVERY/60} min psuje się 5% każdego. Dokup półkę albo wystaw nadmiar w sklepie.`:'Podręczne miejsca na towary, które nie mają miejsca na półkach albo które sam tu odłożysz.'}</p></div>
    <div class="traygrid">${S.tray.map((k,j)=>pslotHtml(k&&hold(k)>0?k:null,`data-act="pslot" data-t="${j}"`,null)).join('')}</div>
    ${over.length?`<div class="overrow"><span class="lbl">Leży obok · psuje się</span><div class="traygrid">${over.map(k=>pslotHtml(k,`data-act="pslot" data-o="${k}"`,null)).join('')}</div></div>`:''}</div>`;
  return h;
}
// --- menu pod prawym przyciskiem
// menu poletka pod prawym przyciskiem: gleba, nawadnianie, przebudowa
let ctxAt=null;
function showPlotCtx(i,x,y){const m=$('#ctx'),p=S.plots[i];if(!m||!p)return;ctxAt={plot:i,x,y};
  const sc=soilCost(p),items=[];
  items.push(p.soil<SOILMAX?['psoil',S.coins<sc,'⬆',`Użyźnij glebę: ${p.soil} → ${p.soil+1}`,`+20% plonu · ${fmtZ(sc)}`]:['',true,'✓','Gleba na maksimum',`${SOILMAX} / ${SOILMAX}`]);
  items.push(p.spr?['',true,'✓','Nawadnianie działa','+20% tempa, chroni przed upałem']:['pspr',S.coins<SPRCOST,'≈','Zamontuj nawadnianie',`+20% tempa · ${fmtZ(SPRCOST)}`]);
  Object.keys(ENV).filter(e=>e!==p.env).forEach(e=>{const lk=S.lvl<ENVREQ[e];
    items.push(['penv',!!p.crop||lk||S.coins<ENVCOST[e],'⌂',`Przebuduj na: ${ENV[e].toLowerCase()}`,p.crop?'najpierw zbierz albo usuń roślinę':lk?`od poziomu ${ENVREQ[e]}`:ENVCOST[e]?fmtZ(ENVCOST[e]):'za darmo',e])});
  m.innerHTML=`<div class="ctxh">Poletko ${i+1} · ${ENV[p.env]} · gleba ${p.soil}/${SOILMAX}</div>${items.map(([a,dis,ic,t,s,e])=>`<button class="ctxi" ${a?`data-act="${a}" data-i="${i}"`:''} ${e?`data-e="${e}"`:''} ${dis?'disabled':''}><span class="ci"><span class="x">${ic}</span></span><span><b>${t}</b>${s?`<small>${s}</small>`:''}</span></button>`).join('')}`;
  m.hidden=false;ctxOpen=true;const w=m.offsetWidth,hh=m.offsetHeight;
  m.style.left=Math.max(8,Math.min(x,innerWidth-w-8))+'px';m.style.top=Math.max(8,Math.min(y,innerHeight-hh-8))+'px';}
const replot=()=>{render();if(ctxAt&&ctxAt.plot!=null)showPlotCtx(ctxAt.plot,ctxAt.x,ctxAt.y)};
function showLineCtx(f,x,y){const m=$('#ctx');if(!m)return;const i=S.lines.indexOf(f),fold=S.lineFold.includes(f);
  const it=[['lfold',fold?'▸':'▾',fold?'Rozwiń linię':'Zwiń linię',''],i>0?['lmove','↑','Przesuń wyżej','',-1]:null,i<S.lines.length-1?['lmove','↓','Przesuń niżej','',1]:null,['lhide','✕','Usuń linię','Wróci przez „+ Dodaj linię”']].filter(Boolean);
  m.innerHTML=`<div class="ctxh">${esc(ITEMS[f].n)}</div>${it.map(([a,ic,t,s,d])=>`<button class="ctxi" data-act="${a}" data-f="${f}" ${d!=null?`data-d="${d}"`:''}><span class="ci"><span class="x">${ic}</span></span><span><b>${t}</b>${s?`<small>${s}</small>`:''}</span></button>`).join('')}`;
  m.hidden=false;ctxOpen=true;const w=m.offsetWidth,hh=m.offsetHeight;
  m.style.left=Math.max(8,Math.min(x,innerWidth-w-8))+'px';m.style.top=Math.max(8,Math.min(y,innerHeight-hh-8))+'px';}
function hideCtx(){ctxAt=null;const m=$('#ctx');if(m)m.hidden=true;ctxOpen=false}
function showCtx(el,x,y){const m=$('#ctx');if(!m)return;let items=[],title='';
  if(el.dataset.i!=null){const i=+el.dataset.i,k=S.shelf[i],r=rule(i),q=k?hold(k):0;
    title=r==='block'?'Miejsce zawsze puste':k?ITEMS[k].n:'Puste miejsce';
    if(k&&r!=='pin') items.push(['ctxpin',`data-i="${i}"`,PIN,'Zawsze tutaj','To miejsce zostaje dla tego towaru']);
    if(r!=='block') items.push(['ctxblock',`data-i="${i}"`,BLOCK,'Zawsze puste','Nic tu nie trafi']);
    if(r) items.push(['ctxclear',`data-i="${i}"`,'<span class="x">✕</span>','Usuń regułę',r==='pin'?'Zdejmij przypięcie':'Zdejmij blokadę']);
    if(k&&q) items.push(['ctxtray',`data-k="${k}"`,'<span class="x">⇣</span>','Odłóż do rozłożenia','']);
    items.push(['ctxname',`data-s="${Math.floor(i/SHELF_W)}"`,'<span class="x">✎</span>','Zmień nazwę półki',esc((S.shelfNames||[])[Math.floor(i/SHELF_W)]||`Półka ${Math.floor(i/SHELF_W)+1}`)]);}
  else if(el.dataset.sh!=null){const s=+el.dataset.sh;title=(S.shelfNames||[])[s]||`Półka ${s+1}`;items.push(['ctxname',`data-s="${s}"`,'<span class="x">✎</span>','Zmień nazwę półki','']);}
  else {const k=el.dataset.dk;if(!k){hideCtx();return}title=ITEMS[k].n;
    items.push(['ctxshelf',`data-k="${k}"`,'<span class="x">⇡</span>','Odłóż na półkę','Na pierwsze wolne miejsce']);
    if(el.dataset.o!=null) items.push(['ctxtray',`data-k="${k}"`,'<span class="x">⇣</span>','Do rozłożenia','']);}
  if(!items.length){hideCtx();return}
  m.innerHTML=`<div class="ctxh">${esc(title)}</div>${items.map(([a,d,ic,t,s])=>`<button class="ctxi" data-act="${a}" ${d}><span class="ci">${ic}</span><span><b>${t}</b>${s?`<small>${s}</small>`:''}</span></button>`).join('')}`;
  m.hidden=false;ctxOpen=true;const w=m.offsetWidth,hh=m.offsetHeight;
  m.style.left=Math.max(8,Math.min(x,innerWidth-w-8))+'px';m.style.top=Math.max(8,Math.min(y,innerHeight-hh-8))+'px';}

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
  if(nextL) h+=`<button class="ware lock" data-act="tab" data-v="ulep"><span class="plus">${LOCK}</span>Więcej miejsca: Lada sklepowa w Ulepszeniach</button>`;
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
    h+=`<div class="item ${has?'has':''}"><h3>${n}</h3><p>${d}</p><div class="ft">${has?`<span class="owned">${on?'Pracuje':'Ma wolne'}</span><button class="btn sm ${on?'':'ok'}" data-act="toggleW" data-w="${id}">${on?'Daj wolne':'Wezwij do pracy'}</button>`
      :S.lvl<lv?`<span class="req">Od poziomu ${lv}</span><span class="num">${fmtZ(c)}</span>`:`<span class="num">${fmtZ(c)}</span><button class="btn sm pri" data-act="hire" data-w="${id}" ${S.coins<c?'disabled':''}>Zatrudnij</button>`}</div></div>`});
  const mk=S.millers.length, mc=millerCost(mk), mr=millerReq(mk);
  h+=`<div class="item ${mk?'has':''}"><div class="ih"><h3>Młynarze</h3><span style="margin-left:auto">${lvdots(mk,MILLER_MAX)}</span></div><p>Każdy młynarz prowadzi jedno zlecenie: wybraną mąkę w wybranej ilości albo bez końca. Zlecenia dajesz w Przetwórni albo w Księdze mąk.</p>
    <div class="ft">${mk>=MILLER_MAX?'<span class="owned">Komplet</span>':S.lvl<mr?`<span class="req">${mk?'Kolejny':'Pierwszy'} od poziomu ${mr}</span><span class="num">${fmtZ(mc)}</span>`:`<span class="num">${fmtZ(mc)}</span><button class="btn sm pri" data-act="hireMiller" ${S.coins<mc?'disabled':''}>Zatrudnij ${mk?'kolejnego':''}</button>`}</div></div>`;
  h+=`</div></div><div class="sec"><div class="sechead"><h2>Usprawnienia</h2><p>Działają na całe gospodarstwo. Każdy kolejny stopień kosztuje więcej i wymaga wyższego poziomu gospodarza.</p></div><div class="shop">`;
  RES.forEach(([id,n,d,mx])=>{const l=res(id),c=resCost(id),rq=resReq(id);
    h+=`<div class="item ${l>=mx?'has':''}"><div class="ih"><h3>${n}</h3><span class="more num" style="margin-left:auto">${l}/${mx}</span></div>${lvdots(l,mx)}<p>${d}</p>
    <div class="ft">${l>=mx?'<span class="owned">Ukończone</span>':S.lvl<rq?`<span class="req">Następny stopień od poziomu ${rq}</span><span class="num">${fmtZ(c)}</span>`:`<span class="num">${fmtZ(c)}</span><button class="btn sm pri" data-act="research" data-r="${id}" ${S.coins<c?'disabled':''}>Wdroż stopień ${l+1}</button>`}</div></div>`});
  h+=`</div></div><div class="sec"><div class="sechead"><h2>Maszyny</h2><p>Każda maszyna ma ${MLVMAX} poziomów: +20% tempa na poziom, drugie stanowisko od poziomu 4, trzecie od poziomu 8.</p></div><div class="shop">`;
  MACH.forEach(([id])=>{const mm=M[id],m=S.m[id],lk=S.lvl<mm.lv;
    h+=`<div class="item ${m.owned?'has':''}"><div class="ih">${mart(id)}<div><h3>${mm.n}</h3>${m.owned?lvdots(m.lvl,MLVMAX)+`<small class="more">${mSlots(id)} ${plural(mSlots(id),'stanowisko','stanowiska','stanowisk')} · tempo ×${mSpeed(id).toFixed(2)}</small>`:''}</div></div><p>${mm.d}</p>
    <div class="ft">${!m.owned?(lk?`<span class="req">Od poziomu ${mm.lv}</span><span class="num">${fmtZ(mm.p)}</span>`:`<span class="num">${fmtZ(mm.p)}</span><button class="btn sm" data-act="buym" data-m="${id}" ${S.coins<mm.p?'disabled':''}>Kup</button>`):m.lvl<MLVMAX?`<span class="num">${fmtZ(mUpCost(id))}</span><button class="btn sm" data-act="upm" data-m="${id}" ${S.coins<mUpCost(id)?'disabled':''}>Ulepsz do poz. ${m.lvl+1}</button>`:'<span class="owned">Poziom maksymalny</span>'}</div></div>`});
  const pc=plotCost();
  h+=`</div></div><div class="sec"><div class="sechead"><h2>Ziemia</h2></div><div class="shop">
    <div class="item"><h3>Nowe poletko</h3><p>Masz ${S.plots.length} z 24 poletek. Każde kolejne jest droższe.</p><div class="ft"><span class="num">${fmtZ(pc)}</span><button class="btn sm" data-act="buyplot" ${S.coins<pc||S.plots.length>=24?'disabled':''}>Kup</button></div></div>
    <div class="item"><h3>Półka w spiżarni</h3><p>Masz ${S.shelves} z ${SHELF_MAX} półek, czyli ${S.shelves*SHELF_W} miejsc na rodzaje towarów. Bez miejsca towar leży na podłodze i się psuje.</p><div class="ft"><span class="num">${fmtZ(shelfCost())}</span><button class="btn sm" data-act="buyshelf" ${S.coins<shelfCost()||S.shelves>=SHELF_MAX?'disabled':''}>Kup</button></div></div>
    <div class="item"><h3>Gleba, nawadnianie, szklarnie</h3><p>Kliknij prawym przyciskiem poletko w zakładce Pola (na telefonie przytrzymaj). Gleba ma ${SOILMAX} poziomów, każdy daje +20% plonu. Nawadnianie (${fmtZ(SPRCOST)}) przyspiesza wzrost o 20% i chroni przed upałem. Szklarnia: ${fmtZ(ENVCOST.szklarnia)} od poziomu ${ENVREQ.szklarnia}. Pole ryżowe: ${fmtZ(ENVCOST.mokre)} od poziomu ${ENVREQ.mokre}.</p></div>
  </div></div>`;
  return h;
}

function vKsiega(){
  const made=nMade();
  let h=`<div class="sec"><div class="prog"><span class="big">${made}<small> / ${FLOURS.length} mąk</small></span><span class="track"><i style="width:${made/FLOURS.length*100}%"></i></span></div>
  <div class="chips">${CATS.map((c,i)=>`<button class="chip ${S.cat===i?'on':''}" data-act="cat" data-v="${i}">${i?c:'Wszystkie'} <span class="num">${i?FLOURS.filter(f=>ITEMS[f].cat===i&&S.made[f]).length+'/'+FLOURS.filter(f=>ITEMS[f].cat===i).length:''}</span></button>`).join('')}</div></div><div class="book">`;
  FLOURS.filter(f=>!S.cat||ITEMS[f].cat===S.cat).forEach(f=>{const it=ITEMS[f],n=S.made[f]||0,steps=chainOf(f),alts=(BYM[f]||[]).slice(1);
    h+=`<article class="fc ${n?'made':''}"><div class="fh">${icon(f)}<div><h3>${esc(it.n)}</h3><p class="src">${esc(it.src)}</p></div><span class="st">${n?`Wyprodukowano<br>${n} szt.`:'Jeszcze nie'}</span></div>
    <ol class="chain">${steps.map(s=>{
      if(s.crop){const lk=!unlocked(s.crop);return `<li class="${lk?'lockd':'grow'}"><span><span class="m">Uprawa${lk?` (od poz. ${s.crop.lvl})`:''}</span> ${esc(s.crop.n)} <span class="lat">${esc(s.crop.lat)}</span> · ${ENV[s.crop.env].toLowerCase()} · ${fmtT(s.crop.g)}${s.crop.r?`, potem co ${fmtT(s.crop.r)}`:''} · nasiona ${seedCost(s.crop)} zł</span></li>`}
      const own=S.m[s.r.m].owned;
      return `<li class="${own?'':'miss'}"><span><span class="m">${M[s.r.m].n}${own?'':' (brak)'}</span> ${esc(s.r.verb.toLowerCase())}: ${ioTxt(s.r.in)} → ${ioTxt(s.r.out)}</span></li>`}).join('')}</ol>
    ${alts.map(r=>`<p class="note">Druga ścieżka: ${M[r.m].n}, ${esc(r.verb.toLowerCase())} z ${ioTxt(r.in)}.</p>`).join('')}
    ${it.note?`<p class="note">${esc(it.note)}</p>`:''}
    <div class="fcf"><span class="more">W sklepie: ${unitPrice(f)} zł${S.hot===f?' (dziś ×1,4)':''} · masz ${inv(f)}</span>${S.millers.length?`<button class="btn sm" data-act="planopen" data-f="${f}">Zleć młynarzowi</button>`:''}</div></article>`;});
  return h+`</div>`;
}

function vKron(){
  const nA=Object.keys(S.ach).length;
  const st=[['Czas gospodarowania',fmtT(S.t)],['Rok i pora',`${yearN()} · ${SEASONS[seasonN()].n}`],['Zarobione łącznie',fmtZ(S.earned)],['Zebrane plony',S.st.harv+' szt.'],['Partie z maszyn',S.st.crafted],['Renoma',`${S.pop.l} · ${POP_NAMES[S.pop.l-1]}`],['Klienci w sklepie',S.st.cust],['Sprzedane towary',S.st.sold+' szt.'],['Zamówienia',S.st.orders],['Mąki w księdze',`${nMade()} / 70`]];
  let h=`<div class="sec"><div class="sechead"><h2>Kronika gospodarstwa</h2></div><div class="kpis">${st.map(([a,b])=>`<div class="kpi"><span>${a}</span><b>${b}</b></div>`).join('')}</div></div>
  <div class="sec"><div class="sechead"><h2>Osiągnięcia <span class="more num">${nA}/${ACH.length}</span></h2><p>Każde osiągnięcie wypłaca nagrodę od razu.</p></div><div class="achs">`;
  ACH.forEach(([id,n,d,,rw])=>{const on=!!S.ach[id];h+=`<div class="ach ${on?'':'off'}">${MEDAL(on)}<div class="at"><b>${esc(n)}</b>${esc(d)} · <span class="num">${rw} zł</span></div></div>`});
  h+=`</div></div><div class="sec"><div class="sechead"><h2>Zapis gry</h2><p>Gra zapisuje się sama co kilka sekund. Zminimalizowana dalej pracuje, a po zamknięciu czas w gospodarstwie stoi. Kopia w pliku chroni postęp, gdy wyczyścisz dane przeglądarki albo przeniesiesz grę na inny komputer.</p></div>
   <div class="toolbar"><button class="btn pri" data-act="export">Zapisz kopię do pliku</button><button class="btn" data-act="import">Wczytaj kopię z pliku</button></div></div>
   <div class="sec"><div class="sechead"><h2>Ustawienia</h2><span class="more">Aura Fields · wersja ${VERSION}</span></div><div class="toolbar">
   <button class="btn" data-act="sound">${S.sound?'Wycisz dźwięki':'Włącz dźwięki'}</button>
   <button class="btn warn" data-act="reset">${resetArm?'Kliknij jeszcze raz, by skasować postęp':'Zacznij od nowa'}</button></div></div>`;
  return h;
}

// ---------- ARKUSZE ----------
let sheetPlot=-1, sheetMode=null, clearArm=false, resetArm=false, draft=null;
function openPlot(i){sheetPlot=i;sheetMode='plot';clearArm=false;drawSheet();$('#sheet').hidden=false;$('#panel').scrollTop=0}
function closeSheet(){$('#sheet').hidden=true;sheetPlot=-1;sheetMode=null}
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
    ${fz?`<p class="empty-note">Ziemia jest zamarznięta. Siać pod gołym niebem możesz od wiosny, czyli za <b class="num" data-ts="0"></b>. W tym czasie możesz użyźnić glebę albo przebudować poletko na szklarnię.</p>`:''}<p class="more">Glebę, nawadnianie i przebudowę poletka znajdziesz pod prawym przyciskiem na poletku.</p>`;
    if(!fz) CROP_GROUPS.forEach(g=>{h+=`<div class="grp">${g}</div><div class="seeds">`;
      CROPS.filter(c=>c.grp===g).forEach(c=>{const ok=compatible(c,p.env),lk=!unlocked(c),cost=seedCost(c),af=S.coins>=cost;
        const emptyCompat=S.plots.filter(q=>!q.crop&&compatible(c,q.env)&&!frozen(q)).length;
        const est=c.g/plotRate({...p,crop:c.id}), late=ok&&!lk&&est>tW;
        h+=`<div class="seed ${lk?'lock':ok?'':'off'}"><span class="sv">${cropThumb(c.id,3)}</span><div class="si"><b>${esc(c.n)}</b>
        <span>${lk?`odblokujesz na poziomie ${c.lvl}`:ok?`${fmtT(est)} · ${plotYield(p,c.id)}× plon${c.r?' · wieloletnia':''}`:`wymaga: ${ENV[c.env].toLowerCase()}`}</span>${late?'<br><span class="down">nie zdąży przed zimą, przezimuje uśpiona</span>':''}<br><span>→ ${c.flours.length} ${plural(c.flours.length,'mąka','mąki','mąk')} · ${price(c.out)} zł/szt. surowo</span></div>
        <div class="sb"><button class="btn sm ${ok&&af&&!lk?'pri':''}" data-act="plant" data-c="${c.id}" ${ok&&af&&!lk?'':'disabled'}>${cost} zł</button>
        ${ok&&!lk&&!c.r&&emptyCompat>1?`<button class="btn sm" data-act="plantall" data-c="${c.id}" ${af?'':'disabled'} title="Zasiej na wszystkich wolnych pasujących poletkach">×${emptyCompat}</button>`:''}</div></div>`;});
      h+=`</div>`;});
  }
  panel.innerHTML=h; panel.scrollTop=sc; progress();}

// arkusz zlecenia dla młynarza: wybór mąki z listy, ilość suwakiem albo „bez końca”
function openPlan(k,f){
  if(k==null){k=S.millers.findIndex(m=>!m.plan); if(k<0) k=0;}
  const cur=S.millers[k].plan;
  draft={k,f:f||(cur&&cur.f)||FLOURS.find(x=>!S.made[x]&&feasible(x))||FLOURS.find(x=>feasible(x))||'m_psz',n:cur?(cur.n||10):10,inf:cur?!cur.n:false};
  sheetMode='plan'; sheetPlot=-1;
  const opts=CATS.slice(1).map((c,ci)=>`<optgroup label="${esc(c)}">${FLOURS.filter(x=>ITEMS[x].cat===ci+1).map(x=>{const pr=chainProblem(x);return `<option value="${x}" ${x===draft.f?'selected':''}>${S.made[x]?'✓ ':''}${esc(ITEMS[x].n)}${pr?' (niedostępna)':''}</option>`}).join('')}</optgroup>`).join('');
  $('#panel').innerHTML=`<div class="ph"><div><h2>Zlecenie dla młynarza ${k+1}</h2><p>Młynarz sam dodaje do kolejek kolejne etapy obróbki, gdy w spiżarni są surowce. Plony musisz zebrać sam albo przez parobka.</p></div><button class="btn sm" data-act="close">Zamknij</button></div>
   ${S.millers.length>1?`<div class="chips" style="margin-bottom:12px">${S.millers.map((m,j)=>`<button class="chip ${j===k?'on':''}" data-act="planopen" data-k="${j}" data-f="${draft.f}">Młynarz ${j+1}${m.plan?' · zajęty':''}</button>`).join('')}</div>`:''}
   <div class="form">
    <label class="fl2" for="planF">Mąka</label>
    <select id="planF">${opts}</select>
    <div id="planSum" class="plansum"></div>
    <label class="fl2" for="planN">Ilość worków: <b id="planNv" class="num"></b></label>
    <div class="rng"><input type="range" id="planN" min="1" max="100" step="1" value="${draft.n}"><span class="qbtns">${[1,5,10,25,50,100].map(n=>`<button class="btn sm" data-act="planq" data-n="${n}">${n}</button>`).join('')}</span></div>
    <label class="chk"><input type="checkbox" id="planInf" ${draft.inf?'checked':''}> Bez końca, aż zatrzymam</label>
   </div>
   <div class="envs"><button class="btn pri" data-act="planok">Zleć</button>${cur?`<button class="btn warn" data-act="planstop" data-k="${k}">Zatrzymaj obecne</button>`:''}<button class="btn" data-act="close">Anuluj</button></div>`;
  $('#sheet').hidden=false; $('#panel').scrollTop=0;
  $('#planF').addEventListener('change',e=>{draft.f=e.target.value;planSum()});
  $('#planN').addEventListener('input',e=>{draft.n=+e.target.value;planSum()});
  $('#planInf').addEventListener('change',e=>{draft.inf=e.target.checked;planSum()});
  planSum();
}
function planSum(){if(!draft)return;const f=draft.f,steps=chainOf(f),pr=chainProblem(f),other=S.millers.findIndex((m,j)=>j!==draft.k&&m.plan&&m.plan.f===f);
  $('#planNv').textContent=draft.inf?'bez końca':draft.n; $('#planN').disabled=draft.inf;
  $('#planSum').innerHTML=`<div class="fh" style="display:flex;gap:10px;align-items:center">${icon(f)}<div><b>${esc(ITEMS[f].n)}</b><br><span class="more">${esc(ITEMS[f].src)} · ${unitPrice(f)} zł za worek · masz ${inv(f)}</span></div></div>
   <p class="more">Etapy: ${steps.map(s=>s.crop?`uprawa (${esc(s.crop.n)})`:M[s.r.m].n).join(' → ')}</p>
   ${pr?`<p class="req">${esc(pr)}. Młynarz zacznie, gdy to uzupełnisz.</p>`:''}${other>=0?`<p class="req">Tę mąkę prowadzi już młynarz ${other+1}.</p>`:''}`;}

// ---------- ZAPIS DO PLIKU ----------
function exportSave(){save();const blob=new Blob([JSON.stringify(S)],{type:'application/json'});const a=document.createElement('a');
  const d=new Date();a.href=URL.createObjectURL(blob);a.download=`aura-fields-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}.json`;
  document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1000);toast('Kopia zapisu pobrana do pliku');}
function importSave(){const inp=document.createElement('input');inp.type='file';inp.accept='.json,application/json';
  inp.onchange=()=>{const f=inp.files[0];if(!f)return;f.text().then(t=>{const s=JSON.parse(t);if(!s||s.v!==3||!s.plots)throw 0;
    S=repair(s);if(S._arrange){delete S._arrange;placeItems()}stageCache=[];closeSheet();save();render();toast('Wczytano zapis gry','gold')}).catch(()=>toast('To nie jest plik zapisu tej gry.'))};
  inp.click();}

// ---------- AKCJE ----------
function pay(c,src){if(S.coins<c)return false;S.coins-=c;dirty=true;if(src&&c)spendFeed(c,src);return true}
const ACT={
 tab:d=>{S.tab=d.v;closeSheet();render();window.scrollTo(0,0)},
 plot:d=>{const i=+d.i,p=S.plots[i];if(isReady(p)){harvest(i);render()}else openPlot(i)},
 harvest1:()=>{harvest(sheetPlot);closeSheet();render()},
 plant:d=>{if(plant(sheetPlot,d.c)){closeSheet();render()}},
 plantall:d=>{let n=0;S.plots.forEach((p,i)=>{if(!p.crop&&compatible(CR[d.c],p.env)&&plant(i,d.c,n>0))n++});toast(`Zasiano ${n}× ${CR[d.c].n}`);closeSheet();render()},
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
   pSel=k&&hold(k)>0&&pSel!==k?k:null;pMove=false;render()},
 pmove:()=>{pMove=!pMove;render()},
 pdesel:()=>{pSel=null;pMove=false;render()},
 ctxpin:d=>{hideCtx();const i=+d.i;if(S.shelf[i]){S.slotRule[i]='pin';toast(`${ITEMS[S.shelf[i]].n}: zawsze na tym miejscu`)}render()},
 ctxblock:d=>{hideCtx();const i=+d.i,k=S.shelf[i];if(k&&inv(k)>0){S.shelf[i]=null;delete S.slotRule[i];if(!moveToTray(k))placeItems()}S.shelf[i]=null;S.slotRule[i]='block';render()},
 ctxclear:d=>{hideCtx();const i=+d.i;delete S.slotRule[i];if(S.shelf[i]&&!inv(S.shelf[i]))S.shelf[i]=null;render()},
 ctxtray:d=>{hideCtx();moveToTray(d.k);pMove=false;render()},
 ctxshelf:d=>{hideCtx();toShelf(d.k);pMove=false;render()},
 buyshelf:()=>{if(S.shelves>=SHELF_MAX||!pay(shelfCost(),'Nowa półka w spiżarni'))return;S.shelves++;S.shelf.push(...Array(SHELF_W).fill(null));ensureShelfPos();placeItems();snd('level');render()},
 enq:d=>{if(enqueue(+d.r,+d.n))snd('click');render()},
 clearq:d=>{clearQueue(d.m);render()},
 lmove:d=>{hideCtx();const i=S.lines.indexOf(d.f);moveLine(d.f,i+(+d.d));render()},
 lfold:d=>{hideCtx();S.lineFold=S.lineFold.includes(d.f)?S.lineFold.filter(x=>x!==d.f):[...S.lineFold,d.f];render()},
 lhide:d=>{hideCtx();S.lines=S.lines.filter(x=>x!==d.f);if(!S.lineHide.includes(d.f))S.lineHide.push(d.f);render()},
 lshow:d=>{S.lineHide=S.lineHide.filter(x=>x!==d.f);if(!S.lines.includes(d.f))S.lines.push(d.f);render()},
 laddopen:()=>openLineAdd(),
 ladd:d=>{S.lineHide=S.lineHide.filter(x=>x!==d.f);if(!S.lines.includes(d.f))S.lines.push(d.f);closeSheet();render()},
 lunq:d=>{unqueue(+d.r);render()},
 buym:d=>{const mm=M[d.m];if(S.m[d.m].owned||S.lvl<mm.lv||!pay(mm.p,mm.n))return;S.m[d.m].owned=true;S.selM=d.m;toast(`${mm.n} stoi w przetwórni`,'gold');snd('level');render()},
 upm:d=>{const m=S.m[d.m];if(!m.owned||m.lvl>=MLVMAX||!pay(mUpCost(d.m),`${M[d.m].n}: poziom ${m.lvl+1}`))return;m.lvl++;snd('level');render()},
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
 hire:d=>{const w=WORK.find(x=>x[0]===d.w);if(S.work[d.w]||S.lvl<w[4]||!pay(w[3],w[1]))return;S.work[d.w]=true;S.auto[d.w]=true;toast(`${w[1]} zaczyna pracę`,'gold');snd('level');render()},
 hireMiller:()=>{const k=S.millers.length;if(k>=MILLER_MAX||S.lvl<millerReq(k)||!pay(millerCost(k),`Młynarz ${k+1}`))return;S.millers.push({plan:null,off:false});toast(`Młynarz ${k+1} zaczyna pracę. Daj mu zlecenie w Przetwórni.`,'gold');snd('level');render()},
 toggleW:d=>{S.auto[d.w]=S.auto[d.w]===false;render()},
 research:d=>{const r=resDef(d.r);if(res(d.r)>=r[3]||S.lvl<resReq(d.r)||!pay(resCost(d.r),`${r[1]}: stopień ${res(d.r)+1}`))return;S.res[d.r]=res(d.r)+1;if(d.r==='lada')padShop();snd('level');render()},
 planopen:d=>{if(!S.millers.length)return;openPlan(d.k!=null?+d.k:null,d.f)},
 planq:d=>{draft.n=+d.n;draft.inf=false;$('#planN').value=draft.n;$('#planInf').checked=false;planSum()},
 planok:()=>{const ml=S.millers[draft.k];if(!ml)return;ml.plan={f:draft.f,n:draft.inf?0:Math.max(1,draft.n),done:0};ml.off=false;S.st.planned++;
   toast(`Młynarz ${draft.k+1}: ${draft.inf?'bez końca':draft.n+'×'} ${ITEMS[draft.f].n}`);closeSheet();render()},
 planstop:d=>{const ml=S.millers[+d.k];if(ml)ml.plan=null;if(sheetMode==='plan')closeSheet();render()},
 millerOff:d=>{const ml=S.millers[+d.k];ml.off=!ml.off;render()},
 sound:()=>{S.sound=!S.sound;render()},
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
addEventListener('pointerup',()=>{ptrDown=false}); addEventListener('pointercancel',()=>{ptrDown=false});
// przeciąganie towarów: między półkami, „Do rozłożenia” i tym, co leży obok
document.addEventListener('dragstart',e=>{const b=e.target.closest&&e.target.closest('.pslot[data-dk]');if(!b)return;dragKey=b.dataset.dk;dragging=true;hideCtx();
  e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',dragKey)}catch(_){}});
const dropSlot=t=>t.closest&&t.closest('.pslot[data-i],.pslot[data-t]');
document.addEventListener('dragover',e=>{if(dragKey&&dropSlot(e.target)){e.preventDefault();e.dataTransfer.dropEffect='move'}});
document.addEventListener('dragenter',e=>{const t=dropSlot(e.target);document.querySelectorAll('.pslot.over').forEach(x=>x!==t&&x.classList.remove('over'));if(t&&dragKey)t.classList.add('over')});
document.addEventListener('drop',e=>{const t=dropSlot(e.target);if(!t||!dragKey)return;e.preventDefault();
  if(t.dataset.i!=null) moveToShelf(dragKey,+t.dataset.i); else moveToTray(dragKey,+t.dataset.t);
  pSel=null;pMove=false;dragKey=null;dragging=false;save();render()});
document.addEventListener('dragend',()=>{if(dragging){dragKey=null;dragging=false;render()}});
// przeciąganie linii produkcyjnych za uchwyt
let dragLine=null;
document.addEventListener('dragstart',e=>{const h=e.target.closest&&e.target.closest('.lgrip[data-lf]');if(!h)return;dragLine=h.dataset.lf;dragging=true;
  e.dataTransfer.effectAllowed='move';try{e.dataTransfer.setData('text/plain',dragLine)}catch(_){}const row=h.closest('.lrow');if(row){row.classList.add('dragsrc');try{e.dataTransfer.setDragImage(row,20,20)}catch(_){}}});
const lineTarget=e=>{const row=e.target.closest&&e.target.closest('.lrow[data-line]');if(!row)return null;const r=row.getBoundingClientRect();return {row,after:e.clientY>r.top+r.height/2}};
document.addEventListener('dragover',e=>{if(!dragLine)return;const t=lineTarget(e);if(!t)return;e.preventDefault();e.dataTransfer.dropEffect='move';
  document.querySelectorAll('.lrow.dropb,.lrow.dropa').forEach(x=>x.classList.remove('dropb','dropa'));t.row.classList.add(t.after?'dropa':'dropb')});
document.addEventListener('drop',e=>{if(!dragLine)return;const t=lineTarget(e);if(t){e.preventDefault();const f=t.row.dataset.line;
  if(f!==dragLine){const a=S.lines.filter(x=>x!==dragLine);let i=a.indexOf(f)+(t.after?1:0);S.lines=a;S.lines.splice(i,0,dragLine)}}
  dragLine=null;dragging=false;save();render()});
document.addEventListener('dragend',()=>{if(dragLine){dragLine=null;dragging=false;render()}});
// menu pod prawym przyciskiem (na telefonie: przytrzymanie)
document.addEventListener('contextmenu',e=>{const ln=e.target.closest&&e.target.closest('.lrow[data-line]');if(ln&&!e.target.closest('button,.lml')){e.preventDefault();showLineCtx(ln.dataset.line,e.clientX,e.clientY);return}
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
document.addEventListener('keydown',e=>{gest=true;if(e.key==='Escape'&&sheetMode)closeSheet()});

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
  const busy=Object.values(S.m).some(m=>m.run.length); if(!reduce) sail+=dt*(busy?1.6:0.35);
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
  if(document.hidden) return; // w tle tylko liczymy, bez rysowania
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
