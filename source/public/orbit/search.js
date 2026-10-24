const lower=s=>s.toLocaleLowerCase('hr');
export function searchWorkspace(fs,{query='',scope='root',kind='all',content=true}={}){
  if(typeof query!=='string'||query.length>100)throw new Error('Upit smije imati do 100 znakova.');
  if(!['root','docs','labs'].includes(scope)||!['all','file','dir'].includes(kind))throw new Error('Neispravan odabir pretraživanja.');
  const needle=lower(query.trim());if(!needle||!fs.can(scope,'rx'))return [];
  const results=[],stack=[scope];
  while(stack.length){
    const parent=stack.pop();
    // Discovery needs both listing and traversal rights for every directory.
    if(!fs.can(parent,'rx'))continue;
    for(const n of fs.children(parent)){
      if(n.type==='dir'&&fs.can(n.id,'rx'))stack.push(n.id);
      if(!fs.can(n.id,n.type==='dir'?'rx':'r')||(kind!=='all'&&kind!==n.type))continue;
      const nameMatch=lower(n.name).includes(needle),position=content&&n.type==='file'?lower(n.content).indexOf(needle):-1;
      if(!nameMatch&&position<0)continue;
      let snippet='';
      if(n.type==='file'){
        const start=position>=0?Math.max(0,position-45):0,end=Math.min(n.content.length,start+180);
        snippet=(start?'…':'')+n.content.slice(start,end).replace(/\s+/g,' ')+(end<n.content.length?'…':'');
      }
      results.push({id:n.id,name:n.name,type:n.type,path:fs.path(n.id),parent:n.parent,match:nameMatch?'name':'content',snippet,characters:n.type==='file'?n.content.length:null});
    }
  }
  return results.sort((a,b)=>(a.match==='name'?0:1)-(b.match==='name'?0:1)||a.path.localeCompare(b.path,'hr'));
}

export function createSearch(ctx){
  const {fs,esc,icon,openApp,openFile,openFolder}=ctx;
  let query='',scope='root',kind='all',content=true,shown=40;
  const $=(s,r)=>r.querySelector(s);
  function search(c){
    c.innerHTML=`<div class="search-app"><div class="search-heading"><span class="label">PRETRAŽIVANJE PROSTORA · 0.7</span><h2>Pronađi gdje je zapisano.</h2><p>Pretraži nazive mapa i datoteka te spremljeni tekst. Rezultati obuhvaćaju aktivne zapise dostupne trenutačnom profilu.</p></div><form class="workspace-search-form"><label class="workspace-search-input">${icon('search')}<input id="workspace-query" type="search" maxlength="100" aria-label="Traži u cijelom prostoru" placeholder="Naziv datoteke ili dio teksta…" autocomplete="off" value="${esc(query)}"></label><button class="button primary">Traži</button></form><div class="search-filters"><label>Lokacija<select id="search-scope" aria-label="Lokacija"><option value="root">Cijeli prostor</option><option value="docs">Dokumenti</option><option value="labs">Vježbe</option></select></label><label>Vrsta<select id="search-kind" aria-label="Vrsta"><option value="all">Mape i tekstovi</option><option value="file">Samo tekstovi</option><option value="dir">Samo mape</option></select></label><label class="search-content-toggle"><input type="checkbox" id="search-content" ${content?'checked':''}>Traži i u sadržaju</label></div><p class="search-help">Velika i mala slova nisu važna. Traži se cijeli uneseni izraz; nema zamjenskih znakova ni posebnih naredbi.</p><div class="search-results-heading"><span id="search-result-status" role="status" aria-live="polite"></span><span>Profil: ${esc(fs.user.name)}</span></div><div id="workspace-results"></div><div class="search-boundaries">Koš i spremljene verzije pregledaj u njihovim aplikacijama. Pretraživanje ostaje unutar ovog preglednika; ne pretražuje računalo ni internet.</div></div>`;
    $('#search-scope',c).value=scope;$('#search-kind',c).value=kind;
    const draw=()=>{
      const rows=searchWorkspace(fs,{query,scope,kind,content}),target=$('#workspace-results',c);
      $('#search-result-status',c).textContent=query.trim()?`${rows.length} rezultata · prikazano ${Math.min(shown,rows.length)}`:'Upiši naziv ili dio teksta.';
      if(!query.trim()){target.innerHTML=`<div class="search-empty">${icon('search')}<h3>Od naziva do sadržaja.</h3><p>Primjer: upiši „Naredbe” za datoteku ili „sigurnosna kopija” za dio spremljenog teksta.</p><button class="button secondary" id="search-example">Isprobaj: Naredbe</button></div>`;$('#search-example',c).onclick=()=>{query='Naredbe';$('#workspace-query',c).value=query;shown=40;draw();};return;}
      target.innerHTML=rows.length?rows.slice(0,shown).map(r=>`<article class="workspace-result"><div class="search-result-icon">${icon(r.type==='dir'?'files':'file')}</div><div class="search-result-main"><h3>${esc(r.name)}</h3><p class="search-result-path">${esc(r.path)}</p>${r.snippet?`<p class="search-snippet">${esc(r.snippet)}</p>`:''}<span class="search-result-meta">${r.type==='dir'?'Mapa':r.characters+' znakova'} · pronađeno u ${r.match==='name'?'nazivu':'sadržaju'}</span></div><div class="search-result-actions"><button class="button secondary" data-search-open="${r.id}">${r.type==='dir'?'Otvori mapu':'Otvori tekst'}</button>${r.type==='file'?`<button class="button subtle" data-search-parent="${r.parent}">Prikaži mapu</button>`:''}</div></article>`).join('')+(rows.length>shown?'<button class="button secondary search-more" id="search-more">Prikaži još 40</button>':''):'<div class="search-empty"><h3>Nema dostupnih rezultata.</h3><p>Skrati izraz, promijeni lokaciju ili uključi traženje u sadržaju. Provjeri i radiš li s odgovarajućim simuliranim profilom.</p></div>';
      for(const b of target.querySelectorAll('[data-search-open]'))b.onclick=()=>{const n=fs.get(b.dataset.searchOpen);if(!n){draw();return;}if(n.type==='dir')openFolder(n.id);else openFile(n.id);};
      for(const b of target.querySelectorAll('[data-search-parent]'))b.onclick=()=>openFolder(b.dataset.searchParent);
      const more=$('#search-more',c);if(more)more.onclick=()=>{shown+=40;draw();};
    };
    $('.workspace-search-form',c).onsubmit=e=>{e.preventDefault();query=$('#workspace-query',c).value;shown=40;draw();};
    $('#workspace-query',c).oninput=e=>{query=e.target.value;shown=40;draw();};
    $('#search-scope',c).onchange=e=>{scope=e.target.value;shown=40;draw();};$('#search-kind',c).onchange=e=>{kind=e.target.value;shown=40;draw();};$('#search-content',c).onchange=e=>{content=e.target.checked;shown=40;draw();};draw();
  }
  function launch(){const w=openApp('search');const input=w?.el.querySelector('#workspace-query');input?.focus();input?.select();}
  return {search,launch};
}
