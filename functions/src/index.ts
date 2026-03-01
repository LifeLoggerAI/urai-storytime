import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// A predefined list of calm, age-appropriate story templates.
const storyTemplates = [
    { theme: "The Friendly Owl Who Lost His Hoot", duration: 180 },
    { theme: "The Little Bear Who Couldn't Sleep", duration: 210 },
    { theme: "The Magical River That Flowed with Starlight", duration: 195 },
    { theme: "The Sleepy Fox and the Quiet Moon", duration: 170 },
    { theme: "The Journey of a Little Raindrop", duration: 220 },
    { theme: "The Secret of the Whispering Tree", duration: 200 },
    { theme: "The Night the Stars Danced", duration: 185 },
    { theme: "The Grateful Turtle and the Gentle Wave", duration: 215 },
    { theme: "The Cloud Who Painted the Sky", duration: 190 },
    { theme: "The Firefly Who Lit Up the Forest", duration: 175 },
];

/**
 * Generates a new story for a given child, validating ownership and subscription status.
 */
export const generateStory = onCall(async (request) => {
    // 1. Authentication Check
    if (!request.auth) {
        throw new HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    const { childId, familyId } = request.data;
    const uid = request.auth.uid;

    // 2. Ownership & Subscription Validation
    const familyRef = db.collection("families").doc(familyId);
    const familyDoc = await familyRef.get();
    const familyData = familyDoc.data();

    if (!familyDoc.exists || familyData?.ownerUid !== uid) {
        throw new HttpsError(
            "permission-denied",
            "You do not have permission to generate a story for this family."
        );
    }

    if (familyData?.billing?.status !== "active") {
        throw new HttpsError(
            "failed-precondition",
            "An active subscription is required to generate new stories."
        );
    }

    // 3. Child Validation
    const childRef = familyRef.collection("children").doc(childId);
    const childDoc = await childRef.get();

    if (!childDoc.exists) {
        throw new HttpsError(
            "not-found",
            "The specified child does not exist in this family."
        );
    }

    // 4. Content Generation
    const template = storyTemplates[Math.floor(Math.random() * storyTemplates.length)];

    // V1 uses predefined assets for safety and predictability.
    const placeholderAudio = "voice/v1/placeholder_audio.mp3";
    const placeholderImage = "images/v1/placeholder_image.png";

    // 5. Generate Signed URLs
    const expires = Date.now() + 60 * 60 * 1000; // 1 hour
    const bucket = storage.bucket("urai-storytime-68426933-5c896.appspot.com");

    const [audioUrl] = await bucket.file(placeholderAudio).getSignedUrl({
        action: "read",
        expires,
    });

    const [imageUrl] = await bucket.file(placeholderImage).getSignedUrl({
        action: "read",
        expires,
    });

    // 6. Write to Firestore
    const storiesRef = familyRef.collection("stories");
    const newStory = {
        theme: template.theme,
        duration: template.duration,
        audioUrl,
        imageUrl,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        isRead: false,
    };

    const storyDocRef = await storiesRef.add(newStory);

    // 7. Return Payload
    return {
        storyId: storyDocRef.id,
        ...newStory,
    };
});
