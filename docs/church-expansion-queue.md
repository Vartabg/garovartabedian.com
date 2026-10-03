# The Church — expansion queue (drafts for review)

The 2026-07-14 enrichment pass shipped every fix, a11y/UX/SEO improvement, and
the two gap-filling road stretches (awakenings + the abuse crisis). This file
holds the **net-new content** that was deliberately *not* auto-merged, because
each entry is either a theological verdict published under your name (the
giants) or needs a real museum/plate image (faces, councils). Review, adjust,
and promote.

---

## 1. New giants — SHIPPED (room now 9, East/West balanced)

Three Eastern/pre-schism giants were authored full and added in chronological
order — each with a primary-source-verified quote and fault source, and the
room's hedging on the contestable claims:

- **Origen of Alexandria** (c. 185–253) — *gift:* first systematic theologian;
  the threefold reading of Scripture (De Principiis IV, verified). *fault:*
  the 553 condemnation + the self-mutilation Eusebius reports and modern
  scholars dispute (Eusebius EH VI.8, verified — hedged).
- **Cyril of Alexandria** (c. 376–444) — *gift:* the Theotokos and the one
  Christ at Ephesus (his 2nd Letter to Nestorius, verified). *fault:* the mob
  violence of his patriarchate and the murder of Hypatia within the climate he
  inflamed (Socrates EH VII.13–15, verified — personal hand hedged as debated).
- **John of Damascus** (c. 675–749) — *gift:* the defense of icons and the
  Greek patristic synthesis (Exposition IV.16, verified). *fault:* his
  refutation of Islam as a "heresy of the Ishmaelites," root of a millennium of
  contemptuous polemic (Sahas, Brill 1972).

**Basil the Great — held, on purpose.** He is genuinely admirable, and his only
real "fault" (a strategic reticence to call the Spirit *God* outright, which
stricter allies read as timidity) does not reach this room's bar of serious,
documented failing. Forcing a fault to fit would betray the room's own honesty.
Recommend he go in **faces** (Cappadocian Greek Christianity), not giants.

**No women yet** (Julian of Norwich, Teresa of Ávila, Catherine of Siena) —
historically defensible for "theologians the church owes," but conspicuous; your
call whether the room's remit stretches to them.

> **RESOLVED 2026-08-24:** the three women shipped in **faces** (English
> anchoritic / Sienese Dominican / Spanish Carmelite), following the same
> logic as the Basil call — the giants room's bar is a serious, documented
> failing, and manufacturing faults for them would betray the room's honesty.
> Teresa and Catherine are the first two women Doctors of the Church; each
> entry carries a verified primary-source quote and a public-domain artwork
> (Met Open Access ×2, Wikimedia CC0 ×1). The giants room stays at nine.

---

## 2. New faces — need a real public-domain / CC0 artwork each

**SHIPPED: Cappadocian Greek (Basil of Caesarea)** — the room's 7th face, per
the Basil-belongs-in-faces call from §1. Verified end to end: art is the Met's
*Mass of Saint Basil* (Subleyras, 1746 — object 439120, `isPublicDomain: true`,
image URL confirmed live), quote is Basil's own defense of the Basiliad
(Letter 94, wording verified against New Advent), and the "today" line carries
the tradition honestly through the 1923 population exchange to the Liturgy of
St. Basil and the vasilopita.

Remaining gaps a comparative reader notices: **medieval**, **modern /
global-South**, **Slavic-Russian Orthodox**, and the **Indian St. Thomas /
Malankara** tradition (already named in `tree.json`'s `oriental.includes` but
with no face). Each new face needs the full `Face` shape **plus** a verified
open-access artwork (Met / Cleveland / Rijksmuseum / Wikimedia PD) with
`objectUrl` + `imageUrl` + `license`.

- **Batrashil review (existing):** the Church-of-the-East face's lone artwork
  (Met 446667) has an *empty* culture field and sits in the Met's **Islamic
  Art** dept, attributed to **Syria** — defensible geographically, but a weak
  representative of Church-of-the-East *Christian* art. Consider swapping for a
  clearer Syriac Christian object, or tighten the caption to name it as a
  Syrian liturgical stole rather than implying it is East-Syriac church art.

---

## 3. New councils — need a plate image each

All seven ecumenical councils + Trent + Vatican I & II are present (complete on
the seven). Optional Western additions the road already mentions but the room
omits: **Constance (1414–18)** — which ended the three-popes schism — and the
**Lateran** councils. Each needs a `councils.json` entry + a
`public/church/councils/<id>.jpg` plate + a `council-plates.json` manifest row.

---

## Also flagged, not yet done (low-risk follow-ups)

- **Contrast — RESOLVED 2026-10-02:** the council/spine muted labels (spine
  labels, tick years, fork years, limb labels, council-map years) were nudged
  from 9–11px to 12px.
- **Sitemap drift — RESOLVED 2026-10-02:** church rooms now derive from
  `WORLD_GUIDES.church.nav` in `sitemap.ts`.
- **Metadata tier — RESOLVED:** all eight world hubs now carry canonical URLs
  and JSON-LD; church is no longer the outlier (verified live 2026-10-02).
