// Dodatki tylko dla aplikacji na Windows (Tauri); w przeglądarce plik nic nie robi.
// Karta aktualizacji pod górnym paskiem: Pobierz → pasek pobierania → Zainstaluj.
(()=>{'use strict';
const T=window.__TAURI__;
if(!T||!T.core)return;
const invoke=T.core.invoke, listen=T.event.listen;
const CHECK_EVERY=6*3600e3;

// menu WebView2 (Wstecz, Odśwież, Drukuj…) nie pasuje do gry; gra ma własne menu pod prawym przyciskiem
document.addEventListener('contextmenu',e=>{if(!e.target.closest('input,textarea,[contenteditable]'))e.preventDefault()});

const css=`
#upd{position:fixed;right:16px;top:calc(var(--updtop,64px) + 12px);z-index:66;width:min(300px,calc(100vw - 32px));display:none;justify-content:flex-end;pointer-events:none}
#upd.show{display:flex}
#upd .uc{pointer-events:auto;position:relative;width:100%;padding:12px 14px 13px;border-radius:14px;color:var(--chaff,#f3e6c8);
  background:linear-gradient(180deg,rgba(54,41,21,.97),rgba(30,23,16,.97));border:1px solid var(--gl-bd,rgba(236,188,76,.26));
  box-shadow:0 14px 30px -12px rgba(0,0,0,.9);backdrop-filter:blur(8px);animation:updin .35s cubic-bezier(.2,.8,.3,1)}
@keyframes updin{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
#upd .uh{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:11px;align-items:center}
#upd .ui{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:rgba(147,203,95,.14);border:1px solid rgba(147,203,95,.45);color:#9fd46a}
#upd .ui svg{width:20px;height:20px}
#upd.ready .ui{background:rgba(236,188,76,.14);border-color:rgba(236,188,76,.55);color:#ecbc4c}
#upd.err .ui{background:rgba(230,120,90,.12);border-color:rgba(230,120,90,.5);color:#f0a080}
#upd .ul{font-size:.66rem;letter-spacing:.14em;text-transform:uppercase;font-weight:800;color:var(--grain,#ecbc4c)}
#upd .uv{font-size:.95rem;font-weight:700;margin-top:1px}
#upd .ux{align-self:start;background:none;border:0;color:rgba(243,230,200,.55);font-size:1rem;line-height:1;padding:2px 4px;border-radius:6px}
#upd .ux:hover{color:var(--chaff,#f3e6c8);background:rgba(255,236,200,.08)}
#upd ul{margin:10px 0 0;padding-left:18px;font-size:.82rem;line-height:1.4;color:rgba(243,230,200,.88)}
#upd .un{margin:8px 0 0;font-size:.76rem;line-height:1.35;color:rgba(243,230,200,.62)}
#upd .ubar{height:6px;margin-top:12px;border-radius:3px;background:rgba(0,0,0,.4);overflow:hidden;display:none}
#upd .ubar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#9fd46a,#ecbc4c);border-radius:3px;transition:width .2s}
#upd.dl .ubar{display:block}
#upd .ub{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;margin-top:12px;padding:9px 12px;border-radius:10px;font-weight:800;font-size:.9rem;
  color:#1b2410;background:linear-gradient(180deg,#b6e27f,#86bd52);border:1px solid rgba(214,240,170,.6);box-shadow:0 6px 16px -8px rgba(120,190,70,.8);transition:filter .15s}
#upd .ub:hover{filter:brightness(1.08)}
#upd .ub:disabled{filter:saturate(.4) brightness(.8);cursor:default}
#upd .ub svg{width:17px;height:17px}
#upd.ready .ub{color:#2a1c06;background:linear-gradient(180deg,#f5cf6c,#d9a53a);border-color:rgba(255,226,150,.7);box-shadow:0 6px 16px -8px rgba(236,188,76,.9)}
#upd.err .ub{color:var(--chaff,#f3e6c8);background:rgba(255,236,200,.08);border-color:rgba(236,188,76,.35);box-shadow:none}
#upd .upill{pointer-events:auto;display:none;align-items:center;gap:7px;padding:7px 12px 7px 9px;border-radius:999px;font-weight:700;font-size:.82rem;color:var(--chaff,#f3e6c8);
  background:linear-gradient(180deg,rgba(54,41,21,.97),rgba(30,23,16,.97));border:1px solid rgba(147,203,95,.55);box-shadow:0 10px 24px -12px rgba(0,0,0,.9)}
#upd .upill svg{width:16px;height:16px;color:#9fd46a}
#upd.ready .upill{border-color:rgba(236,188,76,.7)}
#upd.ready .upill svg{color:#ecbc4c}
#upd.min{width:auto}
#upd.min .uc{display:none}
#upd.min .upill{display:flex}
`;
const ICON={
  down:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>',
  inst:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v5h-5"/></svg>',
  err:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/></svg>'
};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmtMB=b=>(b/1048576).toFixed(1).replace('.',',')+' MB';

// idle: brak aktualizacji · avail: jest, do pobrania · dl: pobieranie · ready: pobrana · inst: instalowanie · err: błąd
let info=null, state='idle', pct=0, got=0, errMsg='', minimized=false, box=null;

function mount(){
  if(box)return;
  const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);
  box=document.createElement('div');box.id='upd';box.setAttribute('aria-live','polite');
  box.addEventListener('click',onClick);
  document.body.appendChild(box);
  const bar=document.querySelector('.bar-top');
  const place=()=>document.documentElement.style.setProperty('--updtop',(bar?bar.getBoundingClientRect().bottom:52)+'px');
  place();addEventListener('resize',place);
  if(bar&&window.ResizeObserver)new ResizeObserver(place).observe(bar);
}

function notesHtml(){
  const lines=String(info&&info.notes||'').split(/\r?\n/).map(l=>l.trim()).filter(l=>/^[-*] /.test(l)).map(l=>l.slice(2));
  if(!lines.length)return '';
  const more=lines.length>5?`<li>i ${lines.length-5} więcej…</li>`:'';
  return `<ul>${lines.slice(0,5).map(l=>`<li>${esc(l)}</li>`).join('')}${more}</ul>`;
}

function draw(){
  mount();
  const v=info?esc(info.version):'';
  let label='Nowa wersja', icon=ICON.down, btn=`${ICON.down}Pobierz aktualizację`, note='Pobiera się w tle, możesz grać dalej.', pill=`Aktualizacja ${v}`;
  if(state==='dl'){label='Pobieranie';btn=`Pobieranie… ${pct}%`;note='Możesz grać dalej. Instalację uruchomisz, kiedy zechcesz.';pill=`Pobieranie ${pct}%`}
  else if(state==='ready'){label='Gotowe do instalacji';icon=ICON.inst;btn=`${ICON.inst}Zainstaluj i uruchom ponownie`;note='Gra zapisze postęp, zainstaluje nową wersję i otworzy się sama po kilku sekundach.';pill=`Zainstaluj ${v}`}
  else if(state==='inst'){label='Instalowanie';icon=ICON.inst;btn='Zapisuję grę i instaluję…';note='Za chwilę gra uruchomi się ponownie.';pill='Instalowanie…'}
  else if(state==='err'){label='Nie udało się';icon=ICON.err;btn='Spróbuj ponownie';note=esc(errMsg);pill='Aktualizacja: błąd'}
  box.className=[state==='idle'?'':'show',state,minimized&&state!=='inst'?'min':''].join(' ');
  if(state==='idle'){box.innerHTML='';return}
  box.innerHTML=`<div class="uc" role="dialog" aria-label="Aktualizacja Aura Fields">
    <div class="uh"><span class="ui">${icon}</span><div><div class="ul">${label}</div><div class="uv">Aura Fields ${v}</div></div>
    <button type="button" class="ux" data-u="min" title="Zwiń" aria-label="Zwiń">✕</button></div>
    ${state==='avail'||state==='err'?notesHtml():''}
    <div class="ubar"><i style="width:${pct}%"></i></div>
    <button type="button" class="ub" data-u="go" ${state==='dl'||state==='inst'?'disabled':''}>${btn}</button>
    <p class="un">${note}${state==='avail'&&info.current?` Masz wersję ${esc(info.current)}.`:''}</p>
  </div><button type="button" class="upill" data-u="max" title="Pokaż aktualizację">${state==='ready'?ICON.inst:ICON.down}${pill}</button>`;
}

async function check(){
  if(state==='dl'||state==='ready'||state==='inst')return;
  try{
    const found=await invoke('update_check');
    if(!found){if(state!=='err'){state='idle';info=null;draw()}return}
    if(!info||info.version!==found.version)minimized=false;
    info=found;state='avail';draw();
  }catch(e){/* brak sieci albo brak wydań: spróbujemy przy następnym sprawdzeniu */}
}

async function download(){
  state='dl';pct=0;got=0;draw();
  try{await invoke('update_download');state='ready';pct=100;minimized=false}
  catch(e){state='err';errMsg='Pobieranie przerwane ('+e+'). Sprawdź połączenie z internetem.'}
  draw();
}

async function install(){
  state='inst';draw();
  // zapis gry: game.js zapisuje stan przy beforeunload
  try{dispatchEvent(new Event('beforeunload'))}catch(e){}
  try{await invoke('update_install')}
  catch(e){state='err';errMsg='Instalacja nie ruszyła ('+e+').';draw()}
}

function onClick(e){
  const b=e.target.closest('[data-u]');if(!b)return;
  const u=b.dataset.u;
  if(u==='min'){minimized=true;draw()}
  else if(u==='max'){minimized=false;draw()}
  else if(state==='avail')download();
  else if(state==='ready')install();
  else if(state==='err'){state='avail';errMsg='';download()}
}

listen('update-progress',ev=>{
  const p=ev.payload||{};got=p.got||0;
  pct=p.total?Math.min(99,Math.floor(got*100/p.total)):0;
  if(!box||state!=='dl')return;
  const bar=box.querySelector('.ubar i'),btn=box.querySelector('.ub'),pill=box.querySelector('.upill');
  const txt=p.total?`${pct}%`:fmtMB(got);
  if(bar)bar.style.width=pct+'%';
  if(btn)btn.textContent=`Pobieranie… ${txt}`;
  if(pill)pill.lastChild.textContent=`Pobieranie ${txt}`;
});

setTimeout(check,4000);
setInterval(check,CHECK_EVERY);
})();
