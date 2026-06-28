# Contributing to Pixel Earth

Thank you for your interest in contributing! Pixel Earth is built to last 10+ years — every contribution should be production-quality, modular, and well-documented.

## Ground rules

- **No placeholder code.** Every function must work.
- **No hardcoded content.** All data belongs in typed configuration objects.
- **SOLID principles.** Single responsibility, open/closed, etc.
- **Fully typed.** No `any`. TypeScript strict mode is enforced.
- **Document your public API.** JSDoc comments on all exported classes and functions.

## Getting started

1. Fork the repository
2. Create a branch: `git checkout -b feature/my-feature`
3. Make changes and write tests
4. Run `npm run type-check && npm run lint && npm test`
5. Submit a pull request

## Branch naming

- `feature/` — new functionality
- `fix/` — bug fixes
- `perf/` — performance improvements
- `docs/` — documentation only
- `mod/` — new example mods

## Pull request checklist

- [ ] TypeScript compiles with zero errors
- [ ] ESLint passes with zero warnings
- [ ] New systems are registered via `engine.registerSystem()`
- [ ] New events are declared in `PixelEarthEvents` in `EventBus.ts`
- [ ] New content types are declared in `types.ts`
- [ ] CHANGELOG.md is updated

## Architecture decisions

When in doubt, follow the patterns already established:

- Systems implement `System` and are registered with `GameEngine`
- Cross-system communication goes through `EventBus`
- All entity data lives in `EntityRegistry`
- UI reads from `GameStore` (Zustand); never from the engine directly
- Save state is managed by `SaveSystem`

## Code style

- 2-space indentation
- Single quotes for strings
- Trailing commas in multi-line objects/arrays
- Explicit return types on public methods

## Questions?

Open a GitHub Discussion or join our Discord (link in README).
