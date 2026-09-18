---
name: dapp-react-engineering
description: Implement or refactor React and TypeScript code in this mobile H5 DApp while preserving its existing service boundaries and SCSS conventions.
---

# DApp React engineering

Use this skill for TSX components, hooks, page behavior, rendering performance, local state, asynchronous effects, and focused React refactors.

## Required reading

1. Read `AGENTS.md`, `docs/ai-collaboration.md`, `docs/architecture.md`, and the target module README.
2. Inspect nearby components, hooks, page styles, showcase examples, and tests before adding an abstraction.
3. Read `src/services/dapp/README.md` or `docs/php-api-contracts.md` whenever the React layer touches those boundaries.

## Engineering rules

- Keep state close to its consumer. Do not move page state into Zustand merely to share an implementation detail.
- Use effects for synchronization with external systems, not for derivable render data. Use existing `useLatestRequest()` or `AbortController` when an async result can become stale.
- A page that supports pull refresh must register work that actually awaits its data reload through `usePageRefresh()` and must disable refresh while writes are unsafe.
- Prefer existing components and utility classes. Keep page-specific SCSS below a page root class; retain the template's SCSS and px-to-vw workflow rather than importing a foreign CSS architecture.
- Build pages in normal document flow first: semantic sections, Flexbox or Grid, gaps, padding and responsive sizing own the layout. Do not place content sections, cards, forms, or action bars with absolute or fixed coordinates.
- Positioning is a narrow exception for decorative background art, small icon or badge overlays, and true viewport overlays. Read `docs/layout-standards.md`, add the required immediate `layout-exception` marker in page SCSS, and keep meaningful content in flow.
- Do not treat a design screenshot's pixel coordinates as an implementation requirement. A positioned decorative layer must not determine the placement or size of normal content.
- Treat inspectable Figma layer properties as exact visual requirements. Before styling, read the available font, line-height, letter-spacing, color, opacity, size, spacing, border, radius, shadow, blur and gradient values and implement them without screenshot-based guessing or arbitrary rounding. The normal-flow rule changes the layout technique, not the required visual fidelity.
- Only estimate a Figma property when the exact value cannot be retrieved. Record the estimate and reason, preserve Figma frame values as inputs to the existing px-to-vw pipeline, and compare the rendered result at the design frame width before completion.
- Do not add memoization, lazy loading, or a global abstraction without evidence of a real rendering, bundle, or reuse problem.
- Use precise TypeScript types. External data starts as `unknown`; avoid `any`, non-null assertions, and casts that merely silence the compiler.
- Preserve shared layout and interaction contracts. If a design needs an exceptional header or navigation shape, ask before changing a shared module.

## Validation

Add focused behavior tests for non-trivial logic, run the requested UI verification when applicable, then run lint, test, and the build gate. Report the exact outcome of each command.
