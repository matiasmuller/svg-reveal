# Changelog

All notable changes to this project will be documented in this file.

This project follows a simple, human-readable changelog format inspired by Keep a Changelog.

## [Unreleased]

### Added

- Added `revealSvg` as the single lifecycle API with `play`, `reset`, `finish`, and `destroy`.
- Added `parseSvgString` for importing SVG strings into the current document.
- Added dependency-free tests and release dry-run scripts.

### Changed

- Focused the public package API on SVG stroke reveal.
- Updated the README with English and Spanish usage, API, and limitation docs.
- Renamed the deterministic random option to `randomFunction`.
- Changed `minSegmentLength` and `minSegmentDuration` defaults to `0`.

### Removed

- Removed maintainer-facing repository notes from the public package surface.
