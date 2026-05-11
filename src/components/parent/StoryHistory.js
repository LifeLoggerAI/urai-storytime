import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

const StoryHistory = ({ familyId }) => {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!familyId) {
      setStories([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const storiesRef = collection(db, 'families', familyId, 'stories');
    const q = query(storiesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const storiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStories(storiesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching story history:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [familyId]);

  return (
    <div style={{ marginTop: '3rem', border: '1px solid #eee', padding: '1.5rem', borderRadius: '8px', background: '#fafafa' }}>
      <h2>Story History</h2>
      {loading ? (
        <p>Loading stories...</p>
      ) : stories.length === 0 ? (
        <p>No stories have been created for your family yet.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {stories.map(story => (
            <li key={story.id} style={{ background: 'white', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong style={{fontSize: '1.1rem'}}>{story.theme || 'A Wonderful Tale'}</strong>
                <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                  Created on: {story.createdAt?.toDate().toLocaleDateString()}
                </p>
              </div>
              <a 
                href={story.audioUrl} 
                download 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ padding: '0.5rem 1rem', textDecoration: 'none', background: '#007bff', color: 'white', borderRadius: '4px' }}
              >
                Download Audio
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default StoryHistory;
