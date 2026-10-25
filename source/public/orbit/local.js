import {studentName,studentFilename} from './identity.js';
import {seed} from './core.js';
import {parseBackup,serializeBackup,workspaceStats} from './recovery-model.js';
import {createLocalStore,STORAGE_KEY} from './local-store.js';

const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function connectLocal(student){
  let storage=null;try{storage=window.localStorage;}catch{}
  const local=createLocalStore(storage,student);
  return {...local,account:{name:studentName(student)},mount(getState,isEditorDirty,ctx){
    const mobile=document.documentElement.dataset.distribution==='pwa';
    const {ask,toast,download,openApp,replaceWorkspace,setLabel}=ctx;
    const button=document.createElement('button');button.id='local-work-button';button.textContent='Moj rad';button.className='local-work-button';
    document.querySelector('.top-right').prepend(button);
    const identity=document.createElement('div');identity.id='student-banner';identity.textContent='Učenik / učenica: '+studentName(local.initial.student);document.body.append(identity);
    document.documentElement.style.setProperty('--student-height',identity.offsetHeight+'px');
    new ResizeObserver(()=>document.documentElement.style.setProperty('--student-height',identity.offsetHeight+'px')).observe(identity);
    const warning=document.createElement('aside');warning.className='local-warning';warning.hidden=true;warning.setAttribute('role','status');
    warning.innerHTML='<p></p><button data-local-open>Otvori Moj rad</button><button data-local-retry>Pokušaj spremiti ponovno</button>';
    document.body.append(warning);
    const dialog=document.createElement('dialog');dialog.id='local-work-dialog';dialog.className='local-work-dialog';dialog.setAttribute('aria-labelledby','local-title');document.body.append(dialog);
    let incoming=null,reviewId=0,exportId=0,preparedCopy=null;
    const ready=()=>{if(isEditorDirty()){toast('Prvo spremi ili preuzmi nespremljeni tekst iz Bilježaka.');return false;}return true;};
    function filename(){return studentFilename(getState().student,'rad-'+new Date().toISOString().slice(0,10));}
    async function exportWork(){if(!ready())return;try{const name=filename(),text=await serializeBackup(getState());download(name,text,'application/json');toast('JSON kopija s kontrolnim potpisom pripremljena je za preuzimanje. Provjeri da je datoteka spremljena.');}catch(error){toast(error.message);}}
    // Prepare before the share click: iOS requires navigator.share to run within
    // the user's gesture, without first awaiting a cryptographic operation.
    async function prepareCopy(){
      const id=++exportId;preparedCopy=null;
      const share=dialog.querySelector('[data-share]'),copy=dialog.querySelector('[data-copy]');
      if(share)share.disabled=true;if(copy){copy.value='';copy.placeholder='Pripremam kopiju s kontrolnim potpisom…';}
      try{const name=filename(),text=await serializeBackup(getState());if(id!==exportId||!dialog.open)return;
        preparedCopy={name,text};if(share)share.disabled=false;if(copy){copy.value=text;copy.placeholder='';}
      }catch(error){if(id===exportId&&dialog.open)dialog.querySelector('#local-error').textContent=error.message;}
    }
    async function shareWork(){
      if(!ready())return;
      if(!preparedCopy){toast('Pričekaj da se pripremi kopija.');return;}
      const file=new File([preparedCopy.text],preparedCopy.name,{type:'application/json'});
      try{if(!navigator.canShare?.({files:[file]})){exportWork();return;}await navigator.share({files:[file],title:'zljixOS — moj rad'});}
      catch(error){if(error.name!=='AbortError')toast('Dijeljenje nije uspjelo. Odaberi Spremi rad u JSON ili kopiraj JSON tekst.');}
    }
    function update(){
      const status=local.status(),badge=document.querySelector('.local-badge');
      badge.textContent=local.label();badge.dataset.error=String(status.kind!=='saved');badge.title=status.message||'Spremljeno u pohranu ovog preglednika. Za prenosivu kopiju odaberi Moj rad → Spremi rad u JSON.';
      warning.hidden=status.kind==='saved';warning.querySelector('p').textContent=status.message;
      const statusText=dialog.querySelector('[data-local-status]');if(statusText)statusText.textContent=local.label();
      if(dialog.open)prepareCopy();
    }
    function show(){
      incoming=null;reviewId++;exportId++;preparedCopy=null;
      dialog.innerHTML=`<header class="local-dialog-heading"><div><span class="label">zljixOS · LOKALNO IZDANJE</span><h2 id="local-title">Moj rad</h2></div><button class="button secondary" data-close aria-label="Zatvori Moj rad">Zatvori</button></header>
        <div class="student-owner"><span>Učenik / učenica</span><strong>${esc(studentName(getState().student))}</strong><small>Kopija je vezana uz ime i prezime. Ručno promijenjena kopija neće se učitati.</small></div><p class="local-lead">${mobile?'Pokusi, datoteke i odgovori ostaju na ovom uređaju. Status u gornjoj traci pokazuje je li aplikacija preuzeta za rad bez interneta.':'Uči bez interneta i poslužitelja. Pokusi, datoteke i odgovori ostaju na ovom računalu.'}</p>
        <div class="local-storage-note"><strong data-local-status>${esc(local.label())}</strong><p>Preglednik pokušava automatski sačuvati rad. Za nastavak na drugom uređaju ili nakon brisanja podataka preglednika spremi zasebnu JSON kopiju.</p></div>
        <label class="local-field">Oznaka rada <input id="local-work-label" maxlength="80" placeholder="npr. 2B – Ana – Procesi" value="${esc(getState().learning.label)}"></label>
        <p class="local-help">Oznaka rada je neobvezna napomena i ne mijenja ime vlasnika. Profili Učenik i Nastavnik služe samo vježbi dozvola.</p>
        <div class="local-actions"><button class="button primary" data-export>Spremi rad u JSON</button>${typeof navigator.share==='function'?'<button class="button secondary" data-share>Podijeli JSON kopiju</button>':''}<button class="button secondary" data-report>Moji rezultati i izvještaj</button></div>
        <details><summary>Prikaži JSON za kopiranje</summary><p>Kopiraj cijeli tekst u običnu tekstualnu datoteku s nastavkom .json. Kopija uključuje kontrolni potpis. Sačuvaj cijeli tekst bez mijenjanja vrijednosti.</p><textarea data-copy readonly aria-label="JSON kopija rada" spellcheck="false"></textarea></details>
        <section class="local-import"><h3>Nastavi spremljeni rad</h3><p>Odaberi svoju JSON kopiju iz datoteka uređaja. Prije pregleda provjeravaju se kontrolni potpis, ime i prezime. Promijenjene i stare nepotpisane kopije ne mogu se učitati.</p><label class="local-field">Odaberi JSON datoteku<input id="local-import-file" type="file" accept=".json,application/json"></label><details><summary>Ili zalijepi JSON kopiju</summary><textarea id="local-import-text" aria-label="JSON za učitavanje" placeholder="Zalijepi cijeli JSON…" spellcheck="false"></textarea><button class="button secondary" data-preview>Pregledaj zalijepljenu kopiju</button></details><div id="local-import-preview" role="status"></div></section>
        <p id="local-error" class="error" role="alert"></p><div class="local-actions local-bottom"><button class="button secondary" data-student>Drugi učenik / učenica</button><button class="button secondary" data-new>Započni svoj rad iznova</button>${local.status().kind==='conflict'?'<button class="button secondary" data-reload>Otvori spremljeni rad</button>':''}${local.original()!==null?'<button class="button secondary" data-original>Preuzmi izvorni nečitljivi zapis</button>':''}</div><p class="local-help">Za drugi identitet odaberi Drugi učenik / učenica. Tvoj rad ostaje zasebno spremljen. Za prijenos koristi JSON iz izdanja 0.16.0 ili novijeg. Ako imaš staru kopiju, novi JSON izvezi iz preglednika u kojem je rad sačuvan. ${mobile?'Koristi jedan prozor i isti način otvaranja zljixOS-a. Promjena preglednika ili otvaranje s nove ikone može otvoriti zasebnu pohranu; tada učitaj svoj JSON.':'Koristi jednu karticu i istu putanju HTML datoteke. Promjena preglednika, premještanje datoteke ili privatni način mogu otvoriti prazan prostor; tada učitaj svoj JSON.'}</p>`;
      const q=s=>dialog.querySelector(s);
      q('[data-close]').onclick=()=>dialog.close();q('[data-export]').onclick=exportWork;
      if(q('[data-share]'))q('[data-share]').onclick=shareWork;
      q('#local-work-label').oninput=e=>{try{setLabel(e.target.value.trim());q('#local-error').textContent='';}catch(error){q('#local-error').textContent=error.message;}};
      q('[data-report]').onclick=()=>{dialog.close();openApp('report');};
      const copy=q('[data-copy]');copy.onclick=()=>copy.select();
      async function preview(text){
        const id=++reviewId;
        incoming=null;q('#local-import-preview').replaceChildren();q('#local-error').textContent='';
        q('#local-import-preview').textContent='Provjeravam kontrolni potpis kopije…';
        try{const parsed=await parseBackup(await text,getState().student);if(id!==reviewId||!dialog.open)return;incoming=parsed;const stats=workspaceStats(incoming.state),records=incoming.state.learning.explorer.records.length;
          q('#local-import-preview').innerHTML=`<div class="local-storage-note"><strong>Učenik / učenica: ${esc(studentName(incoming.state.student))}</strong><p>Kontrolni potpis kopije je valjan.</p><p>${esc(incoming.state.learning.label||'Rad bez dodatne oznake')}</p><p>${stats.files} tekstova · ${stats.versions} verzija · ${records} zabilježenih OS pokusa</p><p>${incoming.exportedAt?'Izvezeno: '+esc(new Date(incoming.exportedAt).toLocaleString('hr-HR')):'Stariji format radnog prostora'}</p><button class="button primary" data-import>Učitaj cijeli rad</button></div>`;
          q('[data-import]').onclick=async()=>{
            if(!ready())return;
            const ok=await ask({title:'Učitati spremljeni rad?',description:'Vlasnik kopije: '+studentName(parsed.state.student)+'. Ova kopija zamijenit će tvoje sadašnje datoteke, postavke i odgovore. Najprije ih izvezi ako ih želiš sačuvati.',confirm:'Učitaj i zamijeni',danger:true});
            if(ok&&id===reviewId)try{replaceWorkspace(parsed.state);dialog.close();toast('Učitan rad: '+studentName(getState().student)+'. '+local.label()+'.');}catch(error){q('#local-error').textContent=error.message;}
          };
        }catch(error){if(id!==reviewId||!dialog.open)return;incoming=null;q('#local-import-preview').replaceChildren();q('#local-error').textContent=error.message;}
      }
      q('#local-import-file').onchange=e=>{const file=e.target.files[0];if(!file)return;preview(file.size>8000000?Promise.reject(Error('JSON datoteka je prevelika (najviše 8 MB).')):file.text());};
      q('[data-preview]').onclick=()=>preview(q('#local-import-text').value);
      q('[data-new]').onclick=async()=>{if(!ready())return;const ok=await ask({title:'Započeti novi rad?',description:'Sadašnje datoteke i odgovori zamijenit će se početnim vježbama. Najprije spremi JSON ako želiš nastaviti sadašnji rad ili ga predati nastavniku.',confirm:'Započni novi rad',danger:true});if(ok)try{replaceWorkspace(seed(getState().student));dialog.close();toast('Otvoren je novi rad. '+local.label()+'.');}catch(error){q('#local-error').textContent=error.message;}};
      q('[data-student]').onclick=async()=>{if(!ready())return;if(local.hasPending()){q('#local-error').textContent='Prije promjene učenika spremi JSON: ovaj rad još nije trajno spremljen.';return;}dialog.close();location.reload();};
      const reload=q('[data-reload]');if(reload)reload.onclick=async()=>{if(await ask({title:'Otvoriti spremljeni rad?',description:'Izmjene ovog prozora koje nisu spremljene bit će izgubljene. Najprije izvezi njegov JSON. Nakon ponovnog otvaranja učitat će se zapis iz preglednika.',confirm:'Ponovno otvori',danger:true}))location.reload();};
      const original=q('[data-original]');if(original)original.onclick=()=>download('zljixOS-izvorni-zapis.txt',local.original(),'text/plain');
      if(!dialog.open)dialog.showModal();q('[data-close]').focus();update();
    }
    dialog.addEventListener('close',()=>{reviewId++;exportId++;incoming=null;preparedCopy=null;});
    button.onclick=show;warning.querySelector('[data-local-open]').onclick=show;
    warning.querySelector('[data-local-retry]').onclick=()=>{local.flush();update();};
    local.subscribe(update);
    window.addEventListener('storage',e=>{if(e.key===local.key||e.key===null)local.checkForChanges();});
    window.addEventListener('beforeunload',e=>{if(local.hasPending()||isEditorDirty()){e.preventDefault();e.returnValue='';}});
    local.flush();update();
  }};
}
