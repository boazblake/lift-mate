# Lift-Mate Tasks

## Legend
- `[ ]` pending
- `[/]` in progress
- `[x]` done
- `[~]` blocked

---

## iOS Native Plugin Refactor
- [x] Delete old `CapacitorMediaPipe` plugin structure
- [x] Create new `MediaPipePlugin.swift` with Capacitor bridge
- [x] Update Podfile and Xcode project
- [/] Rename `MediaPipeProcessor.swift` (typo in untracked file — `Proccessor`)
- [ ] Wire up camera preview → MediaPipe → pose data stream
- [ ] Test on-device pose detection

## Home Screen
- [x] Convert `Home.js` → `Home.ts`
- [ ] Design mockup in `docs/design/`
- [ ] Implement workout list with real data
- [ ] Loading / empty / error states

## Exercise Screen (`/pose`)
- [x] Camera + canvas overlay pipeline
- [x] MediaPipe holistic integration (web)
- [ ] Polish exercise selector UX
- [ ] Visible rep counter overlay
- [ ] Form feedback status indicators
- [ ] Recording control UX polish
- [ ] Exercise completion flow
- [ ] Wire up production exercise logic (`src/exercises/`) to pose screen

## Playback (`/playback`)
- [ ] Recording browser / list view
- [ ] Timeline scrubber
- [ ] Recording metadata (date, duration, exercise type)
- [ ] Empty state ("no recordings")

## Progress (`/progress`)
- [ ] Entire screen — currently a stub
- [ ] Stats dashboard / charts
- [ ] History / goals / achievements

## App Shell
- [ ] Settings screen
- [ ] About screen
- [ ] Active tab highlighting
- [ ] Dark mode (uncomment Ionic dark palette)

## Infrastructure
- [x] Set up opencode config + AGENTS.md + designer subagent
- [ ] Install test framework (vitest + cypress)
- [ ] Wire up `ledger.md` for session logging
