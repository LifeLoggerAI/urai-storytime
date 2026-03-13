
import * as functions from "firebase-functions";
import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { getStorage } from "firebase-admin/storage";

admin.initializeApp();
const db = admin.firestore();
const storage = getStorage();

// A secure, server-side whitelist of approved story templates for V1.
const ALLOWED_TEMPLATES = ["dinosaur-friends.json", "moon-explorer.json", "ocean-wonders.json", "sleepy-stars.json"];

/**
 * =================================================================================
 *  GENERATE STORY FUNCTION (V1)
 * =================================================================================
 */
export const generateStory = onCall(async (request) => {
  // 1. Authentication Check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to create a story.");
  }

  const parentUid = request.auth.uid;
  const { familyId, childId, templateId } = request.data;

  // 2. Input Validation
  if (!familyId || !childId || !templateId) {
    throw new HttpsError("invalid-argument", "Missing required parameters: familyId, childId, or templateId.");
  }

  // 3. Ownership Validation
  const familyRef = db.collection("families").doc(familyId);
  const familyDoc = await familyRef.get();

  if (!familyDoc.exists || familyDoc.data()?.ownerUid !== parentUid) {
    throw new HttpsError("permission-denied", "You do not have permission to access this family's data.");
  }

  // 4. Template Whitelist Validation
  if (!ALLOWED_TEMPLATES.includes(templateId)) {
    throw new HttpsError("invalid-argument", `The story template '${templateId}' is not valid or not enabled.`);
  }

  // 5. Core Story Generation Logic (Placeholder for V1)
  const storyTheme = "A Tale of Friendship";
  const storyDuration = 180;
  const audioPath = `stories/${familyId}/${childId}/${templateId}-${Date.now()}.mp3`;
  const imagePath = `stories/${familyId}/${childId}/${templateId}-${Date.now()}.png`;

  // 6. Save to Firestore
  const storiesRef = familyRef.collection('stories');
  const newStoryRef = await storiesRef.add({
    childId: childId,
    templateId: templateId,
    theme: storyTheme,
    duration: storyDuration,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    isRead: false,
    audioPath: audioPath,
    imagePath: imagePath,
  });
  const newStoryId = newStoryRef.id;

  // 7. Generate Signed URLs for Assets
  const bucket = storage.bucket();
  const signedUrlConfig: any = {
      action: 'read',
      expires: Date.now() + 1000 * 60 * 60 * 24, // 24 hours
  };

  const [audioUrl] = await bucket.file(audioPath).getSignedUrl(signedUrlConfig);
  const [imageUrl] = await bucket.file(imagePath).getSignedUrl(signedUrlConfig);

  // 8. Return Structured Payload
  return {
    storyId: newStoryId,
    theme: storyTheme,
    audioUrl: audioUrl,
    imageUrl: imageUrl,
    duration: storyDuration,
    createdAt: new Date().toISOString(),
  };
});

/**
 * =================================================================================
 *  GET STORY PLAYBACK DETAILS FUNCTION (V1)
 * =================================================================================
 */
export const getStoryPlaybackDetails = onCall(async (request) => {
  // 1. Authentication Check
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "You must be logged in to view a story.");
  }

  const parentUid = request.auth.uid;
  const { familyId, storyId } = request.data;

  // 2. Input Validation
  if (!familyId || !storyId) {
    throw new HttpsError("invalid-argument", "Missing required parameters: familyId or storyId.");
  }

  // 3. Ownership Validation
  const familyRef = db.collection("families").doc(familyId);
  const familyDoc = await familyRef.get();

  if (!familyDoc.exists || familyDoc.data()?.ownerUid !== parentUid) {
    throw new HttpsError("permission-denied", "You do not have permission to access this family's data.");
  }

  // 4. Fetch Story Document
  const storyRef = familyRef.collection("stories").doc(storyId);
  const storyDoc = await storyRef.get();

  if (!storyDoc.exists) {
    throw new HttpsError("not-found", "The requested story does not exist.");
  }

  const storyData = storyDoc.data();
  const audioPath = storyData?.audioPath;
  const imagePath = storyData?.imagePath;

  if (!audioPath || !imagePath) {
      throw new HttpsError("internal", "Story data is incomplete and assets cannot be loaded.");
  }

  // 5. Generate Signed URLs for Assets
  const bucket = storage.bucket();
  const signedUrlConfig: any = {
      action: 'read',
      expires: Date.now() + 1000 * 60 * 15, // 15-minute expiry for playback URLs
  };

  const [audioUrl] = await bucket.file(audioPath).getSignedUrl(signedUrlConfig);
  const [imageUrl] = await bucket.file(imagePath).getSignedUrl(signedUrlConfig);

  // 6. Return URLs
  return {
    audioUrl,
    imageUrl,
  };
});
