# ESGCounts brand guidelines

Source of truth: [`ESGCounts_Brandbook.pdf`](./ESGCounts_Brandbook.pdf). Always use these assets and
colours for anything ESGCounts-branded: the website, the dashboard, emails, decks, documents and
generated artifacts. Never redraw the logo or substitute other greens.

The name is written **ESGCounts**, one word: "ESG" in lime, "Counts" in teal.

## Logo files (`public/brand/`)

Vector paths extracted straight from the brandbook (`brand/extract-logos.py` regenerates them).

| File | Use on |
| --- | --- |
| `logo-color.svg` | White or light backgrounds (default) |
| `logo-on-teal.svg` | Teal `#2C5D63` or dark backgrounds (white mark, lime ESG, white Counts) |
| `logo-teal.svg` | Pale lime `#F2FEDC` / light tinted backgrounds (all teal) |
| `logo-white.svg` | Lime `#A9C52F` backgrounds (all white) |
| `mark-teal.svg`, `mark-white.svg` | Leaf-and-bars symbol alone, where space is tight |
| `app-icon.svg` | Favicon / app icon (white mark on teal tile); also `app/icon.svg` |

Wordmark aspect ratio is about 5.56 : 1. Keep clear space around it of at least the height of the "E".

## Colours

**Primary**

| Name | Hex | Role |
| --- | --- | --- |
| Lime | `#A9C52F` | Accent, "ESG", highlights, charts |
| Teal | `#2C5D63` | Main brand colour, buttons, links, headers |
| Dark slate | `#283739` | Headings, body text, dark sections |

**Secondary (supporting tints)**: `#E2FFFF` ice, `#F2FEDC` pale lime, `#F9FBE7` cream, `#DAECE6` mint.

**Neutrals**: `#FFFFFF`, `#F5F5F5`, `#9CA3AF`, `#1B1B1B`.

In code these are Tailwind tokens in `app/globals.css`: `lime-*`, `teal-*` (brand scales, 500 = brand
hex) and `ink-*` (dark slate), plus `ice`, `paleLime`, `cream`, `mint`.

## Typography

- Headings: **Quicksand** (bold/semibold), as used in the brandbook titles.
- Body: **Oxygen**, as used in the brandbook body copy.
- Accent rule under headings: short lime bar (about 34 × 3 px), as on every brandbook page.
