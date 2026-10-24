# Orbit OS 0.9.0 — razvoj

Moduli su u `public/orbit/`, a deterministički testovi u `test/`. Izgradnja (`npm run build`, esbuild 0.28.0) stvara samostalni `dist/Orbit-OS.html` i šest datoteka u `dist/mobitel/`. Računalno izdanje ne treba poslužitelj. Mobilno izdanje koristi statični HTTPS hosting i scoped service worker za offline pokretanje.

## Vođeno učenje

- `course-data.js`: osam lekcija s objašnjenjima, riješenim primjerima, 18 uvjeta pokusa i povratnim informacijama na svaku opciju samoprovjere.
- `course-model.js`: validacija, promjene napretka, kriterij dovršavanja te HTML/TXT zapis za nastavnika.
- `course.js` i `course.css`: početni prikaz Uči od početka, prilagođen uskom zaslonu. CSS se učitava nakon općeg mobilnog stila.
- `models.js`: dodaje `learning.course`; stari rad bez tog polja dobiva prazan tečaj, a prethodna polja ostaju sačuvana.
- `app.js`: otvara vođene lekcije pri pokretanju i povezuje ih s postojećim simulatorom.

Ključ lokalne pohrane ostaje `orbit-os.offline.workspace.v1`. JSON kopije sadrže i novi napredak. `FileSystem.transact()` validira cijeli prostor i vraća prethodno stanje ako promjena ne uspije. Prvi i zadnji odgovori samoprovjere čuvaju se odvojeno; slobodan tekst uvijek se escapira. Dovršenost nije dokaz samostalnosti niti ocjena slobodnog odgovora.

## Izgradnja i provjera

```sh
npm install
npm test
npm run build
npm run check:artifact
```

69 testova pokriva ranije funkcionalnosti i novi tijek učenja, migraciju, zaključavanje predviđanja, promjenu uvjeta, validaciju uvoza, lokalni nastavak i JSON round-trip. Provjere gotovih artefakata obuhvaćaju jednu valjanu inline skriptu, ugrađene stilove, odsutnost mrežnih API poziva iz desktop izdanja, manifest, ikone i offline worker.

UI provjera u Chromiumu uključuje početnu lekciju od primjera do izvještaja, pogrešne i ispravljene odgovore, nastavak nakon osvježavanja te prikaze 320, 375 i 414 px. Test na fizičkim iOS/Android uređajima i razredu učenika nije proveden. Desktop `file:` pokretanje ovisi i o pravilima korisnikova preglednika; JSON izvoz ostaje način prijenosa odgovora.

## Objava

Korijen GitHub repozitorija sadrži mobilno izdanje. Kopiraj svih šest izgrađenih mobilnih datoteka u korijen, a desktop HTML u `downloads/`. Izvorna mapa u repozitoriju zove se `source/`. Ne objavljuj `node_modules`, učeničke JSON kopije ni QA datoteke.

Worker ime predmemorije izvodi iz verzije i sadržaja HTML-a, manifesta, ikona i predloška workera. Instalacija nove predmemorije je cjelovita; neuspješan pokušaj ne briše staru. Ažuriranje ne poziva `skipWaiting`, nego čeka zatvaranje prozora prethodne verzije. Podatci učenika nalaze se u localStorage, odvojeno od predmemorije programa.
