# Orbit OS 0.9 — nastavni koncept

Središnja je namjena razumjeti od kojih se dijelova operacijski sustav sastoji, koje probleme rješava i kojim mehanizmima to postiže. Radna površina omogućuje pristup pokusima i datotekama; početna točka učeniku je **Uči od početka**. **Istraži OS** slijedi kao detaljni prikaz.

## Prvo učenje bez predznanja

Učenik prolazi šest osnovnih lekcija: dijelovi računala, uloga OS-a, program i proces, dijeljenje CPU-a, memorija i čitanje datoteke. Dretve i zastoj dva su dodatna proširenja. U svakoj lekciji novi pojmovi dolaze uz svakodnevni primjer.

1. **Razumij:** kratko objašnjenje i izravne definicije novih pojmova.
2. **Pogledaj primjer:** riješen slučaj, jedan korak i njegova posljedica u svakom prikazu.
3. **Isprobaj:** učenik odabire uvjet, predviđa ishod i prolazi događaje uz objašnjenje. Pogrešno predviđanje ne sprječava nastavak.
4. **Provjeri:** dvije samoprovjere s obrazloženjem svake opcije te učenikovo objašnjenje svojim riječima.

Dovršavanje zahtijeva pregled primjera, završen pokus, ispravljene samoprovjere i ne-prazan osvrt. To nije automatska ocjena znanja. Izvještaj čuva prvi i zadnji odgovor te broj pokušaja. Trenutačna varijanta pokusa može se ponoviti; izmjena uvjeta traži novo predviđanje i novo dovršavanje. Prethodni uvjeti početničkog pokusa ne arhiviraju se. Za trajnu usporedbu više uvjeta služi detaljni simulator.

Nastavnik može nakon osnova tražiti prijenos na novi primjer: umjesto bilješke, učenik neka objasni otvaranje slike ili reprodukciju glazbe. Prijelaz na detaljni simulator treba slijediti tek kada može imenovati sudionike i obrazložiti osnovne promjene.

## Tri cjeline detaljnog simulatora

| Cjelina | Pitanje učenika | Što učenik radi |
| --- | --- | --- |
| Struktura | Od kojih je dijelova sastavljen sustav i kako su povezani? | Odabire dio karte, čita njegovu ulogu i primjer pa otvara povezani mehanizam. |
| Funkcije | Koji problem rješava OS? | Povezuje upravljanje resursima, zaštitu i usluge s konkretnim mehanizmom. |
| Mehanizmi | Što se dogodi, kojim redoslijedom i zašto? | Predviđa ishod, mijenja uvjete, prolazi događaje i obrazlaže promjene stanja. |

Karta je logički prikaz, ne fizička blok-shema ni točan model svih operacijskih sustava. CPU izvršava i aplikacijski i jezgreni kod. Privilegirani način rada procesora razlikuje se od korisničke uloge ili administratorskog računa.

## Rad u detaljnom simulatoru

Nakon početničkih lekcija zajednički pregledajte Strukturu i Funkcije. Učenici trebaju razumjeti što su aplikacija, jezgra, resurs, sistemski poziv i korisnički/jezgreni način rada prije samostalnog praćenja događaja.

Potom slijedi šest pokusa. Zadnji je proširenje koje pretpostavlja razumijevanje dretve, resursa i lokota.

| Pokus | Varijante | Pitanje na koje učenik treba moći odgovoriti |
| --- | --- | --- |
| Program i proces | Jedna / dvije instance | Zašto isti program može imati više procesa i zašto završetak jednog ne briše program? |
| Čitanje datoteke | Disk / predmemorija / odbijen pristup | Koji dijelovi sustava sudjeluju i kada zaista trebaju disk i čekanje? |
| Prekid i kontekst | P2 spreman / nema drugog spremnog procesa | Zašto prijelaz u jezgreni način ne znači nužno promjenu procesa? |
| Virtualna memorija | Prisutna / neprisutna valjana stranica / nedopuštena adresa | Kada se pristup može nastaviti nakon obrade iznimke, a kada se odbija? |
| Dretve i povećanje | Bez mutexa / cijeli odsječak pod mutexom | Kako dva povećanja mogu dati 1 umjesto 2 i što mora štititi isti lokot? |
| Kružno čekanje | Različit / isti redoslijed resursa | Koja je razlika između privremenog čekanja i zastoja? |

## Metoda: predvidi, promatraj, objasni

1. Pročitajte cilj i pojmove. Nove pojmove objasnite na primjeru prije očekivanja samostalne uporabe.
2. Odaberite uvjete. Učenik svojim riječima zapisuje ishod koji očekuje i razlog. Nije cilj pogoditi odgovor.
3. Pokrećite po jedan događaj. Prije sljedećega pitajte: tko radi, tko čeka i koji je resurs promijenjen?
4. Učenik zapisuje objašnjenje i uspoređuje rezultat s predviđanjem. Pokus se može zabilježiti kada su provedeni svi koraci i oba odgovora su upisana.
5. Ponovite drugu varijantu istog pokusa. Zabilježene varijante ostaju jedna uz drugu u usporedbi.
6. Otvorite Izvještaj. Kopiranje za Word uključuje uvjete, početno predviđanje, ishod modela i objašnjenje učenika.

Predviđanje se tijekom pokušaja zaključava. Povratak na početak omogućuje njegovu promjenu, pa zapis nije neizmjenjiv dokaz prvotnog mišljenja. Za istu varijantu čuva se najnoviji zabilježeni pokus; ponovno bilježenje ažurira taj zapis. Promjena uvjeta upozorava ako bi zamijenila pokušaj koji još nije zabilježen. Korak i odgovori ostaju u korisnikovu prostoru i nakon ponovnog učitavanja.

Oznake dovršenja potvrđuju prolazak postupka. Ne provjeravaju stručnu točnost, samostalnost ni autorstvo. Nastavnik provjerava objašnjenje, razliku među varijantama i primjenu na novi primjer. Nastavnički portal zasad ne preuzima izvještaje učenika automatski.

## Povezivanje s postojećim laboratorijima

Nakon objašnjenja mehanizma učenik mijenja ulaze u odgovarajućem laboratoriju: trajanja i algoritam CPU-a, broj okvira i niz pristupa memoriji, raspored blokova diska, prava pristupa ili mrežnu postavku. To daje prijelaz od razumijevanja događaja prema samostalnom pokusu.

Datoteke, Bilješke, Terminal, Oporavak i ostale postojeće aplikacije zadržane su. Njihove operacije služe praktičnim vježbama. Povezani laboratorij ne dijeli automatski ulazne podatke s novim vođenim pokusom; to su različiti, jasno označeni modeli.

## Granice

- Prikaz događaja nije stvarna jezgra, emulator instrukcijskog skupa ili mjerenje računala. Nema izvršavanja korisničkih naredbi na stvarnom računalu. Lokalno izdanje ne treba poslužitelj.
- Koraci predstavljaju događaje različitih stvarnih trajanja. Jednaki vizualni razmaci ne znače jednako vrijeme.
- CPU pokus koristi jednu logičku jezgru i po jednu dretvu procesa. Pokus dretvi prikazuje zadano ispreplitanje apstraktnih operacija, bez detaljnog prikaza svakog prebacivanja CPU-a i implementacije lokota.
- Memorijski pokus izostavlja TLB. Kod jedne neprisutne valjane stranice odabrani je okvir izmijenjen pa treba zapis prije učitavanja. To nije univerzalan tijek svake iznimke stranice.
- Čitanje je blokirajuće, s metapodacima već u RAM-u. Provjera dozvole pri otvaranju modelirana je nalik UNIX-u.
- Model otvorenih aplikacija pojednostavljeno povezuje aplikaciju s jednim procesom. U stvarnom OS-u odnos prozora, programa, procesa i dretvi može biti mnogo složeniji.
- Ova nadogradnja nije tvrdnja da je pokriven cijeli kurikulum OS-a. Primjerice, detaljan boot, IPC, višestruke jezgre, posebne arhitekture jezgri i unutarnji format konkretnog datotečnog sustava nisu potpuni zasebni simulatori.

## Stručna provjera i izvori

Objašnjenja i kod pokusa izvorno su oblikovani za Orbit. Ključne razlike provjerene su prema primarnim obrazovnim i tehničkim izvorima (pristup 24. listopada 2026.):

- [OSTEP — procesi](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-intro.pdf)
- [OSTEP — prijenos kontrole, načini rada i kontekst](https://pages.cs.wisc.edu/~remzi/OSTEP/cpu-mechanisms.pdf)
- [OSTEP — memorija izvan RAM-a](https://pages.cs.wisc.edu/~remzi/OSTEP/vm-beyondphys.pdf)
- [OSTEP — I/O uređaji](https://pages.cs.wisc.edu/~remzi/OSTEP/file-devices.pdf)
- [OSTEP — dretve](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-intro.pdf)
- [OSTEP — lokoti](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-locks.pdf)
- [OSTEP — zastoji i druge poteškoće konkurentnosti](https://pages.cs.wisc.edu/~remzi/OSTEP/threads-bugs.pdf)
- [Linux man-pages — open](https://man7.org/linux/man-pages/man2/open.2.html)
- [seL4 Foundation — uvod u mikrokernel](https://sel4.systems/About/seL4-whitepaper.pdf)
