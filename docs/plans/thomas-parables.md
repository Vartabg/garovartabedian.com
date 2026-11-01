# Thomas parallels in the Parables room

Baseline: origin/master `2f1cc570aafb96aa83460b560a7c0e2bf9893bf4` at the start of this task. Goal: make sourced parallels in the hosted Gospel of Thomas discoverable from the existing parables, without treating Thomas as a canonical Gospel or changing the 31-story/7-saying list.

Data: add optional structured Thomas saying references to existing rows in `public/jesus/parables.json`. Each is a saying number and a source-backed, short relationship label where needed, including related but distinct material such as the rejected stone (66). Sources must be named, linked, and checked against the hosted Mattison saying and the room's biblical passage. No invented parallels, no suggestion of dependence or authorship. Include relevant short sayings as well as stories where supported. The source list and exact mapping should be reviewable in the data or a note.

UI: render links inside each expanded parable as a separate "Gospel of Thomas · outside the canon" area, independent of the biblical-passage fetch's success. Each link goes to the existing stable `/early/library/gospel-thomas/saying-N` page; never send Thomas through the Scripture-reference parser or include it as a canonical account. Keep existing in-book labels and counts intact. Source and method explain the limits of parallel comparison. Existing no-JS and accessible links must remain usable as appropriate to the room.

Verification: validate every mapped number and its hosted primary-text page, compare exact mapping with sources, test examples including 64, 65–66 and omitted non-parallels, accessibility of links, and run full lint/typecheck/test/build plus relevant browser and a11y checks. If a cited mapping cannot be verified, omit it and report it. Never alter the ancient text.

## Verified mapping and scope

Citations below compare the listed passages; short labels mark partial comparisons. Saying numbering follows the hosted Mattison edition. S = Mahlon H. Smith, Synoptic Gospels Primer, Jesus Speaks in Parables (https://virtualreligion.net/primer/outlines/parables.html); R = Smith, Jesus' Reputation (https://virtualreligion.net/primer/outlines/repute.html); J = Smith, Jesus' Journey to Judea (https://virtualreligion.net/primer/outlines/journey.html); U = Smith, Jesus at Jerusalem (https://virtualreligion.net/primer/outlines/judea.html); P = Smith, Strong Man (https://virtualreligion.net/forum/RLQ/q_powers.html); H = Smith, Parables of Harvest (https://virtualreligion.net/primer/harvest_4.html); B = Richard Bauckham, “Synoptic Parousia Parables Again,” New Testament Studies 29 (1983), 129–134 (https://www.cambridge.org/core/journals/new-testament-studies/article/abs/synoptic-parousia-parables-again/AF875ECAF707C39D6A977A5FEFF19E67); W = J. Gertrud Tönsing, Mending clothes and making wine, Stellenbosch Theological Journal 11 (2026) (https://doi.org/10.17570/stj.2025.v11n1.15); X = IntraText Gospel of Thomas cross references (https://www.intratext.com/IXT/ENG0103/_P5.HTM). Cross-check each against the hosted Mattison text. These sources do not prove dependence.

| Room entry | Thomas | Biblical comparison | Scope | Source |
|---|---:|---|---|---|
| new-patch-new-wine | 47 | Mark 2:21–22 | Wine and patch | W |
| divided-house | 35 | Mark 3:27 | Strong man only | P |
| sower | 9 | Matthew 13:3–9 | Sower | S |
| weeds-among-wheat | 57 | Matthew 13:24–30 | Weeds | S, H |
| mustard-seed | 20 | Mark 4:30–32 | Mustard seed | S |
| leaven | 96 | Matthew 13:33 | Leaven | S |
| hidden-treasure | 109 | Matthew 13:44 | Treasure | S |
| pearl | 76 | Matthew 13:45–46 | Pearl | S |
| net | 8 | Matthew 13:47–48 | Net | S |
| blind-guide | 34 | Matthew 15:14 | Blind guides | R |
| what-defiles | 14 | Matthew 15:11 | What enters and leaves the mouth | R |
| lost-sheep | 107 | Matthew 18:12–14 | Lost sheep | R |
| wicked-tenants | 65 | Mark 12:1–9 | Tenants | U |
| wicked-tenants | 66 | Mark 12:10–11 | Rejected stone following the story | U |
| wedding-banquet | 64 | Luke 14:15–24 | Dinner invitations | J, U |
| watchful-servants | 21, 103 | Luke 12:39–40 | Related thief/watchfulness sayings | B |
| talents-and-pounds | 41 | Matthew 25:29; Luke 19:26 | Related saying on having and receiving | X |
| seed-growing | 21 | Mark 4:29 | Harvest image only, not the growing-seed story | H |
| rich-fool | 63 | Luke 12:16–21 | Rich fool | J |

Do not describe Thomas 21 as a version of the growing-seed parable: Smith notes only the harvest image is shared. Do not assert that all 38 entries have Thomas parallels. At minimum, 64–66 and the listed short-saying mappings must be implemented and tested. Links for the new matches will appear in a server-rendered `<noscript>` list on the room page when scripts are disabled, in addition to links within expanded entries when scripts are enabled. The no-JS fallback does not claim to render biblical passages.

Test links while biblical passages are pending, rejected, null, and retried. Assert Thomas never reaches the passage loader. Resolve every target through `getLibraryPage` and confirm it contains primary text; browser-check keyboard navigation and JavaScript-disabled links. Existing list counts and canon labels must hold.
