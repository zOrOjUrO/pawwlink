# PawLink — Brand Identity

> Reference doc. Do **not** apply to the frontend yet — frontend scaffolding comes later.

## Name
**PawLink**

## Taglines (pick one later)
1. **Every paw, back home.**
2. **Reuniting rescues, one scan at a time.**
3. **The network that brings them home.**

## Color Palette
| Role | Name | Hex | Use |
|------|------|-----|-----|
| Primary | Rescue Teal | `#1B9C8F` | Brand color, primary buttons, links, active states |
| Secondary | Deep Slate | `#1F2A37` | Headers, body text, nav bars, high-contrast surfaces |
| Accent | Amber Alert | `#F4A340` | Triage warnings, CTAs, highlights, severity badges |
| Support — Success | Meadow Green | `#3FB97A` | Match found, healthy triage, confirmations |
| Support — Danger | Signal Red | `#E0533D` | Critical triage, urgent severity, errors |
| Neutral — BG | Soft Cloud | `#F7F9FA` | App background, cards |
| Neutral — Border | Mist Gray | `#D9E0E3` | Dividers, input borders, muted text |

**Rationale:** Teal reads as trustworthy/civic-tech and clinical-clean without feeling cold. Amber gives an actionable "alert" tone fitting for triage. Green/red support colors map directly to the severity score for instant visual triage.

## Typography
- **Headings:** *Plus Jakarta Sans* (or Poppins fallback) — geometric, friendly, modern.
- **Body / UI:** *Inter* — highly legible at small sizes, excellent for dense data tables and the Digital Passport view.
- **Mono (IDs, embeddings, debug):** *JetBrains Mono* or *IBM Plex Mono*.

Scale suggestion: 32 / 24 / 20 / 16 / 14 / 12 px, 1.5 line-height for body.

## Logo Concept
A rounded **paw pad** where the four toe beans are rendered as **network nodes** connected by thin link-lines back to the central pad — visually fusing "paw" + "connected network." The negative space between the central pad and the toes can subtly suggest a location pin / heart.

*Prompt for an image generator:*
> Minimalist flat vector logo of a dog/cat paw print where each toe bean is a glowing circular network node connected by thin lines to the central pad, forming a small mesh network. Teal (#1B9C8F) primary with one amber (#F4A340) accent node. Clean, civic-tech, friendly, rounded geometry, white background, scalable, no text.

## Icon Concept
A single **paw pad merged with a connectivity graph** — three or four small nodes (toes) linked to a central pad by edges, suggesting both a paw and a federated network of databases finding a match. Works as a favicon and app icon at 16px. Amber accent node signals the "active link" / live match.

## Tone of Voice
Professional but warm. Civic-tech but approachable. We speak to shelter volunteers under pressure: **clear, calm, reassuring, never clinical-cold or cutesy.**

- ✅ "We found a likely match. Notifying the owner now."
- ✅ "No match yet — we've alerted local community channels."
- ❌ "ERROR: query returned null."
- ❌ "OMG a lost doggo!! 🐾🐾"

Lead with action and reassurance; keep jargon out of user-facing copy.
