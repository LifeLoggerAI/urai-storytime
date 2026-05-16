import type { AnalyticsEventName } from '../types/analytics';

const blockedMetadataKeys = new Set([
  'prompt',
  'body',
  'rawStory',
  'childFullName',
  'schoolName',
  'preciseLocation',
  'privateFamilyDetails'
]);

export async function trackEvent(
  name: AnalyticsEventName,
  metadata: Record<string, string | number | boolean | null | undefined>
) {
  const safeMetadata: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (!blockedMetadataKeys.has(key) && value !== undefined) {
      safeMetadata[key] = value;
    }
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('urai-storytime:analytics', {
        detail: {
          name,
          metadata: safeMetadata,
          createdAt: new Date().toISOString()
        }
      })
    );
  }
}
