// Small deterministic models for explaining OS mechanisms. No host operations.
// A step is a meaningful event, not a measured CPU instruction or time unit.
export const MECHANISMS = [
  {id:'process', title:'Od programa do procesa', part:'Procesi', app:'monitor',
    goal:'Razlikovati program na disku, proces i njegov adresni prostor.',
    terms:[['Program','Pohranjene upute i podaci.'],['Proces','Instanca programa tijekom izvođenja, s identifikatorom (PID), stanjem i resursima.'],['Adresni prostor','Skup virtualnih adresa dostupnih procesu.'],['PCB','Zapis kojim jezgra prati proces, primjerice njegov PID i stanje.']],
    variants:[['one','Jedna instanca'],['two','Dvije instance istog programa']],
    predict:'Koliko će biti programa na disku, a koliko procesa i adresnih prostora?',
    question:'Zašto zatvaranje jednog procesa ne briše program niti nužno zatvara drugu instancu?',
    limit:'Prikazujemo apstraktno stvaranje procesa. Ne razrađujemo posebne API-je pojedinog OS-a ni učitavanje stranica na zahtjev. Različiti virtualni adresni prostori mogu dijeliti fizičke stranice koda.'},
  {id:'read',title:'Što se događa pri čitanju datoteke?',part:'Datoteke i I/O',app:'users',
    goal:'Pratiti zahtjev aplikacije kroz zaštitu, datotečni sustav i uređaj.',
    terms:[['I/O (ulaz/izlaz)','Razmjena podataka s uređajima, primjerice čitanje s diska.'],['Sistemski poziv','Kontrolirani zahtjev programa za uslugu jezgre.'],['Deskriptor datoteke','Oznaka otvorene datoteke koju program koristi pri čitanju.'],['Predmemorija','Kopija podataka u RAM-u koja može izbjeći pristup uređaju.'],['Prekid uređaja','Obavijest hardvera koja omogućuje jezgri obradu događaja.']],
    variants:[['disk','Dozvoljeno · podatak na disku'],['cache','Dozvoljeno · podatak u predmemoriji'],['denied','Nema dozvole čitanja']],
    predict:'Hoće li nastati I/O zahtjev i hoće li proces čekati? Objasni svoje predviđanje.',
    question:'Gdje se putovi razilaze? Zašto sistemski poziv ne mora uzrokovati pristup disku ni promjenu procesa?',
    limit:'Model je nalik UNIX-u: provjera dozvole pri otvaranju, zatim blokirajuće čitanje. Metapodaci su već u RAM-u; nema pogreške uređaja. Ovdje se ne čitaju osobne datoteke iz aplikacije Datoteke.'},
  {id:'cpu',title:'Prekid i promjena konteksta',part:'Procesor',app:'cpu',
    goal:'Razlikovati ulazak u jezgru od prebacivanja na drugi proces.',
    terms:[['Kontekst','Stanje izvođenja, npr. registri i adresa sljedeće instrukcije (PC).'],['Kvant','Dodijeljeni vremenski odsječak CPU-a.'],['Raspoređivač','Odabire sljedeći spremni tok izvođenja.'],['Preotimanje','OS prekida izvođenje procesa radi raspoređivanja.']],
    variants:[['ready','P2 je spreman'],['alone','Nema drugog spremnog procesa']],
    predict:'Mora li nakon isteka kvanta proces P1 prepustiti CPU drugom procesu u ovom slučaju?',
    question:'U kojem slučaju mijenjamo proces, a u kojem samo način rada CPU-a? Što se mora sačuvati?',
    limit:'Jedna logička jezgra, po jedna dretva u procesu, Round Robin. PC prikazuje mjesto nastavka korisničkog konteksta; adrese instrukcija same jezgre izostavljene su. Prikaz ne mjeri trajanje prekida ni promjene konteksta.'},
  {id:'memory',title:'Virtualna adresa i iznimka stranice',part:'Memorija',app:'memory',
    goal:'Razlikovati valjanu neprisutnu stranicu od nedopuštene adrese.',
    terms:[['Stranica / okvir','Jednako veliki dijelovi virtualne / fizičke memorije.'],['MMU','Hardverska jedinica koja prevodi i provjerava memorijske pristupe.'],['Tablica stranica','Preslikavanje virtualnih stranica u fizičke okvire, s pravima pristupa.'],['Iznimka stranice','Sinkroni događaj zbog pristupa koji se ne može normalno dovršiti (page fault).']],
    variants:[['hit','Valjana stranica u RAM-u'],['missing','Valjana stranica izvan RAM-a'],['invalid','Nedopuštena virtualna adresa']],
    predict:'Hoće li se pristup završiti, trebati I/O ili biti odbijen? Mora li svaka iznimka stranice značiti pogrešku programa?',
    question:'Zašto se nakon učitavanja stranice ponavlja pristup, a pri nedopuštenoj adresi ne?',
    limit:'Stranica ima 1024 B, bez TLB-a. U ovom pokusu neprisutna valjana stranica ima kopiju na disku; izbacuje se izmijenjena stranica. U stvarnosti neke iznimke ne traže disk (npr. nova nulta stranica).'},
  {id:'threads',title:'Dretve i izgubljeno povećanje',part:'Sinkronizacija',app:'cpu',
    goal:'Objasniti kako ispreplitanje dretvi mijenja rezultat nad dijeljenim podatkom.',
    terms:[['Dretva','Tok izvođenja s vlastitim registrima i stogom; dretve procesa dijele adresni prostor.'],['Utrka nad podatkom','Nesinkronizirani sukobljeni pristupi dijeljenom podatku.'],['Kritični odsječak','Dio programa koji pristupa dijeljenom resursu i treba zaštitu.'],['Mutex','Lokot koji samo jednoj dretvi dopušta ulazak u zaštićeni odsječak.']],
    variants:[['race','Bez lokota'],['mutex','Cijelo povećanje pod lokotom']],
    predict:'Dvije dretve trebaju povećati x za 1. Početno x = 0. Koji završni rezultat očekuješ?',
    question:'Zašto x = x + 1 nije nužno jedna nedjeljiva radnja? Koji dio mora štititi isti lokot?',
    limit:'Model instrukcija čitaj–izračunaj–upiši, s unaprijed određenim ispreplitanjem na jednom CPU-u. To nije izvršavanje izvornog C/JavaScript koda niti prikaz svih memorijskih modela. Zastoji i detalji implementacije mutexa ovdje su izostavljeni.'},
  {id:'deadlock',title:'Kružno čekanje i zastoj',part:'Sinkronizacija · proširenje',app:'cpu',
    goal:'Uočiti uzajamno čekanje i provjeriti učinak istog redoslijeda zauzimanja resursa.',
    terms:[['Resurs','Objekt koji proces treba, ovdje isključivo zauzeti lokot R1 ili R2.'],['Zastoj (deadlock)','Procesi se ne mogu nastaviti jer međusobno čekaju resurse koje drže.'],['Kružno čekanje','Zatvoreni krug ovisnosti među procesima.']],
    variants:[['cycle','Različit redoslijed'],['ordered','Oba procesa traže R1 pa R2']],
    predict:'Mogu li oba procesa završiti ako svaki već drži jedan lokot i čeka drugi?',
    question:'Kako isti redoslijed zauzimanja uklanja krug? Zašto obično čekanje još nije zastoj?',
    limit:'Dva procesa, dva isključiva lokota, bez prisilnog oduzimanja ili odustajanja. Jednaki redoslijed sprječava ovaj krug; ne jamči sve poželjne osobine složenog sustava, poput pravednosti.'}
];
export const mechanism = id => MECHANISMS.find(x=>x.id===id);
const copy = x => JSON.parse(JSON.stringify(x));

export function traceMechanism(id,variant){
  const lesson=mechanism(id);
  if(!lesson?.variants.some(v=>v[0]===variant))throw Error('Nepoznat mehanizam ili inačica pokusa.');
  let state={mode:'Korisnički',cpu:'—',process:'—',memory:'—',io:'Nema zahtjeva',result:'Još nema ishoda'};
  const steps=[];
  const add=(key,actor,title,why,patch={})=>{state={...state,...patch};steps.push({key,actor,title,why,state:copy(state)});};
  if(id==='process'){
    const count=variant==='two'?2:1;
    add('program','apps','Program je pohranjen','Pohranjene upute same još ne koriste CPU kao proces.',{cpu:'Ljuska',process:'Nema procesa Bilješke',memory:'Nema adresnog prostora Bilježaka',programs:1,instances:0});
    for(let i=1;i<=count;i++){
      if(i===2)add('shell-again','scheduler','Ljuska ponovno dobiva CPU','Korisnik traži još jednu instancu. P1 ostaje spreman.',{cpu:'Ljuska',process:'P1: spreman'});
      add('request-'+i,'syscall','Zahtjev za pokretanje '+i,'Ljuska traži uslugu OS-a. Jezgra preuzima kontrolu.',{mode:'Jezgreni',cpu:'Jezgra u kontekstu ljuske'});
      add('create-'+i,'scheduler','Jezgra stvara P'+i,'Nastaju zapis o procesu, PID i vlastiti virtualni adresni prostor.',{process:`P${i}: nov`,memory:`${i} odvojen${i===1?'':'a'} virtualn${i===1?'i':'a'} adresn${i===1?'i prostor':'a prostora'}`,instances:i});
      add('ready-'+i,'scheduler','P'+i+' je spreman','Spreman proces čeka raspoređivanje; još ne mora imati CPU.',{process:`P${i}: spreman`});
      add('dispatch-'+i,'scheduler','P'+i+' dobiva CPU','Obnavlja se početni kontekst i prelazi na izvođenje korisničkog koda.',{mode:'Korisnički',cpu:'P'+i,process:`P${i}: izvodi se`});
    }
    if(count===2)add('p1-again','scheduler','P1 ponovno dobiva CPU','P2 ostaje spreman dok P1 nastavlja svoj kod.',{cpu:'P1',process:'P1: izvodi se; P2: spreman'});
    add('exit','syscall','P1 završava','Jezgra oslobađa njegove resurse; program ostaje pohranjen. U modelu se zapis o P1 odmah uklanja.',{mode:'Jezgreni',cpu:'Obrada završetka P1',process:count===2?'P1: završen; P2: spreman':'P1: završen',memory:count===2?'Ostaje adresni prostor P2':'Prostor P1 oslobođen',instances:count-1});
    add('remaining','apps','Što ostaje nakon završetka?','Program, proces i prozor različiti su pojmovi. Jedan proces u stvarnom OS-u može imati više prozora.',{mode:'Korisnički',cpu:count===2?'P2':'Ljuska',process:count===2?'P2: izvodi se':'Nema procesa Bilješke',result:`Program na disku: 1. Preostali procesi: ${count-1}.`});
  }
  if(id==='read'){
    add('request','apps','Aplikacija želi pročitati tekst','Poziva otvaranje datoteke; sama ne upravlja kontrolerom diska.',{cpu:'P1',process:'P1: izvodi se'});
    add('enter','syscall','Sistemski poziv open','CPU kontrolirano prelazi u jezgreni način rada, u istom procesu.',{mode:'Jezgreni',cpu:'Jezgra u kontekstu P1'});
    add('permission','filesystem','Provjera putanje i dozvole','Jezgra provjerava pravo otvaranja. U ovom modelu svi metapodaci već su u RAM-u.');
    if(variant==='denied'){
      add('deny','filesystem','Otvaranje je odbijeno','Deskriptor nije dodijeljen. Čitanje podataka se ne pokreće.',{result:'EACCES: pristup odbijen'});
      add('return','apps','Povratak istoj aplikaciji','Aplikacija dobiva pogrešku i može je prikazati korisniku.',{mode:'Korisnički',cpu:'P1'});
    }else{
      add('opened','filesystem','Datoteka je otvorena','Aplikacija dobiva deskriptor 3, oznaku za sljedeće operacije.',{mode:'Korisnički',cpu:'P1',descriptor:3});
      add('read','syscall','Sistemski poziv read(3)','Aplikacija traži bajtove. Jezgra provjerava otvorenu datoteku i odredišni spremnik.',{mode:'Jezgreni',cpu:'Jezgra u kontekstu P1'});
      if(variant==='disk'){
        add('device','drivers','Predmemorija nema podatak','Upravljački program predaje zahtjev uređaju.',{io:'Čitanje diska u tijeku'});
        add('blocked','scheduler','P1 čeka I/O; P2 radi','Blokirani P1 nije kandidat za CPU. Drugi spremni proces može se izvoditi.',{mode:'Korisnički',cpu:'P2',process:'P1: čeka I/O; P2: izvodi se'});
        add('interrupt','hardware','Uređaj javlja dovršetak','Prekid omogućuje obradu završetka. Podatak je sada u RAM-u.',{mode:'Jezgreni',cpu:'Obrada prekida tijekom P2',memory:'Podatak u predmemoriji',io:'Dovršeno'});
        add('wake','scheduler','P1 postaje spreman','Spreman ne znači da se već izvodi; raspoređivač još bira proces.',{process:'P1: spreman; P2: prekinut obradom prekida'});
        add('resume','scheduler','Raspoređivač odabire P1','Nakon promjene konteksta nastavlja se obrada čitanja za P1.',{cpu:'Jezgra u kontekstu P1',process:'P1: izvodi se; P2: spreman'});
      }else{
        add('cache','filesystem','Podatak je već u predmemoriji','Nema potrebe pokrenuti uređaj ni blokirati P1 zbog ovog čitanja.',{memory:'Podatak u predmemoriji'});
      }
      add('copy','filesystem','Bajtovi se kopiraju u spremnik aplikacije','Uspješno čitanje vraća broj pročitanih bajtova.',{memory:'Aplikacija ima traženi tekst',result:'Pročitano 12 bajtova'});
      add('return','apps','P1 nastavlja korisnički kod','Aplikacija može prikazati tekst. Uređaj nije bio potreban u svakoj inačici.',{mode:'Korisnički',cpu:'P1',process:'P1: izvodi se'});
    }
  }
  if(id==='cpu'){
    add('running','apps','P1 troši svoj kvant','PC označava mjesto nastavka u programu; ovdje ga ilustrira broj 120.',{cpu:'P1',process:variant==='ready'?'P1: izvodi se; P2: spreman':'P1: izvodi se',pc:120,ready:variant==='ready'?'P2':'Prazno'});
    add('timer','hardware','Vremenski prekid','Hardver predaje kontrolu jezgri. Korisnički program ne mora dobrovoljno pozvati OS.',{mode:'Jezgreni',cpu:'Obrada vremenskog prekida'});
    add('save','scheduler','Sačuvano je stanje P1','Stanje potrebno za nastavak čuva se uz pomoć hardvera i jezgre.',{saved:'P1: PC 120 i registri'});
    if(variant==='ready'){
      add('select','scheduler','P2 je sljedeći u redu','P1 ostaje spreman. Izbor sljedećeg procesa razlikuje se od mehanizma prijenosa kontrole.',{process:'P1: spreman; P2: odabran',ready:'P1'});
      add('switch','scheduler','Obnova konteksta P2','Obnavljaju se registri i odgovarajući adresni prostor P2.',{pc:60,memory:'Adresni prostor P2'});
      add('return','apps','P2 se izvodi','P1 će kasnije nastaviti sa svojeg sačuvanog mjesta.',{mode:'Korisnički',cpu:'P2',process:'P1: spreman; P2: izvodi se',result:'Promijenjeni su način rada i proces.'});
    }else{
      add('select','scheduler','P1 ostaje odabran','Nema drugog spremnog procesa u ovom modelu.',{process:'P1: odabran'});
      add('return','apps','Nastavlja se P1','Povratak iz jezgre ne zahtijeva prijelaz na drugi proces.',{mode:'Korisnički',cpu:'P1',pc:120,process:'P1: izvodi se',result:'Promijenjen je način rada, ali nije promijenjen proces.'});
    }
  }
  if(id==='memory'){
    const address=3*1024+12,frame=variant==='hit'?2:0;
    add('address','apps','P1 pristupa virtualnoj adresi '+address,'Dijeljenjem s 1024 dobivamo stranicu 3 i pomak 12.',{cpu:'P1',process:'P1: izvodi se',address,page:3,offset:12,memory:variant==='hit'?'Okvir 2: stranica 3':'Okvir 0: izmijenjena stranica 1'});
    add('lookup','memory','MMU provjerava preslikavanje','Prevođenje valjane prisutne stranice obično se odvija bez ulaska u jezgru.');
    if(variant!=='hit'){
      add('fault','memory','Iznimka stranice predaje kontrolu jezgri','Događaj je nastao zbog trenutačne instrukcije; nije vremenski prekid.',{mode:'Jezgreni',cpu:'Obrada iznimke za P1'});
      if(variant==='invalid'){
        add('invalid','memory','Adresa nije dopuštena','Jezgra ne može popraviti ovaj pristup učitavanjem stranice.',{result:'Pristup odbijen; u ovom primjeru P1 završava.',process:'P1: završen',cpu:'Jezgra obrađuje pogrešku'});
        return {id,variant,steps};
      }
      add('valid','memory','Adresa je valjana, ali stranica nije prisutna','Jezgra započinje zapis izmijenjene stranice. P1 čeka, a P2 može koristiti CPU.',{mode:'Korisnički',cpu:'P2',io:'Zapis stranice 1 na disk',process:'P1: čeka I/O; P2: izvodi se'});
      add('writeback','drivers','Zapis izmijenjene stranice dovršen','Prekid javlja završetak zapisa. Tek nakon očuvanja sadržaja okvir se može ponovno upotrijebiti.',{mode:'Jezgreni',cpu:'Obrada dovršetka I/O-a',io:'Zapis dovršen',memory:'Okvir 0: slobodan',process:'P1: čeka; P2: prekinut obradom prekida',writebacks:1});
      add('load','drivers','Učitavanje stranice 3','Jezgra pokreće čitanje. P1 i dalje čeka, a P2 nastavlja dok uređaj radi.',{mode:'Korisnički',cpu:'P2',io:'Čitanje stranice 3',process:'P1: čeka I/O; P2: izvodi se'});
      add('mapped','memory','Tablica stranica je ažurirana','Prekid javlja dovršetak I/O-a. Stranica 3 mapirana je u okvir 0; P1 je spreman.',{mode:'Jezgreni',cpu:'Obrada dovršetka I/O-a',memory:'Okvir 0: stranica 3',io:'Dovršeno',process:'P1: spreman; P2: prekinut obradom prekida'});
      add('retry','scheduler','P1 dobiva CPU i ponavlja pristup','Obnavlja se kontekst; izvorna instrukcija sada može završiti.',{mode:'Korisnički',cpu:'P1',process:'P1: izvodi se'});
    }
    add('physical','hardware','Pristup fizičkoj memoriji','Fizička adresa = broj okvira × veličina stranice + pomak.',{physical:frame*1024+12,result:`Fizička adresa: ${frame} × 1024 + 12 = ${frame*1024+12} B.`});
  }
  if(id==='threads'){
    let x=0;const registers={T1:null,T2:null};
    add('shared','apps','Dvije dretve dijele x','Svaka želi jednom povećati x. Registri su zasebni, podatak x je zajednički.',{cpu:'T1',process:'Jedan proces, dvije dretve',x,registers:'T1: —; T2: —',memory:'Dijeljeni x = 0',lock:'Slobodan'});
    const schedule=variant==='race'?[[1,'read'],[2,'read'],[1,'add'],[2,'add'],[1,'write'],[2,'write']]:[[1,'lock'],[1,'read'],[1,'add'],[1,'write'],[1,'unlock'],[2,'lock'],[2,'read'],[2,'add'],[2,'write'],[2,'unlock']];
    for(const [n,op] of schedule){
      const t='T'+n;
      if(op==='lock'){add(t+op,'apps',t+' zauzima mutex','Samo vlasnik lokota smije u zaštićeni odsječak.',{cpu:t,lock:t});continue;}
      if(op==='unlock'){add(t+op,'apps',t+' otpušta mutex','Sljedeća dretva tek sada može sigurno čitati i povećati x.',{cpu:t,lock:'Slobodan'});continue;}
      if(op==='read')registers[t]=x;
      if(op==='add')registers[t]++;
      if(op==='write')x=registers[t];
      add(t+op,'apps',t+': '+{read:'čitaj x u registar',add:'povećaj registar za 1',write:'upiši registar u x'}[op],op==='write'?'Upis mijenja zajednički podatak.':'Mijenja se samo vlastiti registar dretve.',{cpu:t,x,registers:`T1: ${registers.T1??'—'}; T2: ${registers.T2??'—'}`,memory:'Dijeljeni x = '+x});
    }
    add('result','apps','Usporedi očekivanje i rezultat',variant==='race'?'Obje su dretve pročitale 0. Posljednji upis prebrisao je povećanje prve. To je jedan mogući ishod bez zaštite.':'Druga dretva čita vrijednost koju je prva već upisala.',{result:`Dva povećanja; očekivano 2; dobiveno ${x}.`});
  }
  if(id==='deadlock'){
    add('start','apps','P1 i P2 trebaju oba resursa','Lokot može držati samo jedan proces. Čekajući proces zadržava već zauzeti lokot.',{cpu:'P1',r1:'Slobodan',r2:'Slobodan',process:'P1 i P2 spremni'});
    add('p1r1','apps','P1 zauzima R1','P1 treba još i R2.',{r1:'P1'});
    if(variant==='cycle'){
      add('p2r2','apps','P2 zauzima R2','P2 traži resurse obrnutim redoslijedom.',{cpu:'P2',r2:'P2'});
      add('wait1','scheduler','P1 čeka R2','R2 drži P2, a P1 zadržava R1.',{cpu:'P2',process:'P1: čeka P2'});
      add('wait2','scheduler','P2 čeka R1','R1 drži P1. Nitko ne može doći do otpuštanja lokota.',{cpu:'Nijedan od ova dva procesa',process:'P1 čeka P2; P2 čeka P1',cycle:true,result:'Zastoj: P1 → P2 → P1.'});
    }else{
      add('wait2','scheduler','P2 čeka R1 i još ne drži R2','Jednak redoslijed ostavlja P1 put do dovršetka.',{cpu:'P1',process:'P1: izvodi se; P2: čeka R1'});
      add('p1r2','apps','P1 zauzima i R2','P1 sada može obaviti rad.',{r2:'P1'});
      add('release1','apps','P1 otpušta oba resursa','P2 može nastaviti kad dobije CPU.',{r1:'Slobodan',r2:'Slobodan',process:'P1: završen; P2: spreman'});
      add('p2r1','apps','P2 zauzima R1','Redoslijed je isti kao kod P1.',{cpu:'P2',r1:'P2'});
      add('p2r2','apps','P2 zauzima R2','P2 može obaviti rad i osloboditi lokote.',{r2:'P2'});
      add('release2','apps','Oba procesa su dovršila rad','P2 je čekao, ali nije nastao krug čekanja.',{cpu:'—',r1:'Slobodan',r2:'Slobodan',process:'P1: završen; P2: završen',cycle:false,result:'Oba procesa završila; nema zastoja.'});
    }
  }
  return {id,variant,steps};
}

export function defaultExplorer(){return {drafts:{},records:[]};}
export function explorerDraft(explorer,id){return explorer.drafts[id]||{variant:mechanism(id).variants[0][0],step:0,prediction:'',reflection:''};}
export function validateExplorer(raw){
  if(raw===undefined)return defaultExplorer();
  if(!raw||typeof raw!=='object'||!raw.drafts||Array.isArray(raw.drafts)||typeof raw.drafts!=='object'||Object.keys(raw.drafts).length>6||!Array.isArray(raw.records)||raw.records.length>15)throw Error('Neispravan zapis učenja mehanizama.');
  const drafts={},records=[],seen=new Set();
  const validate=(id,d)=>{
    const l=mechanism(id);
    if(!l||!d||!l.variants.some(v=>v[0]===d.variant)||typeof d.prediction!=='string'||d.prediction.length>1200||typeof d.reflection!=='string'||d.reflection.length>2000)throw Error('Neispravan odgovor ili inačica mehanizma.');
  };
  for(const [id,d] of Object.entries(raw.drafts)){
    validate(id,d);
    if(!Number.isInteger(d.step)||d.step<0||d.step>traceMechanism(id,d.variant).steps.length)throw Error('Neispravan korak mehanizma.');
    drafts[id]={variant:d.variant,step:d.step,prediction:d.prediction,reflection:d.reflection};
  }
  for(const r of raw.records){
    validate(r?.id,r);const key=r.id+':'+r.variant;
    if(seen.has(key)||typeof r.at!=='string'||r.at.length>100||!Number.isFinite(Date.parse(r.at)))throw Error('Neispravan spremljeni pokus.');
    seen.add(key);records.push({id:r.id,variant:r.variant,prediction:r.prediction,reflection:r.reflection,at:r.at});
  }
  return {drafts,records};
}

export function saveMechanismRecord(explorer,id,at=new Date().toISOString()){
  const d=explorerDraft(explorer,id),trace=traceMechanism(id,d.variant);
  if(d.step!==trace.steps.length)throw Error('Najprije prođi pokus do završetka.');
  if(!d.prediction.trim()||!d.reflection.trim())throw Error('Zapiši predviđanje i objašnjenje. Njihovu točnost pregledava nastavnik.');
  const record={id,variant:d.variant,prediction:d.prediction,reflection:d.reflection,at};
  return validateExplorer({...explorer,records:[...explorer.records.filter(r=>r.id!==id||r.variant!==d.variant),record]});
}
