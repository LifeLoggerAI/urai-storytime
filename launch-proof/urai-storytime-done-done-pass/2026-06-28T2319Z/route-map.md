# URAI Storytime route map - done done implementation pass

Timestamp: 2026-06-28T2319Z
Baseline proof commit: 13c7e6adc834c2ced023a0c54e7ca5b914f4fe46

## Routes after this pass

| Route | Status after pass | Notes |
| --- | --- | --- |
| `/` | Existing redirect/surface | Not changed in this pass. |
| `/storytime` | Prototype plus production wiring | Form now validates title/theme/age/mood/source input, labels demo mode, and only exposes cloud create path when cloud/provider/client config gates pass. |
| `/storytime/demo` | Working deterministic demo | Preserved. Clearly labeled demo and not persisted. |
| `/storytime/[sessionId]` | Real-capable gated route | Static-only `dynamicParams = false` behavior removed. Non-demo ids render `CloudSession`, which attempts authenticated Firestore session lookup only when cloud config is ready. |
| `/storytime/settings` | Read-only/gated | Existing settings boundary retained. |
| `/share/story/demo` | Working public-share demo shell | Preserved. Clearly labeled as demo safety shell. |
| `/share/story/[shareId]` | Real-capable gated route | Static-only `dynamicParams = false` behavior removed. Non-demo ids render `ShareStory`, which attempts public share lookup only when public sharing config is ready. |

## Important route truth

- Demo routes are still demo-only and should not be marketed as production generation.
- Real ids are no longer blocked by static route params.
- Cloud session reads require Firebase client env vars, enabled cloud gate, Firebase Auth, deployed rules/indexes, and real data.
- Public share reads require Firebase client env vars, enabled public sharing gate, verified rules/indexes, and real `publicStoryShares` documents.
