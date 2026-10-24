// Fetch explicitly through the worker, then save a prepared Blob. Some browsers
// send anchor downloads outside the service worker's fetch path.
export async function prepareOfflineDownload(fetchFile=fetch,timeout=7000){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeout);
  try{const response=await fetchFile('./downloads/Orbit-OS.html',{signal:controller.signal});if(!response.ok)throw Error('Preuzimanje nije uspjelo.');const blob=await response.blob();if(!blob.size)throw Error('Prazna datoteka aplikacije.');return new Blob([blob],{type:'text/html;charset=utf-8'});}
  finally{clearTimeout(timer);}
}
export function mountMobile(){
  const button=document.createElement('button');button.id='pwa-status-button';button.disabled=true;
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M4 15v5h16v-5"/></svg>';
  button.setAttribute('aria-label','Pripremam offline preuzimanje');button.title='Pripremam offline preuzimanje';
  document.querySelector('.top-right').append(button);
  const status=document.createElement('span');status.className='sr-only';status.setAttribute('role','status');document.body.append(status);
  const dialog=document.createElement('dialog');dialog.id='pwa-dialog';dialog.setAttribute('aria-labelledby','pwa-title');
  dialog.innerHTML=`<div class="local-dialog-heading"><h2 id="pwa-title">Spremi za offline rad</h2><button class="button secondary" data-close>Zatvori</button></div><div class="pwa-state" role="status"><strong data-state></strong><p data-detail></p></div><p data-update hidden></p><a class="button primary pwa-download" href="./downloads/Orbit-OS.html" download="Orbit-OS.html" data-download>Spremi aplikaciju (.html)</a><p>Za računalo: spremi datoteku pa je otvori dvoklikom u pregledniku. Sadrži sve lekcije i pokuse; server i internet nisu potrebni.</p><button class="button primary" data-install hidden>Dodaj aplikaciju na uređaj</button><h3>iPhone ili iPad</h3><p>Za rad na mobitelu u Safariju otvori <strong>Dijeli → Dodaj na početni zaslon</strong>. Ako se nudi, uključi <strong>Otvori kao web-aplikaciju</strong> i potvrdi Dodaj.</p><h3>Android</h3><p>Upotrijebi gumb za dodavanje ako je ponuđen ili u izborniku Chromea odaberi <strong>Dodaj na početni zaslon / Instaliraj aplikaciju</strong>.</p><p>Otvori aplikaciju s nove ikone dok imaš internet i pričekaj zelenu ikonu preuzimanja. Zatim provjeri ponovno otvaranje u zrakoplovnom načinu.</p><p class="pwa-footer">Aplikacija i tvoji odgovori spremaju se odvojeno. Za prijenos bodova na drugi uređaj ili u preuzetu HTML aplikaciju spremi i uvezi JSON kroz „Moj rad”.</p><button class="button secondary" data-save-work>Otvori spremanje mojeg rada</button>`;
  document.body.append(dialog);
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
  function showUpdate(){const el=dialog.querySelector('[data-update]');el.hidden=!registration?.waiting;el.textContent='Novo izdanje je preuzeto. Spremi svoj rad, zatvori sve prozore Orbita i ponovno ga otvori. Ažuriranje neće prekidati pokus.';}
  let query=0;
  async function check(){
    const id=++query,worker=navigator.serviceWorker.controller;
    if(!worker){show('Pripremam offline preuzimanje…','Ostani na internetu dok ikona ne postane zelena.');return;}
    const channel=new MessageChannel();
    const timer=setTimeout(()=>{channel.port1.close();if(id===query)show('Spremnost preuzimanja još nije potvrđena.','Ostani na internetu i ponovno otvori aplikaciju.');},8000);
    channel.port1.onmessage=async event=>{clearTimeout(timer);channel.port1.close();if(id!==query)return;const data=event.data;
      if(data?.type==='ORBIT_OFFLINE_STATUS'&&data.ready&&data.downloadReady){
        try{
          if(!downloadURL||downloadBuild!==data.build){const blob=await prepareOfflineDownload();if(id!==query)return;if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL=URL.createObjectURL(blob);downloadBuild=data.build;download.href=downloadURL;}
          show('Spremno za preuzimanje i offline rad.','Sve lekcije, pokusi i HTML datoteka za preuzimanje spremljeni su na ovom uređaju.',true);
        }catch{if(id===query)show('Datoteka za spremanje još nije spremna.','Poveži se na internet i ponovno otvori aplikaciju.');}
      }else show('Offline preuzimanje još nije spremno.','Poveži se na internet. Ako je preuzeto novo izdanje, zatvori sve prozore Orbita pa ponovno otvori aplikaciju.');
    };
    worker.postMessage({type:'ORBIT_OFFLINE_STATUS'},[channel.port2]);
  }
  navigator.serviceWorker.addEventListener('controllerchange',check);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
  window.addEventListener('online',check);
  show('Pripremam offline preuzimanje…','Ostani na internetu dok ikona ne postane zelena.');
  check();
  navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
    registration=reg;showUpdate();
    const watch=worker=>{if(!worker)return;worker.addEventListener('statechange',()=>{showUpdate();if(worker.state==='activated')check();if(worker.state==='redundant'&&!ready)show('Preuzimanje nije uspjelo.','Provjeri vezu i slobodan prostor pa ponovno otvori Orbit.');});};
    watch(reg.installing);reg.addEventListener('updatefound',()=>watch(reg.installing));check();navigator.serviceWorker.ready.then(check);
  }).catch(()=>{if(!ready)show('Offline preuzimanje nije potvrđeno.','Provjeri internetsku vezu, HTTPS adresu i postavke preglednika pa ponovno otvori Orbit.');});
}
