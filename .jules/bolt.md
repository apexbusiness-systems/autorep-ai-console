## 2026-04-06 - Missing array memoization caused unnecessary renders
**Learning:** Found that pages like `ManagerPage` and `LeadsPage` were doing expensive array `.filter` operations (e.g. `conversations.filter(...)`) synchronously during render, recalculating even when the underlying data hadn't changed (e.g. just switching tabs).
**Action:** When a page calculates derived lists or counts from store arrays, wrap them in `useMemo` so they're only recomputed when the array data itself changes.
## 2025-04-07 - Zustand store selector anti-pattern causes excessive re-renders
**Learning:** Discovered that returning derived arrays directly within `useStore` selectors (e.g., `useStore(s => s.quotes.filter(...))`) breaks referential equality in Zustand, causing components to re-render on *every* store update (even unrelated ones).
**Action:** When deriving data from the global store, select the entire list (or necessary slice) via the selector first, then apply the derivation (like `.filter()` or `.find()`) locally using `useMemo`.
## 2025-04-08 - Missing array memoization caused unnecessary renders on keystrokes
**Learning:** Found that `LiveAgentConsole` was doing expensive array `.filter` operations (e.g. `messages.filter(...)`) synchronously during render, recalculating even when the underlying data hadn't changed, notably on every keystroke when `inputValue` changes.
**Action:** When a page calculates derived lists from store arrays, wrap them in `useMemo` so they're only recomputed when the array data itself changes.
## 2025-04-09 - Zustand `useStore` strict equality anti-pattern
**Learning:** Found that fallback empty arrays (e.g. `s.messages[id] || []`) in `useStore` selectors cause consumers to re-render on *every* single state change (even unrelated ones) because `[] !== []` and Zustand uses strict reference equality (`===`) by default.
**Action:** Always declare a module-level constant like `const EMPTY_ARRAY = []` and return that as the fallback in Zustand selectors when an array field might be missing.
## 2026-04-10 - Deferred Search Queries
**Learning:** Found that `searchQuery` in `ConversationsPage` was directly tied to a `useMemo` block that filtered a list synchronously on every keystroke, leading to possible UI stuttering.
**Action:** When performing list filtering based on user input, use React's `useDeferredValue` to defer the expensive filtering operation while keeping the input responsive.
## 2025-04-17 - Avoid duplicated inline array traversals in different useMemo blocks
**Learning:** Found that `ManagerPage` was recalculating the same O(N) array `.filter` operations for `aiCount` and `humanCount` multiple times across different `useMemo` hooks (`handlerData` and `timelineData`).
**Action:** When the same derived array calculation is needed by multiple sibling component states, extract it into its own component-level `useMemo` hook and pass it as a dependency, preventing redundant traversals.
## 2025-04-18 - Single-pass array reduction instead of multiple .filter() calls
**Learning:** Found that pages like `ManagerPage`, `LeadsPage`, and `FinancePage` were chaining multiple `.filter().length` or similar operations on the same large array (e.g., `conversations`, `followUpTasks`, `packets`) sequentially inside `useMemo` hooks. This caused multiple O(N) traversals and redundant array allocations.
**Action:** When deriving multiple subsets or counts from the same list, replace multiple `.filter()` calls with a single-pass `for` loop to categorize or count items simultaneously. This prevents redundant O(N) array traversals and reduces intermediate memory allocations.
## 2024-05-18 - Single-Pass Array Reduction\n**Learning:** Found multiple chained `.filter()` calls on large lists in `VehiclesPage.tsx` and `ConversationsPage.tsx`, which causes multiple O(N) traversals and redundant array allocations.\n**Action:** Replaced chained `.filter()` operations with a single pass that combines all condition checks. Also realized that the return of `.filter()` is a new array, which means it can be safely sorted directly (e.g., `filtered.sort(...)`) instead of spreading into a new array (`[...filtered].sort(...)`).
