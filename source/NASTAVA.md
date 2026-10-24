# Orbit OS 0.11 — samostalno učenje i automatska provjera

Cilj je povezati **strukturu** (dijelovi i odnosi), **funkciju** (problem koji OS rješava) i **mehanizam** (redoslijed događaja i promjena stanja). Polazi se od pisanja bilješke i spremanja, a zatim postupno uvode procesi, raspoređivanje, virtualna memorija, I/O i sinkronizacija.

## Metodički slijed svake misije

1. **Razumij:** veza s poznatim primjerom, cilj učenja, objašnjenje, rječnik i česta zabluda. Kratki objektivni zadatak provjerava temeljnu ideju prije napredovanja.
2. **Pogledaj primjer:** učenik prati riješen slučaj, jedan događaj i posljedicu po prikazu. Nakon cijelog primjera sam slaže uzročno smislen redoslijed. Nije dovoljno samo klikati Dalje.
3. **Isprobaj:** predvidi, promatraj i usporedi sve uvjete. Dva uvjeta u šest misija, tri u memoriji i čitanju datoteke. Pogrešna pretpostavka nije pogreška koja oduzima bodove. Zaključak nakon usporedbe zasebno se provjerava.
4. **Provjeri:** dvije kratke provjere pa novi slučaj s dva odabira — ishod i razlog. Točni moraju biti oba. Time se ista ideja prenosi, primjerice, s bilješke na crtež ili s dva na tri procesa.

Na Easy i Moderate netočan odgovor dobiva objašnjenje. Na Hard prvo dobiva poticaj za ponovnu analizu; trag i detaljniju povratnu informaciju učenik otvara nakon prvog pokušaja. Učenik može zatražiti trag ili se vratiti na lekciju i pokušati ponovno. Pregled misija izdvaja još netočne zadatke. Završni izazov nakon predaje daje preporuku tema za ponavljanje. Odgovori se prikazuju u stabilno izmiješanom redoslijedu.

## Tri težine

| Težina | Podrška i zahtjev | Dovršavanje jedne misije |
| --- | --- | ---: |
| Easy | Dva ponuđena odgovora u kratkim provjerama, postavljen prvi događaj redoslijeda i uputa kako razmišljati. Prepoznavanje i objašnjenje temeljnih odnosa. | 100 XP |
| Moderate | Svi odgovori i pomoć na zahtjev. Nakon osnove dodatni slučaj zahtijeva prijenos pravila i vezu ishoda s razlogom. | 120 XP |
| Hard | Sve iz Moderate plus dijagnostički slučaj s tri povezane odluke. Učenik razdvaja dokaz i pretpostavku, procjenjuje promjenu uvjeta i bira opravdanu intervenciju. Pomoć nakon prvog pokušaja. | 140 XP |

Osam novih primjena i osam dijagnoza daju ukupno 320 dodatnih XP. Težina se bira u pregledu i zaglavlju misija. Zajednički temeljni odgovori ostaju riješeni nakon promjene težine; isti se zadatak ne može ponovno bodovati na drugoj težini. Spuštanje težine ne briše ranije osvojene dodatne bodove. Zato ukupni XP može biti viši od zbroja trenutačne lakše putanje.

Primjeri novih dijagnoza: nespremljena promjena nije dokaz kvara SSD-a; dodavanje RAM-a ne daje dozvolu; mutex samo oko upisa ne štiti prethodno čitanje; pravilo redoslijeda lokota sprječava budući krug, ali samo ne razrješava postojeći zastoj. Tri odabira moraju zajedno biti točna. Nema nastavničkog pregleda ni bodovanja slobodnog teksta.

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

Osnova svake misije ima 100 XP: temelj 10, redoslijed 20, usporedba 20, dvije provjere 20, prijenos 30. Sve aktivnosti zajedno donose 1720 XP: misije s dodatnim slučajevima 1120, laboratoriji 220, detaljni mehanizmi 140, mrežni izazovi 140 i završni izazov 100.

Pet rangova: Početnik (0), Istraživač (150), Analitičar (400), Poznavatelj sustava (700), OS navigator (1000). Sedam znački: prva misija, šest osnova, svih 18 uvjeta, ispravljena pogreška, dretve i zastoj, tri laboratorija, završni rezultat najmanje 80/100.

Bodovi se izvode iz odgovora i potvrđenih radnji, ne iz spremljenog zbroja ili vremena provedenog u aplikaciji. Pogreške i pomoć ne smanjuju osvojive bodove. Točan zadatak zaključava se i više ne donosi bodove. Ponavljanje uvjeta ne briše ranije postignuće. Nema rangiranja učenika, odbrojavanja, niza obveznih dnevnih dolazaka ni kazne za pauzu.

## Automatski laboratoriji

Praktični laboratorij daje 10 XP za izvršene radnje i 10 za točan strukturirani zaključak. Neki dokazi provjeravaju stanje datoteke, drugi potvrđenu radnju u simulatoru. Pokretanje izvoza potvrđuje samo da je aplikacija pokrenula preuzimanje; ne dokazuje da je korisnik spremio datoteku na uređaj.

Detaljni mehanizmi imaju ukupno 14 uvjeta. Po dovršenom tragu događaja učenik odabire ishod (5 XP) i razlog (5 XP). Prije pokusa bira predviđanje bez bodovanja.

Mrežni izazov daje 20 XP tek nakon početnog neuspjeha, potrebnih provjera s aktualnim postavkama i točnog odabira uzroka. Dovoljno dugačak slobodan tekst ne potvrđuje razumijevanje. Svih sedam izazova može se riješiti bez intervencije nastavnika.

## Završna provjera i izvještaj

Završni izazov otključava se nakon svih osam misija dovršenih na trenutačno odabranoj težini. Svaka težina ima vlastitu banku od 20 pitanja (dvije inačice po temi). Težina već započetog pokušaja ostaje nepromjenjiva do predaje, i nakon promjene težine misija. Sadrži deset pitanja iz osam tema i dva povezivanja tema. Svako vrijedi 10 bodova. Nema pomoći ili informacije o točnosti prije predaje; nakon predaje svaki odgovor dobiva objašnjenje. U XP ulazi najbolji rezultat. Pokušaj se može pauzirati i nastaviti. Dvije inačice po temi izmjenjuju se; zato ponovljeni pokušaji nisu neovisni standardizirani ispiti.

Izvještaj razdvaja XP ostvaren uz ispravke od točnosti prvih odgovora bez zatražene pomoći. Mrežne dijagnoze imaju zaseban rezultat bez statistike prvog odgovora. Prikazuje se težina prvog i zadnjeg odgovora, najbolji završni rezultat za svaku težinu, povijest i pregled zadnjeg pokušaja. Easy sadrži ugrađeno vođenje; prvi odgovori i rezultati različitih težina nisu izravno usporedivi. U ukupni XP ulazi jedan najbolji završni rezultat, ne zbroj rezultata po težinama.

Arhivirani slobodni osvrti iz ranijih izdanja ostaju sačuvani, ali nisu obvezni za napredovanje i ne ocjenjuju se prema duljini. Aplikacija ne tvrdi da automatski razumije proizvoljan učenički tekst. XP nije službena školska ocjena niti dokaz tko je rješavao: lokalni zapis može se izmijeniti, a pomoć izvan aplikacije nije moguće nadzirati.

## Upotreba i granice

Učenik počinje u **Uči od početka**, a zatim ide u **Istraži OS** i praktične laboratorije. Bodovi su stalno u gornjoj traci u svim aplikacijama. Zelena ikona otvara spremanje aplikacije tek kad su i mobilni paket i samostalni HTML predmemorirani. Na kraju izvozi JSON kroz **Moj rad**. Na zajedničkom računalu svaki učenik čuva vlastitu kopiju; simulirani profili služe učenju dozvola i ne odvajaju stvarne korisnike.

Modeli jasno označavaju pojednostavljenja: jedan logički CPU, unaprijed zadani događaji, odabrani mehanizmi. Nisu mjerenje ponašanja stvarnog računala. Ugrađeni sadržaj radi offline nakon preuzimanja; vanjski izvori trebaju mrežu.

Temeljna literatura: [Operating Systems: Three Easy Pieces](https://pages.cs.wisc.edu/~remzi/OSTEP/) — procesi, ograničeno izravno izvođenje, raspoređivanje, memorija, I/O, dretve i lokoti; [GNU dozvole](https://www.gnu.org/software/coreutils/manual/html_node/Mode-Structure.html); Microsoftove upute za ping, ipconfig i nslookup povezane su uz mrežni model. Pitanja i pojednostavljeni pokusi napisani su za Orbit.
