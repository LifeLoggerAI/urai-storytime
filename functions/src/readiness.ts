import { onRequest } from 'firebase-functions/v2/https';
import { getStoryProviderReadiness } from './story-provider.js';

const region = process.env.FIREBASE_REGION || 'us-central1';

function nonEmpty(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function boundedShareTtl(value: string | undefined): boolean {
  const days = Number(value || '30');
  return Number.isInteger(days) && days >= 1 && days <= 30;
}

export interface StorytimeTechnicalReadiness {
  ready: boolean;
  checks: Record<string, boolean>;
  publicSharingEnabled: boolean;
}

export function evaluateStorytimeTechnicalReadiness(): StorytimeTechnicalReadiness {
  const provider = getStoryProviderReadiness();
  const publicSharingValue = String(process.env.STORYTIME_PUBLIC_SHARING || '').toLowerCase();
  const publicSharingEnabled = publicSharingValue === 'true';
  const checks = {
    protectedRuntime: process.env.FUNCTIONS_EMULATOR !== 'true',
    projectIdentity: nonEmpty(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID),
    runtimeRevision: nonEmpty(process.env.K_REVISION),
    isolatedFirebaseProject: process.env.STORYTIME_FIREBASE_ISOLATED === 'true',
    cloudMode: process.env.STORYTIME_CLOUD_MODE === 'true',
    providerConfigured: provider.ready === true,
    deterministicFallbackDisabled: process.env.STORYTIME_ALLOW_DETERMINISTIC_FUNCTION_BUILDER !== 'true',
    publicSharingExplicit: publicSharingValue === 'true' || publicSharingValue === 'false',
    publicShareTtlBounded: boundedShareTtl(process.env.STORYTIME_PUBLIC_SHARE_TTL_DAYS),
  };

  return {
    ready: Object.values(checks).every(Boolean),
    checks,
    publicSharingEnabled,
  };
}

export const health = onRequest({ region }, (_request, response) => {
  response.set('Cache-Control', 'no-store');
  response.status(200).json({
    service: 'urai-storytime',
    status: 'ok',
    projectIdentityPresent: nonEmpty(process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID),
    revisionPresent: nonEmpty(process.env.K_REVISION),
  });
});

export const readiness = onRequest({ region }, (_request, response) => {
  const result = evaluateStorytimeTechnicalReadiness();
  response.set('Cache-Control', 'no-store');
  response.status(result.ready ? 200 : 503).json({
    service: 'urai-storytime',
    status: result.ready ? 'ready' : 'not_ready',
    checks: result.checks,
    publicSharingEnabled: result.publicSharingEnabled,
    claimBoundary: 'technical_runtime_only',
  });
});
