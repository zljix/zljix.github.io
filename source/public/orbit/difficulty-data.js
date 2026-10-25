import {COURSE} from './course-data.js';

export const DIFFICULTIES=[
  {id:'easy',label:'Easy',title:'Upoznaj i razumij',description:'Za prvi susret s OS-om. Dva izbora u kratkim provjerama, početak redoslijeda i vodič uz zadatke.',goal:'Prepoznaj dio sustava, opiši njegovu ulogu i prati jednostavan mehanizam.',target:100},
  {id:'moderate',label:'Moderate',title:'Primijeni znanje',description:'Svi izbori, pomoć na zahtjev i dodatni slučaj iz svakodnevnog rada.',goal:'Prenesi pravilo na novu situaciju i poveži ishod s razlogom.',target:120},
  {id:'hard',label:'Hard',title:'Istraži uzrok',description:'Primjena i dodatna dijagnoza: poveži tri odluke. Pomoć nakon prvog pokušaja.',goal:'Razlikuj moguća objašnjenja, predvidi posljedicu i odaberi opravdan popravak.',target:140}
];
export const difficultyById=id=>DIFFICULTIES.find(d=>d.id===id);
const field=(label,...options)=>({label,options});
const scenario=(q,fields,answer,why,hint)=>({type:'pair',q,fields,answer,why,hint});
const cases={
 hardware:[
  scenario('Spremiš verziju A bilješke. Zatim napišeš verziju B, bez spremanja i bez automatske kopije. Nestane napajanja. Što očekuješ pri ponovnom otvaranju?',[
   field('Koja verzija ostaje?','A','B','Ni jedna, jer su obje bile prikazane na zaslonu.'),
   field('Gdje je bila nespremljena promjena B?','Samo u trajnoj pohrani.','U radnoj memoriji aplikacije.','U zasebnoj jezgri OS-a.')],[0,1],
   'Na SSD-u je ostala A. B je promijenila radnu kopiju u RAM-u, a spremanje nove verzije nije dovršeno.','Razdvoji posljednju uspješno spremljenu verziju od teksta koji je samo vidljiv.'),
  scenario('A je ranija verzija bilješke, a B novija. Učenik kaže: „B je bila na zaslonu, pa je SSD morao zakazati jer se nakon nestanka napajanja vratila A.” Poznato je samo da je A bila spremljena, a B nije. Procijeni tvrdnju.',[
   field('Što objašnjava ishod?','Kvar SSD-a je dokazan.','Nespremljena B mogla je ostati samo u RAM-u.','CPU je trajno pohranio B.'),
   field('Koji podatak bi promijenio zaključak?','B je bila vidljiva deset minuta.','Aplikacija je bila povećana.','Potvrđeno uspješno spremanje B prije nestanka napajanja.'),
   field('Što ubuduće smanjuje isti rizik?','Dovršiti spremanje i provjeriti spremljenu verziju.','Dodati RAM bez promjene postupka spremanja.','Ostaviti prozor povećan.')],[1,2,0],
   'Nestanak nespremljene promjene nije dokaz kvara SSD-a. Za drukčiji zaključak treba dokaz da je nova verzija doista zapisana.','Odvoji opažanje od pretpostavke: što je dokazano o zapisu na trajnu pohranu?')],
 os:[
  scenario('Ista aplikacija uspješno sprema u mapu A, a zapis u mapu B se odbija. Disk je isti i radi; korisnik nema pravo pisanja u B.',[
   field('Koji dio puta zaustavlja zapis?','Provjera prava pristupa.','Izbor boje prozora.','Izvođenje svake aplikacijske upute na SSD-u.'),
   field('Koji je razuman sljedeći korak?','Ponovno pokrenuti CPU dok dozvole ostaju iste.','Tražiti odobrenje ili spremiti u dopuštenu mapu.','Zaobići OS izravnim pisanjem na uređaj.')],[0,1],
   'Isti disk može poslužiti jedan dopušteni zahtjev i odbiti drugi. Odabrati dopušteno odredište ili zatražiti odgovarajuće pravo rješava konkretni uzrok.','Usporedi što se razlikuje između A i B; uređaj je u oba slučaja isti.'),
  scenario('A i B dvije su mape na istom uređaju. Zapis u mapu B je odbijen. Učenik predlaže zamjenu upravljačkog programa. Zapis u mapu A uspijeva, a pregled prava pokazuje da korisnik u B smije samo čitati.',[
   field('Najbolje potkrijepljen uzrok','Nema prava pisanja u B.','Nijedan upravljački program ne radi.','CPU ne može izvršavati jezgru OS-a.'),
   field('Ako administrator odobri pisanje u B, uz ostale uvjete iste…','CPU više ne mora izvršavati upute.','Ova prepreka zapisu nestaje.','OS prestaje posredovati zahtjevu.'),
   field('Zašto zamjena upravljačkog programa nije prvi korak?','Upravljački programi ne sudjeluju u zapisu.','Čitanje uvijek daje i pravo pisanja.','Uspjeh u A potvrđuje da uređaj može primiti zapis, a utvrđena je razlika u pravima.')],[0,1,2],
   'Dijagnoza slijedi razliku u uvjetima. Odobrenje uklanja utvrđenu prepreku; ne tvrdi da u svakom stvarnom sustavu više nikakav kvar nije moguć.','Traži objašnjenje koje se slaže i s uspjehom u A i s odbijanjem u B.')],
 process:[
  scenario('Program Bilješke pokrenut je dvaput; nastali su zasebni procesi P1 i P2. P1 ima nespremljen tekst, a P2 je već spremio svoju datoteku. U ovom modelu završimo samo P1, bez automatskog spremanja.',[
   field('Što se događa s P2?','Mora završiti zajedno s P1.','Može nastaviti raditi.','Pretvara se u datoteku programa.'),
   field('Što ostaje sigurno spremljeno?','Nespremljeni tekst P1.','Samo identifikator P1.','Datoteka koju je P2 uspješno spremio.')],[1,2],
   'Odvojene instance imaju zasebno stanje. Završetak P1 ne briše spremljenu datoteku P2 niti nužno završava P2.','Razdvoji tri stvari: datoteku programa, stanje procesa i spremljeni dokument.'),
  scenario('P1 i P2 dva su zasebna procesa istog programa Bilješke, bez zajedničkih radnih podataka. P1 čeka podatke s diska, a P2 je spreman za CPU. Učenik želi obrisati datoteku programa jer „nijedan prozor trenutačno ne piše”.',[
   field('Što opisuje P1?','Završen proces.','Aktivan proces koji čeka događaj.','Datoteku koja više ne postoji.'),
   field('Tko je kandidat za CPU?','P2.','P1, iako potreban podatak još nije stigao.','Ni jedan, jer im je program isti.'),
   field('Koji zaključak nije opravdan opažanjem prozora?','Proces može čekati bez završetka.','Spreman proces može nastaviti.','Datoteka programa više nije potrebna zato što nema vidljivog pisanja.')],[1,0,2],
   'Stanje procesa opisuje izvođenje, a ne postojanje programa. Čekanje i nevidljiv rad nisu dokaz da je proces završen ili da program treba brisati.','Provjeri zasebno status svakog procesa i postojanje pohranjenih uputa.')],
 cpu:[
  scenario('P1 i P2 dva su procesa koja dijele jedan CPU. P1 obrađuje tekst, a P2 čita datoteku. P1 se izvodi, P2 čeka disk. P1 se blokira čekajući tipkovnicu; u istom trenutku disk dovrši zahtjev P2. Nema drugih procesa.',[
   field('Tko sada može dobiti CPU?','P1 jer je zadnji bio aktivan.','P2.','Oba moraju ostati blokirana.'),
   field('Koja je promjena to omogućila?','P2 je iz čekanja prešao među spremne.','P1 je izbrisao program P2.','Disk je preuzeo izvršavanje uputa P2.')],[1,0],
   'Dovršetak I/O-a uklanja razlog čekanja P2. P1 sada čeka drugi događaj; raspoređivač može izabrati spremni P2.','Ažuriraj stanja oba procesa prije izbora sljedećega.'),
  scenario('P1, P2 i P3 oznake su triju procesa, ne njihovih prioriteta. P1 se izvodi na jedinom CPU-u, P2 čeka podatke s diska, a P3 je spreman za CPU. Vremenski odsječak P1 istječe. Učenik tvrdi da se tada nužno izvodi P2.',[
   field('Zašto tvrdnja ne slijedi?','P2 još čeka I/O.','Svaki prekid završava sve procese.','P3 ne može biti spreman dok P1 radi.'),
   field('Što OS treba prije prijelaza s P1 na P3?','Obrisati upute P1.','Sačuvati kontekst P1 i obnoviti kontekst P3.','Prenijeti program P3 na CPU bez njegova stanja.'),
   field('Ako se I/O P2 dovrši, što je tada sigurno?','P2 postaje spreman; izbor za CPU ovisi o raspoređivaču.','P2 odmah završava.','P2 nužno istisne svaki drugi proces istoga trenutka.')],[0,1,0],
   'Prekid i promjena procesa nisu isto. Kandidat mora biti spreman; dovršetak I/O-a daje spremnost, a raspoređivač određuje izvođenje.','Razdvoji događaj prekida, skup spremnih procesa i odluku raspoređivača.')],
 memory:[
  scenario('P1 i P2 dva su procesa s vlastitim adresnim prostorima. Oba koriste virtualnu adresu 120. Za P1 ona vodi u fizički okvir A, a za P2 u okvir B. A i B različiti su dijelovi RAM-a. Oba pristupa su dopuštena i tražene su stranice u RAM-u.',[
   field('Čitaju li nužno isti podatak?','Da, jer je broj 120 isti.','Ne, okviri A i B mogu sadržavati različite podatke.','Ni jedan pristup nije moguć.'),
   field('Treba li ovdje učitati stranicu s diska?','Ne, tražene stranice već su prisutne.','Da, zbog jednakih virtualnih adresa.','Da, pri svakom čitanju RAM-a.')],[1,0],
   'Virtualna adresa vrijedi unutar adresnog prostora procesa. Jednaki brojevi ne jamče isto fizičko mjesto, a prisutne stranice ne treba ponovno učitati.','Najprije pogledaj preslikavanje svakog procesa, zatim prisutnost njegove stranice.'),
  scenario('P1 i P2 dva su procesa. P1 traži dopuštenu memorijsku stranicu koja nije u RAM-u, ali ima kopiju na disku. P2 pokušava nedopušten pristup drugoj stranici koja jest u RAM-u. Usporedi postupke.',[
   field('Postupak za P1','Odbiti jer svaka iznimka znači zabranu.','Učitati dopuštenu stranicu i ponoviti pristup.','Zaobići preslikavanje.'),
   field('Postupak za P2','Dopustiti jer je podatak u RAM-u.','Učitati istu stranicu još jednom da bi dobio pravo.','Odbiti nedopušten pristup.'),
   field('Bi li više slobodnog RAM-a samo uklonilo problem P2?','Da, kapacitet određuje dozvole.','Ne, kapacitet i pravo pristupa različiti su uvjeti.','Da, ako P1 prestane raditi.')],[1,2,1],
   'Dopuštenost se provjerava zasebno od prisutnosti. Učitavanje može riješiti nedostupnost dopuštene stranice, ali ne stvara dozvolu za P2.','Za svaki proces odgovori na dva pitanja: smije li pristupiti i je li stranica prisutna?')],
 read:[
  scenario('P1 i P2 dva su procesa. P1 ima dozvolu za čitanje datoteke, ali njezin sadržaj nije u predmemoriji. Dok P1 čeka da disk pročita sadržaj, P2 je spreman za CPU. Nakon dovršetka čitanja sadržaj ostaje u RAM-u.',[
   field('Što CPU može raditi tijekom čitanja?','Izvršavati P2.','Izvršavati blokirani P1 kao da je podatak stigao.','Mora biti neaktivan cijelo vrijeme.'),
   field('Ponovno dopušteno čitanje istog sadržaja može…','…nužno ponovno čekati isti fizički disk.','…upotrijebiti kopiju iz RAM-a.','…preskočiti svaku provjeru prava.')],[0,1],
   'I/O jednog procesa može se preklopiti s izvršavanjem drugoga. Sačuvani sadržaj zatim može poslužiti iz predmemorije uz odgovarajuće pravo pristupa.','Prati odvojeno CPU, uređaj i mjesto gdje se sadržaj nalazi.'),
  scenario('Prvo dopušteno čitanje čeka disk, drugo je brzo jer su sadržaj i metapodatci u RAM-u. Treći zahtjev dolazi nakon ukidanja prava čitanja. U ovom modelu OS ponovno provjerava dozvolu za svaki zahtjev.',[
   field('Najbolje objašnjenje ubrzanja drugog čitanja','Sadržaj se mogao preuzeti iz predmemorije.','CPU je trajno zamijenio SSD.','Drugi zahtjev nije trebao nikakve upute.'),
   field('Ishod trećeg zahtjeva','Dopušten je jer postoji kopija u RAM-u.','Odbijen je zbog prava pristupa.','Dopušten je tek kad se kopija ukloni iz RAM-a.'),
   field('Ako se predmemorija isprazni, a pravo opet odobri…','Čitanje je zauvijek nemoguće.','Predmemorija automatski mijenja dozvole.','Sadržaj može opet trebati pročitati s diska.')],[0,1,2],
   'Predmemorija objašnjava put podataka, a dozvola odluku smije li zahtjev proći. Promjena jednoga ne mijenja automatski drugo.','Usporedi tri uvjeta: dozvola, mjesto sadržaja i završetak potrebnog I/O-a.')],
 threads:[
  scenario('T1 i T2 dvije su dretve istog procesa, a x njihov zajednički brojač, početno 10. Svaka ga poveća za 1. Isti mutex (lokot) štiti cijelo čitanje, računanje i upis; T1 završi prije nego T2 uđe.',[
   field('Završni x','11','12','20'),
   field('Zašto?','T2 čita 11 koji je upisala T1.','Obje čitaju 10 pa mutex zbroji rezultate.','Mutex zamjenjuje oba izračuna jednim.')],[1,0],
   'T1 upisuje 11 i otpusti lokot. T2 zatim pročita novu vrijednost i upiše 12. Zaštićena je cijela operacija, ne samo pojedini upis.','Zapiši vrijednost koju druga dretva vidi u trenutku svojeg čitanja.'),
  scenario('T1 i T2 dvije su dretve istog procesa, a x njihov zajednički brojač, početno 10. Obje prvo pročitaju 10 bez lokota i svaka izračuna 11. Isti mutex (lokot) štiti samo završni upis, pa T1 upiše 11, zatim T2 upiše 11.',[
   field('Završni x u navedenom rasporedu','12','11','10'),
   field('Zašto mutex nije bio dovoljan?','Samo upisi su uređeni; izračuni koriste istu staru vrijednost.','Mutex nužno onemogućuje svako povećanje.','Druga dretva ne izvršava upis.'),
   field('Koja izmjena daje 12 za dva dovršena povećanja?','Zaključati samo crtanje broja.','Svakoj dretvi dati drugi, neovisni lokot.','Istim mutexom zaštititi čitanje, računanje i upis svake dretve.')],[1,0,2],
   'Redoslijed samih upisa ne popravlja rezultat izračunat iz stare vrijednosti. Kritični odsječak mora obuhvatiti cijelo povećanje.','Provjeri je li zajednička vrijednost pročitana prije ulaska u zaštićeni dio.')],
 deadlock:[
  scenario('P1 i P2 dva su procesa, a R1 i R2 dva resursa, svaki dostupan samo jednom procesu u trenutku. P1 drži R1 i čeka R2. P2 drži R2, ali ne traži R1 i može dovršiti rad te otpustiti R2.',[
   field('Je li opisan nužan zastoj?','Da, čim jedan proces čeka.','Ne, P2 može napredovati.','Da, čim postoje dva resursa.'),
   field('Koji događaj može omogućiti nastavak P1?','P2 otpusti R2 nakon rada.','P1 ponovno zatraži R2 bez promjene uvjeta.','P1 zadrži R1 i zabrani P2 dovršetak.')],[1,0],
   'Čekanje nije samo po sebi zastoj. Nema zatvorenog kruga: P2 može dovršiti rad i osloboditi ono što P1 treba.','Pronađi postoji li barem jedan sudionik koji može završiti bez čekanja na drugoga.'),
  scenario('P1 i P2 dva su procesa, a R1 i R2 dva resursa, svaki zaštićen zasebnim lokotom. P1 drži R1 i čeka R2; P2 drži R2 i čeka R1. Nema odustajanja ni prisilnog oduzimanja. Predlaže se: „Ubrzajmo CPU i promijenimo prioritet P1.”',[
   field('Hoće li to samo po sebi osloboditi resurs?','Da, veći prioritet automatski otpušta tuđi lokot.','Ne, oba i dalje čekaju resurs koji drži drugi.','Da, brži CPU prekida svaki krug.'),
   field('Koje pravilo za buduća izvođenja sprječava ovaj krug?','Svi uzimaju R1 prije R2.','Svaki proces uzima drugi redoslijed.','Svi drže prvi resurs zauvijek.'),
   field('Primjenjuje li samo novo pravilo retroaktivno popravak već nastalog zastoja?','Da, bez ikakve promjene postojećih stanja.','Da, ako se pravilo napiše u bilješku.','Ne, postojeći krug treba zasebno razriješiti; pravilo uređuje nova zauzimanja.')],[1,0,2],
   'Brzina ne uklanja zatvoren krug čekanja. Jedinstven redoslijed sprječava takav krug pri novom zauzimanju, ali sam ne mijenja već zauzete resurse.','Razlikuj sprječavanje budućeg zastoja od oporavka nakon već nastalog zastoja.')]
};
export const EXTENSION_TASKS=Object.entries(cases).flatMap(([lesson,list])=>list.map((t,i)=>({...t,id:`c-${lesson}-${i?'challenge':'apply'}`,lesson,area:'extension',difficulty:i?'hard':'moderate',stage:3,points:20})));

const choice=(q,options,answer,why)=>({type:'choice',q,options,answer,why,hint:why});
const extraEasy=[
 ['link1',choice('P1 i P2 dva su procesa. P1 čeka podatke s diska, a P2 je spreman za izvođenje. Može li CPU za to vrijeme izvršavati P2?',['Može.','Ne može dok P1 čeka.'],0,'Dok jedan proces čeka I/O, CPU može izvršavati drugi spremni proces.'),choice('Kopija datoteke postoji u RAM-u, ali korisnik nema pravo čitanja. Daje li mu sama kopija to pravo?',['Da.','Ne.'],1,'Dostupnost sadržaja ne zamjenjuje dozvolu za pristup.')],
 ['link2',choice('Bilješka je uspješno spremljena na SSD. Proces uređivača zatim završi. Mora li nestati i bilješka?',['Ne, spremljena datoteka može ostati.','Da, završetak procesa briše spremljeni dokument.'],0,'Proces je aktivno izvođenje, a spremljeni dokument može ostati nakon njegova završetka.'),choice('Što je jezgra OS-a?',['Programski dio sustava koji izvršava CPU.','Fizički procesor odvojen od računala.'],0,'Jezgra OS-a je softver, dok je CPU hardver koji izvršava upute.')]
];
export const EASY_FINAL_BANK=[...COURSE.map(l=>[l.id,...l.quiz.map(q=>({...q,type:'choice',why:q.feedback[q.answer],hint:q.feedback[q.answer]}))]),...extraEasy].flatMap(([topic,...list])=>list.map((q,i)=>({...q,id:`easy-${topic}-${i}`,topic,points:10})));
// A Hard final combines all three decisions in each new diagnostic scenario.
// Each distractor contains a plausible but incomplete combination, not a joke answer.
export const HARD_FINAL_BANK=Object.entries(cases).flatMap(([topic,list])=>list.map((t,i)=>{
 const f=t.fields,indices=t.answer,combination=values=>values.map((v,k)=>f[k].label+': '+f[k].options[v]).join(' · ');
 const wrongA=indices.map((v,k)=>k===0?(v+1)%f[k].options.length:v),wrongB=indices.map((v,k)=>k===1?(v+1)%f[k].options.length:v),wrongC=indices.map((v,k)=>k===f.length-1?(v+2)%f[k].options.length:v);
 return {...choice(t.q+' Odaberi potpuno ispravno objašnjenje.',[combination(indices),combination(wrongA),combination(wrongB),combination(wrongC)],0,t.why),id:`hard-${topic}-${i}`,topic,points:10};
})).concat([
 ['link1',choice('P1 i P2 dva su procesa. P1 traži dopuštenu memorijsku stranicu koja nije u RAM-u i čeka da je disk učita. P2 je spreman za CPU. Koji slijed je moguć?',['CPU izvršava P2; po dovršetku I/O-a P1 postaje spreman i kasnije ponovi pristup.','P1 nastavlja pristup prije učitavanja jer dozvola znači da je stranica prisutna.','CPU mora mirovati sve do učitavanja, bez obzira na P2.','Učitavanje stranice briše program P2.'],0,'Čekanje I/O-a, raspoređivanje CPU-a i ponavljanje memorijskog pristupa povezani su, ali odvojeni koraci.'),choice('P1 i P2 dva su procesa. P1 traži čitanje datoteke koja je u predmemoriji, ali nema pravo čitanja. P2 je drugi proces, spreman za CPU. Koja promjena rješava baš odbijanje zahtjeva P1?',['Više procesorskog vremena za P2.','Opravdano odobrenje prava čitanja; sama predmemorija i izbor CPU-a nisu dozvola.','Pražnjenje predmemorije bez promjene prava.','Veći odsječak vremena bez promjene prava.'],1,'Pravo pristupa je utvrđena prepreka; lokacija sadržaja i raspoređivanje CPU-a ne zamjenjuju provjeru prava.')],
 ['link2',choice('P1, P2 i P3 tri su procesa. P1 i P2 drže po jedan isključivo zauzet resurs i čekaju onaj drugoga; nitko ne odustaje ni prisilno otpušta resurse. P3 ne treba te resurse i izvodi se na CPU-u. Je li rad P3 dokaz da P1 i P2 nisu u zastoju?',['Da, zastoj mora zaustaviti svaki proces računala.','Ne, zatvoren krug P1–P2 može ostati dok P3 napreduje.','Da, P3 svojim izvođenjem automatski otpušta njihove resurse.','Ne, zato što spreman proces nikada ne može dobiti CPU.'],1,'Zastoj može zahvatiti podskup procesa. Aktivnost trećega ne razrješava njihov krug čekanja.'),choice('Dvije dretve zaštićene istim mutexom dovrše dva povećanja u RAM-u. Posljednje spremanje na SSD prethodilo je tim povećanjima. Nema automatskog spremanja; nestane napajanja. Što vrijedi?',['Mutex jamči i trajnost novih vrijednosti nakon nestanka napajanja.','Ispravno usklađivanje u RAM-u ne znači da je novo stanje spremljeno na SSD.','CPU uvijek prenosi RAM na SSD pri nestanku napajanja.','Završetak dretve sam po sebi potvrđuje trajni zapis.'],1,'Sinkronizacija uređuje zajedničko izvođenje, a trajno spremanje rješava drugi problem: očuvanje podataka nakon gubitka napajanja.')]
].flatMap(([topic,...list])=>list.map((q,i)=>({...q,id:`hard-${topic}-${i}`,topic,points:10}))));
