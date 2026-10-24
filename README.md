# Orbit OS 0.11.1

Aplikacija na hrvatskom za samostalno učenje strukture, funkcija i mehanizama operacijskih sustava. Radi u pregledniku, bez računa i aplikacijskog poslužitelja. Objavljena na https://zljix.github.io/.

## Vođeno učenje i igrifikacija

**Uči od početka** vodi kroz osam misija: dijelovi računala, uloga OS-a, procesi, CPU, memorija, čitanje datoteke, dretve i zastoj. Svaka povezuje ranije znanje, cilj, jednostavne definicije, čestu zabludu, riješeni primjer, promjenu uvjeta pokusa i primjenu na novi slučaj.

Osnova svake misije donosi **100 XP**: kratka provjera 10, redoslijed 20, usporedba uvjeta 20, dvije provjere po 10 i samostalna primjena 30. Za usporedbu treba proći sve uvjete (dva ili tri). Predviđanja se ne kažnjavaju. Zadnji zadatak traži i ishod i razlog.

**Easy** (100 XP po misiji) vodi početnika kroz dva izbora i početak redoslijeda. **Moderate** (120 XP) dodaje primjenu u novoj situaciji. **Hard** (140 XP) dodaje dijagnozu s tri povezane odluke i pomoć nakon prvog pokušaja. Težinu možeš promijeniti bez gubitka ili udvostručavanja bodova.

| Aktivnost | Najviše XP |
| --- | ---: |
| Osam misija s dodatnim primjenama i dijagnozama | 1120 |
| Jedanaest praktičnih laboratorija | 220 |
| Četrnaest uvjeta detaljnih mehanizama | 140 |
| Sedam mrežnih izazova | 140 |
| Završni izazov — najbolji rezultat | 100 |
| **Ukupno** | **1720** |

Pet rangova i sedam znački prate postignuća. Pogreška otvara objašnjenje, pomoć i ponavljanje. Svaki zadatak boduje se jednom; ponavljanje ne gomila XP. Posebno se čuvaju prvi odgovor, zadnji odgovor, njihove težine, broj pokušaja i pomoć. Easy sadrži ugrađeno vođenje. Bodovi su uvijek vidljivi u gornjoj traci, u svim aplikacijama. Mrežne dijagnoze nisu uključene u statistiku prvih odgovora.

Nakon osam misija dovršenih na odabranoj težini otključava se završni izazov: deset pitanja, bez pomoći i povratne informacije o točnosti do predaje. Nakon predaje slijede rezultat, objašnjenja i plan ponavljanja. Svaka težina ima vlastitu banku i dvije inačice pitanja po temi. Već započeti pokušaj zadržava izvornu težinu. Najbolji rezultati prikazuju se po težinama, a u ukupni XP ulazi jedan najbolji rezultat. Čuva se najviše 20 pokušaja, uključujući najbolji za svaku težinu i najnoviji. Nema vremenskog ograničenja.

Sve radnje i strukturirani odgovori boduju se automatski, bez nastavničke intervencije. Stare slobodne bilješke ostaju arhivirane; ne pretvaraju se automatski u dokaz znanja. XP je napredak u učenju uz dostupnu pomoć, a ne školska ocjena niti zaštićen ispitni zapis.

## Spremanje i offline rad

- Napredak, bodovi, pokušaji i datoteke spremaju se lokalno. **Moj rad** omogućuje JSON kopiju za prijenos na drugi uređaj.
- Nadogradnja čuva stare datoteke, pokuse, osvrte i nedovršene nacrte. Novi zadatci imaju zaseban zapis bodovanja.
- Za prvo otvaranje na mobitelu potreban je internet. Ikona preuzimanja je siva i onemogućena dok cijeli paket nije spreman. Zatim postaje zelena i otvara **Spremi za offline rad**: preuzimanje samostalnog HTML-a, dodavanje na uređaj kad je podržano i upute za početni zaslon. HTML datoteka također je predmemorirana pa se može preuzeti bez veze.
- Poslije nadogradnje zatvori sve kartice/prozore Orbita i ponovno otvori aplikaciju; nova offline verzija ne zamjenjuje aktivnu lekciju usred rada.
- Za računalo preuzmi [Orbit-OS.html](downloads/Orbit-OS.html) i otvori ga preglednikom bez lokalnog poslužitelja. Rad prenosi zasebnom JSON kopijom.
- **Izvještaj** prikazuje automatske bodove, odgovore, pokušaje i potvrđene radnje. Može se kopirati, ispisati ili izvesti; nikome se ne šalje automatski.

## Razvoj i objava

Izvorni kod, testovi i skripte su u `source/`. Uz Node.js i npm:

```sh
npm install
npm test
npm run build
npm run check:artifact
```

Izgradnja stvara `dist/Orbit-OS.html` i mobilni paket u `dist/mobitel/`, uključujući `downloads/Orbit-OS.html`. GitHub Pages koristi `main`, mapu `/`; mobilne datoteke objavljuju se u korijenu, a desktop HTML u `downloads/`. Ne objavljuju se QA datoteke, učenički radovi ni `node_modules`.

Verzija 0.11.1 ima 90 automatiziranih testova. Provjereni su prijelaz prve misije kroz 100/120/140 XP, pomoć na Hard, trajna traka bodova, očuvanje težine i ranijih rezultata, početnička misija do 100 XP, ispravci, nastavak nakon osvježavanja, oba završna pokušaja, praktični zaključak, detaljni mehanizam, mrežna dijagnostika i širine 320, 375 i 414 px u Chromiumu. Test na fizičkim iPhone/Android uređajima ni evaluacija s razredom nisu provedeni.
