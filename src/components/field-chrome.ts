/**
 * Shared chrome for every Orc text-entry component.
 *
 * One beam, one focus contract, written once. Focus is border-only: the border
 * goes green and the beam's green underlay lights, with no outline in any focus
 * path — the resting state of Orc desktop's composer, which is what these
 * fields are meant to look like. Forced-colors keeps a `Highlight` border so
 * high-contrast users still get a system-drawn cue.
 */

export type FieldControl = "textarea" | "input";

/**
 * The beam, the border, the focus rules and the label — everything both fields
 * share. Each component appends its own control-specific rules after this.
 */
export function fieldChromeStyles(control: FieldControl): string {
  return `
    :host {
      display: block;
      font-family: var(--orc-font-sans, Inter, ui-sans-serif, system-ui, sans-serif);
    }

    @property --orc-beam-angle {
      syntax: "<angle>";
      inherits: false;
      initial-value: 24deg;
    }

    @keyframes orc-beam {
      to { --orc-beam-angle: 384deg; }
    }

    label {
      display: block;
      margin-bottom: 6px;
      color: var(--orc-text, #c7cfca);
      font-size: 13px;
      font-weight: 600;
    }

    label[hidden] { display: none; }

    .field {
      --orc-beam-angle: 24deg;
      position: relative;
      isolation: isolate;
      border: 1px solid var(--orc-control-border, #565f89);
      border-radius: var(--orc-radius-md, 0.5rem);
      background: var(--orc-panel, #16181b);
      transition: border-color 0.16s ease-out, outline-color 0.16s ease-out;
    }

    /* A native-CSS glowing surround: the conic gradient is masked down to a 1px
       edge and never sits over field content. */
    .field::before {
      content: "";
      position: absolute;
      inset: -1px;
      z-index: 1;
      padding: 1px;
      border-radius: inherit;
      pointer-events: none;
      background: conic-gradient(from var(--orc-beam-angle),
        transparent 0 58%,
        color-mix(in srgb, var(--orc-green, #9dc76b) 32%, transparent) 66%,
        var(--orc-green, #9dc76b) 73%,
        color-mix(in srgb, var(--orc-yellow, #d5b05c) 76%, var(--orc-green, #9dc76b)) 78%,
        color-mix(in srgb, var(--orc-green, #9dc76b) 34%, transparent) 85%,
        transparent 92% 100%),
        linear-gradient(var(--orc-beam-underlay, transparent) 0 0);
      -webkit-mask: linear-gradient(currentColor 0 0) content-box, linear-gradient(currentColor 0 0);
      -webkit-mask-composite: xor;
      mask: linear-gradient(currentColor 0 0) content-box, linear-gradient(currentColor 0 0);
      mask-composite: exclude;
    }

    @media (prefers-reduced-motion: no-preference) {
      .field::before { animation: orc-beam 7s linear infinite; }
      /* Focus quickens the beam. With no ring, this is the focus cue that
         isn't carried by colour — it survives where a hue change alone
         wouldn't. */
      .field:has(${control}:focus)::before { animation-duration: 3s; }
    }

    /* Focus greens the border and lights a faint green rim under the sweeping
       beam. That is the entire cue — no outline in any focus path, keyboard
       included, so the field looks the same however you reach it. */
    .field:has(${control}:focus) {
      border-color: var(--orc-green, #9dc76b);
      --orc-beam-underlay: color-mix(in srgb, var(--orc-green, #9dc76b) 45%, transparent);
    }

    /* The inner control already has \`outline: 0\`; this also drops the outline
       the UA would draw on the wrapper if a consumer made it focusable. */
    .field:focus-visible {
      outline: none;
    }

    ${control} {
      display: block;
      width: 100%;
      box-sizing: border-box;
      border: 0;
      outline: 0;
      background: transparent;
      color: var(--orc-text, #c7cfca);
      font: inherit;
      font-size: 13px;
      line-height: 1.5;
    }

    ${control}::placeholder {
      color: var(--orc-muted-strong, #565f89);
    }

    /* Same screen-reader-only treatment as <orc-status-dot>'s .sr-only. */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }

    ${control}:disabled {
      color: var(--orc-muted-strong, #565f89);
      cursor: not-allowed;
    }

    /* A disabled field that still glows reads as invitation. Dim the whole
       surround, beam included. */
    .field:has(${control}:disabled) {
      opacity: 0.72;
    }

    @media (prefers-reduced-motion: reduce) {
      .field { transition: none; }
      .field::before {
        animation: none;
        background: linear-gradient(112deg, transparent 12%, var(--orc-green, #9dc76b) 48%,
          color-mix(in srgb, var(--orc-yellow, #d5b05c) 70%, var(--orc-green, #9dc76b)) 58%, transparent 88%),
          linear-gradient(var(--orc-beam-underlay, transparent) 0 0);
      }
    }

    @media (forced-colors: active) {
      .field { border-color: CanvasText; }
      .field::before {
        animation: none;
        background: none;
        -webkit-mask: none;
        mask: none;
        border: 1px solid CanvasText;
      }
      /* The green border is a custom token forced-colors discards, so the
         system Highlight carries the focus cue here. */
      .field:has(${control}:focus) { border-color: Highlight; }
    }
  `;
}

/**
 * Points the control at a visually-hidden description, or at nothing.
 *
 * Mirrors `<orc-dialog>`'s syncDescription: an IDREF pointing at an empty node
 * yields an empty description, which is worse than none.
 */
export function syncDescription(
  root: ShadowRoot | null,
  control: HTMLElement,
  hint: string,
  elementId: string,
): void {
  const description = root?.querySelector<HTMLElement>(".description");
  if (!description) return;

  description.textContent = hint;
  description.hidden = hint === "";
  if (hint === "") {
    control.removeAttribute("aria-describedby");
    return;
  }
  description.id ||= `${elementId}-description`;
  control.setAttribute("aria-describedby", description.id);
}
