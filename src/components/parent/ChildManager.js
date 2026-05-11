import React, { useState, useEffect } from 'react';
import { db, auth } from '../../firebase'; // Adjust path as needed
import { collection, addDoc, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const ChildManager = () => {
  const [children, setChildren] = useState([]);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('3');
  const [familyId, setFamilyId] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Find the family document corresponding to the user's UID
        const familiesRef = collection(db, 'families');
        const q = query(familiesRef, where('ownerUid', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const familyDoc = querySnapshot.docs[0];
          setFamilyId(familyDoc.id);
        } else {
          console.log('No family document found for this user.');
          // V2: Could implement logic to create a family document here
        }
      } else {
        setUser(null);
        setFamilyId(null);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!familyId) return;

    const childrenRef = collection(db, 'families', familyId, 'children');
    const unsubscribeChildren = onSnapshot(childrenRef, (snapshot) => {
      const childrenData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChildren(childrenData);
    });

    return () => unsubscribeChildren();
  }, [familyId]);

  const handleAddChild = async (e) => {
    e.preventDefault();
    if (!childName.trim()) {
      alert('Please enter a name.');
      return;
    }
    if (!user || !familyId) {
        alert('You must be logged in to add a child.');
        return;
    }

    const childrenRef = collection(db, 'families', familyId, 'children');
    try {
      await addDoc(childrenRef, {
        name: childName,
        age: childAge,
        createdAt: new Date(),
      });
      setChildName('');
      setChildAge('3');
    } catch (error) {
      console.error("Error adding child: ", error);
      alert("Failed to add child. Please try again.");
    }
  };

  return (
    <div style={{ marginTop: '2rem', border: '1px solid #eee', padding: '1.5rem', borderRadius: '8px', background: '#fafafa' }}>
      <h2>Manage Children</h2>

      <div style={{ marginBottom: '1.5rem' }}>
        {children.length === 0 ? (
          <p><em>No children added yet. Use the form below.</em></p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {children.map(child => (
              <li key={child.id} style={{ background: 'white', padding: '0.5rem 1rem', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '0.5rem' }}>
                <strong>{child.name}</strong> - {child.age} years old
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={handleAddChild} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
        <strong style={{ marginRight: '1rem' }}>Add a New Child:</strong>
        <input
          type="text"
          value={childName}
          onChange={(e) => setChildName(e.target.value)}
          placeholder="Child's First Name"
          style={{ padding: '0.5rem', flexGrow: 1, minWidth: '150px' }}
          disabled={!familyId}
        />
        <select
          value={childAge}
          onChange={(e) => setChildAge(e.target.value)}
          style={{ padding: '0.5rem' }}
          disabled={!familyId}
        >
          <option value="3">3 years old</option>
          <option value="4">4 years old</option>
          <option value="5">5 years old</option>
          <option value="6">6 years old</option>
          <option value="7">7 years old</option>
          <option value="8">8 years old</option>
        </select>
        <button type="submit" style={{ padding: '0.5rem 1rem' }} disabled={!familyId}>
          Add Child
        </button>
      </form>
    </div>
  );
};

export default ChildManager;
