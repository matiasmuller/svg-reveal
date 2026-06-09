# Project Principles

This repository is intended to be public, publishable as an npm package, and suitable as part of a professional portfolio.

The scope is intentionally small: provide a clean way to progressively reveal SVG drawings made mainly of lines and strokes.

## Product Scope

- Focus on SVG stroke reveal, not general-purpose animation.
- Prioritize `path`, `line`, `polyline`, `polygon`, `circle`, `ellipse`, and `rect`.
- Treat groups as containers for finding animatable children.
- Keep text animation secondary to the stroke reveal use case.
- Avoid advanced support for dashed lines in the first stable version; document the limitation instead.
- Fail safely when SVGs contain unsupported, hidden, malformed, or zero-length elements.

## Public API Direction

The preferred long-term API is small and explicit:

```js
import { revealSvgLines } from "svg-line-reveal";

const reveal = revealSvgLines(svgElement, {
  duration: 1200,
  delay: 0,
  stagger: 80,
  easing: "ease",
  mode: "sequential"
});

reveal.play();
```

Expected instance methods:

- `play()`
- `reset()`
- `finish()`
- `destroy()`

Potential options:

- `selector`
- `duration`
- `delay`
- `stagger`
- `easing`
- `mode`
- `reverse`
- `autoPlay`
- `preserveExistingStyles`
- `respectReducedMotion`

## Repository Standards

- Keep commits small, ordered, and meaningful.
- Maintain a clear changelog from the beginning.
- Avoid unnecessary files, generated artifacts, and unused experiments.
- Keep the package structure clean and understandable.
- Prefer simple, readable implementation over excessive abstraction.
- Document public APIs and usage examples clearly.
- Keep runtime dependencies at zero unless there is a strong reason.
- Treat repository quality as part of the feature, not as decoration.

## Definition of Done for v0.1.0

- The package can be installed locally.
- The build passes.
- The README explains installation, usage, limitations, and project status.
- `CHANGELOG.md` has a `0.1.0` entry.
- Basic tests cover element detection, stroke style application, reset, finish, destroy, and empty SVG behavior.
- The package exposes a minimal public API.
- The repository has no obvious temporary files, unused assets, or abandoned experiments.
