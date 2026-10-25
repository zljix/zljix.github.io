// Teaching support is separate from scoring: existing IDs and answers stay valid.
export const GUIDES = {
 hardware:{title:'Tvoja bilješka prije i poslije spremanja',story:'Pišeš rečenicu „Danas učim.” Prati što računalo radi s njom dok pišeš, kada spremiš i nakon gašenja.',roles:[['CPU','Procesor izvršava upute programa.'],['RAM','Radna memorija drži tekst koji upravo uređuješ.'],['SSD','Pohrana čuva uspješno spremljenu datoteku.']],headings:['Kreni od pisanja bilješke','Tri dijela, tri različite uloge'],focus:'Razlikuj tekst koji vidiš od teksta koji je spremljen.',retry:'Pronađi tko izvršava upute, tko drži radnu kopiju, a tko čuva spremljeno. Prikaz na zaslonu sam ne potvrđuje spremanje.'},
 os:{title:'Tko sudjeluje kada odabereš Spremi?',story:'Uređivač teksta treba zapisati bilješku u mapu. Prati zahtjev aplikacije, odluku OS-a i rad uređaja.',roles:[['Aplikacija','Uređivač teksta: traži spremanje.'],['OS','Operacijski sustav: organizira rad i provjerava pristup.'],['Uređaj','SSD: prima dopušteni zapis.']],headings:['Aplikacija koristi usluge OS-a','Prati jedan zahtjev za spremanje','Što je resurs i tko ga raspodjeljuje?'],focus:'Razlikuj tko traži radnju, tko provjerava i tko je obavlja.',retry:'Vrati se na put zahtjeva. Odvoji posao aplikacije, provjeru u OS-u i rad uređaja. Postojanje uređaja nije dozvola za pristup.'},
 process:{title:'Iste Bilješke pokrenute dvaput',story:'U ovom modelu jedno pokretanje programa Bilješke stvara jedan proces. Drugo pokretanje može stvoriti drugi proces, s vlastitim stanjem.',roles:[['Program','Spremljene upute programa Bilješke.'],['P1','Proces prvog pokretanja Bilježaka.'],['P2','Proces drugog pokretanja, kada ga odabereš.']],headings:['Program prije pokretanja','Proces nastaje pokretanjem','Završetak izvođenja'],focus:'Odvojeno broji programe u pohrani i procese koji postoje.',retry:'Odvojeno prebroji aktivna izvođenja i spremljene datoteke. Završava li u zadatku jedan proces ili se izričito briše datoteka programa?'},
 cpu:{title:'Bilješke i glazba dijele jedan CPU',story:'Promatramo jedan CPU koji u trenutku izvršava upute jednog procesa. P1 obrađuje tekst, a P2 glazbu. Raspoređivač bira među spremnim procesima.',roles:[['P1','Proces obrade teksta.'],['P2','Proces obrade glazbe.'],['Kvant','Vremenski odsječak dodijeljen procesu.']],headings:['Tko želi koristiti CPU?','OS uređuje izmjenu','Kako proces nastavlja gdje je stao?'],focus:'Za svaki proces prvo utvrdi: izvodi se, spreman je ili čeka uređaj.',retry:'Proces koji postoji ne mora biti spreman. Odvoji istek vremena, obradu prekida i odluku o tome tko sljedeći smije na CPU.'},
 memory:{title:'Proces traži podatak po adresi',story:'P1 želi pristupiti podatku u svojoj virtualnoj memoriji. Odvojeno provjeri smije li pristupiti i je li tražena stranica već u RAM-u.',roles:[['P1','Proces koji traži podatak.'],['P2','Drugi proces koji može raditi dok P1 čeka.'],['Stranica / okvir','Dio virtualne memorije / mjesto za takav dio u RAM-u.']],headings:['Više procesa koristi RAM','Virtualna adresa i fizičko mjesto','Dostupnost i pravo pristupa'],focus:'Odgovori na dva pitanja: „Smije li?” i „Je li već u RAM-u?”',retry:'Napravi dvije odvojene provjere: pravo pristupa i prisutnost stranice. Jedno ne zamjenjuje drugo.'},
 read:{title:'Uređivač otvara biljeska.txt',story:'Proces P1 traži spremljeni tekst. Provjeri dozvolu, zatim postoji li kopija sadržaja u RAM-u ili je potrebno čitanje s diska.',roles:[['P1','Proces koji traži sadržaj datoteke.'],['P2','Drugi spremni proces u primjeru čekanja.'],['Predmemorija','Kopija sadržaja zadržana u RAM-u.']],headings:['Datoteka ima ime i sadržaj','Dozvola i mjesto kopije','Što se događa dok uređaj čita?'],focus:'Prati put sadržaja i stanje procesa odvojeno.',retry:'Najprije provjeri dozvolu, zatim gdje je sadržaj. Dok jedan proces čeka uređaj, razmotri ima li drugi spreman posao.'},
 threads:{title:'Dva zadatka mijenjaju isti brojač',story:'Jedan proces vodi zajednički brojač. Dvije njegove dretve trebaju ga svaka povećati za 1. U uvodnom pokusu brojač počinje s 0.',roles:[['T1','Prva dretva: jedan tok izvođenja unutar procesa.'],['T2','Druga dretva istog procesa; dijeli podatke s T1.'],['x','Zajednički brojač. Početni broj uvijek pročitaj u zadatku.'],['Mutex','Zajednički lokot: samo jedan vlasnik u trenutku.']],headings:['Proces i njegove dretve','Jedno povećanje ima tri radnje','Zašto je redoslijed važan?'],focus:'Za svaku dretvu odvoji što je pročitala, što je izračunala i što je upisala.',retry:'Prati pročitanu vrijednost svake dretve. Privatni izračun još ne mijenja zajednički x; upis ga mijenja. Provjeri koje radnje lokot štiti.'},
 deadlock:{title:'Dva procesa trebaju dva resursa',story:'P1 i P2 obavljaju svoje poslove. Oboma trebaju resursi R1 i R2, primjerice dvije zajedničke datoteke, svaka zaštićena zasebnim lokotom.',roles:[['P1 / P2','Dva različita procesa.'],['R1 / R2','Dva resursa; svaki može držati samo jedan proces.'],['Drži / čeka','Drži: već je zauzeo. Čeka: treba resurs koji trenutačno nije dostupan.']],headings:['Obično čekanje ima izlaz','Kako nastaje zatvoreni krug?','Zašto zajednički redoslijed pomaže?'],focus:'Za svaki proces zapiši što drži i što čeka. Može li itko završiti?',retry:'Samo čekanje nije dovoljno za zaključak. Potraži sudionika koji može napredovati i otpustiti resurs ili zatvoreni krug u kojem nitko to ne može.'}
};

export function guideHTML(id,esc){const g=GUIDES[id];if(!g)return '';return `<section class="learning-scenario" aria-label="Scenarij i sudionici"><span class="label">SITUACIJA KOJU ISTRAŽUJEŠ</span><h2>${esc(g.title)}</h2><p>${esc(g.story)}</p><dl class="learning-roles">${g.roles.map(([name,meaning])=>`<div><dt>${esc(name)}</dt><dd>${esc(meaning)}</dd></div>`).join('')}</dl><p class="learning-focus"><b>Prati:</b> ${esc(g.focus)}</p></section>`;}

// q remains the complete, self-contained wording used by reports and backups.
// Presentation alone separates the given situation from the learner's decision.
export function questionParts(t){
 const q=t.q;
 const finalPrompt='Odaberi potpuno ispravno objašnjenje.';
 if(q.endsWith(' '+finalPrompt))return {context:q.slice(0,-finalPrompt.length-1),prompt:finalPrompt};
 if(t.type==='pair')return {context:q,prompt:t.fields.length===3?'Odredi uzrok, posljedicu i opravdan postupak.':'Poveži ishod s razlogom.'};
 if(t.type==='order')return {context:q,prompt:'Složi događaje redom, od prvoga prema posljednjem.'};
 const match=q.match(/^([\s\S]+[.!?])\s+([^.!?]+[?…])$/u);
 if(q.length>140&&match)return {context:match[1],prompt:match[2]};
 return {context:'',prompt:q};
}
export function questionHTML(t,esc,tag='h3'){const p=questionParts(t);return `${p.context?`<div class="learning-given"><strong>Situacija i početni uvjeti</strong><p>${esc(p.context)}</p></div>`:''}<${tag} class="learning-question">${esc(p.prompt)}</${tag}>`;}

export function retryFeedback(t,r){
 if(t.feedback)return t.feedback[r.last[0]];
 if(r.tries>=2||r.help)return t.why;
 return GUIDES[t.lesson]?.retry||'Usporedi svoj odabir sa zadanim uvjetima. Odvoji ono što je potvrđeno od onoga što samo pretpostavljaš.';
}

export const LAB_PREPARATION = [
 ['process','Proces je aktivno izvođenje, a spremljena datoteka može postojati i nakon njegova završetka.'],
 ['hardware','Kopija u istom pregledniku može nestati zajedno s izvornikom. Odvojenu kopiju treba spremiti izvan njega.'],
 ['os','Dozvole određuju tko smije čitati, pisati ili prolaziti kroz mapu. U ovoj vježbi mijenjaš simulirani profil, ne svoje ime.'],
 ['cpu','FCFS daje red prema dolasku. Round Robin kružno dijeli vrijeme. Kvant je najveći uzastopni odsječak prije nove izmjene.'],
 ['read','I/O znači ulaz/izlaz, primjerice čitanje s diska. SJF bira najkraći sljedeći CPU odsječak; ovdje su trajanja unaprijed zadana.'],
 ['memory','FIFO izbacuje najranije učitanu stranicu; LRU onu najdulje nekorištenu. Stranica je dio virtualne memorije, okvir mjesto u RAM-u.'],
 ['hardware','Blok je jedinica dodjele prostora. Fragmenti su odvojeni nizovi blokova iste datoteke. Preslagivanje ovdje prikazuje raspored, ne preporuku za SSD.'],
 ['os','Terminal prima tekst naredbe. Naredba navodi radnju, putanja datoteku ili mapu. Za puni vođeni uvod koristi Akademiju terminala.'],
 ['read','Mrežni zahtjev također ima put i uvjete. Najprije prouči pojmove i topologiju u Mreži; zatim provjeri adresu, naziv i uslugu odvojeno.'],
 ['read','Prvo dovrši vježbu „Adresa, naziv i usluga”. U dijagnostici uspoređuješ dokaz prije promjene i nakon nje.'],
 ['hardware','Verzija čuva stariji sadržaj u istom prostoru. JSON kopija izvozi stanje rada; provjera oporavka znači otvaranje vraćenog sadržaja.']
];
