import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { STORY_TEMPLATES } from "./storyTemplates";
import OpenAI from "openai";
import crypto from "crypto";

admin.initializeApp();
const storage = admin.storage().bucket();
const openai = new OpenAI();

function hashText(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex");
}

export const generateStory = onCall(async (request) => {
  if (!request.auth) {
    return { error: "unauthenticated" };
  }

  const { familyId, childId } = request.data;
  if (!familyId || !childId) {
    return { error: "invalid-argument" };
  }

  const template =
    STORY_TEMPLATES[Math.floor(Math.random() * STORY_TEMPLATES.length)];

  const voiceHash = hashText(template.text);
  const audioPath = `voice/v0/${voiceHash}.mp3`;
  const file = storage.file(audioPath);

  const [exists] = await file.exists();
  if (!exists) {
    const response = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: template.text,
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    await file.save(buffer, { contentType: "audio/mpeg" });
  }

  const [audioUrl] = await file.getSignedUrl({
    action: "read",
    expires: "03-01-2030",
  });

  await admin.firestore().collection("stories").add({
    familyId,
    childId,
    templateId: template.id,
    theme: template.theme,
    voiceHash,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { audioUrl };
});
