import {APP_VERSION} from './release.js';
// Fetch explicitly through the worker, then save a prepared Blob. Some browsers
// send anchor downloads outside the service worker's fetch path.
export async function prepareOfflineDownload(fetchFile=fetch,timeout=7000){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{const response=await fetchFile('./downloads/zljixOS.html',{signal:controller.signal});if(!response.ok)throw Error('Preuzimanje nije uspjelo.');const blob=await response.blob();if(!blob.size)throw Error('Prazna datoteka aplikacije.');return new Blob([blob],{type:'text/html;charset=utf-8'});}
  finally{clearTimeout(timer);}
}
export function mountMobile(){
  const button=document.createElement('button');button.id='pwa-status-button';button.disabled=true;
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/></svg>';
  button.setAttribute('aria-label','Pripremam offline preuzimanje');button.title='Pripremam offline preuzimanje';
  document.querySelector('.top-right').append(button);
  const status=document.createElement('span');status.className='sr-only';status.setAttribute('role','status');document.body.append(status);
  const dialog=document.createElement('dialog');dialog.id='pwa-dialog';dialog.setAttribute('aria-labelledby','pwa-title');
  dialog.innerHTML=`<div class="local-dialog-heading"><h2 id="pwa-title">Spremi za offline rad</h2><button class="button secondary" data-close>Zatvori</button></div><div class="pwa-state" role="status"><strong data-state></strong><p data-detail></p></div><p data-update hidden></p><a class="button primary pwa-download" href="./downloads/zljixOS.html" download="zljixOS.html" data-download>Spremi aplikaciju (.html)</a><p>Za računalo: spremi datoteku pa je otvori dvoklikom u pregledniku. Sadrži sve lekcije i pokuse; server i internet nisu potrebni.</p><button class="button primary" data-install hidden>Dodaj aplikaciju na uređaj</button><h3>iPhone ili iPad</h3><p>Za rad na mobitelu u Safariju otvori <strong>Dijeli → Dodaj na početni zaslon</strong>. Ako se nudi, uključi <strong>Otvori kao web-aplikaciju</strong> i potvrdi Dodaj.</p><h3>Android</h3><p>Upotrijebi gumb za dodavanje ako je ponuđen ili u izborniku Chromea odaberi <strong>Dodaj na početni zaslon / Instaliraj aplikaciju</strong>.</p><p>Otvori aplikaciju s nove ikone dok imaš internet i pričekaj zelenu ikonu preuzimanja. Zatim provjeri ponovno otvaranje u zrakoplovnom načinu.</p><p class="pwa-footer">Aplikacija i tvoji odgovori spremaju se odvojeno. Za prijenos bodova na drugi uređaj ili u preuzetu HTML aplikaciju spremi i uvezi JSON kroz „Moj rad”.</p><button class="button secondary" data-save-work>Otvori spremanje mojeg rada</button>`;
  document.body.append(dialog);
  let applying=false;
  let installPrompt=null,registration=null,ready=false,downloadURL=null,downloadBuild=null;
  const installButton=dialog.querySelector('[data-install]'),download=dialog.querySelector('[data-download]');
  button.onclick=()=>{if(ready)dialog.showModal();};dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  dialog.querySelector('[data-save-work]').onclick=()=>{dialog.close();document.querySelector('.local-work-button').click();};
  download.onclick=event=>{if(!ready)event.preventDefault();};
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;installButton.hidden=!ready;});
  installButton.onclick=async()=>{if(!installPrompt||!ready)return;const prompt=installPrompt;installPrompt=null;installButton.hidden=true;try{await prompt.prompt();}catch{dialog.querySelector('[data-detail]').textContent='Dodavanje nije dovršeno. Možeš upotrijebiti izbornik preglednika.';}};
  window.addEventListener('appinstalled',()=>{installPrompt=null;installButton.hidden=true;});
  function show(title,detail,ok=false){
    if(!ok&&downloadURL){URL.revokeObjectURL(downloadURL);downloadURL=null;downloadBuild=null;}
    ready=ok;button.disabled=!ok;button.dataset.ready=String(ok);button.title=ok?'Spremno · spremi za offline rad':title;
    button.setAttribute('aria-label',ok?'Spremno · spremi za offline rad':title);status.textContent=title;
    installButton.hidden=!ok||!installPrompt;download.setAttribute('aria-disabled',String(!ok));download.tabIndex=ok?0:-1;
    dialog.querySelector('[data-state]').textContent=title;dialog.querySelector('[data-detail]').textContent=detail;
  }
  if(!window.isSecureContext||!('serviceWorker' in navigator)){
    show('Offline preuzimanje nije dostupno.','Za pripremu mobilne aplikacije otvori HTTPS poveznicu u novijem pregledniku.');return;
  }
  const updateButton=document.createElement('button');updateButton.id='app-update-button';updateButton.textContent='Novo izdanje';updateButton.hidden=true;document.querySelector('.top-right').append(updateButton);
  const updateDialog=document.createElement('dialog');updateDialog.id='update-dialog';updateDialog.setAttribute('aria-labelledby','update-title');
  updateDialog.innerHTML=`<h2 id="update-title">Verzija igre</h2><p>Otvorena verzija: <strong>${APP_VERSION}</strong></p><p data-update-status role="status">Provjeravam dostupna izdanja…</p><button class="button primary" data-apply-update hidden>Otvori novo izdanje</button><button class="button secondary" data-check-update>Provjeri ponovno</button><button class="button secondary" data-close-update>Zatvori</button><p>Potvrđeni odgovori i bodovi ostaju uz tvoje ime. Prije osvježavanja dovrši unos i spremi nespremljeni tekst.</p>`;
  document.body.append(updateDialog);
  const updateStatus=updateDialog.querySelector('[data-update-status]'),applyButton=updateDialog.querySelector('[data-apply-update]');
  updateDialog.querySelector('[data-close-update]').onclick=()=>updateDialog.close();
  function showUpdate(){
    const available=!!registration?.waiting;
    updateButton.hidden=!available;updateButton.dataset.available=String(available);applyButton.hidden=!available;
    updateStatus.textContent=available?'Novo izdanje preuzeto je i spremno za otvaranje.':registration?.installing?'Preuzimam novo izdanje…':navigator.onLine?'Nema preuzetog novog izdanja. Otvorena verzija: '+APP_VERSION+'.':'Nema internetske veze. Možeš nastaviti s preuzetom verzijom.';
    const el=dialog.querySelector('[data-update]');el.hidden=!available;el.textContent='Dostupno je novo izdanje. Zatvori ovaj dijalog i odaberi „Novo izdanje”.';
  }
  async function requestUpdate(){
    if(!updateDialog.open)updateDialog.showModal();
    updateStatus.textContent='Provjeravam novo izdanje…';
    try{if(registration)await registration.update();showUpdate();}catch{updateStatus.textContent='Provjera nije uspjela. Nastavi s ovom verzijom pa pokušaj kada imaš vezu.';}
  }
  updateButton.onclick=requestUpdate;
  updateDialog.querySelector('[data-check-update]').onclick=requestUpdate;
  window.addEventListener('zljixos:check-update',requestUpdate);
  applyButton.onclick=()=>{
    const guard=new CustomEvent('zljixos:before-update',{cancelable:true,detail:{reason:''}});
    if(!window.dispatchEvent(guard)){updateStatus.textContent=guard.detail.reason;return;}
    if(!registration?.waiting){updateStatus.textContent='Novo izdanje još nije spremno. Provjeri ponovno.';return;}
    applying=true;applyButton.disabled=true;updateStatus.textContent='Otvaram novo izdanje…';
    registration.waiting.postMessage({type:'ZLJIX_APPLY_UPDATE'});
  };
  let query=0;
  async function check(){
    const id=++query,worker=navigator.serviceWorker.controller;
    if(!worker){show('Pripremam offline preuzimanje…','Ostani na internetu dok ikona ne postane zelena.');return;}
    const channel=new MessageChannel();
    const timer=setTimeout(()=>{channel.port1.close();if(id===query)show('Spremnost preuzimanja još nije potvrđena.','Ostani na internetu i ponovno otvori aplikaciju.');},8000);
    channel.port1.onmessage=async event=>{clearTimeout(timer);channel.port1.close();if(id!==query)return;const data=event.data;
      if(data?.type==='ORBIT_OFFLINE_STATUS'&&data.ready&&data.downloadReady&&data.build?.startsWith(APP_VERSION+'-')){
        try{
          if(!downloadURL||downloadBuild!==data.build){const blob=await prepareOfflineDownload();if(id!==query)return;if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL=URL.createObjectURL(blob);downloadBuild=data.build;download.href=downloadURL;}
          show('Spremno za preuzimanje i offline rad.','Sve lekcije, pokusi i HTML datoteka za preuzimanje spremljeni su na ovom uređaju.',true);
        }catch{if(id===query)show('Datoteka za spremanje još nije spremna.','Poveži se na internet i ponovno otvori aplikaciju.');}
      }else show('Offline preuzimanje još nije spremno.','Poveži se na internet. Ako je preuzeto novo izdanje, dovrši unos i odaberi „Novo izdanje”.');
    };
    worker.postMessage({type:'ORBIT_OFFLINE_STATUS'},[channel.port2]);
  }
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(applying)location.reload();else{check();showUpdate();}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
  window.addEventListener('online',check);
  show('Pripremam offline preuzimanje…','Ostani na internetu dok ikona ne postane zelena.');
  check();
  navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
    registration=reg;showUpdate();
    const watch=worker=>{if(!worker)return;worker.addEventListener('statechange',()=>{showUpdate();if(worker.state==='activated')check();if(worker.state==='redundant'&&!ready)show('Preuzimanje nije uspjelo.','Provjeri vezu i slobodan prostor pa ponovno otvori zljixOS.');});};
    watch(reg.installing);reg.addEventListener('updatefound',()=>watch(reg.installing));check();navigator.serviceWorker.ready.then(check);
  }).catch(()=>{if(!ready)show('Offline preuzimanje nije potvrđeno.','Provjeri internetsku vezu, HTTPS adresu i postavke preglednika pa ponovno otvori zljixOS.');});
}
