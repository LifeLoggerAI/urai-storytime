
const admin = require('firebase-admin');
const test = require('firebase-functions-test')();
const { expect } = require('chai');
const sinon = require('sinon');

// Import the functions to be tested AFTER initializing the test SDK
const myFunctions = require('../index');

describe("Cloud Functions: Security & Integration", () => {
    let adminStub;

    before(() => {
        adminStub = sinon.stub(admin, 'initializeApp');
    });

    after(() => {
        adminStub.restore();
        test.cleanup();
    });

    //=================================================================================
    //  1. generateStory Function Tests
    //=================================================================================
    describe("generateStory", () => {

        it("SUCCESS: Should generate a story for an authorized owner", async () => {
            // Mock Firestore state for a valid owner
            const familyDocMock = {
                exists: true,
                data: () => ({ ownerUid: 'owner-uid-123' })
            };
            const getStub = sinon.stub().returns(Promise.resolve(familyDocMock));
            const addStub = sinon.stub().returns(Promise.resolve({ id: 'new-story-id' }));

            // Stub the Firestore methods
            const firestoreStub = {
                collection: sinon.stub().returns({
                    doc: sinon.stub().returns({ get: getStub, collection: () => ({ add: addStub }) }),
                }),
            };
            
            // Temporarily replace the real firestore instance with our stub
            Object.defineProperty(admin, 'firestore', { get: () => () => firestoreStub, configurable: true });
            
            const wrapped = test.wrap(myFunctions.generateStory);
            const context = { auth: { uid: 'owner-uid-123' } };
            const data = { familyId: 'family-1', childId: 'child-1', templateId: 'dinosaur-friends.json' };

            const result = await wrapped(data, context);

            expect(result.storyId).to.equal('new-story-id');
            expect(result.theme).to.exist;

            // Cleanup the stubs
            Object.defineProperty(admin, 'firestore', { get: () => admin.firestore, configurable: true });
        });

        it("ADVERSARIAL: Should REJECT users trying to access a family they don't own", async () => {
            // Mock Firestore to return a document owned by someone else
            const familyDocMock = {
                exists: true,
                data: () => ({ ownerUid: 'the-real-owner-uid' })
            };
            const getStub = sinon.stub().returns(Promise.resolve(familyDocMock));

            const firestoreStub = {
                collection: sinon.stub().returns({ doc: sinon.stub().returns({ get: getStub }) })
            };

            Object.defineProperty(admin, 'firestore', { get: () => () => firestoreStub, configurable: true });

            const wrapped = test.wrap(myFunctions.generateStory);
            const context = { auth: { uid: 'malicious-user-uid' } };
            const data = { familyId: 'family-owned-by-someone-else', childId: 'child-1', templateId: 'dinosaur-friends.json' };

            try {
                await wrapped(data, context);
                // If it reaches here, the test has failed.
                throw new Error('The function did not throw an error as expected.');
            } catch (e) {
                expect(e.code).to.equal('permission-denied');
            }
            
            Object.defineProperty(admin, 'firestore', { get: () => admin.firestore, configurable: true });
        });

         it("VALIDATION: Should reject calls with invalid templateId", async () => {
            const wrapped = test.wrap(myFunctions.generateStory);
            const context = { auth: { uid: 'test-user-1' } };
            const data = { familyId: 'family-1', childId: 'child-1', templateId: 'invalid-template.json' };

            try {
                await wrapped(data, context);
                throw new Error('The function did not throw an error as expected.');
            } catch (e) {
                expect(e.code).to.equal('invalid-argument');
            }
        });
    });

    //=================================================================================
    //  2. getStoryPlaybackDetails Function Tests
    //=================================================================================
    describe("getStoryPlaybackDetails", () => {

        it("ADVERSARIAL: Should REJECT users trying to access a story in a family they don't own", async () => {
             // Mock Firestore to return a family document owned by someone else
            const familyDocMock = {
                exists: true,
                data: () => ({ ownerUid: 'the-real-owner-uid' })
            };
            const getStub = sinon.stub().returns(Promise.resolve(familyDocMock));

            const firestoreStub = {
                collection: sinon.stub().returns({ doc: sinon.stub().returns({ get: getStub }) })
            };

            Object.defineProperty(admin, 'firestore', { get: () => () => firestoreStub, configurable: true });

            const wrapped = test.wrap(myFunctions.getStoryPlaybackDetails);
            const context = { auth: { uid: 'malicious-user-uid' } };
            const data = { familyId: 'family-owned-by-someone-else', storyId: 'story-1' };

            try {
                await wrapped(data, context);
                throw new Error('The function did not throw an error as expected.');
            } catch (e) {
                expect(e.code).to.equal('permission-denied');
            }

            Object.defineProperty(admin, 'firestore', { get: () => admin.firestore, configurable: true });
        });

         it("VALIDATION: Should reject calls for a story that does not exist", async () => {
            const familyDocMock = { exists: true, data: () => ({ ownerUid: 'owner-uid-123' }) };
            const storyDocMock = { exists: false }; // Story does not exist
            
            const familyGetStub = sinon.stub().resolves(familyDocMock);
            const storyGetStub = sinon.stub().resolves(storyDocMock);

            const firestoreStub = {
                collection: sinon.stub().returns({
                    doc: (docPath) => {
                        if (docPath === 'family-1') {
                            return { get: familyGetStub, collection: () => ({ doc: () => ({ get: storyGetStub }) }) };
                        }
                        return {};
                    }
                })
            };

            Object.defineProperty(admin, 'firestore', { get: () => () => firestoreStub, configurable: true });
            
            const wrapped = test.wrap(myFunctions.getStoryPlaybackDetails);
            const context = { auth: { uid: 'owner-uid-123' } };
            const data = { familyId: 'family-1', storyId: 'non-existent-story' };

            try {
                await wrapped(data, context);
                throw new Error('The function did not throw an error as expected.');
            } catch (e) {
                expect(e.code).to.equal('not-found');
            }

            Object.defineProperty(admin, 'firestore', { get: () => admin.firestore, configurable: true });
        });
    });
});
