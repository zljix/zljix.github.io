# zljix · Uči kroz igru

Početna stranica s izborom edukativnih igara na **https://zljix.github.io/**.

| Igra | Adresa | Repozitorij |
| --- | --- | --- |
| zljixOS — operacijski sustavi | https://zljix.github.io/zljixOS/ | [zljix/zljixOS](https://github.com/zljix/zljixOS) |
| SISgame — sigurnost informacijskih sustava | https://zljix.github.io/SISgame/ | [zljix/SISgame](https://github.com/zljix/SISgame) |

Ovaj repozitorij sadrži samo portal i male datoteke za kompatibilnost starih poveznica. Izvorni kod, testovi, PWA paket i samostalni HTML igre zljixOS nalaze se u zasebnom repozitoriju. Izvorna povijest razvoja igre ostaje dostupna u Git povijesti ovog repozitorija do commita `3fe8cf279e082524cf0f2d6f99cd388183e0aca4`.

## Razvoj i objava

Statični HTML, CSS i JavaScript bez biblioteka, vanjskih fontova, analitike ili koraka izgradnje. GitHub Pages: grana `main`, mapa `/ (root)`. Svaki repozitorij igre zasebno upravlja svojom objavom.

Za lokalnu provjeru pokreni bilo koji statični HTTP poslužitelj iz korijena ovog repozitorija. Poveznice `/zljixOS/` i `/SISgame/` na lokalnom poslužitelju zahtijevaju montirane mape tih igara; na GitHub Pagesu pripadaju zasebnim projektnim stranicama.

## Stare instalacije zljixOS-a

- `/igra.html` vodi na `/zljixOS/`.
- `/downloads/zljixOS.html` vodi na novu samostalnu HTML igru.
- `/manifest.webmanifest` ostaje samo za kompatibilnost stare instalacije i usmjerava na novu adresu igre. Portal ne instalira vlastiti PWA.
- `/sw.js` povlači stari root worker i briše isključivo cache s prefiksom `orbit-mobile:https://zljix.github.io/:`. Ne dira workere ni predmemorije `/zljixOS/` i `/SISgame/`, lokalne rezultate ili otvorene lekcije.
- Lokalna pohrana ostaje na istoj domeni i koristi nepromijenjene ključeve. Staru ikonu na početnom zaslonu zamijeni instalacijom igre s nove adrese.

## Dodavanje igre

Dodaj novu semantičku karticu u `index.html`, postavi poveznicu na njezinu projektnu adresu i ažuriraj broj igara. Portal radi i s isključenim JavaScriptom; `portal.js` služi samo povlačenju starog offline workera.
