import {requestStudent,requireSameStudent,studentName} from './identity.js';
import {createShellAcademy} from './shell-ui.js';
import {gameStats} from './game-model.js';
import {difficultyById} from './difficulty-data.js';
import {createCourse} from './course.js';
import {FileSystem,seed,validateState,tokenize,modeString,PROTECTED} from './core.js';
import {createTeaching} from './teaching.js';
import {createExplorer} from './explorer.js';
import {createNetworking} from './network-ui.js';
import {createRecovery} from './recovery-ui.js';
import {createSearch} from './search.js';
import {connectLocal} from './local.js';
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const plural=(n,one,few,many)=>n%10===1&&n%100!==11?one:n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?few:many;
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={
 explorer:'<path d="M3 4h18v5H3ZM3 12h8v8H3ZM15 12h6v8h-6M7 9v3M18 9v3"/>',
 recovery:'<path d="M3 10a9 9 0 1 1 2 8M3 3v7h7M12 7v5l3 2"/>',
 network:'<rect x="8" y="2" width="8" height="6" rx="1"/><rect x="2" y="16" width="7" height="6" rx="1"/><rect x="15" y="16" width="7" height="6" rx="1"/><path d="M12 8v4M5.5 16v-4h13v4"/>',
 report:'<path d="M14 3H5v18h14V8Z M14 3v5h5 M8 12h8 M8 16h8"/>',
 users:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-4a6 6 0 0 1 12 0v4M17 4a3 3 0 0 1 0 6M18 14c3 0 4 2 4 5v2"/>',
 cpu:'<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 1v5M15 1v5M9 18v5M15 18v5M1 9h5M1 15h5M18 9h5M18 15h5"/><rect x="9" y="9" width="6" height="6"/>',
 memory:'<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M6 18v3M10 18v3M14 18v3M18 18v3M7 10v4M12 10v4M17 10v4"/>',
 drive:'<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="11" r="5"/><path d="m12 11 6 6M6 18h.01"/>',
 journal:'<path d="M7 3h12v18H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3ZM4 17h15M8 7h7M8 11h7"/>',
 guide:'<path d="M12 5C8 2 4 3 2 4v15c3-2 7-2 10 0 3-2 7-2 10 0V4c-3-2-7-2-10 1ZM12 5v14"/>',
 play:'<path d="m8 4 12 8-12 8Z"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/>',
 circle:'<circle cx="12" cy="12" r="8"/>',
 copy:'<rect x="8" y="8" width="13" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
 cut:'<circle cx="5" cy="6" r="3"/><circle cx="5" cy="18" r="3"/><path d="m8 8 13 13M8 16 13 11M16 8l5-5"/>',
 paste:'<path d="M8 4H4v17h16V4h-4"/><rect x="8" y="2" width="8" height="5" rx="1"/>',
 home:'<circle cx="12" cy="12" r="7"/><ellipse cx="12" cy="12" rx="11" ry="4" transform="rotate(-30 12 12)"/><circle cx="19" cy="6" r="2" fill="currentColor" stroke="none"/>',
 files:'<path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/><path d="M3 9h18"/>',
 editor:'<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4M3 7h3M3 12h3M3 17h3"/>',
 terminal:'<path d="m5 6 5 5-5 5M13 17h6"/>',
 monitor:'<path d="M3 14h4l3-8 4 13 3-8h4"/>',
 lab:'<path d="M9 3h6M10 3v6L4 19a1.4 1.4 0 0 0 1.2 2h13.6a1.4 1.4 0 0 0 1.2-2L14 9V3M8 14h8"/><circle cx="12" cy="17.5" r=".5"/>',
 settings:'<path d="m10 3-.6 2.3-2 .9-2.1-.8-2 3.4L5 10.5v2.7l-1.7 1.6 2 3.4 2.2-.6 2 1 .5 2.4h4l.6-2.4 2-1 2.1.7 2-3.4-1.7-1.7v-2.7l1.7-1.6-2-3.4-2.1.8-2-.9L14 3Z"/><circle cx="12" cy="12" r="3"/>',
 grid:'<rect x="4" y="4" width="6" height="6" rx="1.3"/><rect x="14" y="4" width="6" height="6" rx="1.3"/><rect x="4" y="14" width="6" height="6" rx="1.3"/><rect x="14" y="14" width="6" height="6" rx="1.3"/>',
 file:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6M8 13h8M8 17h5"/>',
 arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
 chevron:'<path d="m9 6 6 6-6 6"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 check:'<path d="m5 12 4 4L19 6"/>',
 minus:'<path d="M5 12h14"/>',
 max:'<rect x="5" y="5" width="14" height="14" rx="1"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/>',
 upload:'<path d="M12 15V3m-5 5 5-5 5 5M4 15v5h16v-5"/>',
 trash:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
 pencil:'<path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14Z"/>',
 disk:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 14h18M7 17h.01M11 17h.01"/>',
 info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
 desktop:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M12 17v4M8 21h8"/>',
 save:'<path d="M4 3h13l4 4v14H3V3ZM7 3v6h9V3M7 21v-8h10v8"/>'
};
paths.course=paths.guide;paths.shell=paths.terminal;
const icon=(name,cls='')=>`<svg viewBox="0 0 24 24" aria-hidden="true" class="${cls}">${paths[name]||paths.file}</svg>`;
const appIcon=name=>`<span class="app-icon icon-${name}">${icon(name)}</span>`;
const APPS={home:{title:'Početna',desc:'Upoznaj svoj prostor',w:790,h:600,ram:32},files:{title:'Datoteke',desc:'Sve na svome mjestu',w:710,h:490,ram:48},editor:{title:'Bilješke',desc:'Mjesto za tvoje ideje',w:650,h:520,ram:40},terminal:{title:'Terminal',desc:'Naredba po naredba',w:660,h:440,ram:24},monitor:{title:'Procesi',desc:'Pogled ispod površine',w:660,h:550,ram:32},lab:{title:'Laboratorij',desc:'Isprobaj. Otkrij. Nauči.',w:640,h:590,ram:32},settings:{title:'Postavke',desc:'Uredi svoj prostor',w:560,h:590,ram:24}};
Object.assign(APPS,{
 shell:{title:'Akademija terminala',desc:'DOS/CMD, Linux i PowerShell · 18 razina',w:1160,h:820,ram:32},
 course:{title:'Uči od početka',desc:'Objašnjenje, primjer, pokus i provjera',w:1160,h:850,ram:32},
 explorer:{title:'Istraži OS',desc:'Struktura, funkcije i mehanizmi',w:1120,h:790,ram:32},
 search:{title:'Pretraživanje',desc:'Pronađi naziv ili dio teksta',w:850,h:700,ram:24},
 recovery:{title:'Oporavak',desc:'Verzije i sigurnosne kopije',w:970,h:740,ram:24},
 network:{title:'Mreža',desc:'Veza, DNS i dijagnostika',w:980,h:740,ram:32},
 report:{title:'Izvještaj',desc:'Pregled i predaja rada',w:900,h:730,ram:24},
 users:{title:'Korisnici i dozvole',desc:'Tko smije što?',w:800,h:670,ram:32},
 cpu:{title:'CPU laboratorij',desc:'Proces po proces',w:900,h:690,ram:32},
 memory:{title:'Memorija',desc:'Stranice i okviri',w:870,h:690,ram:32},
 drive:{title:'Disk',desc:'Blokovi i pohrana',w:810,h:650,ram:24},
 trash:{title:'Koš',desc:'Vrati obrisani zapis',w:660,h:490,ram:16},
 journal:{title:'Dnevnik',desc:'Trag radnji u sustavu',w:720,h:560,ram:16},
 guide:{title:'Vodič',desc:'Pojmovi i upute',w:780,h:650,ram:24}
});
APPS.lab.w=980;APPS.lab.h=700;APPS.files.w=820;APPS.files.h=540;
async function start(){
const student=await requestStudent();
const local=connectLocal(student);
const storageOK=true,initialWarning='';
const fs=new FileSystem(local.initial,state=>{local.persist(state);updateGlobalScore(state);});
function updateGlobalScore(state){const owner=$('#student-banner');if(owner)owner.textContent='Učenik / učenica: '+studentName(state.student);const s=gameStats(state),b=$('#global-score'),v=$('#global-score-value'),value=s.total+' XP';if(v.textContent!==value)v.textContent=value;b.setAttribute('aria-label','Bodovi: '+value+'. Otvori pregled misija.');b.title=value+' / '+s.max+' · Rang '+s.level+' · Težina '+difficultyById(state.learning.game.difficulty).label;}
updateGlobalScore(fs.state);
const windows=new Map();let zIndex=10,pid=100,active=null;
let cwd='docs',selected=null,editorId='welcome',editorDirty=false,termCwd='root',terminalHistory=[],historyIndex=0;
let terminalLines=[{text:'zljixOS terminal 0.16.0 · lokalno',type:'banner'},{text:'Mali terminal, tvoj virtualni disk. Upiši help za popis naredbi.\n',type:''}];
let toastTimer,fileClipboard=null,fileSearch='';
const teaching=createTeaching({fs,esc,icon,openApp,toast,ask,download,refresh,changed:dataChanged,permissionsChanged,switchUser,dirty:()=>editorDirty,openLesson:id=>{fs.transact(()=>{fs.state.learning.course.lesson=id;fs.state.learning.course.overview=false;fs.state.learning.course.stage=0;fs.state.learning.game.screen='lessons';});openApp('course');refresh('course');},appTitle:id=>APPS[id].title});
const exploring=createExplorer({fs,esc,icon,openApp,toast,ask,refresh});
const shellAcademy=createShellAcademy({fs,esc,icon,toast,ask,refresh,openApp});
const learningCourse=createCourse({fs,esc,icon,openApp,openMechanism:exploring.openLesson,toast,refresh});
const networking=createNetworking({fs,esc,icon,openApp,toast,ask,download,refresh});
const recovery=createRecovery({fs,esc,icon,openApp,openFile,openFolder:id=>{navigateFolder(id);openApp('files');},toast,ask,download,chooseFile,refresh,changed:dataChanged,dirty:()=>editorDirty,replaceWorkspace});
const searching=createSearch({fs,esc,icon,openApp,openFile,openFolder:id=>{navigateFolder(id);openApp('files');}});
function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('#toast').hidden=true;},5000);}
function safe(fn){try{return fn();}catch(e){toast(e.message);return null;}}
function applySettings(){document.body.dataset.theme=fs.state.theme;document.body.classList.toggle('large',fs.state.large);}
applySettings();
if(!storageOK){$('.local-badge').innerHTML='<i></i> Privremeni prostor';}
function byteSize(text){const n=new TextEncoder().encode(text).length;return n<1024?n+' B':(n/1024).toFixed(1)+' KB';}
function download(name,content,type='text/plain;charset=utf-8'){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.hidden=true;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
function refresh(...ids){for(const id of ids){const win=windows.get(id);if(win)render(win);}}
function dataChanged(){if(!fs.get(cwd))cwd='root';if(!fs.get(termCwd))termCwd='root';if(!fs.get(selected))selected=null;refresh('files','lab','trash','journal','report','recovery','search');if(windows.has('editor')){if(fs.get(editorId)){updateEditorMeta();}else render(windows.get('editor'));}updateTerminalPrompt();}
function switchUser(id){if(editorDirty){toast('Preuzmi nespremljeni tekst prije promjene profila.');return false;}try{fs.switchUser(id);fileClipboard=null;selected=null;cwd='docs';termCwd='root';updateProfile();dataChanged();refresh('users','editor','journal');return true;}catch(e){toast(e.message);return false;}}
function updateProfile(){const b=$('#profile-button');if(b){b.innerHTML=icon('users')+'<span>'+esc(fs.user.name)+'</span>';b.setAttribute('aria-label','Simulirani profil: '+fs.user.name);}const footer=$('.launcher-footer');if(footer)footer.innerHTML='<span class="avatar">'+esc(fs.user.name[0])+'</span><div><strong>'+esc(fs.user.name)+' · simulirani profil</strong><small>Lokalno izdanje · profili služe vježbi</small></div>';}
function permissionsChanged(){dataChanged();refresh('editor','users','journal');}
function navigateFolder(id){try{fs.require(id,'rx');cwd=id;selected=null;fileSearch='';refresh('files');}catch(e){toast(e.message);refresh('lab','journal');}}
async function pasteNode(){if(!fileClipboard)return;const n=fs.get(fileClipboard.id);if(!n){fileClipboard=null;toast('Izvor više ne postoji.');return;}try{if(fileClipboard.cut){fs.moveTo(n.id,cwd);fileClipboard=null;dataChanged();toast('Stavka je premještena.');}else{let name=n.name;if(fs.children(cwd).some(v=>v.name.toLowerCase()===name.toLowerCase())){await ask({title:'Naziv kopije',description:'Na odredištu već postoji taj naziv.',input:true,value:name.replace(/(\.[^.]+)?$/, ' - kopija$1'),confirm:'Kopiraj',validate:value=>{fs.copyTo(n.id,cwd,value);dataChanged();return true;}});}else{fs.copyTo(n.id,cwd,name);dataChanged();toast('Stavka je kopirana.');}}}catch(e){toast(e.message);}}
function focusWindow(id){const w=windows.get(id);if(!w)return;w.min=false;w.el.hidden=false;w.el.style.zIndex=++zIndex;active=id;for(const v of windows.values())v.el.classList.toggle('active',v.id===id);$('#active-app').textContent=APPS[id].title;updateDock();}
function updateDock(){for(const b of $$('#dock-apps button')){const id=b.dataset.app;b.classList.toggle('open',windows.has(id));b.classList.toggle('active',active===id&&!windows.get(id)?.min);}}
function refreshMonitor(){refresh('monitor');}
function openApp(id){if(!APPS[id])return;closeLauncher();if(windows.has(id)){if(['course','report','lab','shell'].includes(id))render(windows.get(id));focusWindow(id);refreshMonitor();if(id==='terminal')$('.terminal-prompt input',windows.get(id).el)?.focus();return windows.get(id);}
  const app=APPS[id],el=document.createElement('section');el.className='window';el.dataset.app=id;el.setAttribute('aria-label',app.title);el.setAttribute('role','region');el.tabIndex=-1;
  const space=$('#desktop'),width=Math.min(app.w,space.clientWidth-36),height=Math.min(app.h,space.clientHeight-110);
  const offset=(windows.size%5)*23;
  el.style.cssText=`width:${width}px;height:${height}px;left:${Math.max(18,Math.min(space.clientWidth-width-20,(space.clientWidth-width)/2-25+offset))}px;top:${Math.max(18,Math.min(space.clientHeight-height-108,38+offset))}px;`;
  el.innerHTML=`<div class="window-header"><span class="window-app-symbol">${icon(id)}</span><span class="window-title">${app.title}</span><div class="window-controls"><button data-window="min" aria-label="Minimiziraj ${app.title}" title="Minimiziraj">${icon('minus')}</button><button data-window="max" aria-label="Povećaj ${app.title}" title="Povećaj ili vrati">${icon('max')}</button><button data-window="close" aria-label="Zatvori ${app.title}" title="Zatvori">${icon('close')}</button></div></div><div class="window-content"></div>`;
  const w={id,el,pid:pid++,min:false,max:false};windows.set(id,w);$('#windows').append(el);render(w);focusWindow(id);wireWindow(w);refreshMonitor();return w;
}
function minimize(id){const w=windows.get(id);if(!w)return;w.min=true;w.el.hidden=true;if(id==='editor')safe(()=>fs.transact(()=>{fs.state.lesson.minimized=true;}));selectTopWindow();refreshMonitor();refresh('lab');}
function selectTopWindow(){const top=[...windows.values()].filter(w=>!w.min).sort((a,b)=>+b.el.style.zIndex- +a.el.style.zIndex)[0];if(top)focusWindow(top.id);else{active=null;$('#active-app').textContent='Radna površina';updateDock();}}
async function closeApp(id,fromProcess=false){const w=windows.get(id);if(!w)return false;if(id==='editor'&&editorDirty){const ok=await ask({title:'Bilješka nije spremljena',description:'Preglednik nije uspio spremiti tekst. Preuzmite bilješku prije zatvaranja ako je želite sačuvati.',confirm:'Zatvori bez spremanja',danger:true});if(!ok)return false;editorDirty=false;}
  w.el.remove();windows.delete(id);if(fromProcess&&id==='editor'&&fs.state.lesson.minimized)safe(()=>fs.transact(()=>{fs.state.lesson.ended=true;}));selectTopWindow();refreshMonitor();refresh('lab');return true;
}
function wireWindow(w){const header=$('.window-header',w.el);w.el.addEventListener('pointerdown',()=>{if(active!==w.id){focusWindow(w.id);}});header.addEventListener('click',e=>{const action=e.target.closest('[data-window]')?.dataset.window;if(action==='min')minimize(w.id);if(action==='close')closeApp(w.id);if(action==='max')maximize(w);});header.addEventListener('dblclick',e=>{if(!e.target.closest('button'))maximize(w);});
  header.addEventListener('pointerdown',e=>{if(e.target.closest('button')||w.max||innerWidth<=700||e.button!==0)return;const x=e.clientX,y=e.clientY,left=w.el.offsetLeft,top=w.el.offsetTop;header.setPointerCapture(e.pointerId);const move=ev=>{w.el.style.left=Math.max(0,Math.min($('#desktop').clientWidth-w.el.offsetWidth,left+ev.clientX-x))+'px';w.el.style.top=Math.max(0,Math.min($('#desktop').clientHeight-130,top+ev.clientY-y))+'px';};const end=()=>{header.removeEventListener('pointermove',move);header.removeEventListener('pointerup',end);header.removeEventListener('pointercancel',end);};header.addEventListener('pointermove',move);header.addEventListener('pointerup',end);header.addEventListener('pointercancel',end);});
}
function maximize(w){w.max=!w.max;w.el.classList.toggle('maximized',w.max);$('[data-window=max]',w.el).setAttribute('aria-label',(w.max?'Vrati veličinu ':'Povećaj ')+APPS[w.id].title);}
function render(w){const c=$('.window-content',w.el);const renderers={home:homeView,files:filesView,editor:editorView,terminal:terminalView,monitor:monitorView,settings:settingsView,shell:shellAcademy.academy,...teaching,course:learningCourse.course,explorer:exploring.explorer,network:networking.network,recovery:recovery.recovery,search:searching.search};renderers[w.id](c);}
function openButtons(root){for(const b of $$('[data-open]',root))b.onclick=()=>openApp(b.dataset.open);}
function homeView(c){c.innerHTML=`<div class="home-content"><div class="home-eyebrow"><span class="label">zljixOS · UČENJE OPERACIJSKIH SUSTAVA</span><span class="tag">LOKALNO · 0.16.0</span></div><div class="hero"><div><h1>Razumij sustav,<br><em>korak po korak.</em></h1><p>Kreni bez predznanja: upoznaj dijelove računala, razumij jedan primjer, isprobaj ga i provjeri razumijevanje.</p><div class="hero-actions"><button class="button primary" data-open="course">Uči od početka ${icon('arrow')}</button><button class="button subtle" data-open="shell">DOS/CMD, Linux i PowerShell · 18 razina</button></div></div><div class="hero-art" aria-hidden="true"><div class="hero-orb"></div><span class="hero-star">✧</span></div></div><div class="section-line"><h2>Produbi razumijevanje pokusom</h2><span>Predvidi → promatraj → objasni.</span></div><div class="home-apps">${['cpu','memory','drive','network'].map(id=>`<button class="home-app" data-open="${id}">${appIcon(id)}<strong>${APPS[id].title}</strong><small>${APPS[id].desc}</small></button>`).join('')}</div><div class="home-lab">${icon('guide')}<div><strong>Od dijelova do mehanizma.</strong><p>Šest osnovnih lekcija i dva proširenja pripremaju te za istraživanje detaljnih mehanizama.</p></div><button data-open="course" aria-label="Uči od početka">${icon('arrow')}</button></div><div class="home-bottom"><span><i class="status-dot"></i>Spremanje i prijenos rada: Moj rad</span><span>Nastavni simulator operacijskog sustava</span></div></div>`;openButtons(c);}
function breadcrumb(id){let n=fs.get(id);const parts=[];while(n){parts.unshift(n);n=fs.get(n.parent);}return parts.map((n,i)=>`${i?icon('chevron','small-icon'):''}<button data-folder="${esc(n.id)}">${n.id==='root'?'Moj prostor':esc(n.name)}</button>`).join('');}
function filesView(c){
 if(!fs.get(cwd))cwd='docs';const readable=fs.can(cwd,'rx'),list=readable?fs.list(cwd):[],writable=fs.can(cwd,'wx');
 c.innerHTML=`<div class="file-app"><div class="file-toolbar"><button class="button primary" id="new-folder" ${!writable?'disabled':''}>${icon('plus')} Nova mapa</button><button class="button secondary" id="new-file" ${!writable?'disabled':''}>${icon('file')} Novi tekst</button><label class="file-search">${icon('search')}<input aria-label="Traži u mapi" placeholder="Traži u mapi…"></label><button class="button subtle" id="import-text" ${!writable?'disabled':''}>${icon('upload')} Uvezi</button></div><div class="file-body"><aside class="file-sidebar"><span class="label">MOJ PROSTOR</span>${[['root','disk','Sve datoteke'],['docs','files','Dokumenti'],['labs','lab','Vježbe']].map(([id,ico,label])=>`<button data-folder="${id}" class="${cwd===id?'selected':''}" title="${label}">${icon(ico)}<span>${label}</span></button>`).join('')}<button id="open-search" title="Pretraži cijeli prostor">${icon('search')}<span>Pretraživanje</span></button><button id="open-trash" title="Koš">${icon('trash')}<span>Koš</span></button><button id="open-recovery" title="Oporavak">${icon('recovery')}<span>Oporavak</span></button></aside><div class="file-main"><div class="breadcrumb">${breadcrumb(cwd)}</div><div class="file-list"></div></div></div><div class="file-selection"><button class="button secondary" id="open-selected">Otvori</button><button class="button subtle" id="copy-selected">${icon('copy')} Kopiraj</button><button class="button subtle" id="cut-selected">${icon('cut')} Izreži</button><button class="button subtle" id="paste-selected" ${!fileClipboard||!writable?'disabled':''}>${icon('paste')} Zalijepi</button><button class="button subtle" id="rename-selected">${icon('pencil')} Naziv</button><button class="button subtle" id="delete-selected">${icon('trash')} U Koš</button><button class="button subtle" id="permissions-selected">${icon('lock')} Dozvole</button><button class="button subtle" id="export-selected" title="Preuzmi datoteku">${icon('download')}</button></div><div class="window-status"><span>${esc(fs.user.name)} · profil vježbe</span><span>${list.length} ${plural(list.length,'stavka','stavke','stavki')} · Odaberi → Otvori</span></div></div>`;
 const updateSelection=()=>{const n=fs.get(selected),locked=PROTECTED.includes(selected);for(const row of $$('[data-node]',c)){row.classList.toggle('selected',row.dataset.node===selected);row.setAttribute('aria-pressed',row.dataset.node===selected);}$('#open-selected',c).disabled=!n;$('#copy-selected',c).disabled=!n||locked;$('#cut-selected',c).disabled=!n||locked||!writable;$('#rename-selected',c).disabled=!n||locked||!writable;$('#delete-selected',c).disabled=!n||locked||!writable;$('#export-selected',c).disabled=n?.type!=='file'||!fs.can(n.id,'r');};
 const draw=()=>{const shown=list.filter(n=>n.name.toLocaleLowerCase('hr').includes(fileSearch.toLocaleLowerCase('hr')));$('.file-list',c).innerHTML=`<div class="file-head"><span>NAZIV</span><span>DOZVOLE</span><span>VELIČINA</span></div>${!readable?'<div class="file-empty">'+icon('lock')+'<p>Ovaj profil nema dozvolu čitanja i prolaza kroz mapu.</p></div>':shown.length?shown.map(n=>`<button class="file-row ${n.type==='file'?'file':''}" data-node="${esc(n.id)}" aria-label="${n.type==='dir'?'Mapa':'Datoteka'} ${esc(n.name)}" aria-pressed="false"><span class="file-name">${icon(n.type==='dir'?'files':'file')}<span>${esc(n.name)}</span></span><small>${n.mode}</small><small>${n.type==='file'?byteSize(n.content):'—'}</small></button>`).join(''):'<div class="file-empty">'+icon('files')+'<p>'+ (fileSearch?'Nema rezultata.':'Mapa je prazna. Dodaj mapu ili tekstualnu datoteku.')+'</p></div>'}`;for(const row of $$('[data-node]',c)){row.onclick=()=>{selected=row.dataset.node;updateSelection();};row.ondblclick=()=>openNode(row.dataset.node);row.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();openNode(row.dataset.node);}};}updateSelection();};draw();
 const search=$('.file-search input',c);search.value=fileSearch;search.oninput=()=>{fileSearch=search.value;selected=null;draw();};
 for(const button of $$('[data-folder]',c))button.onclick=()=>navigateFolder(button.dataset.folder);
 $('#new-folder',c).onclick=()=>createNode('dir');$('#new-file',c).onclick=()=>createNode('file');$('#import-text',c).onclick=importText;$('#open-search',c).onclick=searching.launch;$('#open-trash',c).onclick=()=>openApp('trash');$('#open-recovery',c).onclick=()=>recovery.showVersions(selected);
 $('#open-selected',c).onclick=()=>openNode(selected);$('#rename-selected',c).onclick=renameNode;$('#delete-selected',c).onclick=deleteNode;$('#permissions-selected',c).onclick=()=>teaching.permissions(selected||cwd);
 $('#copy-selected',c).onclick=()=>{fileClipboard={id:selected,cut:false};$('#paste-selected',c).disabled=!writable;toast('Kopirano. Otvori odredišnu mapu pa klikni Zalijepi.');};$('#cut-selected',c).onclick=()=>{fileClipboard={id:selected,cut:true};$('#paste-selected',c).disabled=!writable;toast('Odabrano za premještanje. Otvori odredište pa Zalijepi.');};$('#paste-selected',c).onclick=pasteNode;
 $('#export-selected',c).onclick=()=>safe(()=>{const n=fs.get(selected);if(n?.type==='file')download(n.name,fs.read(n.id));});
}
function openNode(id){const n=fs.get(id);if(!n)return;if(n.type==='dir')navigateFolder(id);else openFile(id);}
async function createNode(type,parent=cwd){const value=await ask({title:type==='dir'?'Nova mapa':'Nova tekstualna datoteka',description:'Lokacija: '+fs.path(parent),value:type==='dir'?'':'biljeska.txt',confirm:'Izradi',input:true,validate:name=>{const n=fs.create(parent,name,type);dataChanged();if(type==='file')openFile(n.id);else{selected=n.id;refresh('files');}return true;}});if(value)toast(type==='dir'?'Mapa je izrađena.':'Datoteka je spremna za pisanje.');}
async function renameNode(){const n=fs.get(selected);if(!n)return;await ask({title:'Preimenuj',value:n.name,input:true,confirm:'Spremi naziv',description:'Novi naziv u mapi '+fs.path(n.parent),validate:name=>{fs.rename(n.id,name);dataChanged();return true;}});}
async function deleteNode(){const n=fs.get(selected);if(!n)return;if(editorDirty){let current=fs.get(editorId);while(current){if(current.id===n.id){toast('Prvo preuzmite nespremljeni tekst u Bilješkama.');focusWindow('editor');return;}current=fs.get(current.parent);}}const ok=await ask({title:'Premjestiti u Koš?',description:`Stavka „${n.name}” bit će premještena u Koš${n.type==='dir'?' zajedno sa sadržajem':''}. Možeš je vratiti iz aplikacije Koš.`,confirm:'U Koš'});if(ok)safe(()=>{fs.trash(n.id);dataChanged();toast('Stavka je u Košu.');});}
function chooseFile(accept,handler){const i=document.createElement('input');i.type='file';i.accept=accept;i.onchange=()=>{if(i.files?.[0])handler(i.files[0]);};i.click();}
function importText(){const destination=cwd;chooseFile('.txt,.md,.csv,.json,.log,.html,.css,.js,text/plain',async file=>{try{if(file.size>250000)throw new Error('Za ovaj prototip uvezite tekst do 250 KB.');const text=await file.text();if(text.includes('\u0000'))throw new Error('Odaberite tekstualnu datoteku.');let name=file.name;if(fs.children(destination).some(n=>n.name.toLowerCase()===name.toLowerCase()))name='Uvoz-'+Date.now()+'-'+name;const n=fs.create(destination,name,'file',text);selected=n.id;dataChanged();toast('Tekstualna datoteka je uvezena.');}catch(e){toast(e.message);}});}
async function openFile(id){try{fs.read(id);}catch(e){toast(e.message);refresh('lab','journal');return;}if(editorDirty){if(id!==editorId)toast('Prvo preuzmite nespremljeni tekst u Bilješkama.');focusWindow('editor');$('.editor-text',windows.get('editor')?.el)?.focus();return;}editorId=id;editorDirty=false;const w=openApp('editor');render(w);$('.editor-text',w.el)?.focus();}
function editorView(c){const n=fs.get(editorId),canRead=!!n&&fs.can(n.id,'r'),canWrite=canRead&&fs.can(n.id,'w');c.innerHTML=`<div class="editor-app"><div class="editor-toolbar"><button class="button secondary" id="editor-new">${icon('plus')} Novi tekst</button><button class="button primary" id="editor-save" ${!canWrite?'disabled':''}>${icon('save')} Spremi</button><button class="button subtle" id="editor-download" ${!canRead?'disabled':''} title="Preuzmi tekst">${icon('download')}</button><button class="button subtle" id="editor-versions" ${!canRead?'disabled':''}>${icon('recovery')} Verzije</button><span class="editor-path">${n?esc(fs.path(n.parent)):'Odaberi datoteku u Datotekama'}</span></div><div class="editor-title">${icon('file')}<h2>${n?esc(n.name):'Tvoja sljedeća ideja'}</h2></div><textarea class="editor-text" aria-label="Sadržaj bilješke" spellcheck="false" ${!canWrite?'readonly':''} ${!canRead?'disabled':''} placeholder="Zapiši nešto…"></textarea><div class="window-status"><span class="editor-save-state">${!canRead?'Pristup sadržaju nije dopušten':!canWrite?'Samo čitanje · nema dozvole pisanja':local.label()}</span><span id="editor-count"></span></div></div>`;$('#editor-versions',c).onclick=()=>recovery.showVersions(editorId);const area=$('.editor-text',c);area.value=canRead?fs.read(n.id):'';updateEditorCount(c);area.oninput=()=>saveEditor(c);$('#editor-new',c).onclick=()=>{if(editorDirty){toast('Prvo preuzmite nespremljeni tekst.');return;}createNode('file',n?.parent||'docs');};$('#editor-save',c).onclick=()=>saveEditor(c,true);$('#editor-download',c).onclick=()=>{if(fs.can(editorId,'r'))download(fs.get(editorId)?.name||'biljeska.txt',area.value);};}
function updateEditorCount(c){const value=$('.editor-text',c)?.value||'';const out=$('#editor-count',c);if(out)out.textContent=`${value.length} ${plural(value.length,'znak','znaka','znakova')} · ${value.split('\n').length} ${plural(value.split('\n').length,'redak','retka','redaka')}`;}
function saveEditor(c,explicit=false){const n=fs.get(editorId),area=$('.editor-text',c),label=$('.editor-save-state',c);if(!n||!area)return;try{fs.write(n.id,area.value);editorDirty=false;label.textContent=local.label();label.classList.remove('editor-error');refresh('files','lab','recovery','search');if(explicit){void local.flush();toast('Provjeri status lokalnog spremanja u gornjoj traci.');}}catch(e){editorDirty=true;label.textContent='Nije spremljeno — preuzmi tekst';label.classList.add('editor-error');if(explicit)toast(e.message);}updateEditorCount(c);}
function updateEditorMeta(){const w=windows.get('editor'),n=fs.get(editorId);if(!w||!n)return;$('.editor-title h2',w.el).textContent=n.name;$('.editor-path',w.el).textContent=fs.path(n.parent);}
function terminalView(c){c.innerHTML=`<div class="terminal-app"><div class="terminal-info">${icon('info')} Nastavni terminal · naredbe rade samo u virtualnom sustavu zljixOS-a</div><div class="terminal-scroll"><div class="terminal-output" role="log" aria-label="Izlaz terminala" aria-live="polite"></div><form class="terminal-prompt"><label for="terminal-input"></label><input id="terminal-input" aria-label="Naredba terminala" autocomplete="off" autocapitalize="off" spellcheck="false"></form></div><div class="terminal-tip">help · popis naredbi &nbsp;&nbsp; ↑ ↓ · prethodne naredbe &nbsp;&nbsp; clear · očisti prikaz</div></div>`;paintTerminal();const input=$('input',c);$('form',c).onsubmit=async e=>{e.preventDefault();const command=input.value.trim();if(!command)return;input.value='';terminalHistory.push(command);historyIndex=terminalHistory.length;await runCommand(command);};input.onkeydown=e=>{if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();historyIndex=Math.max(0,Math.min(terminalHistory.length,historyIndex+(e.key==='ArrowUp'?-1:1)));input.value=terminalHistory[historyIndex]||'';}};}
function updateTerminalPrompt(){const w=windows.get('terminal');if(w){const label=$('.terminal-prompt label',w.el);if(label)label.textContent=`${fs.user.id}@zljixOS:${fs.path(termCwd)} $`;}}
function paintTerminal(){const w=windows.get('terminal');if(!w)return;const out=$('.terminal-output',w.el);if(!out)return;out.replaceChildren();for(const l of terminalLines){const p=document.createElement('div');p.className='terminal-line '+l.type;p.textContent=l.text;out.append(p);}updateTerminalPrompt();const scroll=$('.terminal-scroll',w.el);scroll.scrollTop=scroll.scrollHeight;}
function terminalLog(text,type=''){terminalLines.push({text:String(text),type});if(terminalLines.length>250)terminalLines=terminalLines.slice(-250);paintTerminal();}
const sessionStart=Date.now();
async function runCommand(line){terminalLog(`${fs.user.id}@zljixOS:${fs.path(termCwd)} $ ${line}`,'command');try{
 const tokens=tokenize(line),[cmd,...a]=tokens;if(!cmd)return;
 const arity=(min,max=min)=>{if(a.length<min||a.length>max)throw new Error('Pogrešan broj argumenata. Upiši help.');};
 const node=path=>{const n=fs.resolve(path,termCwd);if(!n)throw new Error('Putanja ne postoji.');return n;};
 if(cmd==='help'){terminalLog(`DATOTEKE
  pwd                     trenutačna putanja
  ls [-l] [putanja]        sadržaj; -l prikazuje vlasnika i dozvole
  cd [putanja]            promijeni mapu; bez putanje → /
  mkdir naziv             nova mapa
  touch naziv.txt         nova tekstualna datoteka
  cat naziv.txt           pročitaj sadržaj
  echo "tekst" > ime.txt  upiši (zamijeni) sadržaj
  cp izvor odredište      kopiraj datoteku (bez prepisivanja)
  mv izvor mapa           premjesti zapis u postojeću mapu
  rm naziv                TRAJNO obriši datoteku ili praznu mapu
  stat putanja            metapodaci zapisa

MREŽNA SIMULACIJA
  ipconfig [/all]         IPv4, maska, pristupnik i DNS pokusnog računala
  ipconfig /renew         obnovi postavke preko simuliranog DHCP-a
  ping 192.168.10.30      ICMP prema susjedu u učionici
  ping 203.0.113.10       ICMP prema pokusnom web-poslužitelju
  nslookup portal.skola.test   upit pokusnom DNS poslužitelju
  curl http://portal.skola.test   HTTP zahtjev (TCP 80)
  Mrežne naredbe dijele postavke aplikacije Mreža; ne šalju pakete.

PROFILI I DOZVOLE
  whoami                  aktivan simulirani profil
  id                      profil i grupe
  su oznaka               prebaci profil u simulatoru, bez lozinke
  chmod 640 putanja       promijeni dozvole kao vlasnik ili Nastavnik
  chown oznaka putanja    promijeni vlasnika kao Nastavnik

MODELI I APLIKACIJE
  ps                      otvorene aplikacije
  kill PID                zatvori aplikaciju
  free                    model RAM-a za otvorene aplikacije
  df                      stanje zasebnog pokusnog diska
  date                    datum i vrijeme preglednika
  uptime                  trajanje ove sesije zljixOS-a
  clear                   očisti prikaz

Navodnici omogućuju razmake u nazivima. Nema cjevovoda,
izvođenja skripti ni stvarnih sistemskih naredbi. Za povratno
brisanje koristi Koš u grafičkoj aplikaciji Datoteke.`);}
 else if(['ipconfig','ping','nslookup','curl'].includes(cmd)){terminalLog(networking.command(cmd,a));}
 else if(cmd==='pwd'){arity(0);terminalLog(fs.path(termCwd));}
 else if(cmd==='whoami'){arity(0);terminalLog(fs.user.id);}
 else if(cmd==='id'){arity(0);terminalLog(`korisnik=${fs.user.id} grupe=${fs.user.groups.join(',')} administrator-modela=${fs.user.admin?'da':'ne'}`);}
 else if(cmd==='su'){arity(1);if(switchUser(a[0]))terminalLog('Simulirani profil promijenjen. Ovo nije autentikacija.');}
 else if(cmd==='ls'){const long=a[0]==='-l',args=long?a.slice(1):a;if(args.length>1||args[0]?.startsWith('-'))throw new Error('Primjer: ls -l /Dokumenti');const n=node(args[0]||'.');const list=n.type==='dir'?fs.list(n.id):[n];terminalLog(list.map(v=>long?`${v.type==='dir'?'d':'-'}${modeString(v.mode)} ${v.owner}:${v.group} ${v.name}${v.type==='dir'?'/':''}`:(v.type==='dir'?'▸ ':'  ')+v.name+(v.type==='dir'?'/':'')).join('\n')||'(prazna mapa)');}
 else if(cmd==='cd'){arity(0,1);const n=node(a[0]||'/');if(n.type!=='dir')throw new Error('Putanja nije mapa.');fs.require(n.id,'x');termCwd=n.id;}
 else if(cmd==='mkdir'||cmd==='touch'){arity(1);const existing=fs.resolve(a[0],termCwd);if(cmd==='touch'&&existing?.type==='file'){fs.require(existing.id,'w');return;}const t=fs.target(a[0],termCwd);fs.create(t.parent,t.name,cmd==='mkdir'?'dir':'file');dataChanged();}
 else if(cmd==='cat'){arity(1);const n=node(a[0]);terminalLog(fs.read(n.id)||'(prazna datoteka)');fs.evidence('terminalRead');refresh('lab');}
 else if(cmd==='stat'){arity(1);const n=node(a[0]);terminalLog(`Putanja: ${fs.path(n.id)}\nVrsta: ${n.type==='dir'?'mapa':'tekst'}\nVlasnik: ${n.owner}\nGrupa: ${n.group}\nDozvole: ${n.mode} ${modeString(n.mode)}${n.type==='file'?'\nSadržaj: '+byteSize(n.content):''}`);}
 else if(cmd==='chmod'){arity(2);if(editorDirty)throw new Error('Prvo preuzmi nespremljenu bilješku.');fs.chmod(node(a[1]).id,a[0]);permissionsChanged();terminalLog('Dozvole su promijenjene.');}
 else if(cmd==='chown'){arity(2);if(editorDirty)throw new Error('Prvo preuzmi nespremljenu bilješku.');const n=node(a[1]);fs.chown(n.id,a[0],n.group);permissionsChanged();}
 else if(cmd==='echo'){const i=tokens.redirects.length?tokens.redirects[0]-1:-1;if(i<0)terminalLog(a.join(' '));else{if(i!==a.length-2||tokens.redirects.length!==1)throw new Error('Primjer: echo "Pozdrav" > biljeska.txt');const content=a.slice(0,i).join(' ')+'\n',name=a[i+1],existing=fs.resolve(name,termCwd);if(existing){if(existing.id===editorId&&editorDirty)throw new Error('Datoteka ima nespremljeni tekst u Bilješkama.');fs.write(existing.id,content);}else{const t=fs.target(name,termCwd);fs.create(t.parent,t.name,'file',content);}fs.evidence('terminalWrite');dataChanged();if(existing?.id===editorId)refresh('editor');}}
 else if(cmd==='cp'){arity(2);const n=node(a[0]);if(n.type!=='file')throw new Error('cp ovdje kopira tekstualne datoteke. Za mapu koristi Datoteke.');const dest=fs.resolve(a[1],termCwd),t=dest?.type==='dir'?{parent:dest.id,name:n.name}:fs.target(a[1],termCwd);fs.copyTo(n.id,t.parent,t.name);dataChanged();}
 else if(cmd==='mv'){arity(2);const n=node(a[0]),dest=node(a[1]);fs.moveTo(n.id,dest.id);dataChanged();}
 else if(cmd==='rm'){arity(1);const n=node(a[0]);if(n.id===editorId&&editorDirty)throw new Error('Datoteka ima nespremljeni tekst u Bilješkama.');fs.remove(n.id);dataChanged();}
 else if(cmd==='ps'){arity(0);terminalLog('PID  APLIKACIJA                PROZOR\n'+[...windows.values()].map(w=>`${String(w.pid).padEnd(5)}${APPS[w.id].title.padEnd(26)}${w.min?'minimiziran':'otvoren'}`).join('\n'));}
 else if(cmd==='kill'){arity(1);if(!/^\d+$/.test(a[0]))throw new Error('PID mora biti broj.');const w=[...windows.values()].find(w=>w.pid===Number(a[0]));if(!w)throw new Error('Ne postoji aplikacija s tim PID-om.');if(await closeApp(w.id,true))terminalLog(`Zatvoreno: ${APPS[w.id].title}.`);}
 else if(cmd==='free'){arity(0);const used=64+[...windows.values()].reduce((sum,w)=>sum+APPS[w.id].ram,0);terminalLog(`MODEL APLIKACIJA (nije mjerenje RAM-a računala)\nUkupno: 1024 MiB\nDodijeljeno: ${used} MiB\nSlobodno: ${1024-used} MiB\nPokus stranica u aplikaciji Memorija zaseban je model.`);}
 else if(cmd==='df'){arity(0);const used=fs.state.learning.disk.files.reduce((sum,f)=>sum+f.blocks.length,0);terminalLog(`POKUSNI DISK (nije disk računala)\nUkupno: 128 KiB\nZauzeto: ${used*4} KiB\nSlobodno: ${(32-used)*4} KiB`);}
 else if(cmd==='date'){arity(0);terminalLog(new Date().toLocaleString('hr-HR'));}
 else if(cmd==='uptime'){arity(0);terminalLog('Ova sesija zljixOS-a traje '+Math.floor((Date.now()-sessionStart)/1000)+' s.');}
 else if(cmd==='clear'){arity(0);terminalLines=[];paintTerminal();}
 else throw new Error(`Naredba „${cmd}” nije podržana. Upiši help.`);
 }catch(e){terminalLog(e.message,'error');refresh('lab','journal');}finally{updateTerminalPrompt();}}
function monitorView(c){const list=[...windows.values()];const ram=64+list.reduce((n,w)=>n+APPS[w.id].ram,0);c.innerHTML=`<div class="monitor-app"><div class="app-intro"><div><h2>Ispod površine.</h2><p>Prati otvorene aplikacije i vidi što se mijenja kada ih zatvoriš.</p></div><span class="tag">NASTAVNI MODEL</span></div><div class="metrics"><div class="metric"><div class="metric-label">OTVORENE APLIKACIJE</div><div class="metric-value">${list.length}<span>procesa aplikacija</span></div><small>${list.filter(w=>w.min).length} ${plural(list.filter(w=>w.min).length,'minimiziran prozor','minimizirana prozora','minimiziranih prozora')}</small></div><div class="metric"><div class="metric-label">MODEL RAM-a</div><div class="metric-value">${ram}<span>/ 1024 MiB</span></div><div class="meter"><span style="width:${ram/1024*100}%"></span></div></div></div><table class="process-table"><thead><tr><th>APLIKACIJA</th><th>PID</th><th>PROZOR</th><th>MODEL RAM-a</th><th></th></tr></thead><tbody><tr><td><span class="process-name">${icon('home')} zljixOS okruženje</span></td><td>1</td><td>Osnova</td><td>64 MiB</td><td></td></tr>${list.map(w=>`<tr><td><span class="process-name">${icon(w.id)} ${APPS[w.id].title}</span></td><td>${w.pid}</td><td>${w.min?'Minimiziran':'Otvoren'}</td><td>${APPS[w.id].ram} MiB</td><td><button data-end="${w.id}" aria-label="Završi ${APPS[w.id].title}">Završi</button></td></tr>`).join('')}</tbody></table><div class="model-note"><strong>Minimiziran prozor ≠ završen proces.</strong><br>U ovom modelu svaka aplikacija dobiva zadanu količinu RAM-a. Minimiziranjem se ona ne oslobađa; zatvaranjem se oslobađa. Brojke su ilustracija, ne mjerenje tvog računala. Ovdje radi jednostavnosti pridružujemo jedan model procesa jednoj aplikaciji s prozorom. Stvarni proces može imati više prozora ili nijedan, a zatvaranje prozora ne mora završiti proces. Stvarni OS ima složeniju raspodjelu memorije.</div></div>`;for(const b of $$('[data-end]',c))b.onclick=()=>closeApp(b.dataset.end,true);}
function settingsView(c){c.innerHTML=`<div class="settings-app"><h2>Uredi svoj prostor.</h2><div class="setting-section"><h3>Pozadina</h3><div class="theme-grid">${[['dusk','Sumrak'],['sea','Obala'],['dawn','Zora']].map(([value,label])=>`<button class="theme-option ${fs.state.theme===value?'selected':''}" data-theme="${value}" aria-pressed="${fs.state.theme===value}"><div class="theme-preview"></div><span>${label}</span></button>`).join('')}</div></div><div class="setting-section setting-line"><div><h3>Veći tekst bilježaka</h3><p>Ugodnije čitanje i pisanje u uređivaču.</p></div><button class="switch ${fs.state.large?'on':''}" id="large-text" role="switch" aria-checked="${fs.state.large}" aria-label="Veći tekst bilježaka"><span></span></button></div><div class="setting-section"><h3>Sigurnosna kopija</h3><div class="setting-line"><p>Preuzmi sve mape, tekstove i postavke u jednu datoteku. Kopiju možeš vratiti ovdje ili u zljixOS-u na drugom uređaju.</p></div><div class="backup-actions"><button class="button secondary" id="backup-export">${icon('download')} Preuzmi kopiju</button><button class="button secondary" id="backup-import">${icon('upload')} Pregledaj i vrati kopiju</button></div></div><div class="settings-note"><strong>Rad se čuva lokalno u pregledniku.</strong><br>Prije izlaska provjeri status spremanja. U izborniku Moj rad izvezi JSON za nastavak na drugom računalu ili predaju nastavniku. HTML datoteka ne sadrži naknadno upisane odgovore. Radi u jednoj kartici; na zajedničkom računalu izvezi rad pa započni novi. Simulirani profili nisu stvarni računi.<br><br>zljixOS je nastavni simulator strukture, funkcija i mehanizama OS-a. Terminal i model procesa ne upravljaju stvarnim OS-om, uređajima ili aplikacijama računala.</div><div class="settings-version">zljixOS · LOKALNO NASTAVNO IZDANJE 0.16.0</div></div>`;
  for(const b of $$('.theme-option',c))b.onclick=()=>safe(()=>{fs.transact(()=>{fs.state.theme=b.dataset.theme;});applySettings();settingsView(c);});
  $('#large-text',c).onclick=()=>safe(()=>{fs.transact(()=>{fs.state.large=!fs.state.large;});applySettings();settingsView(c);});
  $('#backup-export',c).onclick=recovery.exportBackup;
  $('#backup-import',c).onclick=recovery.openBackup;
}
function replaceWorkspace(incoming){
  if(editorDirty)throw new Error('Prvo spremi ili preuzmi nespremljeni tekst iz Bilježaka.');
  const validated=validateState(incoming);requireSameStudent(fs.state.student,validated.student);fs.transact(()=>{fs.state=validated;});
  editorDirty=false;fileClipboard=null;cwd='docs';selected=null;editorId=fs.children('docs').find(n=>n.type==='file')?.id||null;termCwd='root';terminalLines=[];terminalHistory=[];historyIndex=0;
  applySettings();updateProfile();for(const w of windows.values())render(w);
}

function ask(options){return new Promise(resolve=>{const dialog=$('#dialog');$('#dialog-title').textContent=options.title;$('#dialog-description').textContent=options.description||'';$('#dialog-label').hidden=!options.input;$('#dialog-input').value=options.value||'';$('#dialog-input').required=!!options.input;$('#dialog-error').textContent='';$('#dialog-submit').textContent=options.confirm||'Spremi';$('#dialog-submit').className='button '+(options.danger?'danger':'primary');$('#dialog-icon').innerHTML=icon(options.danger?'info':options.input?'pencil':'info');const finish=value=>{dialog.close();resolve(value);};$('#dialog-cancel').onclick=()=>finish(null);dialog.oncancel=e=>{e.preventDefault();finish(null);};$('#dialog-form').onsubmit=async e=>{e.preventDefault();try{const value=options.input?$('#dialog-input').value.trim():true;if(options.validate)await options.validate(value);finish(value);}catch(error){$('#dialog-error').textContent=error.message;}};dialog.showModal();if(options.input){$('#dialog-input').focus();$('#dialog-input').select();}else $('#dialog-cancel').focus();});}
function closeLauncher(){$('#launcher').hidden=true;$('#launcher-button').setAttribute('aria-expanded','false');}
function launcherApps(query=''){const apps=Object.entries(APPS).filter(([id,a])=>(a.title+' '+a.desc).toLocaleLowerCase('hr').includes(query.toLocaleLowerCase('hr')));$('#launcher-grid').innerHTML=apps.map(([id,a])=>`<button class="launcher-app" data-open="${id}">${appIcon(id)}<span>${a.title}</span></button>`).join('')||'<p class="muted">Nema rezultata.</p>';openButtons($('#launcher-grid'));}
$('#shortcuts').innerHTML=['course','shell','explorer','lab'].map(id=>`<button class="shortcut" data-open="${id}">${appIcon(id)}<span>${APPS[id].title}</span></button>`).join('');openButtons($('#shortcuts'));
$('#dock-apps').innerHTML=['course','explorer','files','lab','report','settings'].map(id=>`<button data-app="${id}" aria-label="${APPS[id].title}">${appIcon(id)}</button>`).join('');for(const b of $$('#dock-apps button'))b.onclick=()=>{const w=windows.get(b.dataset.app);if(w&&active===w.id&&!w.min)minimize(w.id);else openApp(b.dataset.app);};
const globalSearchButton=document.createElement('button');globalSearchButton.id='workspace-search-button';globalSearchButton.innerHTML=icon('search');globalSearchButton.setAttribute('aria-label','Pretraži prostor (Ctrl+K)');globalSearchButton.title='Pretraži prostor · Ctrl+K';globalSearchButton.onclick=searching.launch;$('.top-right').prepend(globalSearchButton);
const profileButton=document.createElement('button');profileButton.id='profile-button';profileButton.onclick=()=>openApp('users');$('.top-right').prepend(profileButton);updateProfile();
$('#launcher-button').innerHTML=icon('grid');$('#search-icon').innerHTML=icon('search');$('#desktop-toggle').innerHTML=icon('desktop');$('#launcher-button').onclick=()=>{if(!$('#launcher').hidden)closeLauncher();else{$('#launcher').hidden=false;$('#launcher-button').setAttribute('aria-expanded','true');$('#app-search').value='';launcherApps();$('#app-search').focus();}};
$('#app-search').oninput=e=>launcherApps(e.target.value);$('#brand').onclick=()=>openApp('course');$('#global-score').onclick=()=>{fs.transact(()=>{fs.state.learning.course.overview=true;fs.state.learning.game.screen='lessons';});openApp('course');};$('#desktop-toggle').onclick=()=>{for(const id of windows.keys())minimize(id);};
window.addEventListener('pageshow',e=>{if(e.persisted)location.reload();});
document.addEventListener('pointerdown',e=>{if(!e.target.closest('#launcher,#launcher-button'))closeLauncher();});
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'&&!$('#dialog').open){e.preventDefault();searching.launch();return;}if(e.key==='Escape')closeLauncher();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'&&active==='editor'){e.preventDefault();saveEditor($('.window-content',windows.get('editor').el),true);}if(e.ctrlKey&&e.altKey&&e.key.toLowerCase()==='t'){e.preventDefault();openApp('terminal');}if(e.ctrlKey&&e.altKey&&e.key.toLowerCase()==='f'){e.preventDefault();openApp('files');}});
document.addEventListener('input',e=>{const form=e.target.closest('.window-content form');if(form)form.dataset.pendingWork='true';});
window.addEventListener('zljixos:before-update',e=>{
  let reason='';
  if(editorDirty)reason='U Bilješkama postoji nespremljen tekst. Najprije ga spremi ili preuzmi.';
  else if(document.querySelector('form[data-pending-work="true"]')||document.querySelector('#shell-command')?.value.trim())reason='Imaš nedovršen unos. Najprije provjeri odgovor, pokreni upisanu naredbu ili primijeni unesene postavke.';
  else if(local.status().kind!=='saved')reason='Rad još nije potvrđeno spremljen u pregledniku. Zatvori ovaj dijalog i u „Moj rad” spremi JSON kopiju ili pokušaj spremiti ponovno.';
  if(reason){e.detail.reason=reason;e.preventDefault();}
});
window.addEventListener('beforeunload',e=>{if(editorDirty){e.preventDefault();e.returnValue='';}});
window.addEventListener('resize',()=>{if(innerWidth<=700)return;for(const w of windows.values()){if(w.max)continue;w.el.style.left=Math.max(0,Math.min(w.el.offsetLeft,$('#desktop').clientWidth-w.el.offsetWidth))+'px';w.el.style.top=Math.max(0,Math.min(w.el.offsetTop,$('#desktop').clientHeight-140))+'px';}});
function tick(){const now=new Date();$('#clock').textContent=now.toLocaleDateString('hr-HR',{day:'numeric',month:'short'})+' · '+now.toLocaleTimeString('hr-HR',{hour:'2-digit',minute:'2-digit'});$('#clock').dateTime=now.toISOString();}tick();setInterval(tick,20000);
local.mount(()=>fs.state,()=>editorDirty,{ask,toast,download,openApp,replaceWorkspace,setLabel:value=>{fs.transact(()=>{fs.state.learning.label=value;});refresh('report');}});
const firstCourse=openApp('course');if(innerWidth>700)maximize(firstCourse);if(initialWarning)setTimeout(()=>toast(initialWarning),800);

}
start().catch(error=>{const note=document.createElement("p");note.setAttribute("role","alert");note.className="startup-error";note.textContent="zljixOS nije moguće otvoriti: "+error.message;document.body.append(note);});
