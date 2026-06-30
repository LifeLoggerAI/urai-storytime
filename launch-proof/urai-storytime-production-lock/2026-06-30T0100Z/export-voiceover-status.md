# Export and voiceover status

## Classification

Export/voiceover readiness: 30/100.

Current classification: JOB-CREATED ONLY / PARTIAL / BLOCKED FROM PIPELINE CLAIMS.

## What exists

`prepareVoiceoverJob`:

- Requires auth.
- Reads owned session.
- Requires `consentSnapshot.voiceover === true`.
- Requires narrator script id.
- Creates queued `voiceoverJobs` record.
- Creates queued `storyExports` record.
- Creates `timelineReplayEvents` export event.
- Returns queued ids and provider label.

## What is missing

- No worker/processor proof.
- No generated voiceover/audio artifact proof.
- No generated export zip/file proof.
- No Storage write proof.
- No signed/download URL proof.
- No failure/retry proof.
- No Asset Factory end-to-end job ingestion proof.
- No export status UI proof.

## Launch rule

Do not claim export/download/voiceover is production-ready. Safe wording: `Voiceover/export job records can be queued in source, but artifact generation and retrieval are not yet production-proven.`

## Acceptance criteria for upgrade

1. Queue voiceover/export job from a persisted session with explicit voiceover consent.
2. Process job through real worker/provider/Asset Factory.
3. Persist completed status and artifact metadata.
4. Write artifact to Storage under protected path.
5. Verify owner can retrieve artifact.
6. Verify non-owner cannot retrieve artifact.
7. Verify failure/retry path.
8. Record sanitized command logs and artifact proof without exposing private content.
