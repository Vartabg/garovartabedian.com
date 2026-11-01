# Additional Synoptic figures

Baseline: origin/master fec0f7aa. Add the passages identified in the user's preceding audit to the Parables room, keeping existing entries and stable links. Their classification as parables varies. Group directly comparable passages but say explicitly when the passages are related images rather than the same scene. Use the existing figure shape and passage panel, Greek text, error and retry handling; render a separately headed “More parables and figures of speech” section, rather than claiming the additions all appear in the existing Snodgrass/Trench story selection.

Selection and references:
- Children in the marketplace: MAT 11:16-19, LUK 7:31-35 (Snodgrass index; Just)
- Return of the unclean spirit: MAT 12:43-45, LUK 11:24-26 (Just)
- Closed door: LUK 13:24-30 (Just)
- Going before the judge: MAT 5:25-26, LUK 12:58-59 (Just)
- Doorkeeper: MRK 13:33-37; include LUK 12:35-38 as a related image with a visible note that these are not identical scenes (Just). Luke is also already in watchful servants.
- Householder’s new and old treasures: MAT 13:52 (scholarly https://brill.com/downloadpdf/display/book/9789004680043/BP000014.pdf )
- Physician, heal yourself: LUK 4:23 (Just vocabulary); its note says parabolē here is often translated proverb, not that its words are called a narrative parable.
- Lamp on a stand: MAT 5:15, MRK 4:21, LUK 8:16 and 11:33; Thomas 33 (Just, https://church.catholic-resources.org/Bible/Parables.htm). Label Thomas outside canon, show full hosted translation and include no-script reader link.
- Wedding guests and bridegroom: MAT 9:15, MRK 2:19-20, LUK 5:34-35 (Just)
- Speck and plank: MAT 7:3-5, LUK 6:41-42 (Just)
- Trees and fruit: MAT 7:16-20, LUK 6:43-45 (Just)
- Salt: MAT 5:13, MRK 9:50, LUK 14:34-35 (Just)
- Camel and needle: MAT 19:24, MRK 10:25, LUK 18:25 (Just)
- Sheep in the pit: MAT 12:11-12 (Snodgrass index https://wsproject.org/archive/books/snodgrass.html)
- Father’s gifts: MAT 7:9-11, LUK 11:11-13 (https://www.scielo.org.za/scielo.php?lng=en&nrm=iso&pid=S2305-08532019000100042&script=sci_arttext&tlng=en)
- Two masters: MAT 6:24, LUK 16:13 (Just); Luke is already part of unjust steward. Avoid claiming independent narrative; include the same sourced Thomas 47 comparison already in the unjust steward entry with its context note.

Add citations for selection, say selection is non-exhaustive, and revise the existing absolute source-list sentence so it accurately describes only the original 31 stories. Put each new figure into Find and #parable-... hash lookup; all references must resolve in local WEB, and panel headings/links must distinguish Matthew, Mark, Luke, and noncanonical Thomas. Add 33 to Thomas server loading, no-JS fallback, deployment traces and staged-source validation; preserve all existing gates. Test each source range and unique ID, scripture and Thomas reading, link/Find/hash/error/retry behavior, output traced and staged, a11y opened comparison, visual browser checks and normal full lifecycle and release gates.

## Review corrections

Generalize `JohnFigure` to a shared `ScriptureFigure` with optional Thomas mappings and optional comparison note. John and Synoptic data remain separate; render distinct section labels and source notes. The room, Find, server, trace audit, and release audit all consume the same Synoptic JSON. Original 31-story and seven-saying counts remain scoped to the original collection. The browser shows the whole Mattison saying; note that the lamp is only part of 33 and the two-master image is only part of 47. The in-room note makes Mark/Luke differences explicit. The existing null behavior remains a visible unavailable-text message; rejection retains retry.

The staged release check must verify both the standalone reader and the fully hydrated `/jesus/parables#parable-synoptic-lamp` in a real browser. Scope any existing deployment bypass to requests to the verified staged origin only; block external navigation and requests, never print or save the bypass. Assert the lamp's canonical panels, the complete labeled Thomas 33 text and working standalone link. Exercise failure behavior through injected browser dependencies in tests. Both traces must fail when saying 33 is omitted; staged mapping must fail when its source is absent. Verify all verses in each hosted range; uniqueness spans all lists. Add tests for both direct hash and in-room Find event.

For Matthew/Luke father imagery pair, use Delbert Burkett, https://www.sbl-site.org/wp-content/uploads/2024/12/Burkett_vol2.pdf, in addition to Viljoen for its classification. Felix Just’s full table was accessible to the author through web search, including the lamp and other listings; Brill PDF source returned 403, so use accessible https://scielo.org.za/scielo.php?pid=S2305-08532015000100012&script=sci_arttext for Matthew 13:52 as an additional supporting source.

The staged browser handler uses a non-redirecting fetch for same-origin requests and aborts all redirects. It catches request failures without printing Playwright's header-bearing errors. Real-browser tests verify redirect containment and captured error output; unit tests reject missing and empty Gospel text.
