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
const MAX_METADATA_KEYS = 20;
const MAX_METADATA_STRING_CHARS = 160;

function sanitizeMetadataValue(value: string | number | boolean | null) {
  return typeof value === 'string' ? value.slice(0, MAX_METADATA_STRING_CHARS) : value;
}

export async function trackEvent(
  name: AnalyticsEventName,
  metadata: Record<string, string | number | boolean | null | undefined>
) {
  const safeMetadata: Record<string, string | number | boolean | null> = {};

  for (const [key, value] of Object.entries(metadata)) {
    if (Object.keys(safeMetadata).length >= MAX_METADATA_KEYS) break;
    if (!blockedMetadataKeys.has(key) && value !== undefined) {
      safeMetadata[key] = sanitizeMetadataValue(value);
    }
  }

  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent('urai-storytime:analytics', {
          detail: {
            name,
            metadata: safeMetadata,
            createdAt: new Date().toISOString()
          }
        })
      );
    } catch {
      // Analytics must never interrupt story creation, replay, or export flows.
    }
  }
}