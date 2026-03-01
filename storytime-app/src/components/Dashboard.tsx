'use client';

import { useAuth } from '@/hooks/useAuth';
import { auth, db, functions } from '@/lib/firebase';
import { collection, addDoc, query, onSnapshot, DocumentData } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useState, useEffect } from 'react';

interface Child {
  id: string;
  name: string;
  age: number;
}

interface Story {
    id: string;
    theme: string;
    audioUrl: string;
    imageUrl: string;
    duration: number;
    createdAt: any;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState<number | '' >('');
  const [children, setChildren] = useState<Child[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [generatingStory, setGeneratingStory] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      const childrenQuery = query(collection(db, `families/${user.uid}/children`));
      const unsubscribeChildren = onSnapshot(childrenQuery, (querySnapshot) => {
        const childrenData: Child[] = [];
        querySnapshot.forEach((doc) => {
          childrenData.push({ id: doc.id, ...doc.data() } as Child);
        });
        setChildren(childrenData);
      });

      const storiesQuery = query(collection(db, `families/${user.uid}/stories`));
      const unsubscribeStories = onSnapshot(storiesQuery, (querySnapshot) => {
        const storiesData: Story[] = [];
        querySnapshot.forEach((doc) => {
          storiesData.push({ id: doc.id, ...doc.data() } as Story);
        });
        setStories(storiesData);
      });

      return () => {
        unsubscribeChildren();
        unsubscribeStories();
      };
    }
  }, [user]);

  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user && childName && childAge) {
      try {
        await addDoc(collection(db, `families/${user.uid}/children`), {
          name: childName,
          age: childAge,
        });
        setChildName('');
        setChildAge('');
      } catch (error) {
        console.error("Error adding child: ", error);
      }
    }
  };

  const handleGenerateStory = async (childId: string) => {
    if (!user) return;
    setGeneratingStory(childId);
    try {
      const generateStory = httpsCallable(functions, 'generateStory');
      const result = await generateStory({ childId: childId, familyId: user.uid });
      console.log('Story generated:', result.data);
    } catch (error) {
      console.error("Error generating story: ", error);
    } finally {
      setGeneratingStory(null);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div>
      <h2>Welcome, {user.email}</h2>
      <button onClick={() => auth.signOut()}>Sign Out</button>
      
      <hr />

      <h3>Manage Children</h3>
      <form onSubmit={handleAddChild}>
        <input
          type="text"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          placeholder="Child's Name"
          required
        />
        <input
          type="number"
          value={childAge}
          onChange={(e) => setChildAge(Number(e.target.value))}
          placeholder="Child's Age"
          required
        />
        <button type="submit">Add Child</button>
      </form>

      <h4>Children:</h4>
      <ul>
        {children.map((child) => (
          <li key={child.id}>
            {child.name} - Age: {child.age}
            <button onClick={() => handleGenerateStory(child.id)} disabled={generatingStory === child.id}>
              {generatingStory === child.id ? 'Generating...' : 'Generate Story'}
            </button>
          </li>
        ))}
      </ul>
      
      <hr />

      <h3>Stories</h3>
      <ul>
        {stories.map((story) => (
          <li key={story.id}>
            <h4>{story.theme}</h4>
            <img src={story.imageUrl} alt={story.theme} width="200" />
            <audio controls src={story.audioUrl} />
            <p>Duration: {story.duration}s</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
