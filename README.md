# Orbit OS 0.9.0

Aplikacija na hrvatskom za učenje strukture, funkcija i mehanizama operacijskih sustava. Radi u pregledniku, bez korisničkog računa i aplikacijskog poslužitelja.

## Odakle krenuti

Otvara se **Uči od početka**: šest osnovnih lekcija (dijelovi računala, uloga OS-a, program i proces, raspoređivanje CPU-a, memorija i čitanje datoteke) te dva proširenja (dretve i zastoj).

U svakoj lekciji učenik prolazi četiri faze: **Razumij → Pogledaj primjer → Isprobaj → Provjeri**. Prvo upoznaje pojmove i riješeni primjer; zatim odabire uvjet, predviđa ishod i korak po korak promatra posljedice. Samoprovjere daju objašnjenje svakog odgovora. Na kraju učenik upisuje zaključak svojim riječima.

Detaljni prikaz **Istraži OS** i prethodni laboratoriji dostupni su za produbljivanje. Simulator pojednostavljuje stvarni OS; pretpostavke su navedene uz svaki pokus.

## Spremanje i offline rad

- Napredak i odgovori čuvaju se lokalno u pregledniku. **Moj rad** prikazuje stanje spremanja i omogućuje JSON kopiju za prijenos na drugi uređaj.
- Dovršena lekcija znači dovršene aktivnosti, a ne automatsku ocjenu znanja. Izvještaj uključuje početne i ispravljene odgovore, broj pokušaja, predviđanje i slobodno objašnjenje.
- Stari radovi učitavaju se bez brisanja prethodnih datoteka, pokusa ili osvrta. Verzija 0.9.0 dodaje zaseban zapis vođenih lekcija.
- Na mobitelu otvori stranicu preko HTTPS-a i provjeri oznaku spremnosti za rad bez interneta. Upute za dodavanje na početni zaslon nalaze se u aplikaciji. Za prvi dohvat potreban je internet.
- Nakon ažuriranja zatvori sve otvorene prozore/kartice Orbita pa ga ponovno otvori. Nova offline verzija preuzima se bez zamjene verzije usred rada.
- Za računalo je dostupno samostalno izdanje [Orbit-OS.html](downloads/Orbit-OS.html). Spremi HTML na računalo i otvori ga preglednikom. Učenikov rad prenosi se zasebnom JSON kopijom.

## Razvoj

Izvorni kod, testovi i skripte nalaze se u `source/`. U toj mapi, uz Node.js i npm:

```sh
npm install
npm test
npm run build
npm run check:artifact
```

Izgradnja stvara `dist/Orbit-OS.html` za lokalno otvaranje i `dist/mobitel/` za statični HTTPS hosting. Objavljeni korijen repozitorija sadrži mobilno izdanje; nakon izmjena treba ponovno izgraditi i prenijeti svih šest datoteka iz `dist/mobitel/`. `sw.js` dobiva novu oznaku iz sadržaja izdanja. GitHub Pages koristi granu `main`, mapu `/`.

## Provjere izdanja 0.9.0

69 automatiziranih testova; provjera samostalnog HTML-a, mobilnog manifesta i offline workera. Provjereni su prvi prolaz kroz lekciju, pogrešni i ispravljeni odgovori, nastavak nakon osvježavanja, izvještaj i uski prikazi u Chromiumu. Nije provedeno testiranje na fizičkim iPhone/Android uređajima ni s razredom učenika.
