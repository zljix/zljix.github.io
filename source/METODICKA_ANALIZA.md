# zljixOS 0.14.0 — metodička i didaktička analiza

Analiza obuhvaća osam misija, 18 uvjeta pokusa, tri terminalske putanje, praktične laboratorije, detaljne simulatore, mrežne izazove i izvještavanje. Polazište je učenik koji prvi put sustavno uči operacijske sustave. Razred, trajanje sata i prethodno iskustvo nisu zadani; zato se težina bira i mijenja tijekom rada.

## Glavni nalaz

Igra je već imala kvalitetan temelj: objašnjenje prije provjere, predviđanje prije pokusa, objektivno provjerljive radnje, različite težine i mogućnost ispravljanja bez gubitka bodova. Problem nije bio samo u oznakama. Duga pitanja, nekoliko zaključanih zadataka istodobno i slabo vidljiva promjena stanja otežavali su razumijevanje. Primjeri terminalskih naredbi nisu uvijek imali pripremljene datoteke. Prethodni offline mehanizam mogao je zadržati staru stranicu i sakriti učinjene izmjene.

## Nalazi i provedene prilagodbe

| Područje | Uočena prepreka | Promjena u izdanju 0.14.0 |
| --- | --- | --- |
| Orijentacija | Početnik vidi mnogo paralelnih dijelova igre. | Početna uputa razlikuje osnovne misije, produbljivanje i jednu od triju neovisnih terminalskih putanja. |
| Kontekst | Sama oznaka P1 ili T1 ne daje mentalnu sliku sudionika. | Svaka misija dobiva konkretan scenarij i odvojene kartice s ulogama. P1/P2 su procesi; T1/T2 su dretve istog procesa; R1/R2 su resursi; x je zajednički brojač čiju početnu vrijednost određuje zadatak. |
| Čitanje pitanja | Cijeli slučaj bio je velik naslov. | Dulji slučaj i početni uvjeti odvojeni su od kratkog zahtjeva. Potpuni tekst ostaje u izvještaju i banci zadataka. Završni Hard slučajevi koriste isto razdvajanje. |
| Objašnjenje | Dulji odlomci nemaju lokalnu orijentaciju. | Odlomci dobivaju sadržajne podnaslove, a scenarij izričito navodi što učenik prati. |
| Riješeni primjer | Prethodna stanja nestaju pri prelasku na sljedeći korak. | Učenik vidi prethodnu i novu vrijednost promijenjenog polja te dosad prikazani slijed događaja. Promjenu označava i tekst, ne samo boja. |
| Pokus | Oznaka kvačice potvrđuje prolazak, ali ne olakšava usporedbu. | Ispod pokusa stoje ishodi i zaključci već opaženih uvjeta. Neopaženi ishod nije unaprijed otkriven. Pogrešno predviđanje ostaje dopušteno. |
| Samostalna provjera | Više kartica i zabrana rada odjednom odvlači pozornost. | Prikazuje se jedan aktivan zadatak. Nakon odgovora ostaje objašnjenje i izričit nastavak. Riješeni zadatci dostupni su u sažetom pregledu. Nedovršena priprema ima poveznicu na potreban korak. |
| Pogreška | Potpuno rješenje može zamijeniti učenikovo razmišljanje. | Prvi pogrešan odgovor, kada nema posebne povratne informacije, usmjerava na važnu razliku u pojmovima. Nakon ponovljenog pokušaja ili pomoći dostupno je potpuno objašnjenje. Posebne povratne informacije iz lekcija i pravila Hard pomoći ostaju. |
| Terminal | Neke naredbe primjera spominju nepostojeće datoteke ili mape. | Svih 18 razina dobiva zaseban izvedeni primjer s vlastitim početnim datotekama. Svaki korak prikazuje naredbu, ispis, mapu prije i poslije te promijenjene ili uklonjene stavke. Primjer ne mijenja bodovani rad. |
| Postupno osamostaljivanje | Na Easy je cijeli terminalski postupak odmah vidljiv. | Objašnjenje ostaje vidljivo, a jedan mogući postupak otvara se po potrebi. Slijedi vlastiti zadatak s vlastitim imenima datoteka. |
| Laboratoriji | FCFS, RR, SJF, FIFO, LRU i druge pretpostavke nisu uvijek blizu zadatka. | Svaka vježba ima kratko potrebno predznanje i gumb za povezano objašnjenje. Učenik se može vratiti osnovama bez traženja kroz izbornike. |
| Vidljivost promjene | Stara offline stranica može ostati nakon običnog osvježavanja. | Verzija je vidljiva pri unosu imena i u gornjoj traci. Novi ulaz `igra.html` otvara novo sučelje i uz stari worker. Nova navigacija pokušava mrežu, a pri nedostupnosti koristi potpuno spremljeno izdanje. Nadogradnja ima vidljiv gumb i provjerava nedovršen unos. |

## Što je namjerno zadržano

- Učenje ide od konkretnog spremanja teksta prema apstraktnijim procesima, raspoređivanju, memoriji, dretvama i zastoju.
- Modeli izričito navode pojednostavnjenja. Jedan simulirani CPU nije tvrdnja da sva stvarna računala imaju jednu jezgru; terminal nije stvarno Windows/Linux okruženje.
- Praktični laboratoriji zahtijevaju radnje i zaključak. Mrežna dijagnostika traži dokaze prije popravka i nakon njega. Detaljni simulatori služe produbljivanju nakon osnovnog puta.
- Easy, Moderate i Hard razlikuju prepoznavanje, primjenu i dijagnozu. Promjena težine ne briše ni udvostručuje XP.
- Nema odbrojavanja ni kazne za pogrešku. Završni izazov odgađa točnost i objašnjenja do predaje; nakon toga nudi ponavljanje tema.
- Izvještaj razlikuje prve i posljednje odgovore, pokušaje, težinu i pomoć. XP je pokazatelj napretka uz dostupno vođenje, a ne samostalno dokazana kompetencija ni školska ocjena.
- Ime i prezime ostaju obvezni. Lokalni zapisi i uvoz odvojeni su po imenu; ova identifikacija ne predstavlja autentikaciju.

## Predložena nastavna uporaba

1. Za prvi susret odabrati Easy i jednu misiju. Učenik najprije svojim riječima imenuje sudionike i njihov posao.
2. U riješenom primjeru zastati na promijenjenom polju: što je bilo prije, što je sada i koja je radnja to uzrokovala?
3. U pokusu najprije predvidjeti ishod, zatim promatrati. Pogrešno predviđanje iskoristiti kao povod za usporedbu uvjeta, bez kazne.
4. Samostalno povezati ishod s razlogom. Ako je korištena pomoć, kasnije tražiti objašnjenje na drugom primjeru.
5. Nakon temelja odabrati odgovarajući laboratorij ili jednu terminalsku putanju. Nije potrebno usporedno učiti tri sintakse.
6. Za ponavljanje u sljedećem susretu otvoriti drugi uvjet ili novu primjenu. Igra nema automatsko vremenski raspoređeno ponavljanje; nastavnik ga planira prema uočenim teškoćama.

## Provjere i granice zaključka

Programski testovi provjeravaju sve terminalske primjere, izvođenje ciljeva, težine, bodovanje, povratak nakon spremanja, vlasništvo kopija, migracije i offline ponašanje. Posebno se provjerava da razdvajanje konteksta ne gubi zadane vrijednosti i da prvi trag ne zamjenjuje potpuno rješenje. Banke pitanja i kanonski odgovori ostaju kompatibilni s prethodnim izdanjem.

U pregledniku su provjereni pogrešan odgovor i ispravak, cijela prva Easy misija do 100 XP, promjena težine bez gubitka bodova, samo jedan aktivan zadatak, ponovni ulaz pod istim imenom, scenarij dretvi, PowerShell primjer bez bodova i samostalna naredba s 20 XP. Provjereni su prikazi širine 320, 375 i 414 piksela.

To potvrđuje funkcionalnost i vidljivost dorade, ali ne dokazuje obrazovnu učinkovitost u razredu. Nije provedeno istraživanje s učenicima ni provjera na fizičkom iPhoneu/Androidu. Za nastavnu evaluaciju treba pratiti može li učenik objasniti uzrok bez otvorene pomoći, prenijeti pravilo na novi slučaj i ponoviti ga nakon vremenskog odmaka. Sam broj XP-a za to nije dovoljan.

## Stručna uporišta

- Institute of Education Sciences, *Organizing Instruction and Study to Improve Student Learning*: povezivanje riješenih primjera i samostalnog rada, konkretnih i apstraktnih prikaza, provjere razumijevanja i pitanja koja traže objašnjenje: https://ies.ed.gov/ncee/wwc/PracticeGuide/1
- MDN, životni ciklus service workera: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
- MDN, izričita aktivacija workera: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerGlobalScope/skipWaiting
- web.dev, ažuriranje PWA-a i usklađenost otvorene stranice s novim workerom: https://web.dev/learn/pwa/update

Navedena načela služe projektiranju aktivnosti. Nisu dokaz da je baš ova igra empirijski vrednovana.
