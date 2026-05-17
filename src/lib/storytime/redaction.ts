export function redactForPublicShare(text: string): string {
  return text
    .replace(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g, "someone important")
    .replace(/\b\d{1,5}\s+[A-Za-z0-9 .'-]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln)\b/gi, "a private place")
    .replace(/\b\d{3}[-.)\s]?\d{3}[-.\s]?\d{4}\b/g, "a private number")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "a private email");
}

export function explainWhyGenerated(sourceSignals: string[]): string {
  if (!sourceSignals.length) {
    return "This story was generated from your selected Storytime inputs only.";
  }

  return `This story was generated from opted-in URAI signals: ${sourceSignals.join(", ")}. You can turn these sources off in Story Settings.`;
}
