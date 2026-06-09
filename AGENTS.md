# Project Instructions

This repository is intended to be public, publishable as an npm package, and suitable as part of a professional portfolio.

Keep the project deliberately small and polished. The core goal is to reveal SVG drawings progressively, especially SVGs made from lines and strokes. Avoid expanding it into a general animation library.

## Repository Standards

- Keep commits small, ordered, and semantic.
- Maintain `CHANGELOG.md` for user-visible changes.
- Avoid unnecessary files, abandoned experiments, generated artifacts, and unused assets.
- Keep the package structure easy to understand.
- Prefer readable code over clever abstractions.
- Keep runtime dependencies at zero unless there is a strong reason.
- Update documentation when public behavior or API changes.
- Treat the repo as production-facing even while the package scope remains modest.

## Current Direction

The technical direction is documented in `docs/project-principles.md`. Before broad API changes, keep the public surface focused on SVG stroke reveal behavior and verify that the README, changelog, and package metadata still match the implementation.
