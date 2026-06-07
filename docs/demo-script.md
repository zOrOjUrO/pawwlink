# PawLink — Recorded Demo Script

**Target length:** ~2.5–3 min · **Demo chip:** `528140000123456` · **Control panel:** `/demo` (URL only, never shown on camera)

---

## Pre-flight (before you hit record)
1. Open `/demo` in a tab → click **Reset demo data**. Wait for "seeded". (Gives a clean, photogenic DB.)
2. Confirm `GET /api/health` → `{ status: "ok", mock_vision: false, supabase: "connected" }`.
3. Set role to **Shelter** (nav switch). Close the `/demo` tab.
4. Have the demo chip on your clipboard (the `/demo` "Show demo chip" button copies it).
5. Browser zoom ~110%, hide bookmarks bar, full-screen the window.

---

## Scene 1 — The hook (0:00–0:20)
**On screen:** Landing on `/intake`, role = Shelter.
**Say:**
> "Every year thousands of pets go missing. When a rescue worker finds one, identifying it and reaching the owner can take days. PawLink does it in seconds. We built it with Dierenambulance Den Haag — for shelter workers, pet parents, and adopters."

---

## Scene 2 — Intake → Digital Passport (0:20–1:00)
**On screen:**
- Drag a dog photo onto the dropzone (or use a real found-animal photo).
- Paste the demo chip `528140000123456` into the microchip field.
- Click **Identify Animal** → the "Analyzing with Mistral AI…" overlay shows → redirects to the passport.

**Say (while it analyzes):**
> "I photograph the animal. PawLink's vision model — running on Mistral — generates a Digital Passport: species, breed with confidence, coat pattern, and a triage severity score, all automatically."

**On the passport page, point at:**
- Breed + confidence badge, coat swatches, triage card / severity.

---

## Scene 3 — Federated match + auto-notify (1:00–1:35)
**On screen:** Same passport — scroll to the match section. With the demo chip it resolves to **chip matched → Sophie van der Berg** via the Amivedi registry, with the green "Owner notified via SMS" pill.
**Say:**
> "In parallel, PawLink queries three pet registries — Amivedi, NDG, and PetBase — plus our own visual database using vector similarity. Here it's an exact microchip match: owner found, and an SMS goes out automatically. That's a reunion that used to take days, done in one step."

> *(Optional)* "If there's no chip, the same screen falls back to a visual match against registered pets, or broadcasts a community alert."

---

## Scene 4 — Lifecycle on the dashboard (1:35–2:05)
**On screen:** Nav → **Dashboard**. Show the seeded queue with mixed states (Searching, In care / urgent, Ready for adoption, Reunited). 
- Use the **Mark as…** dropdown on one animal → set **Ready for adoption** (optimistic update).
- Mention the **delete** button for cleaning up entries.
**Say:**
> "Every animal flows through a lifecycle the shelter manages here — searching, in care, ready for adoption, reunited. One urgent case is flagged red for immediate vet attention."

---

## Scene 5 — Roles: Adopter + Pet parent (2:05–2:40)
**On screen:**
- Role switch → **Adopter** → lands on `/adopt`. Show the recovered animal that's ready for adoption → click **I want to adopt**.
- Role switch → **Pet parent** → `/owner/search` → type a breed (e.g. "tabby") or run the chip lookup → result appears.
**Say:**
> "PawLink isn't just for shelters. Adopters get a public board of animals ready for a home. And pet parents who've lost an animal can search what's currently in rescue, or look up a microchip directly. One platform, three audiences — switchable right here."

---

## Scene 6 — Close (2:40–3:00)
**On screen:** Back to `/intake` (clean hero).
**Say:**
> "Photograph, identify, match, notify — PawLink turns a found animal into a reunion in seconds. It's a PWA, it works offline in the field, and it's built to plug into real Dutch registries. Thanks."

---

## Backup / safety nets
- **If a live photo upload is slow or flaky on camera:** use `/demo` → **Simulate intake** (auto-posts a real dog photo → passport). Do this off-camera, then cut to the passport.
- **If Mistral is rate-limited / errors:** set `MOCK_VISION=true` (returns a clean golden-retriever passport instantly) — visually identical for the demo.
- **If a screen looks empty:** re-run `/demo` → **Reset demo data**.
- **Don't show** the `/demo` panel on camera — it's an operator tool, not part of the product.

## One-line value prop (for the title card / thumbnail)
> **PawLink — every paw, back home.** AI animal-rescue intake: photograph → Digital Passport → federated match → instant owner notification.
