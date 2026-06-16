# Firebase Runtime Verification

## Purpose

This document defines the runtime verification gates required before URAI Storytime can be considered production-ready.

## Required Runtime Verifications

### Firebase Project Verification

Required evidence:
- verified Firebase project ID
- verified ownership
- verified billing account
- verified staging target
- verified production target

### Firebase Auth Verification

Required evidence:
- parent/adult account ownership
- verified provider configuration
- child/family isolation tests
- admin claims verification

### Firestore Verification

Required evidence:
- emulator rules execution
- runtime rules validation
- family isolation verification
- moderation isolation verification
- privacy request verification

### Storage Verification

Required evidence:
- emulator storage rules execution
- export isolation verification
- moderation asset isolation verification

### Monitoring + Alerting Verification

Required evidence:
- monitoring provider configured
- alert routing configured
- production alerts tested
- deployment alerts tested

### Production Deployment Verification

Required evidence:
- successful staging deploy
- successful production deploy
- rollback execution verification
- smoke test execution verification
- secrets verification
- environment verification

## Production Blockers

URAI Storytime remains blocked from production launch until every runtime verification item above is supported with evidence.
