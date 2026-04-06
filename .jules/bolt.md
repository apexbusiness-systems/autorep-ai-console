## 2026-04-06 - Missing array memoization caused unnecessary renders
**Learning:** Found that pages like `ManagerPage` and `LeadsPage` were doing expensive array `.filter` operations (e.g. `conversations.filter(...)`) synchronously during render, recalculating even when the underlying data hadn't changed (e.g. just switching tabs).
**Action:** When a page calculates derived lists or counts from store arrays, wrap them in `useMemo` so they're only recomputed when the array data itself changes.
