import { onCall } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { STORY_TEMPLATES } from "./storyTemplates";

admin.initializeApp();
const storage = admin.storage().bucket();

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

  const audioPath = `voice/v0/${template.id}.mp3`;
  const file = storage.file(audioPath);

  const [exists] = await file.exists();
  if (!exists) {
    return { error: "audio-not-found" };
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
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { audioUrl };
});
