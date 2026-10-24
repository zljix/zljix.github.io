export function mountMobile(){
  const button=document.createElement('button');button.id='pwa-status-button';button.textContent='Provjera…';button.setAttribute('aria-label','Rad bez interneta i instalacija');
  document.querySelector('.top-right').append(button);
  const dialog=document.createElement('dialog');dialog.id='pwa-dialog';dialog.setAttribute('aria-labelledby','pwa-title');
  dialog.innerHTML=`<div class="local-dialog-heading"><h2 id="pwa-title">Orbit na mobitelu</h2><button class="button secondary" data-close>Zatvori</button></div><div class="pwa-state" role="status"><strong data-state>Provjeravam spremnost…</strong><p data-detail></p></div><p data-update hidden></p><button class="button primary" data-install hidden>Dodaj Orbit na uređaj</button><h3>iPhone · Safari</h3><p>Otvori izbornik Dijeli, odaberi <strong>Dodaj na početni zaslon</strong> i potvrdi. Ako se nudi, uključi Otvori kao web-aplikaciju.</p><h3>Android · Chrome</h3><p>U izborniku preglednika odaberi <strong>Dodaj na početni zaslon</strong> ili <strong>Instaliraj aplikaciju</strong>.</p><h3>Prije rada bez interneta</h3><p>Otvori Orbit s nove ikone dok imaš internet. Pričekaj oznaku <strong>Offline spreman</strong>. Zatim uključi zrakoplovni način, zatvori i ponovno otvori Orbit radi provjere na svom uređaju.</p><p class="pwa-footer">Moj rad → Spremi rad u JSON čuva zasebnu kopiju odgovora. Brisanje podataka preglednika ili uklanjanje aplikacije može ukloniti i rad i preuzetu aplikaciju. Safari i ikona na početnom zaslonu mogu imati odvojenu pohranu; rad prenesi JSON kopijom.</p>`;
  document.body.append(dialog);
  button.onclick=()=>dialog.showModal();dialog.querySelector('[data-close]').onclick=()=>dialog.close();
  let installPrompt=null,registration=null,ready=false;
  const installButton=dialog.querySelector('[data-install]');
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;installButton.hidden=false;});
  installButton.onclick=async()=>{if(!installPrompt)return;const prompt=installPrompt;installPrompt=null;installButton.hidden=true;try{await prompt.prompt();}catch{}};
  window.addEventListener('appinstalled',()=>{installPrompt=null;installButton.hidden=true;});
  function show(short,title,detail,ok=false){ready=ok;button.textContent=short;button.dataset.ready=String(ok);dialog.querySelector('[data-state]').textContent=title;dialog.querySelector('[data-detail]').textContent=detail;}
  if(!window.isSecureContext||!('serviceWorker' in navigator)){
    show('Treba HTTPS','Offline kopija nije pripremljena.','Za prvo preuzimanje otvori HTTPS poveznicu u novijem Safariju ili Chromeu. Otvaranje mobilnog paketa kao lokalne datoteke ne instalira offline aplikaciju.');return;
  }
  function showUpdate(){const el=dialog.querySelector('[data-update]');el.hidden=!registration?.waiting;el.textContent='Novo izdanje je preuzeto. Spremi svoj rad, zatvori sve prozore Orbita i ponovno ga otvori. Ažuriranje neće prekidati pokus.';}
  let query=0;
  async function check(){
    const id=++query,worker=navigator.serviceWorker.controller;
    if(!worker)return;
    const channel=new MessageChannel();
    const timer=setTimeout(()=>{channel.port1.close();if(id===query&&!ready)show('Provjeri offline','Spremnost još nije potvrđena.','Ostani na internetu i ponovno otvori aplikaciju.');},8000);
    channel.port1.onmessage=event=>{clearTimeout(timer);channel.port1.close();if(id!==query)return;const data=event.data;
      if(data?.type==='ORBIT_OFFLINE_STATUS'&&data.ready)show('Offline spreman','Aplikacija je spremljena za rad bez interneta.','Ugrađene lekcije i pokusi dostupni su na ovom uređaju. Vanjske poveznice trebaju internet.',true);
      else show('Nije spremno','Preuzeta kopija nije potpuna.','Poveži se na internet i ponovno otvori Orbit. Ako problem ostane, izvezi JSON prije brisanja podataka aplikacije.');
    };
    worker.postMessage({type:'ORBIT_OFFLINE_STATUS'},[channel.port2]);
  }
  navigator.serviceWorker.addEventListener('controllerchange',check);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)check();});
  show('Preuzimanje…','Pripremam rad bez interneta.','Ostani na internetu dok se ne pojavi oznaka Offline spreman.');
  // Check an existing controller even if the update request fails while offline.
  check();
  navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{
    registration=reg;showUpdate();
    const watch=worker=>{if(!worker)return;worker.addEventListener('statechange',()=>{showUpdate();if(worker.state==='activated')check();if(worker.state==='redundant'&&!ready)show('Nije preuzeto','Preuzimanje nije uspjelo.','Provjeri vezu i slobodan prostor pa ponovno otvori Orbit.');});};
    watch(reg.installing);reg.addEventListener('updatefound',()=>watch(reg.installing));check();
    navigator.serviceWorker.ready.then(check);
  }).catch(()=>{if(!ready)show('Nije preuzeto','Offline preuzimanje nije potvrđeno.','Provjeri internetsku vezu, HTTPS adresu i postavke preglednika pa ponovno otvori Orbit.');});
}
