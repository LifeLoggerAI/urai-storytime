# Safety and privacy review

## Classification

Safety/privacy readiness: 55/100.

Current classification: PARTIAL / GATED.

## Positive controls present

- Storytime UI says stories are private by default unless explicitly shared.
- Demo flow is labeled deterministic and non-persistent.
- Create form tells users to avoid names, addresses, phone numbers, school names, and other sensitive details.
- Cloud mode requires Firebase Auth and provider readiness.
- Generation callable requires story-generation consent.
- Public share creation requires explicit consent.
- Voiceover job requires voiceover consent.
- Public shares render only redacted/safe share fields, not private session records.
- Firestore rules make public shares readable only when not revoked.
- Basic blocked terms and redaction helpers exist.
- Emotional arc output includes a caution that it is reflective storytelling, not diagnosis or clinical interpretation.

## Risks / gaps

- Age ranges include child-oriented buckets; guardian/parental consent and child-safety review are not proven.
- Blocked-term lists are basic and not a complete moderation system.
- Regex redaction is insufficient for robust public release by itself.
- No prompt-injection or malicious private-data tests were run in this pass.
- No legal/privacy policy alignment proof was reviewed in this pass.
- No deletion/export completion proof exists.
- No retention policy proof exists.
- No admin/moderation review UI was verified.
- No production AI labeling/legal approval artifact was verified.

## P0 safety boundary

Do not collect real child-sensitive data or market child/family-safe production generation until guardian consent, data minimization, safety moderation, deletion/export, retention, AI labeling, and legal review are complete and recorded.

## Required proof to upgrade

1. Add/verify privacy and terms links on public Storytime surfaces.
2. Add/verify AI-generated content label on generated story output.
3. Add/verify guardian/child consent language before child-oriented use.
4. Add prompt-injection and sensitive-PII redaction tests.
5. Add deletion/export/privacy request flow proof.
6. Add moderation review/escalation workflow or hard-gate unsafe cases.
7. Record legal/safety approval artifact.
