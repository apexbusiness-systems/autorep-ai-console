## 2026-04-06 - Missing array memoization caused unnecessary renders
**Learning:** Found that pages like `ManagerPage` and `LeadsPage` were doing expensive array `.filter` operations (e.g. `conversations.filter(...)`) synchronously during render, recalculating even when the underlying data hadn't changed (e.g. just switching tabs).
**Action:** When a page calculates derived lists or counts from store arrays, wrap them in `useMemo` so they're only recomputed when the array data itself changes.
## 2025-04-07 - Zustand store selector anti-pattern causes excessive re-renders
**Learning:** Discovered that returning derived arrays directly within `useStore` selectors (e.g., `useStore(s => s.quotes.filter(...))`) breaks referential equality in Zustand, causing components to re-render on *every* store update (even unrelated ones).
**Action:** When deriving data from the global store, select the entire list (or necessary slice) via the selector first, then apply the derivation (like `.filter()` or `.find()`) locally using `useMemo`.
## 2025-04-08 - Missing array memoization caused unnecessary renders on keystrokes
**Learning:** Found that `LiveAgentConsole` was doing expensive array `.filter` operations (e.g. `messages.filter(...)`) synchronously during render, recalculating even when the underlying data hadn't changed, notably on every keystroke when `inputValue` changes.
**Action:** When a page calculates derived lists from store arrays, wrap them in `useMemo` so they're only recomputed when the array data itself changes.
