# zljixOS 0.14.0 — razvoj

Samostalni desktop HTML i mobilni PWA nastaju iz `public/orbit/` pomoću `scripts/build.mjs` i esbuilda 0.28.0. Nema aplikacijskog poslužitelja niti udaljenog bodovanja.

## Moduli i kompatibilnost

- `course-data.js`: osam lekcija, primjeri i 18 uvjeta pokusa.
- `course-model.js`: zadržan format navigacije i povijesnih odgovora verzije 0.9. Stari kriterij `finished` ostaje samo radi čitanja prethodnog zapisa; novo dovršavanje izvodi se iz bodovanih zadataka.
- `game-data.js`: 103 objektivna zadatka (48 osnovnih misija, 16 dodatnih slučajeva, 11 laboratorija, 28 mehanizama); osnovna banka završnog izazova za Moderate. Pravilne opcije imaju stabilne kanonske indekse.
- `difficulty-data.js`: tri putanje (100/120/140 XP), 16 primjena i dijagnoza, Easy i Hard završne banke. Ukupno 60 završnih pitanja s kanonskim indeksima.
- `game-model.js`: validacija, preduvjeti, evidencija aktivnosti, prvi/zadnji odgovor, pomoć, XP, rangovi, značke, završni pokušaji i izvještaj.
- `game-ui.js`: zajednički obrasci izbora, redoslijeda i para ishod–razlog. Opcije se deterministički miješaju samo u prikazu.
- `game.css`, `course.js`: mapa misija, četiri faze učenja, povratna informacija, ponavljanje, završni izazov i prilagodba mobitelu.
- `network-model.js`: objektivna dijagnoza uz provjerene pokuse; stari tekst ostaje arhiviran i pri ponovnom rješavanju.
- `teaching.js`, `explorer.js`: postojeći laboratoriji i mehanizmi koriste isto automatsko bodovanje.

`learning.game` je aditivno proširenje radnog prostora. Odsutno polje inicijalizira prazne rezultate i čuva kopiju ranijih nacrta mehanizama u `legacy`. Datoteke, stare lekcije, bilješke, mrežni zapisi i spremljene verzije zadržavaju se. U 0.11 dodani su `difficulty`, `firstMode`, `lastMode` i težina svakog završnog pokušaja. Postojeći zapisi bez težine pokazuju Easy putanju radi očuvanja dovršenih misija; stari odgovori i završni ključevi ostaju Moderate, prema izvornom bodovanju. U 0.13 `state.student` čuva obvezno ime i prezime stvarnog učenika, odvojeno od simuliranih korisnika. `identity.js` normalizira i validira imena te provjerava vlasništvo. Pohrana koristi `zljixos.workspace.v1:` s ključem izvedenim iz oba dijela imena. Ključevi 0.11/0.12 ostaju netaknuti i ne migriraju se automatski jer nemaju provjerljivog vlasnika. Nova kopija ima format `zljixos-backup`, verziju 2, vlasnika u zaglavlju i u radnom prostoru. Model može čitati stare formate za analizu, ali svi korisnički uvozi zahtijevaju podudarno ime. Provjera postoji u lokalnoj pohrani, pregledu uvoza, zamjeni prostora i djelomičnom oporavku.

`FileSystem.transact()` validira stanje, dopunjuje dokaze aktivnosti, sprema i vraća prethodno stanje ako operacija ne uspije. Milestones su monotoni; nova inačica pokusa ne briše ranije potvrđenu aktivnost. XP i značke računaju se iz provjerenih oblika odgovora i evidencija; uvezeni proizvoljni zbroj XP-a se ignorira. To nije zaštita od izmjene klijentskog koda ili smisleno krivotvorenog lokalnog zapisa.

Završna provjera sprema kanonske odgovore i broj pokušaja. Nepotpun pokušaj nema rezultat. Ukupni XP uzima najbolji rezultat, a povijest je ograničena na 20, uz očuvanje najboljeg za svaku težinu i najnovijeg. Prikaz aktivnog pokušaja ne otkriva ključ ni točnost. Promjena težine ne mijenja njegovu banku. U ukupne bodove ulazi najbolji rezultat preko svih težina, uz zaseban prikaz najboljeg po težini.

## Provjere

```sh
npm install
npm test
npm run build
npm run check:artifact
```

126 testova pokriva postojeće modele, postupke oporavka, migraciju, ograničenja bodovanja, sve kategorije do 3520 XP, neponavljanje bodova, sve uvjete usporedbe, pogrešne i nepotpune odgovore, čuvanje pomoći i prvog odgovora, završne pokušaje, ograničenje povijesti, uvoz/izvoz i očuvanje ranijih mrežnih bilježaka. Provjera artefakta traži jednu valjanu ugrađenu skriptu, ugrađene stilove, desktop bez mrežnih API poziva, valjan manifest i offline worker.

Ranija UI provjera u Chromiumu: misija do 100 XP s pogreškom i ispravkom; nastavak nakon osvježavanja; završni rezultati 40/100 i 100/100 s obnovom aktivnog pokušaja; laboratorijski zaključak; svih sedam koraka jednog detaljnog mehanizma; mrežni DNS izazov prije/poslije popravka; širine 320, 375 i 414 px. Provjera 0.11: prva misija 100 → 120 → 140 XP, pogrešna Hard dijagnoza, pomoć i ispravak; promjena težine bez gubitka XP-a i ponovno otvaranje; trajna traka i prikaz 320/375/414 px. Fizički iPhone/Android i rad s razredom nisu testirani.

## Objava

Korijen GitHub repozitorija sadrži mobilne ulaze `index.html` i `igra.html`, manifest, worker i tri ikone. Desktop HTML je u `downloads/`, izvor u `source/`. Ne objavljuj učeničke JSON kopije, testne radne prostore, QA HTML ni `node_modules`.

Worker provjerava sedam predmemoriranih resursa: oba mobilna HTML ulaza, manifest, tri ikone i `downloads/zljixOS.html`. Spremnost ikone zahtijeva potvrđene `ready` i `downloadReady` te uspješno pripremljen neprazan HTML Blob. Eksplicitni `fetch` prolazi kroz worker i preuzima datoteku u memoriju prije zelene ikone; klik sprema Blob bez novog mrežnog zahtjeva. To pokriva preglednike čije nativno preuzimanje ne prolazi kroz worker; ikona je inače onemogućena. Stari worker ne može pogrešno potvrditi novi paket. Gumb otvara dijalog s HTML preuzimanjem, instalacijom kad preglednik nudi događaj i uputama za mobilne preglednike. Desktop preuzimanje radi i iz offline predmemorije. Worker dobiva oznaku iz verzije i hashiranog sadržaja oba HTML-a, manifesta, workera i ikona. Nova predmemorija instalira se cjelovito, bez brisanja stare pri pogrešci. Navigacija prvo traži aktualni HTML na mreži, uz vremensko ograničenje i povrat na cjelovitu instaliranu kopiju pri pogrešci. Ne aktivira se prisilno tijekom instalacije. `skipWaiting` se poziva samo na izričit zahtjev gumba za novo izdanje, nakon provjere nespremljenog rada. Samo kartica koja je zatražila nadogradnju osvježava se na `controllerchange`; druge nastavljaju rad. HTML i samostalni preuzeti paket potpuno su uključeni, bez dijeljenih JavaScript modula koji bi miješali verzije. Preuzimanje zahtijeva da worker odgovara otvorenoj verziji. Ulaz `igra.html` omogućuje prvi dolazak do novog sučelja i kroz stariji worker koji predmemorira `index.html`. Učenički podatci u localStorage odvojeni su od predmemorije aplikacije.

## Akademija terminala (0.13)

- `shell-engine.js`: ograničeni interpreter CMD/Linux, putanje, tekstualni datotečni sustav, cjevovodi i izlaz; bez `eval`, pokretanja procesa ili mrežnih poziva.
- `shell-data.js`: 18 razina, pojmovi, primjeri, 90 provjerljivih ciljeva i jedna moguća rješenja za pomoć.
- `shell-model.js`: zapis naredbi, težine, pomoći i ponavljanja. Radni prostor, tijek, osvojeni zadatci i XP rekonstruiraju se izvršavanjem tog zapisa. Uvezeni XP i oznake dovršenosti ignoriraju se. To nije zaštita od namjernog krivotvorenja valjanog zapisa ili izmjene klijentskog koda.
- `shell-ui.js`, `shell.css`: tri putanje, uvod prije terminala, mobilne tipke za posebne znakove i vidljiv cilj. Novi zapis `learning.shell` je aditivan; stari radni prostori dobivaju prazne terminalske rezultate.
- `test/shell.test.js`: 12 smislenih testova interpretera, svih ciljeva, težina, pomoći, migracije, alternativnih rješenja, ograničenja i ukupnog bodovanja.

Tri/četiri/pet zadataka znače 60/80/100 XP. Osvojeni zadatak ostaje označen pri ponavljanju; trenutni prolaz ponovno kreće od prvog. Terminalska kategorija dodaje 1800 XP, pa ukupni maksimum igre postaje 3520 XP. Nove značke zahtijevaju svih 600 XP odgovarajućeg dijalekta. Svaka razina sprema najviše 400 radnji; nastavni disk ima najviše 80 stavki, datoteka 8000 znakova, naredba 400 znakova. Koristi se ograničen predmemorirani rezultat rekonstrukcije za svaku razinu.

Svjesna pojednostavnjenja: nema zamjenskih znakova, varijabli, ekspanzija, skripti, simboličkih poveznica, pokretanja programa ili mreže. Linux provjerava vlasnikovo čitanje/pisanje obične datoteke; ne modelira potpunu hijerarhiju prava direktorija i ACL. Nepodržana ili neuspjela naredba atomarno vraća stanje; stvarni shell može imati djelomične učinke. Na to se učenika upozorava u samoj vježbi. CMD `find` pri izravnom čitanju daje zaglavlje; u zadatcima za čisti izvještaj koristi se `type | find`.

Provjereni primarni izvori za ponašanje naredbi:
- https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/cmd
- https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/dir
- https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/find
- https://www.gnu.org/software/bash/manual/html_node/Pipelines.html
- https://www.gnu.org/software/bash/manual/html_node/Redirections.html
- https://www.gnu.org/software/coreutils/manual/html_node/chmod-invocation.html

Provjera sučelja 0.12: Chromium 134, desktop 1365×950 i mobilni prikazi 320/375/414×850. Provjereni su pogrešan unos, sve težine prve CMD razine, povrat nakon osvježavanja, Linux 400 → odbijen zapis → 600 → uspješan zapis, pomoć na Hard i odsutnost vodoravnog prelijevanja. Provjerena je instalacija workera pod projektom `/zljixos.github.io/`, ponovno otvaranje bez mreže, preuzimanje pripremljenog Bloba i pokretanje samostalnog HTML-a. Nema JavaScript runtime pogrešaka. Fizički uređaji i Safari nisu testirani.

## PowerShell i identitet u izdanju 0.13

`powershell-engine.js` dodaje Windows putanje, cmdlete i imenovane parametre bez izvršavanja sistemskog koda. Cjevovod čuva objekte do projekcije/izdvajanja svojstva; prikaz tablice služi samo prikazu. `powershell-data.js` sadrži šest razina i 30 ciljeva. Nepodržana pretvorba objekta u tekst jasno se odbija umjesto podučavanja pogrešnog sadržaja. Podržani su Select-String s doslovnim pretraživanjem i odabirom osjetljivosti na velika slova, Select-Object, jednostavni Where-Object, Sort-Object i Measure-Object.

`identity.css` dodaje početni unos i stalnu traku s imenom; visina trake prilagođava položaj prozora i na mobitelu. Početni unos nije unaprijed popunjen posljednjim učenikom. Promjena učenika ponovno učitava aplikaciju, bez prijenosa prethodnih prozora, rezultata ili nacrta. Autentikacija nije uvedena: korisnici jednakog normaliziranog imena dijele lokalni ključ, a klijentski kod i JSON nisu kriptografski zaštićeni.

Provjereni Microsoftovi izvori za PowerShell:
- https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/set-content
- https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.management/add-content
- https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.utility/select-string
- https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/where-object

Objava 0.13 vraća se u `zljix/zljix.github.io`, na adresu https://zljix.github.io/. Stara izdvojena kopija u repozitoriju zljixos.github.io nije odredište ove nadogradnje.

Provjera sučelja 0.13 u Chromiumu 134: svih 30 PowerShell zadataka preko stvarnog polja za unos i porast do 600 XP; pogrešna naredba i pomoć na Hard; obvezan unos imena prije otvaranja prozora; odvojeni učenici nakon promjene i osvježavanja; vidljiv vlasnik u JSON/HTML/TXT/ispisu; promjena oznake rada ne mijenja vlasnika; odbijanje tuđeg JSON-a iz datoteke, lijepljenjem i preko Oporavka; odbijanje anonimne kopije; uspješno vraćanje vlastite kopije; ponovno otvaranje bez mreže i preuzimanje samostalnog HTML-a. Na širinama 320/375/414 px ime i bodovi ostaju vidljivi i nema vodoravnog prelijevanja. Samostalni HTML pokreće unos identiteta i PowerShell bez poslužitelja. Nema zabilježenih JavaScript pogrešaka. Fizički iPhone/Android i Safari nisu testirani.

## Kontekst oznaka u izdanju 0.13.1

Pitanja izričito određuju procese P1/P2/P3, dretve T1/T2 istog procesa, resurse R1/R2 i zajednički brojač x s potrebnom početnom vrijednošću. Verzije, mape i memorijski okviri A/B objašnjeni su u konkretnom slučaju. Dopunjeni su uvodi, pokusi i sve težine završnog izazova. CPU laboratorij objašnjava oznake procesa, t i I/O; memorijski laboratorij prikazuje „Stranica 0” umjesto dvosmislenog „P0”.

Provjera kompatibilnosti svih 103 zadatka i 60 pitanja završnih izazova potvrđuje da su promijenjeni samo tekstovi pitanja: svi identifikatori, ponuđeni odgovori, indeksi točnih odgovora, uvjeti i bodovi ostaju identični. Jasniji kontekst dobilo je 89 generiranih pitanja. Svih 120 postojećih testova prolazi, kao i provjere samostalnog HTML-a i mobilnog paketa.

Vizualno provjereni pitanja o dretvama i resursima, Hard zadatci, legenda CPU-a i nazivi memorijskih stranica u cloud Chromiumu. Odgovor na dopunjeno pitanje daje 10 XP, a ponovno otvaranje s istim imenom čuva taj rezultat. U prikazima širokim 320/375/414 px (iframe s odgovarajućom širinom prikaza) pitanja se prelamaju bez vodoravnog prelijevanja. To nije provjera na fizičkom mobitelu.

## Metodička dorada 0.14.0

`learning-guide.js` odvaja scenarij i uloge od kratkog zahtjeva zadatka te daje prvi trag za ponovno razmišljanje. `learning.css` oblikuje scenarije, usporedbu stanja, slijed događaja i jedan aktivan zadatak. `course.js` čuva povratnu informaciju do gumba za sljedeći zadatak, prikazuje samo opažene ishode i povezuje preduvjete s pripremnim korakom. Ne mijenja banke ni format spremljenih odgovora.

`shell-demo.js` reproducira primjere u zasebnom virtualnom prostoru; primjeri ne nose XP i ne mijenjaju učenički terminal. `teaching.js` povezuje laboratorije s potrebnim predznanjem. `release.js`, `pwa.js` i worker čine verziju i dostupnu nadogradnju vidljivima. Detalji, granice i plan nastavne primjene: [METODICKA_ANALIZA.md](METODICKA_ANALIZA.md).

## Popravci nakon recenzije 0.15.0

Linux razina 5 provjerava ciljnu datoteku kanonskom putanjom, neovisno o trenutačnoj mapi. Terminal odvojeno bilježi automatsko vođenje, traženu natuknicu i otvoren cjelovit postupak. Učeniku je objašnjeno da svaka razina ima zasebne datoteke. PowerShell uvod pokazuje svojstva jednog objekta prije izdvajanja teksta.

CPU i memorijski laboratoriji spremaju konfiguracije izvedenih pokusa, a pri provjeri ponovno računaju rezultate. CPU traži zadani FCFS i RR s kvantima 2, 1 i 6 te usporedbu. I/O laboratorij traži opaženo blokiranje i dva dovršena rasporeda. Memorijski laboratorij traži isti slijed s tri okvira, FIFO/LRU, usporedbu i provjeren prijevod adrese. Opće zastavice dovršetka više nisu dovoljne.

Završni izazov koristi odvojene problemske slučajeve s četiri odgovora i promjenjivim uvjetima; izvještaj odvaja prvi, posljednji i najbolji rezultat po težini. Rangovi traže i dovršene temeljne misije, a najviši rang i najmanje 80/100 na novoj završnoj provjeri. XP iz terminala sam ne daje rang poznavanja OS-a.

Učenik u dodatnom pokusu s dretvama bira svaku sljedeću radnju. Prikaz odvaja zajedničku memoriju od lokalnih vrijednosti dretvi te uspoređuje rad bez lokota, lokot samo za zapis i lokot za cijelo povećanje. Pokus ne daje dodatne XP. Početni pregled ističe jedan gumb za nastavak. Dio distraktora zamijenjen je odgovorima koji odražavaju stvarne početničke zabune.

Provjera: 136 automatiziranih testova; uključeni su apsolutne putanje, evidencija pomoći, uvjeti laboratorija, banke završnih pitanja i iscrpna provjera svih dopuštenih slijedova šest radnji dviju dretvi. U cloud Chromiumu provjereni su gubitak povećanja i ispravno zaključavanje, pomoć iz stvarnog Easy sučelja u izvještaju, dodjela CPU bodova tek nakon svih kvanta, odbijanje pogrešnog i prihvaćanje ispravnog prijevoda memorijske adrese. Dva probna završna pokušaja daju 100 pa 80 bodova: prvi 100, posljednji 80, najbolji 100; ukupni XP se ne udvostručuju. Za pristup završnom sučelju uvezena je jasno označena sintetska JSON kopija.

Novi prikaz dretvi i stalna traka provjereni su u iframe prikazima širine 320, 375 i 414 px, bez vodoravnog prelijevanja dokumenta. Fizički mobilni uređaji i Safari nisu testirani. Samostalni HTML i mobilni paket prolaze provjere ugrađenih skripti, resursa i offline workera.
