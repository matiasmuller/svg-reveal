# SVG Reveal

Small JavaScript utility for progressively revealing SVG drawings made of lines and strokes.

The package is intentionally focused: it is meant for line-based SVG illustrations, diagrams, icons, and technical drawings. It is not trying to replace general animation libraries.

> Project status: early prototype. The current API is usable, but the public package direction is documented in `docs/project-principles.md`.

## Usage

```js
import { animateSvg, parseSvgString } from "svg-reveal";

const svg = parseSvgString(svgSource, { document });
document.querySelector("#stage").replaceChildren(svg);

const result = animateSvg(svg, {
  duration: 4000,
  textRenderRatio: 0.2
});

console.log(result.segmentCount, result.textCount);
```

You can also animate any existing `SVGSVGElement` in the DOM:

```js
import { animateSvg } from "svg-reveal";

animateSvg(document.querySelector("svg"), {
  duration: 2500
});
```

## API

### `animateSvg(svg, options)`

Animates `path`, `line`, `polyline`, `polygon`, `circle`, `ellipse`, `rect`, and `text` nodes.

Main options:

- `duration`: total duration in milliseconds. Defaults to `4000`.
- `textRenderRatio`: proportion of the time dedicated to letter reveal. Defaults to `0.2`.
- `minSegmentLength`: ignores segments shorter than this length. Defaults to `0.5`.
- `minSegmentDuration`: minimum duration for a segment. Defaults to `80`.
- `fillFadeDuration`: fill fade duration. Defaults to `180`.
- `random`: `Math.random`-compatible function, useful for deterministic tests.

Returns a summary with `segmentCount`, `textCount`, `xt`, `velocity`, and `animations`.

### `parseSvgString(source, options)`

Parses SVG text and returns an `SVGSVGElement` imported into the target `document`.

Options:

- `document`: target document. Defaults to `globalThis.document`.
- `removeDimensions`: removes `width` and `height` for responsive layouts. Defaults to `true`.
- `ariaLabel`: accessible label applied to the SVG. Defaults to `"SVG animado"`.

## Limitations

- Dashed strokes can conflict with the stroke reveal technique because both use `stroke-dasharray`.
- Complex SVGs exported from design tools may need cleanup before they animate well.
- Text animation exists in the prototype, but the core package direction is SVG stroke reveal.
- The package does not aim to replace GSAP, Framer Motion, or other general animation libraries.

## Playground

The prototype includes a local playground. Because it uses ES modules, run it through the local server:

```bash
npm run playground
```

Then open `http://localhost:4173/`. The playground is not included in the published package because `package.json` limits published files with `files`.

## Development

```bash
npm run build
```

## Repository Quality

This repo is intended to be public and portfolio-ready. Keep commits ordered, update `CHANGELOG.md` for visible changes, avoid unnecessary files, and keep documentation aligned with the package behavior.
