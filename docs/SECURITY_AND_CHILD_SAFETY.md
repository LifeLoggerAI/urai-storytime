# URAI-StoryTime Security and Child Safety Plan

## Purpose
URAI-StoryTime is intended to become a family-safe storytelling platform. This document defines the technical safety, privacy, moderation, and operational requirements needed before the product can be considered production-ready.

This document is not legal advice and does not claim legal compliance. Formal legal review is required before launch to families or children.

## Current baseline
The current demo uses:
- Local browser storage only.
- No user accounts.
- No backend.
- No cloud database.
- No persistent child profiles.
- A simple prompt blocklist in the local story engine.
- Browser Web Speech narration.

This is acceptable for a limited demo, but not sufficient for production.

## Safety principles
- Safe before magical.
- Parent controlled.
- Private by default.
- Minimal data collection.
- No hidden recording or passive child data collection.
- No unsafe personalization.
- No public child profiles.
- No public story sharing by default.
- Transparent safety boundaries.
- Human review path for flagged content.
- Legal compliance must be reviewed by qualified counsel.

## Required safety layers

### 1. Input safety precheck
Every story prompt/request must be checked before generation.

Checks should include:
- unsafe violence
- sexual content
- abuse or exploitation
- self-harm
- hate or harassment
- adult themes
- personally identifying child information
- medical/legal/financial advice requests
- unsafe roleplay
- prompt injection
- attempts to bypass safety rules

### 2. Parent settings
Parents should control:
- age band
- allowed themes
- blocked themes
- narrator style
- bedtime-safe mode
- memory seed usage
- sharing permissions
- public/private story defaults
- story retention preferences

### 3. Age bands
Recommended initial bands:
- `preschool_3_5`
- `early_reader_6_8`
- `middle_grade_9_12`
- `teen_13_17`
- `adult_demo`

Age bands should influence:
- language complexity
- story length
- emotional intensity
- allowed themes
- lesson framing
- safety thresholds

### 4. Output safety postcheck
Generated stories must be checked before display, narration, saving, or sharing.

Postcheck should verify:
- safe content
- age-appropriate tone
- no policy-breaking scenes
- no accidental personal data exposure
- no unsafe advice
- no frightening escalation for bedtime mode
- no provider hallucinated unsafe content

### 5. Safe fallback behavior
If content fails safety:
- Do not display unsafe output.
- Show calm parent-friendly explanation.
- Offer safer prompt suggestions.
- Log a moderation event.
- Route repeat or severe issues to review.

### 6. Moderation queue
Required moderation objects:
- flagged prompt
- blocked generation
- unsafe output
- user report
- creator submission review
- admin action

Moderation states:
- `pending`
- `approved`
- `rejected`
- `needs_parent_review`
- `escalated`
- `resolved`

### 7. Audit logs
Admin/moderator actions must be logged.

Audit log fields:
- actor id
- actor role
- action
- target type
- target id
- reason
- timestamp
- metadata

### 8. Data privacy controls
Required controls:
- private-by-default family data
- private-by-default stories
- child profile access limited to family adults/admin with strict controls
- data deletion path
- data export path
- retention controls
- no secrets in repository
- no sensitive story text in broad logs
- environment separation

## Recommended Firestore security posture
- Users can read/write only their own user profile.
- Parents can access only their family records.
- Child profiles can only be managed by authorized family adults.
- Stories are private to family unless explicitly published as approved samples.
- Safety reviews are readable by authorized admins/moderators only, except limited parent-facing status.
- Admin audit logs are append-only and admin-readable.
- Public website pages must not require database writes except controlled waitlist/contact endpoints.

## Abuse prevention
Add:
- rate limits
- generation quotas
- suspicious prompt pattern detection
- IP/user throttling
- repeated unsafe request tracking
- admin alerting for severe safety events
- provider cost controls

## Prompt injection defenses
The system prompt and safety rules must not be user-editable.

The pipeline should reject or neutralize prompts that ask the model to:
- ignore safety rules
- reveal hidden instructions
- impersonate unsafe personas
- generate adult or violent content for children
- output secrets or system messages
- bypass parent settings

## Child data risks
Avoid collecting:
- precise child location
- school name
- full legal identity
- sensitive health information
- private family conflicts
- images/audio of children unless a separate explicit consent system exists

If memory seeds are introduced, they must be:
- opt-in
- parent-controlled
- redacted
- fictionalized
- age-safe
- deletable

## Required legal pages before public launch
- Privacy Policy
- Terms of Service
- Child Safety Policy
- Cookie Policy if analytics/cookies are used
- Data deletion instructions
- Contact/safety reporting channel

## Production launch blocker list
Do not launch as a child/family production product until:
- Auth exists.
- Family/child privacy rules exist.
- Parent settings exist.
- Safety precheck and postcheck exist.
- Moderation queue exists.
- Audit logs exist.
- Legal placeholder pages exist at minimum.
- No secrets are committed.
- Staging and production are separated.
- CI/test/deploy gates exist.
- Legal review is scheduled or complete.

## Phase 1 safety goal
Phase 1 should introduce safety domain models and provider boundaries without adding a live AI provider yet. The current blocklist can remain as `LocalSafetyProvider` for demo mode, but it must be isolated behind an interface so stronger providers can replace it later.
