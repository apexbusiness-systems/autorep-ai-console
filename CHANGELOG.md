# AutoRep AI — System Changelog

## v1.1.0-rc.1 (April 6, 2026) - *Investor Demo Readiness Release*

### ✨ Premium UX & Architecture Enhancements
* **Apple-Grade PWA Ecosystem**: Architected comprehensive mobile web App functionality with `manifest.json`, offline-capable Service Worker, iOS specific meta-tags for notch/safe-area (`viewport-fit=cover`, `black-translucent` status bar) and zero-zoom scaling constraints for native iOS feel.
* **Component-Level Motion & Layout**: Overhauled React styling engine by removing Vite constraints and implementing dynamic Tailwind CSS keyframe rendering.
* **Splash Screen Initialization**: Implemented `SplashScreen.tsx` orchestration engine to deliver a 2.7s luxury-brand fade/scale entrance immediately after application cold-boot.

### 📊 Reactivity & State Simulation (`use-store.ts`)
* Configured real-time, event-based reactive state persistence mirroring Supabase endpoints to ensure deterministic multi-agent behavior across Demo modes.
* Standardized date generation utilities to inject dynamic relative timestamps replacing stale mocked datetimes, ensuring UI representations are always up-to-date.

### 📈 Manager KPI Dashboard & Demo Simulator
* **Recharts Visualizations**: Integrated performant SVG charting interfaces within `ManagerPage.tsx` to visualize Conversion Funnel Metrics, AI Handle Rate (vs Human), Lead Souce Distribution, and Conversation Sentiment.
* **Workflow Automation Engine**: Created floating (Ctrl+Shift+D) `DemoSimulator.tsx` invisible control surface that triggers localized state mutations to demonstrate full 9-step simulated "Hot Lead" acquisition lifecycle (Inbound → Soft Pull → Handoff → Pre-Qual → Appointment logic).

### 🛠 Security & Audit Improvements
* Extensible Domain models updated in `domain.ts` targeting `stage_updated` and `sentiment_changed` action events.
* PWA `public/sw.js` network resilience handling instantiated.
