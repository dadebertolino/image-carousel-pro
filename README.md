# Image Carousel Pro

**Versione:** 1.0.0  
**Autore:** Davide "The Prof." Bertolino — [davidebertolino.it](https://www.davidebertolino.it)  
**Compatibilità:** WordPress 5.8+, PHP 7.4+

---

## Descrizione

Plugin WordPress per la creazione di caroselli immagini con rotazione automatica e zoom sull'elemento centrale. Supporta didascalie, lightbox, navigazione touch/keyboard e shortcode multipli nella stessa pagina.

---

## Installazione

1. Caricare la cartella `image-carousel-pro/` in `/wp-content/plugins/`
2. Attivare il plugin dal menu **Plugin** di WordPress
3. Accedere a **Carousel Pro** nel menu di amministrazione

### Struttura cartelle

```
image-carousel-pro/
├── image-carousel-pro.php
├── css/
│   ├── admin.css
│   └── frontend.css
├── js/
│   ├── admin.js
│   └── frontend.js
└── README.md
```

---

## Utilizzo

### Shortcode base

```
[image_carousel]
```

### Shortcode con parametri personalizzati

```
[image_carousel interval="4000" transition="600" zoom="1.4"]
```

| Parametro    | Tipo    | Default | Descrizione                          |
|--------------|---------|---------|--------------------------------------|
| `interval`   | intero  | 3000    | Intervallo rotazione automatica (ms) |
| `transition` | intero  | 500     | Durata animazione transizione (ms)   |
| `zoom`       | decimale| 1.3     | Scala zoom slide centrale (1.0–2.0)  |

> Il plugin supporta **shortcode multipli nella stessa pagina**, ognuno con il proprio lightbox indipendente.

---

## Pannello di amministrazione

Accessibile da **Carousel Pro** nella sidebar di WordPress.

### Impostazioni globali
- **Intervallo rotazione** — tempo in ms tra uno scorrimento e l'altro
- **Durata transizione** — velocità dell'animazione CSS
- **Scala zoom centrale** — ingrandimento della slide attiva

I valori globali sono sovrascrivibili per singola istanza tramite i parametri dello shortcode.

### Gestione immagini
- **Aggiungi immagine** — apre la Media Library di WordPress
- **Trascina** per riordinare (drag & drop tramite handle)
- **Didascalia** — campo testuale per ogni immagine, salvato automaticamente
- **Elimina** — rimuove l'immagine dal carosello e dal filesystem

---

## Funzionalità frontend

- **Rotazione automatica** con pausa al passaggio del mouse
- **Navigazione** tramite frecce, dots, swipe touch e tasti ← →
- **Zoom centrale** configurabile via CSS custom property `--icp-zoom`
- **Lightbox** al click sulla slide attiva, chiudibile con ESC o click fuori
- **Lazy loading** immagini nativo (`loading="lazy"`)
- **Responsive** — layout adattivo per tablet e mobile

---

## Note tecniche

- Le immagini vengono copiate in `wp-content/uploads/carousel-images/` al momento dell'aggiunta
- L'ordine e le didascalie sono salvati nell'opzione WordPress `icp_images`
- Le impostazioni globali sono salvate in `icp_settings`
- Con meno di 3 immagini, le slide vengono duplicate automaticamente per garantire il corretto funzionamento del carousel infinito
- Tutti gli endpoint AJAX sono protetti da nonce e controllo `manage_options`

---

## Changelog

### 1.0.0
- Release iniziale
- Carousel infinito con zoom centrale
- Lightbox per istanze multiple
- Supporto touch e keyboard
- Pannello admin con drag & drop e didascalie
