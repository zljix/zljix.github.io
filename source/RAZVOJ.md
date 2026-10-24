# Orbit OS 0.10.0 — razvoj

Samostalni desktop HTML i mobilni PWA nastaju iz `public/orbit/` pomoću `scripts/build.mjs` i esbuilda 0.28.0. Nema aplikacijskog poslužitelja niti udaljenog bodovanja.

## Moduli i kompatibilnost

- `course-data.js`: osam lekcija, primjeri i 18 uvjeta pokusa.
- `course-model.js`: zadržan format navigacije i povijesnih odgovora verzije 0.9. Stari kriterij `finished` ostaje samo radi čitanja prethodnog zapisa; novo dovršavanje izvodi se iz bodovanih zadataka.
- `game-data.js`: 87 objektivnih zadataka (48 za misije, 11 za laboratorije, 28 za mehanizme) i 20 pitanja banke završnog izazova. Pravilne opcije imaju stabilne kanonske indekse.
- `game-model.js`: validacija, preduvjeti, evidencija aktivnosti, prvi/zadnji odgovor, pomoć, XP, razine, značke, završni pokušaji i izvještaj.
- `game-ui.js`: zajednički obrasci izbora, redoslijeda i para ishod–razlog. Opcije se deterministički miješaju samo u prikazu.
- `game.css`, `course.js`: mapa misija, četiri faze učenja, povratna informacija, ponavljanje, završni izazov i prilagodba mobitelu.
- `network-model.js`: objektivna dijagnoza uz provjerene pokuse; stari tekst ostaje arhiviran i pri ponovnom rješavanju.
- `teaching.js`, `explorer.js`: postojeći laboratoriji i mehanizmi koriste isto automatsko bodovanje.

`learning.game` je aditivno proširenje radnog prostora. Odsutno polje inicijalizira prazne rezultate i čuva kopiju ranijih nacrta mehanizama u `legacy`. Datoteke, stare lekcije, bilješke, mrežni zapisi i spremljene verzije zadržavaju se. Lokalni ključ ostaje `orbit-os.offline.workspace.v1`.

`FileSystem.transact()` validira stanje, dopunjuje dokaze aktivnosti, sprema i vraća prethodno stanje ako operacija ne uspije. Milestones su monotoni; nova inačica pokusa ne briše ranije potvrđenu aktivnost. XP i značke računaju se iz provjerenih oblika odgovora i evidencija; uvezeni proizvoljni zbroj XP-a se ignorira. To nije zaštita od izmjene klijentskog koda ili smisleno krivotvorenog lokalnog zapisa.

Završna provjera sprema kanonske odgovore i broj pokušaja. Nepotpun pokušaj nema rezultat. Ukupni XP uzima najbolji rezultat, a povijest je ograničena na 20, uz očuvanje najboljeg i najnovijeg. Prikaz aktivnog pokušaja ne otkriva ključ ni točnost.

## Provjere

```sh
npm install
npm test
npm run build
npm run check:artifact
```

81 test pokriva postojeće modele, postupke oporavka, migraciju, ograničenja bodovanja, sve kategorije do 1400 XP, neponavljanje bodova, sve uvjete usporedbe, pogrešne i nepotpune odgovore, čuvanje pomoći i prvog odgovora, završne pokušaje, ograničenje povijesti, uvoz/izvoz i očuvanje ranijih mrežnih bilježaka. Provjera artefakta traži jednu valjanu ugrađenu skriptu, ugrađene stilove, desktop bez mrežnih API poziva, valjan manifest i offline worker.

UI provjera u Chromiumu: misija do 100 XP s pogreškom i ispravkom; nastavak nakon osvježavanja; završni rezultati 40/100 i 100/100 s obnovom aktivnog pokušaja; laboratorijski zaključak; svih sedam koraka jednog detaljnog mehanizma; mrežni DNS izazov prije/poslije popravka; širine 320, 375 i 414 px. Fizički iPhone/Android i rad s razredom nisu testirani.

## Objava

Korijen GitHub repozitorija sadrži šest mobilnih datoteka. Desktop HTML je u `downloads/`, izvor u `source/`. Ne objavljuj učeničke JSON kopije, testne radne prostore, QA HTML ni `node_modules`.

Worker dobiva oznaku iz verzije i hashiranog sadržaja izdanja. Nova predmemorija instalira se cjelovito, bez brisanja stare pri pogrešci. Ne koristi `skipWaiting`; nadogradnja čeka zatvaranje prethodnih prozora aplikacije. Učenički podatci u localStorage odvojeni su od predmemorije aplikacije.
