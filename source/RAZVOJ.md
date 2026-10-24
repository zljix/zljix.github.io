# Orbit OS 0.11.1 — razvoj

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

`learning.game` je aditivno proširenje radnog prostora. Odsutno polje inicijalizira prazne rezultate i čuva kopiju ranijih nacrta mehanizama u `legacy`. Datoteke, stare lekcije, bilješke, mrežni zapisi i spremljene verzije zadržavaju se. U 0.11 dodani su `difficulty`, `firstMode`, `lastMode` i težina svakog završnog pokušaja. Postojeći zapisi bez težine pokazuju Easy putanju radi očuvanja dovršenih misija; stari odgovori i završni ključevi ostaju Moderate, prema izvornom bodovanju. Lokalni ključ ostaje `orbit-os.offline.workspace.v1`.

`FileSystem.transact()` validira stanje, dopunjuje dokaze aktivnosti, sprema i vraća prethodno stanje ako operacija ne uspije. Milestones su monotoni; nova inačica pokusa ne briše ranije potvrđenu aktivnost. XP i značke računaju se iz provjerenih oblika odgovora i evidencija; uvezeni proizvoljni zbroj XP-a se ignorira. To nije zaštita od izmjene klijentskog koda ili smisleno krivotvorenog lokalnog zapisa.

Završna provjera sprema kanonske odgovore i broj pokušaja. Nepotpun pokušaj nema rezultat. Ukupni XP uzima najbolji rezultat, a povijest je ograničena na 20, uz očuvanje najboljeg za svaku težinu i najnovijeg. Prikaz aktivnog pokušaja ne otkriva ključ ni točnost. Promjena težine ne mijenja njegovu banku. U ukupne bodove ulazi najbolji rezultat preko svih težina, uz zaseban prikaz najboljeg po težini.

## Provjere

```sh
npm install
npm test
npm run build
npm run check:artifact
```

90 testova pokriva postojeće modele, postupke oporavka, migraciju, ograničenja bodovanja, sve kategorije do 1720 XP, neponavljanje bodova, sve uvjete usporedbe, pogrešne i nepotpune odgovore, čuvanje pomoći i prvog odgovora, završne pokušaje, ograničenje povijesti, uvoz/izvoz i očuvanje ranijih mrežnih bilježaka. Provjera artefakta traži jednu valjanu ugrađenu skriptu, ugrađene stilove, desktop bez mrežnih API poziva, valjan manifest i offline worker.

Ranija UI provjera u Chromiumu: misija do 100 XP s pogreškom i ispravkom; nastavak nakon osvježavanja; završni rezultati 40/100 i 100/100 s obnovom aktivnog pokušaja; laboratorijski zaključak; svih sedam koraka jednog detaljnog mehanizma; mrežni DNS izazov prije/poslije popravka; širine 320, 375 i 414 px. Provjera 0.11: prva misija 100 → 120 → 140 XP, pogrešna Hard dijagnoza, pomoć i ispravak; promjena težine bez gubitka XP-a i ponovno otvaranje; trajna traka i prikaz 320/375/414 px. Fizički iPhone/Android i rad s razredom nisu testirani.

## Objava

Korijen GitHub repozitorija sadrži šest mobilnih datoteka. Desktop HTML je u `downloads/`, izvor u `source/`. Ne objavljuj učeničke JSON kopije, testne radne prostore, QA HTML ni `node_modules`.

Worker provjerava šest predmemoriranih resursa: mobilni HTML, manifest, tri ikone i `downloads/Orbit-OS.html`. Spremnost ikone zahtijeva potvrđene `ready` i `downloadReady` te uspješno pripremljen neprazan HTML Blob. Eksplicitni `fetch` prolazi kroz worker i preuzima datoteku u memoriju prije zelene ikone; klik sprema Blob bez novog mrežnog zahtjeva. To pokriva preglednike čije nativno preuzimanje ne prolazi kroz worker; ikona je inače onemogućena. Stari worker ne može pogrešno potvrditi novi paket. Gumb otvara dijalog s HTML preuzimanjem, instalacijom kad preglednik nudi događaj i uputama za mobilne preglednike. Desktop preuzimanje radi i iz offline predmemorije. Worker dobiva oznaku iz verzije i hashiranog sadržaja oba HTML-a, manifesta, workera i ikona. Nova predmemorija instalira se cjelovito, bez brisanja stare pri pogrešci. Ne koristi `skipWaiting`; nadogradnja čeka zatvaranje prethodnih prozora aplikacije. Učenički podatci u localStorage odvojeni su od predmemorije aplikacije.
