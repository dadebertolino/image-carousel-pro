# Image Carousel Pro

**Versione:** 1.4.0  
**Autore:** Davide "The Prof." Bertolino — [davidebertolino.it](https://www.davidebertolino.it)  
**Compatibilità:** WordPress 5.8+, PHP 7.4+

---

## Descrizione

Plugin WordPress per la creazione di caroselli immagini e video con rotazione automatica, zoom sull'elemento centrale, filtri per categoria, modalità singola slide con effetti di transizione e personalizzazione visiva completa. Ogni parametro è configurabile dal pannello admin e sovrascrivibile per singola istanza tramite shortcode.

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
| `interval` | ms (es: 3000) | 3000 | Intervallo rotazione automatica |
| `transition` | ms (es: 500) | 500 | Durata animazione transizione |
| `zoom` | 1.0–2.0 | 1.3 | Scala zoom slide centrale (modalità carousel) |
| `category` | nome tag | — | Filtra le slide per categoria |
| `mode` | carousel \| single | carousel | Layout: multi-slide o singola slide |
| `effect` | fade \| slide \| flip \| zoom | fade | Transizione in modalità single |
| `border_color` | hex | #0073aa | Colore bordo slide attiva |
| `border_color_inactive` | hex o vuoto | trasparente | Colore bordo slide inattive |
| `border_width` | px (0–10) | 3 | Spessore bordo slide |
| `border_radius` | px (0–50) | 12 | Angoli arrotondati slide |
| `slide_width` | px (80–600) | 250 | Larghezza slide (modalità carousel) |
| `slide_height` | px (60–600) | 180 | Altezza slide |
| `container_height` | px (0 = auto) | 0 | Altezza fissa contenitore |
| `container_border_color` | hex o vuoto | nessuno | Colore bordo contenitore |
| `container_border_width` | px (0–10) | 0 | Spessore bordo contenitore |
| `container_border_radius` | px (0–50) | 0 | Angoli arrotondati contenitore |
| `container_padding` | px (0–100) | 0 | Padding interno contenitore |
| `container_max_width` | px (0 = 100%) | 1200 | Larghezza massima contenitore |
| `show_shadow` | 0 \| 1 | 1 | Ombra sulle slide |
| `image_fit` | cover \| contain \| fill | cover | Adattamento immagine nella slide |
| `minimal` | 0 \| 1 | 0 | Modalità minimal (solo autorotazione) |

### Esempi shortcode

```
[image_carousel category="natura"]
[image_carousel mode="single" effect="flip"]
[image_carousel border_color="#ff0000" border_width="2" border_radius="20"]
[image_carousel slide_width="300" slide_height="220"]
[image_carousel container_max_width="0" container_padding="0"]
[image_carousel minimal="1" mode="single" effect="fade"]
[image_carousel image_fit="contain" show_shadow="0"]
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
- Autoplay mutato configurabile (checkbox admin)
- Play/pausa manuale con click sulla slide
- Pausa autorotazione durante la riproduzione
- Overlay play icon sulla slide video

### Fullscreen

- Bottone expand (⛶) nella barra navigazione
- Doppio click sulla slide (solo immagini, non video)
- Overlay a schermo intero con chiusura via X, ESC o click fuori
- Convive con il lightbox (click singolo = lightbox, doppio click = fullscreen)

### Lightbox

- Click singolo sulla slide per aprire l'immagine in overlay
- Didascalia mostrata sotto l'immagine
- Chiudibile con ESC, click fuori o bottone X
- ID univoco per istanza (supporta shortcode multipli)

### Modalità minimal

- Nasconde frecce, dots, bottone fullscreen
- Disabilita click, doppio click, touch swipe, navigazione da tastiera
- Resta solo l'autorotazione automatica
- Attivabile da admin (checkbox) o shortcode (`minimal="1"`)

### Personalizzazione visiva

- **Bordo slide** — colore attiva/inattiva, spessore, angoli arrotondati
- **Bordo contenitore** — colore, spessore, angoli, indipendente dal bordo slide
- **Dimensioni slide** — larghezza e altezza configurabili
- **Dimensioni contenitore** — altezza fissa, larghezza massima, padding
- **Ombra** — attivabile/disattivabile
- **Adattamento immagine** — cover (riempi), contain (adatta), fill (stira)
- Tutto configurabile via CSS custom properties impostate dal JS

### Navigazione

- Frecce prev/next
- Dots indicatori
- Swipe touch (soglia 50px)
- Tastiera (← →)
- Pausa autorotazione al passaggio del mouse

### Responsive

- Layout adattivo per desktop, tablet e mobile
- Dimensioni slide via CSS custom properties

---

## Note tecniche

- Le immagini e i video vengono copiati in `wp-content/uploads/carousel-images/` al momento dell'aggiunta
- L'ordine, le didascalie e i tag sono salvati nell'opzione WordPress `icp_images`
- Le impostazioni globali sono salvate in `icp_settings` con retrocompatibilità via `wp_parse_args`
- Con meno di 3 immagini in modalità carousel, le slide vengono duplicate automaticamente
- Tutti gli endpoint AJAX sono protetti da `check_ajax_referer`, `current_user_can('manage_options')` e sanitizzazione input (`sanitize_text_field`, `sanitize_hex_color`, `absint`)
- Validazione whitelist su `mode`, `effect`, `image_fit`
- Ogni istanza shortcode ha lightbox e fullscreen con ID univoco

---

## Changelog

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
- Tutti i parametri configurabili da admin e sovrascrivibili via shortcode

### 1.2.0
- Supporto video self-hosted (MP4, WebM, OGG) da Media Library
- Autoplay video mutato configurabile
- Play/pausa inline con click
- Bottone "Aggiungi Video" nell'admin
- Pausa autorotazione durante riproduzione video

### 1.1.0
- Sistema categorie/filtri con tag separati da virgola
- Barra filtri frontend con animazione fade
- Parametro shortcode `category` per filtraggio diretto
- Salvataggio tag via AJAX con debounce

### 1.0.0
- Release iniziale
- Carousel infinito con zoom centrale
- Lightbox per istanze multiple
- Fullscreen (bottone + doppio click)
- Supporto touch e keyboard
- Pannello admin con drag & drop e didascalie
- Fix: lightbox ID univoco per shortcode multipli
- Fix: crash con meno di 3 immagini
- Fix: validazione `$_POST['order']`