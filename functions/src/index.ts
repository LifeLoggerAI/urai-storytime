
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize the Firebase Admin SDK to access Firestore and Storage.
admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// --- ETHICAL GUARDRAIL ---
// This is the server-side whitelist for all approved V1 story templates.
// No story can be generated unless its template ID is in this list.
// This prevents template injection and ensures only approved content is used.
const STORY_TEMPLATE_WHITELIST = [
  "template-001",
  "template-002",
  "template-003",
  "template-004",
  "template-005",
  "template-006",
  "template-007",
  "template-008",
  "template-009",
  "template-010",
];

// A mapping of templates to their metadata.
// In a real scenario, this could come from a database or a configuration file.
const STORY_METADATA = {
    "template-001": { theme: "Friendship", duration: 180 },
    "template-002": { theme: "Bedtime", duration: 210 },
    "template-003": { theme: "Courage", duration: 190 },
    "template-004": { theme: "Sharing", duration: 170 },
    "template-005": { theme: "Adventure", duration: 240 },
    "template-006": { theme: "Family", duration: 180 },
    "template-007": { theme: "Animals", duration: 200 },
    "template-008": { theme: "Kindness", duration: 160 },
    "template-009": { theme: "Discovery", duration: 220 },
    "template-010": { theme: "Helping Others", duration: 195 },
};


/**
 * The core function for securely generating a new story for a child.
 * It enforces all V1 security and data ownership rules.
 */
export const generateStory = functions.https.onCall(async (data, context) => {
  // 1. === AUTHENTICATION CHECK ===
  // The user must be authenticated to call this function.
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }
  const parentUid = context.auth.uid;

  // 2. === INPUT VALIDATION ===
  const { familyId, childId, templateId } = data;
  if (!familyId || !childId || !templateId) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Missing required parameters: familyId, childId, or templateId."
      );
  }

  // 3. === TEMPLATE WHITELIST VALIDATION ===
  // The requested template MUST exist in our V1 whitelist. This is a critical
  // security check to prevent injection of unapproved content.
  if (!STORY_TEMPLATE_WHITELIST.includes(templateId)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `The requested story template '${templateId}' is not valid or not part of the V1 collection.`
    );
  }

  const familyRef = db.collection("families").doc(familyId);

  try {
    // 4. === OWNERSHIP VALIDATION ===
    // Check that the family document exists and is owned by the calling user.
    const familyDoc = await familyRef.get();
    if (!familyDoc.exists || familyDoc.data()?.ownerUid !== parentUid) {
      throw new functions.https.HttpsError(
        "permission-denied",
        "You do not have permission to access or modify this family."
      );
    }

    // 5. === CHILD VALIDATION ===
    // Check that the child document exists as a sub-document of the validated family.
    const childDoc = await familyRef.collection("children").doc(childId).get();
    if (!childDoc.exists) {
      throw new functions.https.HttpsError(
        "not-found",
        "The specified child does not exist in this family."
      );
    }

    // 6. === GENERATE SECURE, SHORT-LIVED SIGNED URLS ===
    // URLs expire in 24 hours, preventing long-term public access.
    const signedUrlOptions = {
      version: "v4" as const,
      action: "read" as const,
      expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
    };

    const bucket = storage.bucket();
    const audioFilePath = `voice/v1/${templateId}.mp3`;
    const imageFilePath = `images/v1/${templateId}.png`;

    const [audioUrl] = await bucket.file(audioFilePath).getSignedUrl(signedUrlOptions);
    const [imageUrl] = await bucket.file(imageFilePath).getSignedUrl(signedUrlOptions);

    // 7. === WRITE THE NEW STORY DOCUMENT ===
    // The story is written server-side into the family's sub-collection,
    // ensuring data is correctly scoped and cannot be created by the client.
    const newStoryRef = familyRef.collection("stories").doc();
    const storyId = newStoryRef.id;
    const storyMetadata = STORY_METADATA[templateId] || { theme: "Untitled", duration: 0 };
    const createdAt = admin.firestore.FieldValue.serverTimestamp();

    const newStoryPayload = {
      storyId,
      templateId, // Store for reference
      theme: storyMetadata.theme,
      duration: storyMetadata.duration,
      audioUrl,
      imageUrl,
      createdAt,
      isRead: false,
    };

    await newStoryRef.set(newStoryPayload);

    // 8. === RETURN STRUCTURED PAYLOAD TO CLIENT ===
    // Send back the complete, structured data for the client to use.
    return newStoryPayload;

  } catch (error) {
    // Log the internal error for debugging.
    functions.logger.error("Error in generateStory:", error);

    // If it's already an HttpsError, re-throw it.
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // For unexpected errors, throw a generic internal error.
    throw new functions.https.HttpsError(
      "internal",
      "An unexpected error occurred while generating the story."
    );
  }
});
