# Orbit OS 0.10 — samostalno učenje i automatska provjera

Cilj je povezati **strukturu** (dijelovi i odnosi), **funkciju** (problem koji OS rješava) i **mehanizam** (redoslijed događaja i promjena stanja). Polazi se od pisanja bilješke i spremanja, a zatim postupno uvode procesi, raspoređivanje, virtualna memorija, I/O i sinkronizacija.

## Metodički slijed svake misije

1. **Razumij:** veza s poznatim primjerom, cilj učenja, objašnjenje, rječnik i česta zabluda. Kratki objektivni zadatak provjerava temeljnu ideju prije napredovanja.
2. **Pogledaj primjer:** učenik prati riješen slučaj, jedan događaj i posljedicu po prikazu. Nakon cijelog primjera sam slaže uzročno smislen redoslijed. Nije dovoljno samo klikati Dalje.
3. **Isprobaj:** predvidi, promatraj i usporedi sve uvjete. Dva uvjeta u šest misija, tri u memoriji i čitanju datoteke. Pogrešna pretpostavka nije pogreška koja oduzima bodove. Zaključak nakon usporedbe zasebno se provjerava.
4. **Provjeri:** dvije kratke provjere pa novi slučaj s dva odabira — ishod i razlog. Točni moraju biti oba. Time se ista ideja prenosi, primjerice, s bilješke na crtež ili s dva na tri procesa.

Netočan odgovor dobiva objašnjenje. Učenik može zatražiti trag ili se vratiti na lekciju i pokušati ponovno. Pregled misija izdvaja još netočne zadatke. Završni izazov nakon predaje daje preporuku tema za ponavljanje. Odgovori se prikazuju u stabilno izmiješanom redoslijedu.

## Ciljevi i tipične zablude

| Misija | Učenik može… | Zabluda koju razrješava |
| --- | --- | --- |
| Dijelovi računala | Razlikovati CPU, RAM i pohranu | Vidljiv tekst već je spremljen. |
| Uloga OS-a | Povezati zahtjev aplikacije, zaštitu i upravljački program | Jezgra OS-a isto je što i procesorska jezgra. |
| Program i proces | Razlikovati zapis programa i pojedino izvođenje | Završetak procesa briše program. |
| Dijeljenje CPU-a | Objasniti raspoređivanje i kontekst | Svaki prekid mora promijeniti proces. |
| Memorija | Razlikovati adresni prostor, dostupnost i pravo pristupa | Svaka iznimka stranice znači pogrešan program. |
| Čitanje datoteke | Povezati dozvolu, predmemoriju, uređaj i čekanje | Svako čitanje sadržaja zahtijeva disk. |
| Dretve | Pratiti čitanje, računanje i upis zajedničkog podatka | Dva povećanja uvijek daju zbroj dva. |
| Zastoj | Razlikovati privremeno i kružno čekanje | Svako čekanje je zastoj. |

## Igrifikacija koja prati učenje

Svaka misija ima 100 XP: temelj 10, redoslijed 20, usporedba 20, dvije provjere 20, prijenos 30. Sve aktivnosti zajedno donose 1400 XP: misije 800, laboratoriji 220, detaljni mehanizmi 140, mrežni izazovi 140 i završni izazov 100.

Pet razina: Početnik (0), Istraživač (150), Analitičar (400), Poznavatelj sustava (700), OS navigator (1000). Sedam znački: prva misija, šest osnova, svih 18 uvjeta, ispravljena pogreška, dretve i zastoj, tri laboratorija, završni rezultat najmanje 80/100.

Bodovi se izvode iz odgovora i potvrđenih radnji, ne iz spremljenog zbroja ili vremena provedenog u aplikaciji. Pogreške i pomoć ne smanjuju osvojive bodove. Točan zadatak zaključava se i više ne donosi bodove. Ponavljanje uvjeta ne briše ranije postignuće. Nema rangiranja učenika, odbrojavanja, niza obveznih dnevnih dolazaka ni kazne za pauzu.

## Automatski laboratoriji

Praktični laboratorij daje 10 XP za izvršene radnje i 10 za točan strukturirani zaključak. Neki dokazi provjeravaju stanje datoteke, drugi potvrđenu radnju u simulatoru. Pokretanje izvoza potvrđuje samo da je aplikacija pokrenula preuzimanje; ne dokazuje da je korisnik spremio datoteku na uređaj.

Detaljni mehanizmi imaju ukupno 14 uvjeta. Po dovršenom tragu događaja učenik odabire ishod (5 XP) i razlog (5 XP). Prije pokusa bira predviđanje bez bodovanja.

Mrežni izazov daje 20 XP tek nakon početnog neuspjeha, potrebnih provjera s aktualnim postavkama i točnog odabira uzroka. Dovoljno dugačak slobodan tekst ne potvrđuje razumijevanje. Svih sedam izazova može se riješiti bez intervencije nastavnika.

## Završna provjera i izvještaj

Završni izazov otključava se nakon svih osam misija. Sadrži deset pitanja iz osam tema i dva povezivanja tema. Svako vrijedi 10 bodova. Nema pomoći ili informacije o točnosti prije predaje; nakon predaje svaki odgovor dobiva objašnjenje. U XP ulazi najbolji rezultat. Pokušaj se može pauzirati i nastaviti. Dvije inačice po temi izmjenjuju se; zato ponovljeni pokušaji nisu neovisni standardizirani ispiti.

Izvještaj razdvaja XP ostvaren uz ispravke od točnosti prvih odgovora bez pomoći. Mrežne dijagnoze imaju zaseban rezultat bez statistike prvog odgovora. Prikazuje se povijest završnih rezultata i pregled zadnjeg pokušaja.

Arhivirani slobodni osvrti iz ranijih izdanja ostaju sačuvani, ali nisu obvezni za napredovanje i ne ocjenjuju se prema duljini. Aplikacija ne tvrdi da automatski razumije proizvoljan učenički tekst. XP nije službena školska ocjena niti dokaz tko je rješavao: lokalni zapis može se izmijeniti, a pomoć izvan aplikacije nije moguće nadzirati.

## Upotreba i granice

Učenik počinje u **Uči od početka**, a zatim ide u **Istraži OS** i praktične laboratorije. Na kraju izvozi JSON kroz **Moj rad**. Na zajedničkom računalu svaki učenik čuva vlastitu kopiju; simulirani profili služe učenju dozvola i ne odvajaju stvarne korisnike.

Modeli jasno označavaju pojednostavljenja: jedan logički CPU, unaprijed zadani događaji, odabrani mehanizmi. Nisu mjerenje ponašanja stvarnog računala. Ugrađeni sadržaj radi offline nakon preuzimanja; vanjski izvori trebaju mrežu.

Temeljna literatura: [Operating Systems: Three Easy Pieces](https://pages.cs.wisc.edu/~remzi/OSTEP/) — procesi, ograničeno izravno izvođenje, raspoređivanje, memorija, I/O, dretve i lokoti; [GNU dozvole](https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html); Microsoftove upute za ping, ipconfig i nslookup povezane su uz mrežni model. Pitanja i pojednostavljeni pokusi napisani su za Orbit.
