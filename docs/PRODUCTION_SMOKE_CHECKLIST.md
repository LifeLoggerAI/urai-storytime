# Production Smoke Checklist

URAI Storytime must not be declared production-ready until every smoke item below has verified evidence.

## Required Smoke Checks

### Public Runtime
- Homepage loads
- Runtime readiness route loads
- Pricing route loads
- Privacy route loads
- Terms route loads

### Story Runtime
- Story creation works
- Moderation precheck works
- Local persistence works
- Unsupported browser fallback works

### Firebase Runtime
- Firebase project verified
- Auth provider verified
- Firestore verified
- Storage verified

### Operations
- Monitoring provider receiving events
- Alert routing verified
- Error reporting verified
- Rollback path verified

### Production Safety
- Secrets verified
- Billing verified
- Legal/privacy approval verified
- Release evidence updated

## Launch Blocker Rule

Any missing smoke verification item blocks production launch.
