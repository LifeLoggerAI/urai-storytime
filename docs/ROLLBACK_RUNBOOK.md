# URAI Storytime Rollback Runbook

## Purpose

This document defines the minimum rollback procedure for URAI Storytime deployments.

## Rollback triggers

Rollback immediately if:

- core routes fail
- build artifacts are broken
- auth becomes inaccessible
- story generation crashes
- moderation failures occur
- production secrets leak
- incorrect Firebase project is targeted
- severe mobile rendering regressions appear

## Required rollback evidence

Before rollback:

- capture deployment identifier
- capture failing screenshots/logs
- capture affected routes
- capture browser console errors
- capture CI run URL if available

## Rollback process

1. Stop further deployments.
2. Identify last known stable commit.
3. Rebuild stable artifact.
4. Redeploy stable artifact.
5. Verify smoke checklist.
6. Reopen deployment only after verification.

## Minimum smoke verification after rollback

- home page renders
- create flow renders
- story route renders
- library renders
- privacy/legal pages render
- no fatal console errors
- mobile viewport works

## Ownership

Jacob owns rollback coordination until a dedicated release owner exists.
