export function redactForPublicShare(text: string): string {
  return text
    .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, "someone important")
    .replace(/\b\d{1,5}\s+[A-Za-z0-9 .'-]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln)\b/gi, "a private place")
    .replace(/\b\d{3}[-.)\s]?\d{3}[-.\s]?\d{4}\b/g, "a private number")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "a private email");
}

export function explainWhyGenerated(sourceSignals: string[]): string {
  if (!sourceSignals.length) {
    return "Created from submitted Storytime inputs. This creative reconstruction is not verified against recorded memories.";
  }

  // These are user-provided labels, not fetched source artifacts. Avoid
  // implying an authorized source lookup or leaking labels into UI prose.
  return "Created from submitted Storytime inputs. Source-signal labels were saved as unverified context, not used to generate the narrative or checked against recorded memories.";
}
