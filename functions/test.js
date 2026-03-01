const firebase = require("firebase/app");
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = require("firebase/auth");
const { getFirestore, doc, setDoc, getDoc, collection, addDoc } = require("firebase/firestore");
const { getFunctions, httpsCallable } = require("firebase/functions");

// Firebase app configuration
const firebaseConfig = {
  apiKey: "fake-api-key",
  authDomain: "localhost",
  projectId: "urai-storytime-68426933-5c896",
  storageBucket: "urai-storytime-68426933-5c896.appspot.com",
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const functions = getFunctions(app);

// Connect to emulators
const { connectFirestoreEmulator } = require("firebase/firestore");
const { connectAuthEmulator } = require("firebase/auth");
const { connectFunctionsEmulator } = require("firebase/functions");

connectFirestoreEmulator(db, "localhost", 8080);
connectAuthEmulator(auth, "http://localhost:9099");
connectFunctionsEmulator(functions, "localhost", 5001);

const generateStory = httpsCallable(functions, 'generateStory');

// Helper to run a function as a specific user
const asUser = async (userEmail, userPassword) => {
    // Sign out any previous user
    await signOut(auth);
    // Sign in the new user
    await signInWithEmailAndPassword(auth, userEmail, userPassword);
};

const main = async () => {
  console.log("--- Running Emulator Validation Tests ---");

  // Test Users
  const user1 = { email: "user1@test.com", password: "password123" };
  const user2 = { email: "user2@test.com", password: "password123" };
  let user1Auth, user2Auth;

  try {
    user1Auth = await createUserWithEmailAndPassword(auth, user1.email, user1.password);
    user2Auth = await createUserWithEmailAndPassword(auth, user2.email, user2.password);
    console.log("✓ Test users created");
  } catch (e) {
    console.log("✓ Test users likely already exist, signing in...");
    user1Auth = await signInWithEmailAndPassword(auth, user1.email, user1.password);
    user2Auth = await signInWithEmailAndPassword(auth, user2.email, user2.password);
    console.log("✓ Test users signed in");
  }

  // Test Data
  const family1Id = "family1";
  const child1Id = "child1";
  const family2Id = "family2";
  const child2Id = "child2";

  await setDoc(doc(db, "families", family1Id), { ownerUid: user1Auth.user.uid, billing: { status: "active" } });
  await setDoc(doc(db, `families/${family1Id}/children`, child1Id), { name: "Test Child 1" });
  await setDoc(doc(db, "families", family2Id), { ownerUid: user2Auth.user.uid, billing: { status: "inactive" } });
  await setDoc(doc(db, `families/${family2Id}/children`, child2Id), { name: "Test Child 2" });
  console.log("✓ Test data created");

  // --- Test Cases ---

  // 1. Unauthorized Request
  await signOut(auth);
  try {
    await generateStory({});
    console.log("✗ Test Failed: Unauthorized request should be blocked.");
  } catch (error) {
    if (error.code === 'functions/unauthenticated' || error.code === 'unauthenticated') { // Emulator vs prod codes can differ
      console.log("✓ Test Passed: Unauthorized request blocked.");
    } else {
      console.log("✗ Test Failed: Unexpected error for unauthorized request.", error);
    }
  }

  // 2. Cross-Family Access Attempt
  await asUser(user2.email, user2.password);
  try {
    await generateStory({ familyId: family1Id, childId: child1Id });
    console.log("✗ Test Failed: Cross-family access should be blocked.");
  } catch (error) {
    if (error.code === 'functions/permission-denied' || error.code === 'permission-denied') {
      console.log("✓ Test Passed: Cross-family access blocked.");
    } else {
      console.log("✗ Test Failed: Unexpected error for cross-family access.", error);
    }
  }

  // 3. Inactive Subscription
  await asUser(user2.email, user2.password);
  try {
    await generateStory({ familyId: family2Id, childId: child2Id });
    console.log("✗ Test Failed: Inactive subscription should be blocked.");
  } catch (error) {
    if (error.code === 'functions/failed-precondition' || error.code === 'failed-precondition') {
      console.log("✓ Test Passed: Inactive subscription blocked.");
    } else {
      console.log("✗ Test Failed: Unexpected error for inactive subscription.", error);
    }
  }

  // 4. Successful Generation
  await asUser(user1.email, user1.password);
  try {
    const result = await generateStory({ familyId: family1Id, childId: child1Id });
    if (result.data.storyId) {
      console.log("✓ Test Passed: Story generated successfully.");
    } else {
      console.log("✗ Test Failed: Successful generation did not return a storyId.");
    }
  } catch (error) {
    console.log("✗ Test Failed: Unexpected error for successful generation.", error);
  }

  console.log("--- Tests Complete ---");
  process.exit(0);
};

main();
