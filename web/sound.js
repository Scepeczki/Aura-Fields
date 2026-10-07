// Aura Fields — dźwięk: ciche, przytłumione tło każdego miejsca i miękkie odgłosy akcji.
// Wszystko jest syntezowane w Web Audio (szum, filtry, krótkie obwiednie), bez plików nagrań.
// Gra woła AuraSound.update(stan) kilka razy na sekundę i AuraSound.fx(rodzaj) przy akcjach.
(()=>{
'use strict';
let ac=null, out=null, ambBus=null, fxBus=null, pink=null, brown=null, B={}, st=null, timers={}, lastTick=0;
const R=(a,b)=>a+Math.random()*(b-a);
const T=()=>ac.currentTime;
// płynne dojście do wartości (stała czasu w sekundach)
const glide=(p,v,tc=0.8)=>{p.cancelScheduledValues(T());p.setTargetAtTime(v,T(),tc)};

function noiseBuf(kind){const n=ac.sampleRate*8,b=ac.createBuffer(2,n,ac.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0,last=0;
    for(let i=0;i<n;i++){const w=Math.random()*2-1;
      if(kind==='pink'){b0=.99886*b0+w*.0555179;b1=.99332*b1+w*.0750759;b2=.969*b2+w*.153852;b3=.8665*b3+w*.3104856;b4=.55*b4+w*.5329522;b5=-.7616*b5-w*.016898;
        d[i]=(b0+b1+b2+b3+b4+b5+b6+w*.5362)*.11;b6=w*.115926}
      else {last=(last+.02*w)/1.02;d[i]=last*3.5}}}
  return b}
function src(buf){const s=ac.createBufferSource();s.buffer=buf;s.loop=true;s.start(T(),R(0,7));return s}
function filt(type,f,q){const x=ac.createBiquadFilter();x.type=type;x.frequency.value=f;if(q!=null)x.Q.value=q;return x}
function gain(v){const g=ac.createGain();g.gain.value=v;return g}
function chain(...n){for(let i=0;i<n.length-1;i++)n[i].connect(n[i+1]);return n[n.length-1]}
function lfo(freq,depth,target,type){const o=ac.createOscillator();o.type=type||'sine';o.frequency.value=freq;const g=gain(depth);o.connect(g);g.connect(target);o.start();return {o,g}}
function pan(v){const p=ac.createStereoPanner?ac.createStereoPanner():gain(1);if(p.pan)p.pan.value=v;return p}

// ---------- tła ciągłe (każde ma własny poziom, który płynnie zmieniamy) ----------
function bed(name,build){const g=gain(0);g.connect(ambBus);build(g);B[name]=g;return g}
function buildBeds(){
  // wiatr: różowy szum w szerokim paśmie, podmuchy przesuwają pasmo i głośność
  bed('wind',g=>{const bp=filt('bandpass',380,.55),lp=filt('lowpass',1400);chain(src(pink),bp,lp,g);B.windBP=bp;B.windLP=lp});
  // deszcz: szum wysoki (szelest) + krople doklejane z harmonogramu; w środku przytłumiony
  bed('rain',g=>{const hp=filt('highpass',700),lp=filt('lowpass',4200);chain(src(pink),hp,lp,g);B.rainLP=lp});
  // cisza pomieszczenia: bardzo niski, ciepły szum
  bed('room',g=>{chain(src(brown),filt('lowpass',190),g)});
  // brzęczenie żarówki w spiżarni: 100 Hz z delikatnymi harmonicznymi i drganiem
  bed('hum',g=>{const m=gain(1);m.connect(g);[[100,.5,'sine'],[200,.16,'sine'],[300,.05,'triangle']].forEach(([f,v,t])=>{const o=ac.createOscillator();o.type=t;o.frequency.value=f;chain(o,gain(v),m);o.start()});
    lfo(.31,.08,m.gain);const s=chain(src(pink),filt('bandpass',3200,1.5),gain(.05));s.connect(g)});
  // maszyny: niski pomruk wału i kamieni
  bed('rumble',g=>{const am=gain(.8);lfo(.9,.25,am.gain);chain(src(brown),filt('lowpass',150),am,g)});
  bed('grind',g=>{const am=gain(.7);lfo(.7,.3,am.gain);chain(src(pink),filt('bandpass',230,1.4),am,g)});
  bed('sift',g=>{const am=gain(.5);lfo(6.5,.45,am.gain,'triangle');chain(src(pink),filt('bandpass',3800,.9),filt('lowpass',5000),am,g)});
  bed('husk',g=>{const am=gain(.5);lfo(10,.4,am.gain,'triangle');chain(src(pink),filt('bandpass',1500,1.2),am,g)});
  bed('fan',g=>{const am=gain(.85);lfo(.23,.15,am.gain);chain(src(pink),filt('bandpass',620,.5),am,g)});
  bed('fire',g=>{chain(src(brown),filt('lowpass',320),g)});
  bed('water',g=>{const am=gain(.7);lfo(.4,.25,am.gain);chain(src(pink),filt('bandpass',1100,.8),filt('lowpass',2400),am,g)});
  // gwar targu: kilka „głosów” z pasm szumu, sylaby z harmonogramu, całość przytłumiona
  bed('murmur',g=>{const lp=filt('lowpass',1500);lp.connect(g);B.voices=[];
    for(let i=0;i<6;i++){const f=i<3?R(320,700):R(520,1100),bp=filt('bandpass',f,4.5),vg=gain(0),p=pan(R(-.7,.7));chain(src(pink),bp,vg,p,lp);B.voices.push({bp,vg,f,talk:false,next:0})}
    chain(src(brown),filt('lowpass',260),gain(.35),g)});
  // świerszcze nocą
  bed('crick',g=>{const o=ac.createOscillator();o.frequency.value=4400;const am=gain(0);const pulse=ac.createOscillator();pulse.type='square';pulse.frequency.value=28;const pd=gain(.5);pulse.connect(pd);pd.connect(am.gain);
    const slow=gain(.5);lfo(.55,.5,slow.gain,'square');chain(o,am,slow,filt('lowpass',6000),g);o.start();pulse.start()});
}

// ---------- odgłosy jednorazowe ----------
function burst(bus,{f=1500,q=1,dur=.08,v=.1,type='bandpass',noise=pink,at=0,p=0,attack=.004}){const t=T()+at,s=ac.createBufferSource();s.buffer=noise;
  const fl=filt(type,f,q),g=gain(0),pn=pan(p);chain(s,fl,g,pn,bus);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+attack);g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  s.start(t,R(0,7));s.stop(t+dur+.05)}
function tone(bus,{f=440,f2=null,dur=.3,v=.05,type='sine',at=0,p=0,attack=.005}){const t=T()+at,o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);
  if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dur*.8);const g=gain(0),pn=pan(p);chain(o,g,pn,bus);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+attack);
  g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.start(t);o.stop(t+dur+.05)}
// moneta: niecałkowite składowe jak w metalu, krótko i miękko
function clink(bus,at=0,v=.035,p=R(-.3,.3)){const f=R(2300,3300);[[1,1],[2.76,.45],[5.4,.2]].forEach(([m,a])=>tone(bus,{f:f*m,dur:R(.18,.32)/Math.sqrt(m),v:v*a,at,p,attack:.002}))}
// skrzypnięcie deski: piła przez wąski filtr, z drganiem tarcia
function creak(bus,v=.03){const t=T(),dur=R(.35,.9),o=ac.createOscillator();o.type='sawtooth';const f0=R(70,140);o.frequency.setValueAtTime(f0,t);o.frequency.linearRampToValueAtTime(f0*R(.8,1.3),t+dur);
  const bp=filt('bandpass',R(650,1100),9);bp.frequency.linearRampToValueAtTime(R(600,1200),t+dur);const g=gain(0),stick=gain(.6);const l=ac.createOscillator();l.frequency.value=R(18,34);const ld=gain(.4);l.connect(ld);ld.connect(stick.gain);
  chain(o,bp,stick,g,pan(R(-.6,.6)),bus);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.08);g.gain.linearRampToValueAtTime(v*.7,t+dur*.7);g.gain.linearRampToValueAtTime(0,t+dur);
  o.start(t);l.start(t);o.stop(t+dur+.05);l.stop(t+dur+.05)}
function bubble(bus,lo,v){const f=R(lo,lo*2.2);tone(bus,{f,f2:f*R(1.6,2.4),dur:R(.04,.09),v,p:R(-.5,.5),attack:.003})}
function chirp(bus){const n=Math.floor(R(2,6)),base=R(2600,4200),p=R(-.8,.8);let at=0;
  for(let i=0;i<n;i++){const f=base*R(.85,1.2);tone(bus,{f,f2:f*R(.7,1.4),dur:R(.06,.14),v:.012,at,p,attack:.01});at+=R(.08,.2)}}
function rustle(bus,dur=.3,v=.04,f=2600){const t=T();for(let i=0;i<6;i++)burst(bus,{f:f*R(.7,1.3),q:.9,dur:R(.04,.1),v:v*R(.4,1),at:i*dur/6+R(0,.03),p:R(-.3,.3)})}

const FX={
  pop(){rustle(fxBus,.22,.05,1800);tone(fxBus,{f:330,f2:240,dur:.14,v:.05})},
  plant(){for(let i=0;i<5;i++)burst(fxBus,{f:R(450,900),q:.8,dur:R(.05,.1),v:.07,noise:brown,at:i*.045});tone(fxBus,{f:95,f2:70,dur:.16,v:.07})},
  sow(){for(let i=0;i<7;i++)burst(fxBus,{f:R(2500,4500),q:2,dur:.03,v:.025,at:i*R(.02,.04),p:R(-.3,.3)});for(let i=0;i<3;i++)burst(fxBus,{f:R(400,800),q:.8,dur:.08,v:.05,noise:brown,at:.12+i*.05})},
  coin(){clink(fxBus,0);clink(fxBus,.09,.028)},
  sale(){clink(fxBus,0,.02)},
  buy(){burst(fxBus,{f:180,q:.7,dur:.12,v:.08,noise:brown});const n=Math.floor(R(4,7));for(let i=0;i<n;i++)clink(fxBus,.05+i*R(.04,.08),.03*R(.6,1))},
  click(){burst(fxBus,{f:1300,q:3,dur:.035,v:.06})},
  trash(){tone(fxBus,{f:110,f2:60,dur:.2,v:.08});rustle(fxBus,.35,.04,1400)},
  level(){[784,988,1175,1568].forEach((f,i)=>{tone(fxBus,{f,dur:1.6,v:.022,at:i*.11,attack:.01});tone(fxBus,{f:f*2.01,dur:.7,v:.006,at:i*.11})})},
  page(){rustle(fxBus,.4,.035,3000)},
};

// ---------- harmonogram zdarzeń tła ----------
const every=(k,a,b,fn)=>{const now=T();if(timers[k]==null)timers[k]=now+R(a*.3,b);if(now>=timers[k]){timers[k]=now+R(a,b);fn()}};
function schedule(s){const tab=s.tab,out=tab==='pola',wet=s.wx==='deszcz',night=s.hour<5||s.hour>=21;
  // podmuchy wiatru
  every('gust',1.5,4,()=>{glide(B.windBP.frequency,R(240,560),1.4)});
  // krople deszczu (na polu wyraźne, w środku głuche stuknięcia o dach)
  if(wet){const n=out?3:1;for(let i=0;i<n;i++)if(Math.random()<.7)burst(ambBus,{f:out?R(2000,5200):R(700,1400),q:2.5,dur:R(.008,.02),v:out?R(.006,.02):R(.004,.01),at:R(0,.1),p:R(-.8,.8)})}
  if(out&&!wet&&!night&&s.season<2) every('bird',2.5,8,()=>chirp(ambBus));
  if(tab==='prz'){every('creak',4,11,()=>creak(ambBus,R(.014,.03)));
    const r=s.run||{};
    if(r.mlo) every('flail',.55,.75,()=>{tone(ambBus,{f:75,f2:55,dur:.14,v:.05*Math.min(2,r.mlo)});burst(ambBus,{f:900,q:.8,dur:.09,v:.02,at:.01})});
    if(r.pra) every('crack',.08,.35,()=>burst(ambBus,{f:R(1800,4200),q:3,dur:R(.006,.015),v:R(.006,.022),p:R(-.4,.4)}));
    if(r.koc) every('boil',.08,.25,()=>bubble(ambBus,180,.02));
    if(r.kad||r.plu) every('drip',.2,.6,()=>bubble(ambBus,500,.012));
    if(r.obi) every('knife',.45,.8,()=>burst(ambBus,{f:R(800,1100),q:4,dur:.03,v:.04,p:-.2}));
    if(r.lup) every('nut',1,2.2,()=>{burst(ambBus,{f:R(1500,2600),q:1.5,dur:.04,v:.05});burst(ambBus,{f:600,q:1,dur:.08,v:.03,noise:brown,at:.03})});
    if(r.pre) every('press',2.5,4.5,()=>{creak(ambBus,.02);burst(ambBus,{f:500,q:1,dur:.35,v:.02,at:.4})});}
  if(tab==='targ'){const now=T();B.voices.forEach(v=>{if(now<v.next)return;
      if(v.talk){glide(v.vg.gain,Math.random()<.25?0:R(.15,.6),.03);v.bp.frequency.setTargetAtTime(v.f*R(.8,1.25),now,.05);v.next=now+R(.09,.24);if(Math.random()<.04){v.talk=false;glide(v.vg.gain,0,.15);v.next=now+R(1,4)}}
      else {v.talk=true;v.next=now+R(.1,.3)}});
    every('till',3,9,()=>{const n=Math.floor(R(1,4));for(let i=0;i<n;i++)clink(ambBus,i*R(.05,.12),.014,R(-.7,.7))});
    every('bag',5,14,()=>rustle(ambBus,.3,.015,1800));}
  else if(B.voices) B.voices.forEach(v=>{if(v.talk){v.talk=false;glide(v.vg.gain,0,.3)}});
  if(tab==='ulep'){every('tick',.98,1.02,()=>{timers.tk=!timers.tk;burst(ambBus,{f:timers.tk?2300:1900,q:6,dur:.025,v:.03,p:.3})});
    every('paper',6,15,()=>rustle(ambBus,.4,.02,3200));
    every('bell',25,50,()=>[1568,2093,2637].forEach((f,i)=>tone(ambBus,{f,dur:2.2,v:.008,at:i*.09,p:-.4})));}
  if(tab==='spiz') every('jar',8,20,()=>{const f=R(1800,2600);tone(ambBus,{f,dur:.25,v:.008,p:R(-.5,.5)});tone(ambBus,{f:f*2.3,dur:.12,v:.004})});
  if(tab==='ksiega'||tab==='kron') every('leaf',7,16,()=>rustle(ambBus,.45,.018,3000));
}
// docelowe poziomy tła w danym miejscu
function levels(s){const tab=s.tab,out=tab==='pola',wet=s.wx==='deszcz',winter=s.season===3,night=s.hour<5||s.hour>=21,r=s.run||{},n=Object.values(r).reduce((a,b)=>a+b,0);
  const L={wind:0,rain:0,room:0,hum:0,rumble:0,grind:0,sift:0,husk:0,fan:0,fire:0,water:0,murmur:0,crick:0};
  if(out){L.wind=wet?.32:winter?.6:.42;L.rain=wet?.42:0;L.crick=night&&!wet&&(s.season===1||s.season===2)?.05:0}
  else if(tab==='targ'){L.wind=.1;L.rain=wet?.2:0;L.murmur=.9;L.room=.1}
  else {L.wind=.05;L.rain=wet?.12:0;L.room=.35}
  if(tab==='spiz') L.hum=.035;
  if(tab==='prz'){L.room=.45;L.rumble=n?Math.min(.9,.35+.12*n):0;L.grind=(r.zar||0)+(r.mbg||0)?.25:0;L.sift=r.sit?.05:0;L.husk=r.lus?.06:0;L.fan=r.sus?.12:0;L.fire=r.pra?.25:0;L.water=(r.kad||r.plu)?.08:0}
  return L}
function apply(s){const L=levels(s);for(const k in L)glide(B[k].gain,L[k],1.2);
  const out=s.tab==='pola';glide(B.windLP.frequency,out?1400:s.tab==='targ'?700:300,1);glide(B.rainLP.frequency,out?4200:s.tab==='targ'?2000:700,1)}

function ensure(){if(ac)return true;const C=window.AudioContext||window.webkitAudioContext;if(!C)return false;
  try{ac=new C();out=filt('lowpass',7500);const comp=ac.createDynamicsCompressor();comp.threshold.value=-18;comp.ratio.value=3;out.connect(comp);comp.connect(ac.destination);
    ambBus=gain(0);fxBus=gain(0);ambBus.connect(out);fxBus.connect(out);
    pink=noiseBuf('pink');brown=noiseBuf('brown');buildBeds();
    document.addEventListener('visibilitychange',()=>{if(!ac)return;if(document.hidden)ac.suspend();else if(st&&st.on)ac.resume()});
    return true}catch(e){ac=null;return false}}
window.AuraSound={
  // s = {on, amb, vol, tab, wx, season, hour, run:{maszyna:liczba partii}}
  update(s){st=s;if(!s.on&&!ac)return;if(!ensure())return;
    if(!s.on){if(ac.state==='running')ac.suspend();return}
    if(ac.state==='suspended'&&!document.hidden)ac.resume();
    glide(fxBus.gain,.9*s.vol,.1);glide(ambBus.gain,s.amb?.75*s.vol:0,.6);
    const now=performance.now();if(now-lastTick<90)return;lastTick=now;
    apply(s);if(s.amb)schedule(s)},
  fx(type){if(!st||!st.on||!ensure()||document.hidden)return;if(ac.state==='suspended')ac.resume();try{(FX[type]||FX.click)()}catch(e){}}
};
})();
