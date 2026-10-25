# zljixOS 0.15.2

Izdanje 0.15.2 prikazuje putanje Akademije terminala redom DOS/CMD → Linux Shell → PowerShell. Početna putanja ostaje DOS/CMD.

U izdanju 0.15.1 provjera verzije stalno je dostupna u gornjoj traci, pokraj preuzimanja. Ikona kružne strelice otvara provjeru, a ističe se kada je novo izdanje spremno.

Izdanje 0.15.0 popravlja provjeru Linux dozvola, zasebno bilježi vođenje, natuknice i otvaranje postupka te povezuje CPU i memorijske laboratorije s konkretnim postavkama, usporedbama i rezultatima. Završni izazov koristi odvojene problemske slučajeve. Rangovi zahtijevaju i dovršene temeljne misije; OS navigator traži novu primjenu od najmanje 80/100. Pokus s dretvama omogućuje učeniku da bira sljedeću radnju i prati zajednički brojač. Detalji: [Metodička analiza](source/METODICKA_ANALIZA.md).

**Za otvaranje novog izdanja nakon stare offline verzije:** https://zljix.github.io/igra.html. Verzija **v0.15.2** vidljiva je već na početnom unosu i u gornjoj traci. Novi ulaz dijeli isti lokalni rad s početnom adresom; ne briši podatke preglednika.

Interaktivna igra na hrvatskom za učenje operacijskih sustava. Objavljuje se na **https://zljix.github.io/** iz repozitorija `zljix/zljix.github.io`. Nastavlja postojeću igru Orbit OS, uključujući DOS/CMD i Linux razine iz izdanja 0.12.

## Ime, prezime i rezultati

Pri svakom otvaranju igre obvezno se unose **ime i prezime**. Dok unos nije dovršen, radni prostor i prethodni rezultati nisu otvoreni. Ime je stalno vidljivo ispod gornje trake s bodovima te u pregledu rada, JSON kopiji, TXT/HTML izvještaju, kopiji za Word i ispisu/PDF-u. Nazivi datoteka rezultata uključuju ime i prezime.

- Svako ime ima zaseban lokalni rad. **Moj rad → Drugi učenik / učenica** vraća na početni unos; prethodni rad ostaje sačuvan.
- Pri učitavanju iz datoteke ili zalijepljenog JSON-a vlasnik kopije mora odgovarati aktivnom imenu. Isto vrijedi u aplikaciji **Oporavak**, za cijeli prostor i odabrane datoteke. Tuđa kopija odbija se prije prikaza njezina sadržaja i bodova.
- Ime vezano uz postojeće bodove nema mogućnost preimenovanja. Neobvezna oznaka rada služi samo napomeni.
- Stare kopije bez imena i prezimena ne mogu se pripisati novom učeniku. Izvorni stari zapisi u pregledniku ostaju netaknuti; ne preuzimaju se automatski.
- Razmaci na rubovima, ponovljeni razmaci i veličina slova u imenu ne stvaraju novi profil. Hrvatska slova, višedijelna imena, crtice i apostrofi su podržani. Različiti dijakritički znakovi razlikuju se.

**Granica zaštite:** ovo je lokalna identifikacija imenom, bez autentikacije. Sprječava miješanje i učitavanje kopija s drugim imenom kroz sučelje. Ne potvrđuje tko je upisao ime, ne razlikuje dvije osobe jednakog imena i ne sprječava namjerno uređivanje JSON-a ili koda. Za provjeru stvarnog identiteta i zaštićeno ocjenjivanje potrebni su računi i poslužiteljska provjera. Imena i rezultati ne šalju se automatski na GitHub ili drugom primatelju.

## Učenje i bodovanje

Osam misija povezuje objašnjenje pojmova, riješen primjer, pokus i automatski provjerenu primjenu. **Easy** daje osnovnih 100 XP po misiji uz vođenje, **Moderate** dodaje primjenu do 120 XP, a **Hard** dijagnostički slučaj do 140 XP. Težina se može promijeniti bez gubitka ili udvostručavanja bodova.

| Aktivnost | Najviše XP |
| --- | ---: |
| Osam misija s primjenama i dijagnozama | 1120 |
| Jedanaest praktičnih laboratorija | 220 |
| Detaljni mehanizmi | 140 |
| Sedam mrežnih izazova | 140 |
| Završni izazov — najbolji rezultat | 100 |
| DOS/CMD — šest razina | 600 |
| Linux Shell — šest razina | 600 |
| PowerShell — šest razina | 600 |
| **Ukupno** | **3520** |

Pet rangova i deset znački prate napredak. Ponavljanje ne gomila bodove. Prati se prva i posljednja težina odgovora, broj pokušaja i zatražena pomoć. Završni izazov od deset pitanja otključava se nakon osam misija na odabranoj težini; rezultat i objašnjenja vide se nakon predaje. Prvi, posljednji i najbolji rezultat novih slučajeva prikazuju se po težini, a u ukupni XP ulazi jedan najbolji rezultat. XP označava napredak uz dostupnu pomoć, a ne školsku ocjenu.

## Akademija terminala

Tri neovisne putanje imaju ukupno **18 razina i 90 praktičnih zadataka**. Svaka razina prvo uvodi pojmove i pokazuje primjere, a zatim učenik upisuje naredbe u virtualni terminal. Cilj se automatski provjerava nakon naredbe. Vrijede i druga ispravna rješenja unutar podržane sintakse.

| Razina | DOS/CMD | Linux Shell | PowerShell |
| --- | --- | --- | --- |
| 1 | `dir`, `cd`, `type`, putanje | `pwd`, `ls`, `cd`, `cat` | `Get-Location`, `Get-ChildItem`, `Set-Location`, `Get-Content` |
| 2 | `mkdir`, `echo`, `>`, `>>` | `mkdir`, `echo`, `>`, `>>` | `New-Item`, `Set-Content`, `Add-Content` |
| 3 | `copy`, `ren`, `move` | `cp`, `mv` | `Copy-Item`, `Rename-Item`, `Move-Item` |
| 4 | `find`, cjevovodi, izvještaj | `grep -F`, cjevovodi, izvještaj | `Select-String`, objekt `MatchInfo`, izdvajanje `Line` |
| 5 | `del`, `rd`, čuvanje podataka | `chmod`, čitanje/pisanje vlasnika | Svojstva, `Where-Object`, `Sort-Object`, `Measure-Object` |
| 6 | Predaja, arhiva i čišćenje | Predaja, arhiva i čišćenje | Predaja, arhiva, `Remove-Item`, `-WhatIf` |

**Easy** obuhvaća tri zadatka (60 XP) uz objašnjenje i postupak koji učenik otvara po potrebi. **Moderate** dodaje primjenu (80 XP) uz pomoć na zahtjev. **Hard** uključuje peti povezani zadatak (100 XP), uz pomoć nakon prvog pokušaja. Sljedeća razina otključava se nakon prva tri zadatka prethodne. Svaki zadatak donosi 20 XP samo jednom.

PowerShell cjevovod prenosi podržane objekte i njihova svojstva, a ne samo tekstualni ispis tablice. Model je ograničen na opisane cmdlete i parametre u Windows okruženju. Kodiranja, puni datotečni provider i sva ponašanja stvarnog PowerShella nisu simulirani. Niti jedan terminal ne izvršava naredbe računala, skripte, programe ili mrežne radnje. Pogrešne naredbe u modelu ne mijenjaju datoteke; stvarni shell može imati djelomične učinke.

## Offline rad i prijenos

Za računalo preuzmi [zljixOS.html](downloads/zljixOS.html) i otvori ga preglednikom. Mobilna aplikacija treba prvo otvaranje preko interneta. Ikona preuzimanja ostaje siva dok cijeli paket nije spreman; zelena ikona otvara preuzimanje HTML-a i upute za dodavanje na početni zaslon. Aplikacija se može ponovno otvoriti bez mreže nakon uspješnog predmemoriranja.

**Aplikacija i rezultati odvojene su datoteke.** Za prijenos rada na drugi uređaj ili u samostalni HTML spremi JSON kroz **Moj rad**, na drugom uređaju upiši isto ime i prezime te učitaj svoj JSON. Na internetu se učitava aktualna stranica; bez interneta ostaje posljednja potpuno spremljena verzija. Gumb **Novo izdanje** otvara preuzetu nadogradnju nakon provjere da nema nedovršenog unosa i da je rad spremljen. Druge kartice ne osvježavaju se automatski. Ako dolaziš sa starijeg izdanja, koristi ulaz `igra.html`.

## Razvoj i provjera

Izvorni kod je u `source/`. Uz Node.js:

```sh
cd source
npm ci
npm test
npm run build
npm run check:artifact
```

Izgradnja stvara `dist/zljixOS.html` i `dist/mobitel/`. GitHub Pages koristi `main`, mapu `/`; mobilni paket ide u korijen, a samostalni HTML u `downloads/zljixOS.html`. Ne objavljuju se učeničke kopije, QA radni prostori ni `node_modules`.

120 automatiziranih testova prolazi: postojeća igra, svih 90 terminalskih ciljeva, objekti PowerShella, pogrešne naredbe, tri težine, pomoć, ponavljanje, ukupni XP, odvojeni učenici, prenosive kopije i odbijanje tuđih/anonimnih rezultata. Provjere samostalnog i mobilnog paketa potvrđuju ugrađene resurse i valjan offline worker. Detalji provedene provjere su u `source/RAZVOJ.md`; metodički opis u `source/NASTAVA.md`.
