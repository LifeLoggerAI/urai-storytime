import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming you have an AuthContext
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import ChildManager from '../components/parent/ChildManager';
import StoryGenerator from '../components/parent/StoryGenerator';
import StoryHistory from '../components/parent/StoryHistory';

const TEMPLATE_WORLDS = {
    "Calm & Nature": ["forest-friends", "sleepy-stars", "moonlight-meadow", "whispering-woods", "arctic-aurora"],
    "Adventure & Exploration": ["ocean-adventure", "sunny-savanna", "jungle-journey", "desert-dreams", "dinosaur-adventure"],
    "Fantasy & Wonder": ["magical-garden", "robot-friends", "city-sounds"]
};

const WORLD_BACKGROUNDS = {
    "Calm & Nature": '#e6f4ea', // Light green
    "Adventure & Exploration": '#fff4e6', // Light orange
    "Fantasy & Wonder": '#f0e6ff', // Light purple
    "default": '#ffffff' // White
};

const ParentDashboard = () => {
    const { currentUser } = useAuth();
    const [familyId, setFamilyId] = useState(null);
    const [currentWorld, setCurrentWorld] = useState('default');

    useEffect(() => {
        const fetchFamilyId = async () => {
            if (currentUser) {
                const userDocRef = doc(db, 'users', currentUser.uid);
                const userDoc = await getDoc(userDocRef);
                if (userDoc.exists() && userDoc.data().familyId) {
                    setFamilyId(userDoc.data().familyId);
                }
            }
        };
        fetchFamilyId();
    }, [currentUser]);

    const handleTemplateChange = (templateId) => {
        const world = Object.keys(TEMPLATE_WORLDS).find(key => TEMPLATE_WORLDS[key].includes(templateId)) || 'default';
        setCurrentWorld(world);
    };

    const backgroundStyle = {
        minHeight: '100vh',
        padding: '2rem',
        backgroundColor: WORLD_BACKGROUNDS[currentWorld],
        transition: 'background-color 0.5s ease'
    };

    if (!currentUser) {
        return <p>Please log in to see your dashboard.</p>;
    }

    if (!familyId) {
        return <p>Loading family information...</p>;
    }

    return (
        <div style={backgroundStyle}>
            <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '2rem', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
                <h1>Parent Dashboard</h1>
                <p>Welcome! Here you can manage your children&apos;s profiles and story settings.</p>
                <ChildManager familyId={familyId} />
                <StoryGenerator familyId={familyId} onTemplateChange={handleTemplateChange} />
                <StoryHistory familyId={familyId} />
            </div>
        </div>
    );
};

export default ParentDashboard;
