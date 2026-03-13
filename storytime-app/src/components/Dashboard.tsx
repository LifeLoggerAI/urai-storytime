
'use client';

import { auth, db, functions } from '../lib/firebase';
import { signOut, User } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { useEffect, useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';


interface DashboardProps {
  user: User;
}

interface Story {
  id: string;
  theme: string;
  childId: string;
  createdAt: { toDate: () => Date };
}

interface ActiveStory extends Story {
  audioUrl?: string;
  imageUrl?: string;
}

const ALLOWED_TEMPLATES = [
    { id: 'dinosaur-friends.json', name: 'Dinosaur Friends' },
    { id: 'moon-explorer.json', name: 'Moon Explorer' },
    { id: 'ocean-wonders.json', name: 'Ocean Wonders' },
    { id: 'sleepy-stars.json', name: 'Sleepy Stars' },
];

const Dashboard = ({ user }: DashboardProps) => {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [children, setChildren] = useState<any[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(ALLOWED_TEMPLATES[0].id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [playbackLoading, setPlaybackLoading] = useState(false);

  const [activeStory, setActiveStory] = useState<ActiveStory | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchInitialData = async () => {
      try {
        const familiesRef = collection(db, 'families');
        const q = query(familiesRef, where('ownerUid', '==', user.uid));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          setError("No family found for your account. Please contact support.");
          setLoading(false);
          return;
        }

        const familyDoc = querySnapshot.docs[0];
        const currentFamilyId = familyDoc.id;
        setFamilyId(currentFamilyId);

        const childrenRef = collection(db, 'families', currentFamilyId, 'children');
        const childrenSnapshot = await getDocs(childrenRef);
        const childrenData = childrenSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setChildren(childrenData);
        if (childrenData.length > 0) {
          setSelectedChild(childrenData[0].id);
        }
        setLoading(false);

        const storiesRef = collection(db, 'families', currentFamilyId, 'stories');
        const storiesQuery = query(storiesRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(storiesQuery, (snapshot) => {
            const storiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
            setStories(storiesData);
        });

        return unsubscribe;

      } catch (err) {
        console.error("Error fetching initial data:", err);
        setError("An error occurred while setting up your dashboard.");
        setLoading(false);
      }
    };

    const unsubscribePromise = fetchInitialData();

    return () => {
      unsubscribePromise.then(unsubscribe => unsubscribe && unsubscribe());
    };

  }, [user]);

  const handleGenerateStory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild || !selectedTemplate || !familyId) {
      setError("Please select a child and a story template.");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const generateStory = httpsCallable(functions, 'generateStory');
      await generateStory({ 
        familyId: familyId, 
        childId: selectedChild, 
        templateId: selectedTemplate 
      });
    } catch (err: any) {
      console.error("Error generating story:", err);
      setError(err.message || "An unknown error occurred.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePlayStory = async (story: Story) => {
    if (!familyId) return;
    setPlaybackLoading(true);
    setError(null);
    setActiveStory(story); // Show modal immediately with loading state

    try {
        const getStoryPlaybackDetails = httpsCallable(functions, 'getStoryPlaybackDetails');
        const result: any = await getStoryPlaybackDetails({ familyId, storyId: story.id });
        
        setActiveStory({ ...story, audioUrl: result.data.audioUrl, imageUrl: result.data.imageUrl });

    } catch(err: any) {
        console.error("Error getting playback details:", err);
        setError("Could not load story. Please try again.");
        setActiveStory(null); // Close modal on error
    } finally {
        setPlaybackLoading(false);
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign Out Error', error);
    }
  };

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId);
    return child ? child.name : 'Unknown Child';
  };

  if (loading) {
      return <div className="text-center py-10">Loading Dashboard...</div>
  }

  return (
    <>
      {/* Story Player Modal */}
      <Transition appear show={activeStory !== null} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setActiveStory(null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    {activeStory?.theme}
                  </Dialog.Title>
                  <div className="mt-4">
                    {playbackLoading ? (
                        <div className="text-center p-8">Loading story...</div>
                    ) : (
                        <>
                            {activeStory?.imageUrl && <img src={activeStory.imageUrl} alt={activeStory.theme} className="w-full h-auto rounded-lg mb-4" />}
                            {activeStory?.audioUrl && <audio controls autoPlay src={activeStory.audioUrl} className="w-full">Your browser does not support the audio element.</audio>}
                        </>
                    )}
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      onClick={() => setActiveStory(null)}
                    >
                      Close
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Main Dashboard */}
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
            {/* Header remains the same */}
        </header>
        <main className="py-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="bg-white p-8 rounded-lg shadow mb-8">
                    {/* Form remains the same */}
                </div>

                <div className="bg-white p-8 rounded-lg shadow">
                    <h2 className="text-xl font-semibold mb-4">Your Family's Stories</h2>
                    {stories.length > 0 ? (
                    <div className="space-y-4">
                        {stories.map(story => (
                        <div key={story.id} className="p-4 border rounded-lg flex justify-between items-center">
                            <div>
                            <h3 className="font-bold text-gray-800">{story.theme}</h3>
                            <p className="text-sm text-gray-500">
                                For {getChildName(story.childId)} • {new Date(story.createdAt?.toDate()).toLocaleDateString()}
                            </p>
                            </div>
                            <button 
                                onClick={() => handlePlayStory(story)}
                                className="px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-100 rounded-md hover:bg-indigo-200"
                            >
                                Play Story
                            </button>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <p className="text-gray-600">No stories have been created yet. Use the form above to create your first one!</p>
                    )}
                </div>
            </div>
        </main>
      </div>
    </>
  );
};

export default Dashboard;
