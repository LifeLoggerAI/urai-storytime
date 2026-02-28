import React, { useState, useEffect } from 'react';
import ChildManager from './ChildManager';
import StoryHistory from './StoryHistory';
import { auth, db } from '../../firebase'; // Adjust path as needed
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const ParentDashboard = () => {
  const [familyId, setFamilyId] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const familiesRef = collection(db, 'families');
        const q = query(familiesRef, where('ownerUid', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const familyDoc = querySnapshot.docs[0];
          setFamilyId(familyDoc.id);
        } else {
          console.log('No family found for this user.');
        }
      } else {
        setUser(null);
        setFamilyId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h1>URAI Storytime</h1>
        <p style={{ color: '#666' }}>
          {user ? `Welcome, ${user.displayName || 'Parent'}!` : 'Welcome to your family\'s calm, parent-guided storytelling space.'}
        </p>
      </header>

      {user ? (
        <>
          <ChildManager familyId={familyId} />
          <StoryHistory familyId={familyId} />
        </>
      ) : (
        <div style={{ padding: '2rem', textAlign: 'center', border: '1px dashed #ccc', borderRadius: '8px' }}>
           <p><strong>Please sign in to manage your family.</strong></p>
           {/* V2: Add sign-in component here */}
        </div>
      )}

    </div>
  );
};

export default ParentDashboard;
