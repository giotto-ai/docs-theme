# Giotto local mock

This is a dependency-free local preview for the Copenhagen redesign work. It uses a local dataset shaped like the public Giotto Help Center: 5 categories, 16 sections, and 57 article records. Article bodies are intentionally short mock content so we can iterate on layout without Zendesk access.

## Run

From the theme root:

```bash
corepack yarn mock
```

Then open <http://127.0.0.1:4173>.

To use another port:

```bash
GIOTTO_MOCK_PORT=4180 corepack yarn mock
```

The mock supports:

- homepage category cards;
- expandable category/section sidebar;
- category and section routes;
- article routes with breadcrumbs and table of contents;
- full-text local search and `⌘ K` search dialog;
- responsive mobile sidebar.

The mock is deliberately separate from `templates/` because Curlybars is rendered by Zendesk. Once the visual direction is approved, the same markup and states can be ported into Copenhagen templates and the local dataset can be replaced by Zendesk helpers.

## Design-system alignment

The preview follows the GiottoOS/g-ui token contract for neutral surfaces, Inter-style typography, borders, focus rings, and primary actions. Its markup also exposes shadcn-compatible `data-slot` roles for `sidebar`, `button`, `card`, `badge`, `breadcrumb`, `command`, `input`, and `item`. This keeps the static mock portable to the React components in `g-ui` if a later screen moves out of Curlybars.

The static preview uses Lucide-compatible inline SVG paths for search, navigation, arrows, external links, and code-copy states. This keeps the icon output consistent with `lucide-react` without adding a second runtime to the vanilla mock.
