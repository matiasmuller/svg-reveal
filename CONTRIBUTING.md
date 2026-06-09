# Contributing

This project is intended to remain small, focused, and clean.

## Guidelines

- Keep changes focused and easy to review.
- Use semantic commits such as `feat:`, `fix:`, `docs:`, `test:`, `refactor:`, and `chore:`.
- Update `CHANGELOG.md` for visible changes.
- Update documentation when public API or behavior changes.
- Avoid unnecessary dependencies, especially runtime dependencies.
- Do not commit generated files unless the project explicitly decides to publish them.
- Do not commit temporary files, logs, local screenshots, backups, or abandoned experiments.
- Prefer readable code over clever abstractions.

## Before Publishing

Run the available quality checks before preparing a release:

```bash
npm run build
```

As the project matures, add linting, type checking, and tests before publishing stable versions.
