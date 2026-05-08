# URAI-StoryTime Website Launch Plan

## Goal
Launch `www.uraistorytime.com` as a polished, trustworthy, family-safe public website that explains URAI-StoryTime, demonstrates the product, captures demand, and prepares users for the full 2.5+ platform.

## Current baseline
The current app has a simple static shell with Home, Create, Library, and Settings. This is useful for a demo, but the public website still needs a complete launch structure, SEO, conversion flow, trust/safety messaging, and legal pages.

## Launch positioning
URAI-StoryTime should be positioned as:

> A magical, privacy-first AI storytelling platform for families that creates safe, narrated, personalized bedtime stories.

Supporting themes:
- family-safe AI
- bedtime calm
- parent controls
- magical narration
- story replay
- privacy-first design
- future creator story packs

## Required public sitemap

```text
/
/demo
/parents
/creators
/safety
/pricing
/waitlist
/about
/contact
/legal/privacy
/legal/terms
/legal/child-safety
/legal/cookies
```

## Page requirements

### Home `/`
Purpose: immediate trust and conversion.

Must include:
- magical hero
- clear one-sentence value proposition
- primary CTA: Create a demo story
- secondary CTA: Join waitlist
- parent trust strip
- sample story preview
- safety/privacy summary
- narrator/replay teaser
- creator platform teaser
- FAQ

### Demo `/demo`
Purpose: let users experience StoryTime without account friction.

Must include:
- demo story form
- clear demo-mode privacy note
- generated story preview
- Web Speech narration fallback
- save/copy behavior
- disclaimer that cloud sync arrives later if not implemented yet

### Parents `/parents`
Purpose: explain safety, controls, and bedtime value.

Must include:
- parent-controlled profiles
- age-aware settings
- privacy-first storage
- bedtime-safe mode
- safe story themes
- what data is and is not collected

### Creators `/creators`
Purpose: prepare future creator ecosystem.

Must include:
- story pack concept
- character/world builder teaser
- publisher workflow teaser
- moderation/approval promise
- creator waitlist CTA

### Safety `/safety`
Purpose: build trust.

Must include:
- input safety
- output safety
- parent controls
- moderation plan
- data privacy principles
- report/contact path
- legal review disclaimer until formal compliance review is complete

### Pricing `/pricing`
Purpose: explain future monetization without overcommitting.

Possible tiers:
- Free Demo
- Family
- Creator
- School / Partner

### Waitlist `/waitlist`
Purpose: capture demand.

Must include:
- email field
- role selector: parent, creator, educator, partner, investor
- consent checkbox
- success state
- error state

### About `/about`
Purpose: tell the mission.

Must include:
- mission statement
- URAI ecosystem connection
- family-first values
- roadmap teaser

### Contact `/contact`
Purpose: support and partnerships.

Must include:
- general inquiry
- safety report
- creator interest
- partner inquiry

### Legal pages
Required before public launch:
- Privacy Policy
- Terms of Service
- Child Safety Policy
- Cookie Policy if analytics/cookies are used

Legal pages may begin as placeholders, but must not falsely claim compliance.

## SEO requirements
- Unique title and description per page.
- Canonical URL.
- Open Graph title, description, and image.
- Twitter card metadata.
- `sitemap.xml`.
- `robots.txt`.
- Semantic headings.
- Descriptive links.
- Structured FAQ content where appropriate.

## Performance requirements
- Static-first rendering where possible.
- Optimized images.
- Minimal JavaScript on public pages.
- Lighthouse performance target: 90+.
- Lighthouse accessibility target: 90+.
- No layout shift on hero.
- Mobile-first CSS.

## Analytics requirements
Track:
- homepage CTA click
- demo started
- demo story generated
- narration played
- waitlist submitted
- creator interest submitted
- safety page viewed

Analytics must respect privacy and avoid collecting sensitive story text by default.

## Domain launch checklist
- Confirm domain ownership.
- Configure DNS.
- Connect hosting provider.
- Enable SSL.
- Verify `www.uraistorytime.com`.
- Redirect root/apex domain if applicable.
- Test mobile and desktop.
- Check all links.
- Check legal pages.
- Run Lighthouse.
- Run post-deploy smoke test.

## Pre-launch smoke test
- Home page loads.
- Demo create flow works.
- Generated story renders.
- Narration button works or fails gracefully.
- Library/local save works in demo mode.
- Settings page loads.
- Waitlist form works or shows planned integration message.
- Legal pages load.
- No console errors for core flow.
- No exposed secrets.

## Launch phases

### Website MVP
- Polish current Home/Create/Library/Settings experience.
- Add Safety, Parents, Waitlist, and Legal pages.
- Add metadata, sitemap, robots.
- Deploy to `www.uraistorytime.com`.

### Platform launch
- Add Auth.
- Add family profiles.
- Add cloud library.
- Add story engine pipeline.
- Add moderation.

### Premium launch
- Add TTS narration.
- Add replay manifests.
- Add creator tools.
- Add story packs.

## Current launch blockers
- Live domain not verified in this environment.
- No auth/cloud backend.
- No production child-safety pipeline.
- No legal pages verified.
- No waitlist/contact backend verified.
- No analytics verified.
- No CI/CD verified.

## Next step
Use this plan during Phase 6 and Phase 8. Do not block Phase 1 architecture work on website polish, but do not launch publicly as a family product until safety, privacy, and legal requirements are addressed.
