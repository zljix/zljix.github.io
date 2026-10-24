# Orbit OS 0.10.0

Aplikacija na hrvatskom za samostalno učenje strukture, funkcija i mehanizama operacijskih sustava. Radi u pregledniku, bez računa i aplikacijskog poslužitelja. Objavljena na https://zljix.github.io/.

## Vođeno učenje i igrifikacija

**Uči od početka** vodi kroz osam misija: dijelovi računala, uloga OS-a, procesi, CPU, memorija, čitanje datoteke, dretve i zastoj. Svaka povezuje ranije znanje, cilj, jednostavne definicije, čestu zabludu, riješeni primjer, promjenu uvjeta pokusa i primjenu na novi slučaj.

Svaka misija donosi **100 XP**: kratka provjera 10, redoslijed 20, usporedba uvjeta 20, dvije provjere po 10 i samostalna primjena 30. Za usporedbu treba proći sve uvjete (dva ili tri). Predviđanja se ne kažnjavaju. Zadnji zadatak traži i ishod i razlog.

| Aktivnost | Najviše XP |
| --- | ---: |
| Osam misija | 800 |
| Jedanaest praktičnih laboratorija | 220 |
| Četrnaest uvjeta detaljnih mehanizama | 140 |
| Sedam mrežnih izazova | 140 |
| Završni izazov — najbolji rezultat | 100 |
| **Ukupno** | **1400** |

Pet razina i sedam znački prate postignuća. Pogreška otvara objašnjenje, pomoć i ponavljanje. Svaki zadatak boduje se jednom; ponavljanje ne gomila XP. Posebno se čuvaju prvi odgovor, zadnji odgovor, broj pokušaja i pomoć. Mrežne dijagnoze nisu uključene u statistiku prvih odgovora.

Nakon osam dovršenih misija otključava se završni izazov: deset pitanja, bez pomoći i povratne informacije o točnosti do predaje. Nakon predaje slijede rezultat, objašnjenja i plan ponavljanja. Dvije inačice svakog pitanja izmjenjuju se među pokušajima. Čuva se najviše 20 pokušaja, uključujući najbolji i najnoviji. Nema vremenskog ograničenja.

Sve radnje i strukturirani odgovori boduju se automatski, bez nastavničke intervencije. Stare slobodne bilješke ostaju arhivirane; ne pretvaraju se automatski u dokaz znanja. XP je napredak u učenju uz dostupnu pomoć, a ne školska ocjena niti zaštićen ispitni zapis.

## Spremanje i offline rad

- Napredak, bodovi, pokušaji i datoteke spremaju se lokalno. **Moj rad** omogućuje JSON kopiju za prijenos na drugi uređaj.
- Nadogradnja čuva stare datoteke, pokuse, osvrte i nedovršene nacrte. Novi zadatci imaju zaseban zapis bodovanja.
- Za prvo otvaranje na mobitelu potreban je internet. Nakon oznake **Offline spreman** aplikacija može raditi bez veze. Upute za početni zaslon nalaze se u aplikaciji.
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

Izgradnja stvara `dist/Orbit-OS.html` i šest datoteka u `dist/mobitel/`. GitHub Pages koristi `main`, mapu `/`; mobilne datoteke objavljuju se u korijenu, a desktop HTML u `downloads/`. Ne objavljuju se QA datoteke, učenički radovi ni `node_modules`.

Verzija 0.10.0 ima 81 automatizirani test. Provjereni su početnička misija do 100 XP, ispravci, nastavak nakon osvježavanja, oba završna pokušaja, praktični zaključak, detaljni mehanizam, mrežna dijagnostika i širine 320, 375 i 414 px u Chromiumu. Test na fizičkim iPhone/Android uređajima ni evaluacija s razredom nisu provedeni.
