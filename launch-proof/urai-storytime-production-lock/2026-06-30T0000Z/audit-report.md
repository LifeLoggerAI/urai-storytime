# Audit report

## 1. Repository/access

- Repository: `LifeLoggerAI/urai-storytime`
- Visibility: public
- Access observed: admin/maintain/push/pull/triage available through connector
- Default branch: `main`
- Archived: false
- Observed pre-proof head from indexed file fetches: `6426b5513c8db4db105b57b961037367f07cb931`
- Proof commit created by this pass: see final assistant report for the latest commit SHA after all proof files are written.

## 2. What Storytime claims

Storytime claims to be the URAI narrative engine for converting opted-in life signals, private reflections, and story seeds into structured story sessions, chapters, memory moments, narrator scripts, emotional arcs, and public-safe story shares.

## 3. What actually works from code inspection

DONE / CODE-WIRED:

- Next.js app shell and Storytime route surface.
- `/storytime` private story seed UI.
- Labeled deterministic demo session path through `/storytime/demo`.
- Firebase Auth email/password UI gated on client config.
- Cloud session reader for non-demo session ids when cloud mode is configured and user is signed in.
- Session library query for signed-in users when cloud mode is configured.
- Callable generation path that requires auth, consent, safety screening, quota enforcement, provider readiness, and writes the generated bundle to Firestore.
- OpenAI provider adapter that only runs when `STORYTIME_GENERATION_PROVIDER=openai`, `OPENAI_API_KEY`, and `STORYTIME_OPENAI_MODEL` are present.
- Public-share creation callable requiring auth and explicit consent.
- Public share route with blocked/loading/not-found/revoked/expired/error/ready states.
- Public share revoke callable that marks the share revoked and resets session visibility.
- Voiceover/export queue scaffolding that creates `voiceoverJobs`, `storyExports`, and timeline replay event records.
- Firestore and Storage rule scaffolding.
- Smoke/static tests that assert route, gate, callable, rules, audit, and deployment boundaries.

PARTIAL / GATED:

- AI generation: provider adapter exists but no production secret/model/deployment proof in this pass.
- Persistence: callable code writes Firestore bundles, but no live or emulator write/read proof in this pass.
- Sharing: create/fetch/revoke code exists, but no deployed smoke proof in this pass.
- Auth/account: Firebase Auth UI exists, but production auth config is not verified.
- Export/download: queue records exist; no completed media/export file pipeline or download proof.
- Admin/operator review: Firestore rules have admin-only moderation/audit access, but no admin review UI was found in this pass.

NOT READY / BLOCKED:

- Live production deployment and URL verification.
- Firebase project replacement from placeholder values.
- DNS/SSL evidence for `https://www.uraistorytime.com`.
- Provider safety/legal/child-minor approval.
- Emulator or live Firebase test receipts.
- Real end-to-end generated story proof under deployed functions/rules.

## 4. Feature classification

| Feature | Classification | Evidence / notes |
|---|---:|---|
| Story creation UI | DONE | Form exists with validation, demo fallback, cloud callable path. |
| Deterministic demo story | DONE | `/storytime/demo` builds local deterministic session and labels it as demo. |
| AI provider generation | PARTIAL | OpenAI adapter exists; production secrets/model/deploy proof missing. |
| Session persistence | PARTIAL | Callable writes Firestore records; no emulator/live proof in this pass. |
| User library | PARTIAL | Client query exists; requires Auth/Firebase config. |
| Share links | PARTIAL | Create/fetch/revoke code exists; live proof missing. |
| Revoke/delete flows | PARTIAL | Share revoke exists; user deletion/export/privacy request completion not verified. |
| Export/download | PARTIAL | Voiceover/export queue records exist; no downloadable artifact proof. |
| Safety/moderation | PARTIAL | Blocked term screening, prompt safety text, redaction, audit events exist; no full production moderation review. |
| Auth/account | PARTIAL | Email/password Auth UI exists; production Firebase Auth config unverified. |
| Admin/operator review | NOT STARTED/PARTIAL | Rules cover admin moderation/audit collections; no admin UI confirmed. |
| Deployment | BLOCKED | `.firebaserc` uses placeholder project values. |

## 5. Safety/privacy risks

- Public sharing currently creates safe placeholder body text rather than a verified human/provider reviewed redacted story body. This is safer than leaking private story records, but still needs product/legal signoff.
- Redaction is regex-based and not enough for a child/minor-safe production product by itself.
- The frontend blocks a short list of sensitive terms, while Functions use a separate blocked term list; both are basic guardrails, not full moderation.
- Child/minor age ranges appear in UI. Production launch needs consent, guardian controls, data retention/deletion/export, and content-safety review.
- Firestore rules protect owner collections and revoke public shares, but rules need emulator proof and malicious-user tests before production claims.

## 6. Verdict

Storytime is a real production-wired prototype, not a pure scaffold, but it remains blocked from production readiness until live cloud/provider/deploy/safety proof exists.
