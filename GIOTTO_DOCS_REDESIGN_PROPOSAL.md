# Giotto Docs redesign proposal

## Obiettivo

Trasformare il tema Zendesk in Giotto-theme con una UX vicina a xAI Docs: shell documentale persistente, navigazione gerarchica, ricerca sempre disponibile, contenuto editoriale leggibile e una gerarchia visuale adatta a API, tutorial e procedure operative.

La copia di lavoro parte dal tema Zendesk `4.57.1` (`2f730c0`) e mantiene il modello di distribuzione Zendesk Guide: template Curlybars, SCSS compilato con Rollup e moduli React caricati tramite import map.

## Dati reali di docs.giotto.ai

Gli endpoint pubblici Help Center espongono 5 categorie, 16 sezioni e 57 articoli pubblicati. La tassonomia attuale è già adatta a una sidebar documentale:

| Categoria | Sezioni |
| --- | --- |
| Giotto Cloud | Personalisation & Workflows; Account & Administration; Connected Applications |
| Giotto API | Getting started; Your local setup; Operations; Usage & Billing |
| Giotto on-prem | Getting started; Prerequisites; Installation & Configuration; Operations; Security |
| Tutorials and Courses | LLMs and Giotto Course; Deep dive |
| Troubleshooting and FAQ | Troubleshooting; FAQ |

La navigazione proposta deve quindi usare categorie come macro-sezioni e sezioni come gruppi espandibili, senza inventare una nuova IA parallela.

## Preview mock locale

Poiché l'accesso diretto all'account Zendesk non è ancora disponibile, il progetto include `mock/`, una preview statica indipendente da ZCLI. Il mock contiene la stessa tassonomia locale, 57 record articolo, routing hash-based per homepage/categorie/sezioni/articoli e ricerca locale. Si avvia con `corepack yarn mock` e ascolta su `http://127.0.0.1:4173`.

Il mock serve per validare rapidamente layout e interazioni. Non sostituisce il rendering Curlybars: il markup è stato trasferito nei template Giotto-theme, mentre il dataset locale resta disponibile per il preview offline.

## Direzione visuale

- Header compatto, con logo/nome Giotto a sinistra e azioni essenziali a destra.
- Sidebar desktop persistente, larga circa 16rem, con stato attivo, gruppi collassabili e scroll indipendente.
- Topbar della documentazione con breadcrumb, ricerca e azioni account.
- Home orientata all’ingresso: ricerca principale, card delle 5 aree, collegamenti rapidi a API/Cloud/on-prem e articoli iniziali.
- Pagine articolo a due colonne: outline/indice a sinistra, contenuto centrale, indice degli heading a destra quando lo spazio lo consente.
- Superficie quasi neutra, bordi sottili, angoli moderati, accent color Giotto, tipografia sans moderna e blocchi codice con contrasto elevato.
- Responsive reale: sidebar trasformata in drawer su mobile, ricerca in primo piano, breadcrumbs compatti.

## Modifiche proposte per file

### Shell e navigazione

- `templates/header.hbs`: sostituire la navigazione orizzontale dominante con una topbar documentale; introdurre trigger accessibile per la sidebar mobile e lasciare le azioni Zendesk esistenti come menu secondario.
- `templates/footer.hbs`: renderlo minimale, con lingua, supporto e link legali.
- `templates/document_head.hbs`: aggiungere classi/attributi della nuova shell, preload della font scelta se approvata e metadati per il comportamento responsive; mantenere l’import map dei moduli Zendesk.
- Nuovo partial, se il runtime Curlybars lo consente: `templates/_docs_sidebar.hbs`, riusato da home, sezione e articolo. In alternativa, replicare il markup minimo nei tre template per ridurre il rischio di incompatibilità con Curlybars.

### Homepage e discovery

- `templates/home_page.hbs`: sostituire l’hero fotografico con una hero documentale composta da titolo, descrizione, ricerca prominente e card delle categorie.
- `templates/category_page.hbs`: introdurre una vista di categoria con descrizione, sezioni in gruppi e conteggio/anteprima articoli.
- `templates/section_page.hbs`: mostrare titolo, descrizione, elenco articoli con stato promoted e una sidebar coerente con la categoria corrente.
- `templates/search_results.hbs`: allineare i risultati al pattern docs, con filtri/contesto, titolo, excerpt e sezione di appartenenza.

### Pagine articolo

- `templates/article_page.hbs`: mantenere author, data, voti, commenti e related articles; aggiungere però una struttura più editoriale, con contenitore leggibile, callout, codice e ancoraggi heading.
- `src/navigation.js` o un nuovo modulo `src/docs-navigation.js`: gestire apertura/chiusura sidebar, stato attivo, persistenza locale della sidebar e pulsante “torna su”.
- `src/search.js`: aggiungere shortcut da tastiera per il focus della ricerca e, se supportato dal markup Zendesk, un command/search overlay ispirato a shadcn.

### Sistema visuale

- `styles/_variables.scss`: introdurre token Giotto per superfici, bordi, testo secondario, accent, focus ring, raggi e larghezze della shell.
- Nuovi partial SCSS: `styles/_docs-shell.scss`, `styles/_docs-sidebar.scss`, `styles/_docs-content.scss`, `styles/_code.scss`, `styles/_callouts.scss`.
- `styles/index.scss`: importare i nuovi partial in un ordine che lasci intatti i moduli Zendesk e consenta override mirati.
- Ridurre il peso di `styles/_hero.scss` e delle regole homepage fotografiche; mantenere gli asset manifest solo se servono alla compatibilità del tema esistente.

## g-ui / shadcn

`g-ui` non è direttamente compatibile con il tema senza una migrazione rischiosa: il tema usa React 17 e styled-components/Garden, mentre `g-ui` usa React 19, Tailwind 4 e Base UI. Importare i componenti React di `g-ui` produrrebbe potenzialmente due runtime React e problemi nel bundle Rollup.

Propongo quindi questa integrazione pragmatica:

1. usare i token di `g-ui/src/index.css` come riferimento per colori, radius, focus ring e tipografia;
2. portare nel tema, in SCSS/HTML accessibile, i pattern `Sidebar`, `Button`, `Breadcrumb`, `Command`, `Badge`, `Card` e `Callout`;
3. usare componenti shadcn come sorgente dei pattern comportamentali solo per le nuove interazioni vanilla JS;
4. lasciare invariati i moduli React Garden esistenti finché non emerge un requisito che giustifichi una migrazione React.

In questo modo la UI resta coerente con Giotto/g-ui senza introdurre Tailwind nel pipeline Zendesk o rompere i bundle già supportati.

## Piano di implementazione

### Fase 1 — foundation

Token, font, topbar, sidebar responsive, layout base e ricerca. Verifica desktop/mobile e accessibilità della navigazione.

### Fase 2 — content templates

Homepage, category, section, search results e article page. Mappatura dei contenuti pubblici di docs.giotto.ai e stati vuoti coerenti.

### Fase 3 — reading experience

Indice articolo, heading anchors, code blocks, callout, tabelle, copy-to-clipboard e related articles.

### Fase 4 — QA Zendesk

Build Rollup, test Jest esistenti, audit a11y, verifica RTL/localizzazione, preview con ZCLI e controllo dei template di community/service catalog/non-authenticated.

## Rischi da tenere sotto controllo

- Curlybars non è Handlebars completo: partial, helper e condizioni devono essere verificati con ZCLI.
- La sidebar globale non riceve automaticamente tutta la tassonomia del Help Center in ogni template; potrebbe servire una soluzione ibrida basata sui dati disponibili nel contesto della pagina.
- Gli heading dell’articolo sono HTML già renderizzato da Zendesk: l’indice richiederà parsing client-side e dovrà essere robusto verso contenuti non uniformi.
- La Cloudflare challenge impedisce una verifica anonima automatica della UI live di docs.giotto.ai; la struttura dei contenuti è stata comunque verificata via API pubblica Zendesk.
