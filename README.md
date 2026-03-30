# Image Carousel Pro

**Versione:** 1.5.0  
**Autore:** Davide "The Prof." Bertolino — [davidebertolino.it](https://www.davidebertolino.it)  
**Compatibilità:** WordPress 5.8+, PHP 7.4+

---

## Descrizione

Plugin WordPress per la creazione di caroselli immagini e video con rotazione automatica, zoom sull'elemento centrale, filtri per categoria, modalità singola slide con effetti di transizione, personalizzazione visiva completa, accessibilità WCAG, preload intelligente e effetti visivi avanzati (Ken Burns, Parallax, 3D Tilt). Ogni parametro è configurabile dal pannello admin e sovrascrivibile per singola istanza tramite shortcode.

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

### Parametri shortcode

| Parametro | Valori | Default | Descrizione |
|---|---|---|---|
| `interval` | ms | 3000 | Intervallo rotazione automatica |
| `transition` | ms | 500 | Durata animazione transizione |
| `zoom` | 1.0–2.0 | 1.3 | Scala zoom slide centrale |
| `category` | nome tag | — | Filtra le slide per categoria |
| `mode` | carousel \| single | carousel | Layout multi-slide o singola |
| `effect` | fade \| slide \| flip \| zoom | fade | Transizione in modalità single |
| `border_color` | hex | #0073aa | Colore bordo slide attiva |
| `border_color_inactive` | hex o vuoto | trasparente | Colore bordo slide inattive |
| `border_width` | px (0–10) | 3 | Spessore bordo slide |
| `border_radius` | px (0–50) | 12 | Angoli arrotondati slide |
| `slide_width` | px (80–600) | 250 | Larghezza slide |
| `slide_height` | px (60–600) | 180 | Altezza slide |
| `container_height` | px (0 = auto) | 0 | Altezza fissa contenitore |
| `container_border_color` | hex o vuoto | nessuno | Colore bordo contenitore |
| `container_border_width` | px (0–10) | 0 | Spessore bordo contenitore |
| `container_border_radius` | px (0–50) | 0 | Angoli arrotondati contenitore |
| `container_padding` | px (0–100) | 0 | Padding interno contenitore |
| `container_max_width` | px (0 = 100%) | 1200 | Larghezza massima contenitore |
| `show_shadow` | 0 \| 1 | 1 | Ombra sulle slide |
| `image_fit` | cover \| contain \| fill | cover | Adattamento immagine |
| `minimal` | 0 \| 1 | 0 | Solo autorotazione, nessuna interazione |
| `ken_burns` | 0 \| 1 | 0 | Zoom e pan lento sulla slide attiva |
| `parallax` | 0 \| 1 | 0 | Profondità immagini allo scroll |
| `tilt_3d` | 0 \| 1 | 0 | Rotazione 3D al passaggio mouse |

### Esempi shortcode

```
[image_carousel category="natura"]
[image_carousel mode="single" effect="flip"]
[image_carousel border_color="#ff0000" border_width="2" border_radius="20"]
[image_carousel slide_width="300" slide_height="220"]
[image_carousel container_max_width="0" container_padding="0"]
[image_carousel minimal="1" mode="single" effect="fade"]
[image_carousel image_fit="contain" show_shadow="0"]
[image_carousel ken_burns="1" parallax="1"]
[image_carousel tilt_3d="1"]
```

> Il plugin supporta **shortcode multipli nella stessa pagina**, ognuno con parametri indipendenti.

---

## Pannello di amministrazione

Accessibile da **Carousel Pro** nella sidebar di WordPress.

### Impostazioni globali

Tutti i parametri della tabella shortcode sono configurabili come default globali dal pannello admin. I colori utilizzano il color picker nativo di WordPress. I valori globali sono sovrascrivibili per singola istanza tramite shortcode.

### Gestione media

- **Aggiungi Immagine** — apre la Media Library (filtro immagini)
- **Aggiungi Video** — apre la Media Library (filtro video, formati MP4/WebM/OGG)
- **Trascina** per riordinare (drag & drop tramite handle)
- **Didascalia** — campo testuale per ogni elemento, salvato automaticamente
- **Tag** — campo testuale per categorie (separati da virgola), salvato automaticamente
- **Elimina** — rimuove l'elemento dal carosello e dal filesystem

### Sezione shortcode

Tabella di riferimento con tutti i parametri disponibili, valori accettati e default correnti.

---

## Funzionalità

### Modalità layout

- **Carousel** (multi-slide) — scorrimento infinito con zoom sull'elemento centrale, più slide visibili contemporaneamente
- **Single** (singola slide) — una slide alla volta a piena larghezza con transizione configurabile

### Effetti transizione (modalità single)

- **Fade** — dissolvenza tra le slide
- **Slide** — scorrimento orizzontale
- **Flip** — rotazione 3D
- **Zoom** — scala in/out

### Filtri per categoria

- Tag separati da virgola assegnabili ad ogni immagine/video dall'admin
- Barra filtri automatica nel frontend (bottoni pill con "Tutti" + un bottone per ogni tag)
- Filtraggio con animazione fade out/in e ricostruzione carousel
- Filtraggio diretto via shortcode con `category="nome"`

### Supporto video

- Video self-hosted da Media Library (MP4, WebM, OGG)
- Autoplay mutato configurabile da admin
- Play/pausa manuale con click sulla slide
- Pausa autorotazione durante la riproduzione

### Fullscreen e Lightbox

- **Lightbox** — click singolo sulla slide apre l'immagine in overlay con didascalia
- **Fullscreen** — bottone expand o doppio click, overlay a schermo intero
- I due sistemi convivono: click = lightbox, doppio click = fullscreen
- Chiusura con ESC, click fuori o bottone X

### Modalità minimal

- Nasconde frecce, dots, bottone fullscreen
- Disabilita click, doppio click, touch swipe, navigazione da tastiera
- Resta solo l'autorotazione automatica

### Personalizzazione visiva

- **Bordo slide** — colore attiva/inattiva, spessore, angoli arrotondati
- **Bordo contenitore** — colore, spessore, angoli, indipendente dal bordo slide
- **Dimensioni slide** — larghezza e altezza configurabili
- **Dimensioni contenitore** — altezza fissa, larghezza massima, padding
- **Ombra** — attivabile/disattivabile
- **Adattamento immagine** — cover (riempi), contain (adatta), fill (stira)

### Effetti visivi

- **Ken Burns** — zoom lento + pan sull'immagine della slide attiva, durata sincronizzata con l'intervallo di rotazione
- **Parallax** — le immagini traslano verticalmente in base alla posizione di scroll della pagina, creando profondità (usa `requestAnimationFrame` per performance)
- **3D Tilt** — rotazione sottile della slide (±8°) seguendo la posizione del mouse, con reset fluido al mouseleave

### Navigazione

- Frecce prev/next
- Dots indicatori
- Swipe touch (soglia 50px)
- Tastiera (← →)
- Pausa autorotazione al passaggio del mouse

---

## UX e Accessibilità

### ARIA (WCAG 2.1)

- `role="region"` + `aria-roledescription="carousel"` sul contenitore
- `role="group"` + `aria-label="Slide X di Y"` su ogni slide
- `aria-live="polite"` sul track per annunciare i cambi slide
- `role="tablist"` + `aria-selected` sui dots, aggiornato dinamicamente
- `role="toolbar"` + `aria-pressed` sui filtri categoria
- `role="dialog"` + `aria-modal` su lightbox e fullscreen
- `aria-hidden` sulle slide non visibili in modalità single

### Preload intelligente

- Le immagini partono senza `src` (placeholder trasparente 1x1 GIF)
- Il JS carica solo le slide nel raggio di ±2 dalla slide attiva
- I video partono con `preload="none"`, passano a `metadata` quando vicini
- Ad ogni cambio slide, le nuove slide adiacenti vengono precaricate

### Skeleton loading

- Effetto shimmer animato (gradiente che scorre) sulle slide in caricamento
- Le immagini/video sono nascosti (`opacity: 0`) fino al completamento del caricamento
- Fade-in di 0.3s quando la risorsa è pronta
- Gestisce correttamente immagini già in cache del browser

---

## Note tecniche

- Le immagini e i video vengono copiati in `wp-content/uploads/carousel-images/`
- Ordine, didascalie e tag salvati nell'opzione WordPress `icp_images`
- Impostazioni globali in `icp_settings` con retrocompatibilità via `wp_parse_args`
- Con meno di 3 immagini in modalità carousel, le slide vengono duplicate automaticamente
- Tutti gli endpoint AJAX protetti da `check_ajax_referer`, `current_user_can` e sanitizzazione input
- Validazione whitelist su `mode`, `effect`, `image_fit`
- Ogni istanza shortcode ha lightbox e fullscreen con ID univoco
- Effetti visivi (Ken Burns, Parallax, 3D Tilt) usano CSS animations e `requestAnimationFrame` per performance ottimale
- Tutte le personalizzazioni visive sono applicate via CSS custom properties

---

## Changelog

### 1.5.0
- Attributi ARIA completi per accessibilità WCAG 2.1
- Preload intelligente con caricamento progressivo (±2 slide)
- Skeleton loading con effetto shimmer animato
- Effetto Ken Burns (zoom + pan lento sulla slide attiva)
- Effetto Parallax (profondità immagini allo scroll)
- Effetto 3D Tilt (rotazione al passaggio mouse)
- Tutti gli effetti opzionali, configurabili da admin e shortcode

### 1.4.0
- Colore bordo slide attiva e inattiva (color picker WP nativo)
- Spessore bordo e angoli arrotondati configurabili
- Larghezza e altezza slide configurabili
- Altezza, bordo, padding e larghezza massima del contenitore configurabili
- Modalità layout: carousel (multi-slide) e single (singola slide)
- Effetti transizione per modalità single: fade, slide, flip, zoom
- Ombra slide attivabile/disattivabile
- Adattamento immagine: cover, contain, fill
- Modalità minimal (solo autorotazione, nessuna interazione)
- Tabella parametri completa nella sezione Shortcode dell'admin

### 1.2.0
- Supporto video self-hosted (MP4, WebM, OGG) da Media Library
- Autoplay video mutato configurabile
- Play/pausa inline con click
- Bottone "Aggiungi Video" nell'admin

### 1.1.0
- Sistema categorie/filtri con tag separati da virgola
- Barra filtri frontend con animazione fade
- Parametro shortcode `category` per filtraggio diretto

### 1.0.0
- Release iniziale
- Carousel infinito con zoom centrale
- Lightbox per istanze multiple
- Fullscreen (bottone + doppio click)
- Supporto touch e keyboard
- Pannello admin con drag & drop e didascalie