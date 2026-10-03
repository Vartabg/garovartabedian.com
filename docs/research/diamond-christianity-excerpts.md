# Diamond Christianity essay: source and playback notes

Reviewed 2026-09-07. Scope: Christianity only.

## Source

- Official upload: [PowerfulJRE, Joe Rogan Experience #2549 — Jared Diamond](https://www.youtube.com/watch?v=t6Jrww8kG24), September 3, 2026; runtime 2:28:14.
- English automatic captions exported from that YouTube watch page using the browser transcript export.
- Export SHA-256: `afa3ab6d1320df7fcf1ca39b4229d172de24130143b95d34d3e0490695e50b38`.
- Cross-check: [Podscripts transcript](https://podscripts.co/podcasts/the-joe-rogan-experience/2549-jared-diamond).
- No full transcript or media copy is republished. The short quote selections total 24 words.
- Timing comes from YouTube captions, not independent auditory transcription. Exact speech and keyframe boundaries can differ slightly from caption timestamps. The official recording remains authoritative.
- The Podscripts timestamps in these passages are 34 seconds later than the YouTube captions. Do not copy podcast timestamps into this player's links.

## Selected ranges on the YouTube timeline

| Topic | Start | End | Editorial context |
| --- | --- | --- | --- |
| Paul and Jesus' message | 13:10 | 13:50 | Includes Diamond's positive assessment of Jesus' message. |
| Mark's composition | 14:11 | 14:25 | Includes the full dating claim; stops as Rogan responds. |
| Miracles and growth | 20:15 | 20:43 | Distinguishes skepticism about doctrines from a claim about their role in expansion. |
| Family life, nursing, longevity | 20:43 | 21:56 | Keeps demographic assertions in their original context; analysis does not present them as established measurements. |
| Literacy and concluding claim | 21:56 | 22:17 | Retains the literacy assertion and qualifies it using Pliny's correspondence. |

All five selected quotations are Diamond's; surrounding dialogue can include Rogan. Sentence punctuation is editorial; an ellipsis marks the omitted hesitation between the words about scientific understanding. No inference about Rogan's motives is presented. No claims about other religions are included in the essay or selected ranges.

## Historical basis

The essay links each historical paragraph to its relevant source: Galatians 1, 1 Corinthians 15–16, 2 Corinthians 8, Yale's lecture on Mark, Eusebius 7.22, Pliny 10.96–97, and Ehrman's critique of epidemic-growth reconstructions. Early belief is distinguished from proof of the resurrection; Paul's practical organization is not denied; later community reports are not treated as population-wide measurements.

## Playback

The click-to-load player uses YouTube's privacy-enhanced embed, absolute `start` and `end` seconds, inline mobile playback, and requested English captions. Native YouTube controls remain available. Only one iframe is mounted at a time; replay remounts from the selected start. Closing returns focus to the initiating button. Timed source links and the essay remain usable without JavaScript or if YouTube refuses playback.

The official player controls ads, consent, regional restrictions, caption availability, and authentication requirements. No promise of ad-free or universally available playback is made. Player parameters: [YouTube documentation](https://developers.google.com/youtube/player_parameters).

Only this article route permits `https://www.youtube-nocookie.com` in `frame-src` and opts out of COEP isolation for compatibility with the external iframe. Other routes retain their existing framing and WASM isolation policies. Both middleware and fallback headers are covered by tests.

The root DocumentPolicyBoundary reloads the document when App Router navigation crosses into or out of the essay. HTTP document policies do not change on client navigation; without this boundary, entering from History would keep its restrictive framing policy, and leaving the essay would not restore reader isolation.

## Verification

- Lint, TypeScript, 619 unit tests, 40 smoke tests, and the full production build passed with Node 24.
- Each selected quotation was matched to the caption text inside its declared playback range; the documented ellipsis accounts for one hesitation.
- Chrome desktop and a 390-pixel viewport: click-to-play, inline playback, captions, single-player switching, and no horizontal overflow. The first two clips were observed stopping at 830 and 865 seconds respectively.
- Production preview: navigated from History into the essay, played the Paul excerpt, and returned to History. No console errors were observed in that check.
- Production HTTP responses: only the essay allows the YouTube frame origin and uses `COEP: unsafe-none`; History and Scripture search retain `credentialless`.
- Actual iOS/Android hardware and browsers other than Chrome were not tested. YouTube's own playback restrictions remain outside the site's control.
