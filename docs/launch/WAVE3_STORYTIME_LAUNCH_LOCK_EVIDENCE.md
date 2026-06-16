# Wave 3 URAI Storytime Launch Lock Evidence

Domain: uraistorytime.com

Repo: LifeLoggerAI/urai-storytime

Status: implementation evidence in progress

## Required role

URAI Storytime is the family-safe story vertical for stories, characters, bedtime worlds, safe AI storytelling, drops, and content bridges from URAI Content.

## Required public routes

- `/`
- `/stories`
- `/characters`
- `/bedtime-worlds`
- `/family-safe-ai`
- `/drops`
- `/signup`
- `/privacy`
- `/terms`

## Required public boundary

Public pages must remain family-safe and must not collect child personal data without a reviewed parent or guardian consent design.

Public pages must not mix adult, edgy, or unsafe content into Storytime surfaces.

## Required routing

- Privacy questions route to `https://uraiprivacy.com`
- Content network routes to `https://uraicontent.com`
- Story drops signup writes to `leads` or approved backend with `leadType=storytime_signup`

## Required shared foundation

- Shared visual foundation or equivalent
- Metadata/no-index pattern
- URAI Privacy link
- UTM/source capture on signup forms
- Family-safe AI language
- QA script for metadata, privacy links, no-index, and placeholder/debug text

## Evidence still required before approval

- Confirm public routes exist
- Confirm family-safe copy and content boundaries
- Confirm no child personal data collection without reviewed consent design
- Confirm story drops signup writes to approved backend
- Confirm UTM/source capture works
- Run build/typecheck/QA
- Confirm DNS and SSL for `uraistorytime.com`
- Record production deployment URL
- Record latest deploy commit
- Record owner approval

## Current launch decision

Do not mark approved until route, family-safety, data-collection, signup, privacy, DNS/SSL, build, and QA evidence are recorded.
