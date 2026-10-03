# Button standard

Status: **enforceable internal contract**

Baseline: **WCAG 2.2 AA**, with the enhanced target, focus, and concurrent-input
requirements below adopted as project requirements.

This standard governs every action control rendered by the site, including
native buttons, icon buttons, button-styled links, and legacy controls while
they are migrated to the shared component. A world's visual language may
change the skin; it may not weaken the interaction contract.

## Standards position

WCAG 2.2 is the current W3C Recommendation and is also ISO/IEC 40500:2025.
WCAG 3 is still an incomplete draft, so it is useful research but is not this
project's conformance target.

The project therefore uses:

- WCAG 2.2 AA as the conformance floor.
- The WCAG 2.2 AAA 44 CSS pixel target and focus-appearance criteria as
  internal requirements.
- A 48 CSS pixel target on coarse-primary-pointer devices, matching the most
  conservative common platform recommendation.
- Native semantics and input-agnostic activation as the default, with no
  mouse-only, touch-only, or stylus-only branch.

Authoritative references:

- [WCAG 2.2 Recommendation](https://www.w3.org/TR/WCAG22/)
- [W3C WCAG 2 overview and ISO status](https://www.w3.org/WAI/standards-guidelines/wcag/)
- [W3C WCAG 3 status](https://www.w3.org/WAI/standards-guidelines/wcag/wcag3-intro/)
- [WAI ARIA Authoring Practices button pattern](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- [Apple Human Interface Guidelines: Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons)
- [Android accessibility API defaults](https://developer.android.com/develop/ui/compose/accessibility/api-defaults)
- [Microsoft touch interactions](https://learn.microsoft.com/en-us/windows/apps/develop/input/touch-interactions)

## Component API

New React code imports the shared primitives from
`src/app/_components/Button.tsx`.

| Primitive | Semantic output | Use |
| --- | --- | --- |
| `Button` | Native `<button>` | An action in the current context. Defaults to `type="button"`. |
| `IconButton` | Native `<button>` | A familiar icon-only action. Requires a non-empty `label`. |
| `ButtonLink` | Next.js link | Internal navigation. |
| `ButtonAnchor` | Native `<a>` | External or document navigation. Adds safe `rel` values for `_blank`. |
| `buttonClassName` | Class recipe only | A semantic element that must share the visual treatment. It does not supply semantics. |

Shared visual props are:

```ts
type ButtonVariant = "primary" | "secondary" | "ghost" | "destructive";
type ButtonSize = "sm" | "md" | "lg" | "icon";

type ButtonVisualProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
};
```

`Button` and `IconButton` additionally support `loading` and `loadingLabel`.
All applicable native element props remain available.

```tsx
<Button type="button" variant="primary" leadingIcon={<SparkleIcon />}>
  Generate summary
</Button>

<IconButton
  type="button"
  label="Close dialog"
  icon={<CloseIcon />}
/>

<ButtonLink href="/work" variant="secondary">
  View work
</ButtonLink>
```

Even though `Button` supplies a safe runtime default, call sites should state
`type="button"` or `type="submit"` when the intent matters. Every literal
native `<button>` in TSX must have an explicit `type` attribute; the smoke
contract enforces this because the HTML default inside a form is submit.

## Variants

### Primary

Use for the single most important forward action in a decision surface. A
page may contain multiple sections with their own primary action, but a single
choice group must not present competing primary buttons.

### Secondary

Use for a normal action or the alternative beside a primary action. This is
the shared component default.

### Ghost

Use for low-emphasis, reversible, or toolbar actions. Its boundary, label,
and focus indicator must remain perceivable in every theme; the absence of a
filled surface is not permission to reduce the target.

### Destructive

Use only for an action with destructive or difficult-to-reverse consequences.
The text must name the action, such as “Delete note,” rather than “OK.” Use a
confirmation or undo path when the consequence is material. Color is a
supplementary cue, never the only cue.

## Sizes and targets

The target is the clickable or tappable region, not merely the painted shape.
Targets must not overlap.

| Size | Visual intent | Normal minimum target | Coarse-pointer minimum target |
| --- | --- | ---: | ---: |
| `sm` | Dense secondary controls | 44 px (`2.75rem`) | 48 px (`3rem`) |
| `md` | Default action | 48 px | 48 px |
| `lg` | Prominent CTA | 56 px | 56 px |
| `icon` | Icon-only action | 44 px square | 48 px square |

The canonical CSS tokens are:

```css
--control-target-min: 2.75rem;
--control-target-coarse: 3rem;
```

The base contract is 44 px. Under `@media (any-pointer: coarse)`, controls grow
to at least 48 px. `any-pointer` is intentional: a touch laptop can have a
fine primary pointer and a coarse secondary touchscreen, and may switch among
mouse, keyboard, touch, and stylus during one session. Do not shrink the base
from a “desktop” user-agent string.

Use `min-block-size` and logical padding rather than a fixed height. Labelled
buttons have content-driven inline size and `max-inline-size: 100%`. Icon-only
buttons have equal inline and block targets. Independent adjacent controls
should normally have an 8 px gap; connected button groups may share an edge
only when every segment independently meets the target requirement.

The web conformance floor is 24 by 24 CSS pixels with defined exceptions, but
that is not the project's normal control size. W3C's enhanced criterion is 44
by 44 CSS pixels. Apple recommends a 44 by 44 point hit region, Android
recommends 48 by 48 dp, and Microsoft recommends 44 by 44 epx with visible
spacing for touch-optimized UI.

- [WCAG 2.2 Target Size (Minimum), 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)
- [WCAG 2.2 Target Size (Enhanced), 2.5.5](https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced)
- [W3C CSS technique C44](https://www.w3.org/WAI/WCAG22/Techniques/css/C44)

## Semantics and accessible names

1. Use `<button>` for an action and a real link for navigation. Do not put a
   link inside a button or a button inside a link.
2. Every native button has an explicit `type="button"`, `type="submit"`, or
   `type="reset"`. Reset requires a documented reason because it is usually
   destructive to entered data.
3. Every control has a concise accessible name. Prefer visible text. An
   icon-only button uses `IconButton label`, `aria-label`, or an equivalent
   programmatic label.
4. When visible text exists, the accessible name contains that exact text,
   preferably at the beginning, so voice users can speak what they see.
5. Decorative icons use `aria-hidden="true"`, do not receive focus, and use
   `currentColor` so they survive forced-color themes.
6. Toggle buttons keep a stable label and expose `aria-pressed`. A changing
   action label such as “Mute”/“Unmute” is a different pattern and must not
   also communicate a contradictory pressed state.
7. Menu buttons expose `aria-haspopup="menu"` and the current
   `aria-expanded` value. Disclosure buttons expose `aria-expanded` and,
   where useful, `aria-controls`.
8. `disabled` means the native action is unavailable. If the control must
   remain focusable so a person can discover why it is unavailable, use
   `aria-disabled="true"`, retain it in the tab order, explain the reason, and
   suppress activation in the handler. The shared primitives intentionally do
   not accept `aria-disabled`: use native `disabled`, or build a client-owned
   specialized control that suppresses every click/submit path before opting
   into focusable ARIA-disabled behavior.

References:

- [MDN `<button>` reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/button)
- [WCAG Name, Role, Value, 4.1.2](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value)
- [WCAG Label in Name, 2.5.3](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html)

## Input and activation

- `Tab` and `Shift+Tab` move focus according to DOM order. Do not use positive
  `tabindex` values.
- A focused button activates with both `Space` and `Enter`. Native HTML
  provides this behavior; custom key handlers must not duplicate it.
- Use the native `click` activation path for a simple action. Do not complete
  an action on `pointerdown`, `mousedown`, or `touchstart`. Activation on the
  release/up event lets a person abort by moving away before release.
- Hover is optional feedback and is added only in a hover-capable precise
  pointer query. No instruction, label, action, or required content may be
  hover-only.
- Stylus, touch, mouse, keyboard, switch, and speech input remain concurrently
  usable. Device detection must not disable an available input modality.
- Focus does not itself submit, navigate, open a dialog, or otherwise change
  context.
- When a button opens a dialog, focus moves into the dialog. When the dialog
  closes, focus normally returns to its trigger. If activation removes the
  trigger, move focus to the logical next point.

References:

- [WCAG Keyboard, 2.1.1](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html)
- [WCAG Pointer Cancellation, 2.5.2](https://www.w3.org/WAI/WCAG22/Understanding/pointer-cancellation)
- [WCAG Concurrent Input Mechanisms, 2.5.6](https://www.w3.org/WAI/WCAG22/Understanding/concurrent-input-mechanisms.html)
- [W3C Pointer Events](https://www.w3.org/TR/pointerevents3/)
- [MDN pointer media feature](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/pointer)
- [MDN hover media feature](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/hover)

## Required states

Every variant implements the states that apply to it:

| State | Contract |
| --- | --- |
| Rest | Label, boundary, and affordance are clear without hover. |
| Hover | Nonessential enhancement only under `(hover: hover) and (pointer: fine)`; causes no layout shift. |
| Focus visible | Persistent two-band or equivalent indicator; never represented by color fill alone. |
| Active/pressed | Immediate visible feedback while depressed; the action still completes on release/click. |
| Toggled/selected | Programmatic `aria-pressed` plus a non-color visual indicator. |
| Loading/busy | Prevents duplicate activation, retains the label and dimensions, exposes `aria-busy`, and announces concise status. |
| Disabled | Visually distinct and semantically unavailable; it does not masquerade as loading. |
| Success/error | A visible message and, when it does not receive focus, a programmatically determinable status message. |

`loading` on the shared button emits `aria-busy="true"`, a `data-loading`
styling hook, and a polite status message from `loadingLabel`. The original
label remains in the accessibility tree. Do not replace it with an unnamed
spinner. Keep loading labels concise, such as “Generating summary.”

Use `role="status"` or an appropriate polite live region for asynchronous
waiting, completion, and result-count messages that do not move focus. Avoid
assertive announcements unless the message is urgent.

- [WCAG Status Messages, 4.1.3](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html)
- [Material Design 3 interaction states](https://m3.material.io/foundations/interaction/states/overview)

## Focus appearance

Every keyboard-operable control has a visible `:focus-visible` indicator. The
minimum project treatment is equivalent to a 2 CSS pixel perimeter with a 3:1
change of contrast. On mixed surfaces, use W3C's two-color technique: two
2-pixel bands whose colors contrast at least 9:1 with each other. Keep a real
CSS outline because forced-color modes may remove box shadows.

The shared default is a white inner band and black outer band. This universal
pair is intentional: theme accents are allowed to blend into imagery, while
black and white retain a 21:1 relationship to one another. World skins may
change shape and surface tokens, but not this focus perimeter.

Focused controls must not be fully hidden by sticky headers, footers, sheets,
or other authored overlays.

- [WCAG Focus Visible, 2.4.7](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html)
- [WCAG Focus Appearance, 2.4.13](https://www.w3.org/WAI/WCAG22/Understanding/focus-appearance.html)
- [WCAG Focus Not Obscured, 2.4.11](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum)
- [W3C two-color focus technique C40](https://www.w3.org/WAI/WCAG22/Techniques/css/C40)

## Color, contrast, and forced colors

- Normal-sized text has at least 4.5:1 contrast against its button surface.
- Large text has at least 3:1 contrast.
- Meaningful icons, boundaries needed to identify a control, and focus
  indicators have at least 3:1 contrast against adjacent colors.
- State, danger, success, or selection is never communicated by color alone.
- Light, dark, world-specific, and user contrast themes all use the same
  semantic tokens and pass independently.

Under `@media (prefers-contrast: more)`, strengthen borders and remove visual
noise that reduces legibility. Under `@media (forced-colors: active)`:

- Keep `forced-color-adjust: auto`.
- Provide an explicit border because gradients and shadows can disappear.
- Use system colors such as `ButtonFace`, `ButtonText`, `Highlight`,
  `HighlightText`, and `GrayText`.
- Preserve a real outline for focus.
- Do not rely on ARIA added to a generic element to receive native button
  system colors; use the native element.

References:

- [WCAG Contrast (Minimum), 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)
- [WCAG Non-text Contrast, 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast)
- [WCAG Use of Color, 1.4.1](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color)
- [MDN `prefers-contrast`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-contrast)
- [MDN `forced-colors`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/forced-colors)

## Motion

Default feedback may use brief color, border, shadow, and small press-position
transitions. It must be purposeful, must not delay activation, and must not be
the only state signal.

Under `@media (prefers-reduced-motion: reduce)` and the site's explicit
reduced-motion preference:

- Remove scale, translation, bounce, and looping decorative motion.
- Stop spinner rotation and present a static busy indicator plus text status.
- Keep state changes immediate and perceivable.
- Never make a person wait for a decorative transition to finish.

- [MDN `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)
- [Apple Human Interface Guidelines: Motion](https://developer.apple.com/design/human-interface-guidelines/motion)

## Text, localization, and responsive layout

- Use real text, `font: inherit`, logical properties, and content-driven
  sizing. Do not bake labels into images.
- A label may wrap when space or text enlargement requires it. Do not clip it
  with a fixed block size or `overflow: hidden` unless the full name remains
  available through an explicitly documented exceptional pattern.
- Controls and labels remain usable at 200% text enlargement and at every
  intermediate step.
- At 320 CSS pixels wide, controls reflow without losing information or
  requiring page-level two-dimensional scrolling.
- Directional icons mirror in right-to-left interfaces when their meaning is
  directional. Icons with an invariant meaning do not mirror.

- [WCAG Resize Text, 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text.html)
- [WCAG Reflow, 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html)

## Exceptions

The following WCAG target-size exceptions exist, but they are not blanket
waivers for project buttons:

- The same function is available through an equivalent conforming target.
- The target is inline within a sentence or block of text.
- The user agent determines the target and the author does not modify it.
- A particular presentation is essential to the information or function.
- For the AA 24 px floor only, an undersized target can meet the spacing
  exception defined by WCAG 2.5.8.

An exception must be documented beside the implementation or in its owning
design note. “It did not fit,” “desktop only,” visual density, and legacy CSS
are not sufficient reasons. A compact painted control may remain visually
small only when a nonoverlapping 44/48 px hit region supplies the actual
target.

The early-writing timeline, Ignatius road, Jesus life maps, and church family
tree use the equivalent-target exception deliberately: crowded SVG/WebGL
marks are noninteractive visualization, and an adjacent labelled native
selector performs the same selection with a nonoverlapping adaptive target.
Do not restore focusable roles to those marks without a collision-safe target
strategy.

## Acceptance matrix

| Area | Required check | Pass condition |
| --- | --- | --- |
| Static semantics | `node --test scripts/smoke/button-contract.test.mjs` | Every TSX native `<button>` has an explicit `type`; `controls.css` retains all adaptive contract hooks and tokens. |
| Component tests | Unit tests for `Button`, `IconButton`, links, loading, and disabled state | Correct element, classes, accessible name, state attributes, safe external-link relation, and no duplicate activation. |
| Keyboard | Tab and Shift+Tab through the page; activate with Space and Enter | Logical focus order, persistent visible focus, expected activation, no trap, and correct focus restoration. |
| Mouse | Hover, press-drag-away, click | Hover does not move layout; drag-away cancels; click activates once. |
| Touch | Current iOS Safari and Android Chrome | Reliable 48 px targets, no overlap, press feedback visible beneath/around the finger, and one activation per tap. |
| Stylus/hybrid | Pen plus touch/mouse/keyboard where available | No modality is locked out; pen requires neither pressure nor hover; switching input works mid-session. |
| Resize/reflow | 200% text sizing and 400% browser zoom to a 320 CSS px viewport | No clipped label, overlap, lost action, or page-level two-dimensional scrolling. |
| Contrast | Each variant and state in every light/dark/world theme | Text and non-text thresholds pass; meaningful state has a non-color cue. |
| Focus | Every focusable variant on solid, image, and gradient surroundings | Indicator meets the two-band/equivalent contract and remains unobscured. |
| Forced colors | Windows High Contrast / `forced-colors: active` | Visible boundary, label, icon, selected state, disabled state, and system-color focus outline; no shadow dependency. |
| Increased contrast | `prefers-contrast: more` | Stronger boundary and legibility without lost state or content. |
| Reduced motion | OS preference and site preference | No transform, bounce, or rotating spinner; busy and pressed state remain perceivable. |
| Assistive technology | VoiceOver/Safari, NVDA/Firefox or Edge, TalkBack/Chrome | Correct name, role, state, keyboard behavior, loading announcement, and focus movement. |
| Voice control | Activate each labelled control by speaking its visible label | Visible label matches or begins the accessible name. |
| Localization | Long-label and RTL fixtures | Text grows or wraps, logical spacing holds, and directional meaning is correct. |

Before a button-system change ships, run the focused smoke test while
iterating, then the repository's normal lint, typecheck, unit, smoke, build,
browser, and accessibility gates required by `AGENTS.md`.
