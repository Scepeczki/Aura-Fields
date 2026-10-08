// Aura Fields — dźwięk: spokojne tło każdego miejsca, miękkie odgłosy akcji i cicha muzyczka w sklepie.
// Tło miejsc i maszyn to zapętlone nagrania z sfx/ (CC0, lista w sfx/ZRODLA.md); reszta jest syntezowana w Web Audio.
// Nagranie wczytuje się dopiero, gdy jest potrzebne. Póki go nie ma (albo się nie wczyta), gra syntezowany zamiennik.
// Gra woła AuraSound.update(stan) kilka razy na sekundę i AuraSound.fx(rodzaj) przy akcjach.
// Kanały (każdy z własną głośnością): fx = akcje gracza, amb = otoczenie, mach = maszyny, crowd = targ, music = muzyka.
(()=>{
'use strict';
let ac=null, out=null, ambBus=null, fxBus=null, BUS={}, pink=null, brown=null, B={}, st=null, timers={}, lastTick=0;
const R=(a,b)=>a+Math.random()*(b-a);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const T=()=>ac.currentTime;
const mtof=m=>440*Math.pow(2,(m-69)/12);
// płynne dojście do wartości (stała czasu w sekundach)
const glide=(p,v,tc=0.8)=>{p.cancelScheduledValues(T());p.setTargetAtTime(v,T(),tc)};

function noiseBuf(kind){const n=ac.sampleRate*8,b=ac.createBuffer(2,n,ac.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,last=0;
    for(let i=0;i<n;i++){const w=Math.random()*2-1;
      if(kind==='pink'){b0=.99886*b0+w*.0555179;b1=.99332*b1+w*.0750759;b2=.969*b2+w*.153852;b3=.8665*b3+w*.3104856;b4=.55*b4+w*.5329522;b5=-.7616*b5-w*.016898;
        d[i]=(b0+b1+b2+b3+b4+b5+b6+w*.5362)*.11;b6=w*.115926}
      else {last=(last+.02*w)/1.02;d[i]=last*3.5}}}
  return b}
// pogłos: impuls z zanikającego szumu (ciepłe, drewniane pomieszczenie)
function verbBuf(sec){const n=Math.floor(ac.sampleRate*sec),b=ac.createBuffer(2,n,ac.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);let lp=0;for(let i=0;i<n;i++){const k=i/n;lp=lp*.6+(Math.random()*2-1)*.4;d[i]=lp*Math.pow(1-k,2.6)}}return b}
function src(buf){const s=ac.createBufferSource();s.buffer=buf;s.loop=true;s.start(T(),R(0,7));return s}
function filt(type,f,q){const x=ac.createBiquadFilter();x.type=type;x.frequency.value=f;if(q!=null)x.Q.value=q;return x}
function gain(v){const g=ac.createGain();g.gain.value=v;return g}
function chain(...n){for(let i=0;i<n.length-1;i++)n[i].connect(n[i+1]);return n[n.length-1]}
function lfo(freq,depth,target,type){const o=ac.createOscillator();o.type=type||'sine';o.frequency.value=freq;const g=gain(depth);o.connect(g);g.connect(target);o.start();return {o,g}}
function pan(v){const p=ac.createStereoPanner?ac.createStereoPanner():gain(1);if(p.pan)p.pan.value=v;return p}

// ---------- tła ciągłe (każde ma własny poziom, który płynnie zmieniamy) ----------
function bed(name,build,cat){const g=gain(0);g.connect(BUS[cat||'amb']);build(g);B[name]=g;return g}
// pogłos przypięty do kanału
function mkVerb(bus,wet){const cv=ac.createConvolver();cv.buffer=verbBuf(2.2);const i=gain(1);chain(i,cv,gain(wet),bus);return i}
const VOWELS=[[730,1090],[530,1840],[300,2200],[570,840],[320,870],[420,1500],[650,1300]];
function buildBeds(){
  // wiatr: różowy szum, podmuchy przesuwają pasmo
  bed('wind',g=>{const bp=filt('bandpass',420,.5),lp=filt('lowpass',3500);chain(src(pink),bp,lp,g);B.windBP=bp;B.windLP=lp});
  // deszcz: szelest + krople z harmonogramu; w środku głuchy szum o dach
  bed('rain',g=>{const hp=filt('highpass',600),lp=filt('lowpass',7000);chain(src(pink),hp,lp,g);B.rainLP=lp});
  // cisza pomieszczenia: bardzo niski, ciepły szum (tylko w tle)
  bed('room',g=>{chain(src(brown),filt('lowpass',200),g)});
  // spiżarnia: wentylator pod sufitem: szum łopat z rytmem obrotu i cichy silniczek
  bed('vent',g=>{const am=gain(.8);lfo(12.5,.22,am.gain);chain(src(pink),filt('bandpass',480,.8),filt('lowpass',2600),am,g);
    const mo=gain(.06);mo.connect(g);[[100,1],[200,.35],[300,.1]].forEach(([f,v])=>{const o=ac.createOscillator();o.frequency.value=f;chain(o,gain(v),mo);o.start()});
    const rat=gain(0);lfo(12.5,.05,rat.gain,'square');chain(src(pink),filt('bandpass',2400,3),rat,g)});
  // maszyny
  bed('rumble',g=>{const am=gain(.8);lfo(.9,.3,am.gain);chain(src(brown),filt('lowpass',160),am,g)},'mach');
  bed('grind',g=>{const am=gain(.7);lfo(.7,.35,am.gain);chain(src(pink),filt('bandpass',260,1.2),am,g);
    const sc=gain(.5);lfo(.7,.4,sc.gain);chain(src(pink),filt('bandpass',1800,2),sc,gain(.4),g)},'mach');
  bed('sift',g=>{const am=gain(.5);lfo(6.5,.48,am.gain,'triangle');chain(src(pink),filt('bandpass',3600,.9),am,g)},'mach');
  bed('husk',g=>{const am=gain(.5);lfo(10,.45,am.gain,'triangle');chain(src(pink),filt('bandpass',1500,1.2),am,g)},'mach');
  bed('fan',g=>{const am=gain(.85);lfo(.23,.15,am.gain);chain(src(pink),filt('bandpass',650,.5),am,g)},'mach');
  bed('fire',g=>{chain(src(brown),filt('bandpass',300,.7),g)},'mach');
  bed('water',g=>{const am=gain(.7);lfo(.4,.25,am.gain);chain(src(pink),filt('bandpass',1300,.8),am,g)},'mach');
  // targ: głosy ludzi (źródło dźwięczne + formanty samogłosek), kilka blisko i tłum dalej, z pogłosem
  bed('crowd',g=>{B.voices=[];const verb=mkVerb(BUS.crowd,.55);
    for(let i=0;i<11;i++){const near=i<3,male=Math.random()<.5,f0=male?R(95,140):R(175,235);
      const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f0;
      const f1=filt('bandpass',500,7),f2=filt('bandpass',1500,9),f2g=gain(.55),vg=gain(0),lp=filt('lowpass',near?4200:1500),p=pan(near?R(-.5,.5):R(-.9,.9));
      o.connect(f1);o.connect(f2);f2.connect(f2g);f1.connect(vg);f2g.connect(vg);chain(vg,lp,p,g);const send=gain(near?.25:.7);p.connect(send);send.connect(verb);
      o.start();B.voices.push({o,f1,f2,vg,f0,near,talk:false,next:0,peak:near?R(.5,.8):R(.18,.32)})}},'crowd');
  // świerszcze nocą
  bed('crick',g=>{const o=ac.createOscillator();o.frequency.value=4400;const am=gain(0);const pulse=ac.createOscillator();pulse.type='square';pulse.frequency.value=28;const pd=gain(.5);pulse.connect(pd);pd.connect(am.gain);
    const slow=gain(.5);lfo(.55,.5,slow.gain,'square');chain(o,am,slow,g);o.start();pulse.start()});
  // muzyczka sklepu (osobny poziom, nuty z harmonogramu)
  bed('music',g=>{B.musicIn=gain(1);B.musicIn.connect(g);B.musicIn.connect(mkVerb(g,.55))},'music');
}

// ---------- nagrania (pętle) ----------
// http(s)/aplikacja: Web Audio (pętla bez przerwy); plik otwarty z dysku (file://): element <audio>, bo fetch jest tam zablokowany
const SFX={}, fileMode=location.protocol==='file:';
const CAT={targ:'crowd',jazz:'music',drzwi:'fx',tryby:'mach',zarna:'mach',sypanie:'mach',sito:'mach',ogien:'mach',wrzatek:'mach',krople:'mach',plukanie:'mach',krojenie:'mach',prasa:'mach',suszarnia:'mach','w-orzech':'mach'};
const catOf=n=>CAT[n]||(n.startsWith('w-')?'fx':'amb');
// głośność kanału (dla elementów <audio>, które idą obok Web Audio)
// czy grać, gdy okno jest zminimalizowane albo karta w tle (ustawienie gracza)
const muted=()=>document.hidden&&!(st&&st.bg);
const catGain=c=>{if(!st||!st.on||muted())return 0;const v=st.vols||{};return (c==='fx'?1.2:1.6)*(v.all==null?.7:v.all)*(v[c]==null?1:v[c])};
function sfx(name){let x=SFX[name];if(x)return x;x=SFX[name]={ok:false,g:null,el:null,vol:0};
  const viaEl=()=>{const el=new Audio('sfx/'+name+'.ogg');el.loop=true;el.volume=0;el.preload='auto';x.el=el;
    el.addEventListener('canplaythrough',()=>{x.ok=true},{once:true});el.addEventListener('error',()=>{x.fail=true})};
  if(fileMode){viaEl();return x}
  fetch('sfx/'+name+'.ogg').then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}).then(b=>ac.decodeAudioData(b)).then(buf=>{
    const sr=ac.createBufferSource();sr.buffer=buf;sr.loop=true;const g=gain(0);sr.connect(g);g.connect(BUS[catOf(name)]);sr.start(T(),R(0,buf.duration));x.g=g;x.ok=true}).catch(viaEl);
  return x}
const ready=n=>!!(SFX[n]&&SFX[n].ok);
const failed=n=>!!(SFX[n]&&SFX[n].fail);
// odgłosy jednorazowe z nagrań (pies, samolot, drzwi); pierwszy raz tylko się wczytują
const SHOT={};
function shotLoad(name){if(SHOT[name])return SHOT[name];const x=SHOT[name]={buf:null,file:fileMode};
  if(!fileMode)fetch('sfx/'+name+'.ogg').then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}).then(b=>ac.decodeAudioData(b)).then(b=>{x.buf=b}).catch(()=>{x.file=true});
  return x}
let FIELD=[];
function shot(name,v,p=0,field){const x=shotLoad(name),c=catOf(name);
  if(x.buf){const sr=ac.createBufferSource(),g=gain(v);sr.buffer=x.buf;chain(sr,g,pan(p),BUS[c]);sr.start();if(field){FIELD.push({sr,g});sr.onended=()=>{FIELD=FIELD.filter(f=>f.sr!==sr)}}return}
  if(x.file&&st){const el=new Audio('sfx/'+name+'.ogg');el.volume=Math.min(1,v*catGain(c));el.play().catch(()=>{});if(field){FIELD.push({el});el.onended=()=>{FIELD=FIELD.filter(f=>f.el!==el)}}}}
function stopField(){FIELD.forEach(f=>{if(f.el)f.el.pause();else{glide(f.g.gain,0,.04);try{f.sr.stop(T()+.25)}catch(e){}}});FIELD=[]}
// paczka zdarzeń: plik z kilkoma wariantami co SLOT sekund, gramy losowy (z lekką zmianą wysokości)
const SLOT=1.2, SPR={'w-zbior':6,'w-siew':6,'w-worek':5,'w-szelest':5,'w-ziarno':6,'w-sloik':6,'w-orzech':6};
function spr(name,v,p=0){const x=shotLoad(name),c=catOf(name),i=Math.floor(Math.random()*SPR[name]);
  if(x.buf){const sr=ac.createBufferSource();sr.buffer=x.buf;sr.playbackRate.value=R(.92,1.08);chain(sr,gain(v),pan(p),BUS[c]);sr.start(T(),i*SLOT,SLOT-.05);return}
  if(x.file&&st){const el=new Audio('sfx/'+name+'.ogg');el.volume=Math.min(1,v*catGain(c));el.currentTime=i*SLOT;el.play().then(()=>setTimeout(()=>el.pause(),(SLOT-.05)*1000)).catch(()=>{})}}
function sfxLevel(name,v,tc,s){if(v<=0&&!SFX[name])return;const x=sfx(name);
  if(x.g){glide(x.g.gain,v,tc);return}
  if(!x.el)return;const tgt=Math.min(1,v*catGain(catOf(name)));
  x.vol=tc<.1?tgt:x.vol+(tgt-x.vol)*.35;if(Math.abs(x.vol-tgt)<.003)x.vol=tgt;x.el.volume=Math.max(0,Math.min(1,x.vol));
  if(x.vol>.001&&x.el.paused)x.el.play().catch(()=>{});else if(x.vol<=.001&&!x.el.paused)x.el.pause()}
function sfxMuteAll(){for(const n in SFX){const x=SFX[n];if(x.el&&!x.el.paused){x.vol=0;x.el.volume=0;x.el.pause()}}}

// ---------- odgłosy jednorazowe ----------
function burst(bus,{f=1500,q=1,dur=.08,v=.1,type='bandpass',noise=pink,at=0,p=0,attack=.004}){const t=T()+at,s=ac.createBufferSource();s.buffer=noise;
  const fl=filt(type,f,q),g=gain(0),pn=pan(p);chain(s,fl,g,pn,bus);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.start(t,R(0,7));s.stop(t+dur+.05)}
function tone(bus,{f=440,f2=null,dur=.3,v=.05,type='sine',at=0,p=0,attack=.005}){const t=T()+at,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);
  if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur*.8);const g=gain(0),pn=pan(p);chain(o,g,pn,bus);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+attack);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.start(t);o.stop(t+dur+.05)}
// moneta: niecałkowite składowe jak w metalu
function clink(bus,at=0,v=.05,p=R(-.3,.3)){const f=R(2300,3300);[[1,1],[2.76,.45],[5.4,.2]].forEach(([m,a])=>tone(bus,{f:f*m,dur:R(.2,.35)/Math.sqrt(m),v:v*a,at,p,attack:.002}))}
// skrzypnięcie deski: piła przez wąski filtr, z drganiem tarcia
function creak(bus,v=.05){const t=T(),dur=R(.35,.9),o=ac.createOscillator();o.type='sawtooth';const f0=R(70,140);o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f0*R(.8,1.3),t+dur);
  const bp=filt('bandpass',R(650,1100),9);bp.frequency.linearRampToValueAtTime(R(600,1200),t+dur);const g=gain(0),stick=gain(.6);const l=ac.createOscillator();l.frequency.value=R(18,34);const ld=gain(.4);l.connect(ld);ld.connect(stick.gain);
  chain(o,bp,stick,g,pan(R(-.6,.6)),bus);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.08);g.gain.linearRampToValueAtTime(v*.7,t+dur*.7);g.gain.linearRampToValueAtTime(0,t+dur);
  o.start(t);l.start(t);o.stop(t+dur+.05);l.stop(t+dur+.05)}
function bubble(bus,lo,v){const f=R(lo,lo*2.2);tone(bus,{f,f2:f*R(1.6,2.4),dur:R(.04,.09),v,p:R(-.5,.5),attack:.003})}
function chirp(bus){const n=Math.floor(R(2,6)),base=R(2600,4200),p=R(-.8,.8);let at=0;
  for(let i=0;i<n;i++){const f=base*R(.85,1.2);tone(bus,{f,f2:f*R(.7,1.4),dur:R(.06,.14),v:.025,at,p,attack:.01});at+=R(.08,.2)}}
function rustle(bus,dur=.3,v=.05,f=2600){for(let i=0;i<6;i++)burst(bus,{f:f*R(.7,1.3),q:.9,dur:R(.04,.1),v:v*R(.4,1),at:i*dur/6+R(0,.03),p:R(-.3,.3)})}
// nuta pozytywki / miękkiego pianina: podstawa + słabe wyższe składowe, długie wybrzmienie
function note(m,at,v,dur=2.4){const f=mtof(m),bus=B.musicIn,p=R(-.35,.35);
  tone(bus,{f,dur,v,at,p,attack:.008});tone(bus,{f:f*2,dur:dur*.45,v:v*.22,at,p,attack:.005});tone(bus,{f:f*3.01,dur:dur*.2,v:v*.07,at,p,attack:.004})}

const FX={
  pop(){spr('w-zbior',.5,R(-.3,.3))},
  plant(){spr('w-siew',.5,R(-.3,.3))},
  sow(){spr('w-siew',.5,R(-.3,.3))},
  coin(){clink(fxBus,0);clink(fxBus,.09,.04)},
  sale(){clink(fxBus,0,.035)},
  buy(){burst(fxBus,{f:180,q:.7,dur:.12,v:.1,noise:brown});const n=Math.floor(R(4,7));for(let i=0;i<n;i++)clink(fxBus,.05+i*R(.04,.08),.045*R(.6,1))},
  click(){burst(fxBus,{f:1300,q:3,dur:.035,v:.08})},
  trash(){tone(fxBus,{f:110,f2:60,dur:.2,v:.1});rustle(fxBus,.35,.06,1400)},
  level(){[784,988,1175,1568].forEach((f,i)=>{tone(fxBus,{f,dur:1.6,v:.035,at:i*.11,attack:.01});tone(fxBus,{f:f*2.01,dur:.7,v:.01,at:i*.11})})},
  page(){rustle(fxBus,.4,.05,3000)},
  // spiżarnia: podniesienie i odłożenie towaru (worek mąki, ziarno, słoik)
  pick_sack(){spr('w-szelest',.32,R(-.2,.2))}, drop_sack(){spr('w-worek',.45,R(-.2,.2))},
  pick_grain(){spr('w-ziarno',.22,R(-.2,.2))}, drop_grain(){spr('w-ziarno',.36,R(-.2,.2));burst(fxBus,{f:200,q:.7,dur:.08,v:.05,noise:brown})},
  pick_jar(){spr('w-sloik',.16,R(-.2,.2))}, drop_jar(){spr('w-sloik',.32,R(-.2,.2))},
};

// ---------- muzyczka w sklepie: spokojne akordy i pozytywka, generowane na bieżąco ----------
const CHORDS=[[48,55,64,71],[45,52,60,67],[41,48,57,64],[43,50,59,62],[48,55,64,67],[45,52,60,64],[50,57,65,72],[43,50,59,65]];
const SCALE=[72,74,76,79,81,84,86,88];
let lastTab=null, musT=null, musStep=0;
function music(){const E=60/70/2,now=T();if(musT==null||musT<now)musT=now+.15;
  while(musT<now+.8){const at=musT-now,bar=Math.floor(musStep/8)%CHORDS.length,b=musStep%8,ch=CHORDS[bar];
    if(b===0){note(ch[0]-12,at,.05,3.6);ch.slice(1).forEach((m,i)=>note(m,at+i*.03,.016,3.2))}
    if(b===4)note(ch[0],at,.02,2.4);
    if(Math.random()<(b%2?.3:.55)){const tones=SCALE.filter(m=>ch.some(c=>(m-c)%12===0));const m=Math.random()<.65&&tones.length?pick(tones):pick(SCALE);note(m,at,R(.022,.034),2.2)}
    musT+=E;musStep++}}

// ---------- harmonogram zdarzeń tła ----------
const every=(k,a,b,fn)=>{const now=T();if(timers[k]==null)timers[k]=now+R(a*.3,b);if(now>=timers[k]){timers[k]=now+R(a,b);fn()}};
function crowd(on){const now=T();B.voices.forEach(v=>{
  if(!on){if(v.talk){v.talk=false;glide(v.vg.gain,0,.04)}return}
  if(now<v.next)return;
  if(v.talk){const [a,b]=pick(VOWELS),k=v.f0>160?1.12:1;v.f1.frequency.setTargetAtTime(a*k,now,.03);v.f2.frequency.setTargetAtTime(b*k,now,.03);
    v.o.frequency.setTargetAtTime(v.f0*R(.88,1.18),now,.08);
    const g=v.vg.gain;g.cancelScheduledValues(now);g.setTargetAtTime(Math.random()<.18?.04:v.peak*R(.6,1),now,.025);const len=R(.11,.26);g.setTargetAtTime(v.peak*.15,now+len*.75,.02);
    v.next=now+len;if(Math.random()<.05){v.talk=false;glide(v.vg.gain,0,.12);v.next=now+R(.8,3.5)}}
  else {v.talk=true;v.next=now+R(.05,.2)}})}
function schedule(s){const tab=s.tab,out=tab==='pola',wet=s.wx==='deszcz',night=s.hour<5||s.hour>=21,EB=tab==='prz'?BUS.mach:tab==='targ'?BUS.crowd:BUS.amb;
  every('gust',1.5,4,()=>{glide(B.windBP.frequency,R(260,620),1.4)});
  if(wet){const n=out?3:1;for(let i=0;i<n;i++)if(Math.random()<.7)burst(BUS.amb,{f:out?R(2000,5600):R(700,1400),q:2.5,dur:R(.008,.02),v:out?R(.01,.03):R(.006,.014),at:R(0,.1),p:R(-.8,.8)})}
  if(out&&!wet&&!night&&s.season<3&&!ready('ptaki')) every('bird',2.5,8,()=>chirp(ambBus));
  // rzadko: pies szczeka gdzieś daleko, raz na kilka minut przelatuje samolot
  if(out){shotLoad('pies');shotLoad('samolot');shotLoad('w-zbior');shotLoad('w-siew');
    every('dog',100,320,()=>shot('pies',R(.3,.5),R(-.9,.9),true));
    every('plane',200,480,()=>shot('samolot',wet?.25:.4,R(-.4,.4),true))}
  if(tab==='prz'){every('creak',4,11,()=>creak(EB,R(.03,.06)));
    const r=s.run||{};
    if(r.mlo) every('flail',.55,.75,()=>{tone(EB,{f:80,f2:55,dur:.16,v:.12});burst(EB,{f:1000,q:.8,dur:.1,v:.05,at:.01,p:R(-.3,.3)})});
    if((r.zar||r.mbg)&&!ready('zarna')) every('stone',1.6,3,()=>burst(EB,{f:R(500,900),q:1.2,dur:.5,v:.04,attack:.15}));
    if(r.pra&&!ready('ogien')) every('crack',.07,.3,()=>burst(EB,{f:R(1800,4200),q:3,dur:R(.006,.015),v:R(.015,.045),p:R(-.4,.4)}));
    if(r.koc&&!ready('wrzatek')) every('boil',.07,.22,()=>bubble(EB,180,.05));
    if(r.kad&&!ready('krople')) every('drip',.2,.6,()=>bubble(EB,500,.035));
    if(r.obi&&!ready('krojenie')) every('knife',.45,.8,()=>{burst(EB,{f:R(800,1100),q:4,dur:.035,v:.09,p:-.2});burst(EB,{f:300,q:1,dur:.05,v:.05,noise:brown})});
    // łupiarka: pojedyncze trzaski łupin w losowych odstępach
    if(r.lup) every('nut',.6,1.8,()=>spr('w-orzech',R(.22,.42)*(r.lup>1?1.15:1),R(-.4,.4)));
    if(r.pre&&!ready('prasa')) every('press',2.5,4.5,()=>{creak(EB,.06);burst(EB,{f:500,q:1,dur:.35,v:.05,at:.4})});
    if(r.sit&&!ready('sito')) every('sieve',.9,1.6,()=>burst(EB,{f:R(3000,5000),q:1,dur:.25,v:.03,attack:.08}));}
  crowd(tab==='targ'&&!ready('targ'));
  if(tab==='targ'){every('till',3,8,()=>{const n=Math.floor(R(1,4));for(let i=0;i<n;i++)clink(EB,i*R(.05,.12),.03,R(-.7,.7))});
    every('bag',5,14,()=>rustle(EB,.3,.03,1800));
    every('cart',14,30,()=>{for(let i=0;i<8;i++)burst(EB,{f:R(300,700),q:1,dur:.06,v:.03,noise:brown,at:i*R(.12,.2),p:-.8+i*.2})});}
  if(tab==='ulep'){if(failed('jazz'))music();every('paper',8,20,()=>rustle(EB,.4,.025,3200));
    every('bell',40,80,()=>[1568,2093,2637].forEach((f,i)=>tone(EB,{f,dur:2.2,v:.012,at:i*.09,p:-.4})))}
  else musT=null;
  if(tab==='spiz'){['w-worek','w-szelest','w-ziarno','w-sloik'].forEach(shotLoad);every('jar',7,18,()=>{const f=R(1800,2600),p=R(-.5,.5);tone(EB,{f,dur:.3,v:.02,p});tone(EB,{f:f*2.3,dur:.14,v:.008,p})});
    every('shelf',10,25,()=>creak(EB,R(.015,.03)))}
  if(tab==='ksiega'||tab==='kron') every('leaf',7,16,()=>rustle(EB,.45,.03,3000));
}
// docelowe poziomy tła w danym miejscu
function levels(s){const tab=s.tab,out=tab==='pola',wet=s.wx==='deszcz',winter=s.season===3,night=s.hour<5||s.hour>=21,r=s.run||{},n=Object.values(r).reduce((a,b)=>a+b,0);
  const L={wind:0,rain:0,room:0,vent:0,rumble:0,grind:0,sift:0,husk:0,fan:0,fire:0,water:0,crowd:0,crick:0,music:0};
  if(out){L.wind=wet?.18:winter?.34:.24;L.rain=wet?.4:0;L.crick=night&&!wet&&(s.season===1||s.season===2)?.06:0}
  else if(tab==='targ'){L.crowd=.55;L.rain=wet?.12:0}
  else {L.wind=.03;L.rain=wet?.1:0;L.room=.08}
  if(tab==="spiz"){L.vent=.15;L.room=.04}
  if(tab==="ulep"){L.music=1.8;L.room=.03}
  if(tab==='prz'){L.room=.06;L.rumble=n?Math.min(.22,.08+.03*n):0;L.grind=(r.zar||r.mbg)?.45:0;L.sift=r.sit?.14:0;L.husk=r.lus?.16:0;L.fan=r.sus?.22:0;L.fire=r.pra?.18:0;L.water=(r.kad||r.plu)?.18:0}
  return L}
// poziomy nagrań w danym miejscu
function sampleLevels(s){const tab=s.tab,wet=s.wx==='deszcz',night=s.hour<5||s.hour>=21,r=s.run||{},n=Object.values(r).reduce((a,b)=>a+b,0);
  const S={swierszcze:0,jazz:0,ptaki:0,targ:0,tryby:0,zarna:0,sypanie:0,sito:0,ogien:0,wrzatek:0,krople:0,plukanie:0,krojenie:0,prasa:0,suszarnia:0};
  if(tab==='pola'&&!night&&s.season<3) S.ptaki=wet?.2:s.season===2?.45:.85;
  if(tab==='targ') S.targ=.85;
  if(tab==='pola'&&night&&!wet&&(s.season===1||s.season===2)) S.swierszcze=.55;
  if(tab==='ulep') S.jazz=.42;
  // przy kilku maszynach naraz każda trochę ciszej, żeby całość nie rosła bez końca
  if(tab==='prz'){shotLoad('w-orzech');const k=1/Math.sqrt(Math.max(1,Object.keys(r).length));S.tryby=n?.09:0;S.zarna=(r.zar||r.mbg)?.42*k:0;S.sypanie=r.mlo?.22*k:0;S.sito=r.sit?.32*k:0;S.ogien=r.pra?.32*k:0;S.wrzatek=r.koc?.3*k:0;
    S.krople=r.kad?.32*k:0;S.plukanie=r.plu?.32*k:0;S.krojenie=r.obi?.36*k:0;S.prasa=r.pre?.32*k:0;S.suszarnia=r.sus?.3*k:0}
  return S}
// syntetyczne warstwy, które nagranie zastępuje
const SYN_BY={grind:'zarna',sift:'sito',fan:'suszarnia',fire:'ogien',crowd:'targ',rumble:'tryby'};
function apply(s,tc){const L=levels(s);for(const k in SYN_BY)if(ready(SYN_BY[k]))L[k]=k==='rumble'?L[k]*.35:0;
  if(L.water&&(ready('krople')||ready('plukanie')))L.water=0;
  if(!failed('swierszcze'))L.crick=0;if(!failed('jazz'))L.music=0;
  for(const k in L)glide(B[k].gain,L[k],tc);
  const SL=sampleLevels(s);for(const k in SL)sfxLevel(k,SL[k],tc,s);
  const out=s.tab==='pola';glide(B.windLP.frequency,out?3500:600,tc);glide(B.rainLP.frequency,out?7000:s.tab==='targ'?3000:900,tc)}

function ensure(){if(ac)return true;const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;
  try{ac=new C();out=filt('lowpass',16000);const comp=ac.createDynamicsCompressor();comp.threshold.value=-16;comp.ratio.value=3;out.connect(comp);comp.connect(ac.destination);
    for(const c of ['fx','amb','mach','crowd','music']){BUS[c]=gain(0);BUS[c].connect(out)}ambBus=BUS.amb;fxBus=BUS.fx;
    pink=noiseBuf('pink');brown=noiseBuf('brown');buildBeds();shotLoad('drzwi');shotLoad('w-zbior');shotLoad('w-siew');
    document.addEventListener('visibilitychange',()=>{if(!ac)return;if(muted()){ac.suspend();sfxMuteAll()}else if(st&&st.on)ac.resume()});
    return true}catch(e){ac=null;return false}}
const fxLast={};
window.AuraSound={
  // s = {on, vols:{all,fx,amb,mach,crowd,music}, tab, wx, season, hour, run:{maszyna:liczba partii}}
  update(s){st=s;if(!s.on&&!ac)return;if(!ensure())return;
    if(!s.on){if(ac.state==='running')ac.suspend();sfxMuteAll();return}
    if(ac.state==='suspended'&&!muted())ac.resume();
    for(const c in BUS)glide(BUS[c].gain,catGain(c),.08);
    const now=performance.now(),sw=s.tab!==lastTab;if(!sw&&now-lastTick<90)return;lastTick=now;lastTab=s.tab;
    if(sw&&s.tab!=='pola')stopField();
    if(sw&&s.tab==='ulep')shot('drzwi',.6,.35);
    apply(s,sw?.04:1.2);schedule(s)},
  fx(type){if(!st||!st.on||!ensure()||muted())return;const now=performance.now();if(now-(fxLast[type]||0)<70)return;fxLast[type]=now;if(ac.state==='suspended')ac.resume();try{(FX[type]||FX.click)()}catch(e){}}
};
})();
