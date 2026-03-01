import React, { useState, useEffect } from 'react';
import { db, functions } from '../../firebase'; // Adjust path as needed
import { collection, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const TEMPLATE_WORLDS = {
  "Calm & Nature": ["forest-friends", "sleepy-stars", "moonlight-meadow", "whispering-woods", "arctic-aurora"],
  "Adventure & Exploration": ["ocean-adventure", "sunny-savanna", "jungle-journey", "desert-dreams", "dinosaur-adventure"],
  "Fantasy & Wonder": ["magical-garden", "robot-friends", "city-sounds"]
};

const TEMPLATE_WHITELIST = Object.values(TEMPLATE_WORLDS).flat();

const StoryGenerator = ({ familyId, onTemplateChange }) => {
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATE_WHITELIST[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    if (!familyId) return;

    const childrenRef = collection(db, 'families', familyId, 'children');
    const unsubscribe = onSnapshot(childrenRef, (snapshot) => {
      const childrenData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setChildren(childrenData);
      if (childrenData.length > 0 && !selectedChild) {
        setSelectedChild(childrenData[0].id);
      }
    });

    return () => unsubscribe();
  }, [familyId, selectedChild]);

  // Effect to call the callback when the template changes
  useEffect(() => {
    if (onTemplateChange) {
      onTemplateChange(selectedTemplate);
    }
  }, [selectedTemplate, onTemplateChange]);

  const handleGenerateStory = async () => {
    if (!selectedChild || !selectedTemplate || !familyId) {
      setFeedback('Please select a child and a story template.');
      return;
    }

    setIsLoading(true);
    setFeedback('Generating a new magical story... please wait.');

    try {
      const generateStory = httpsCallable(functions, 'generateStory');
      const result = await generateStory({
        familyId: familyId,
        childId: selectedChild,
        templateId: selectedTemplate,
      });

      setFeedback(`Story '${result.data.theme}' created successfully! It will now appear in your history.`);

    } catch (error) {
      console.error("Error generating story:", error);
      setFeedback(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!familyId) {
    return null;
  }

  return (
    <div style={{ marginTop: '2rem', border: '1px solid #eee', padding: '1.5rem', borderRadius: '8px', background: '#fafafa' }}>
      <h2>Create a New Story</h2>
      {children.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label htmlFor="child-select" style={{flex: 1}}>For Child:</label>
            <select
              id="child-select"
              value={selectedChild}
              onChange={(e) => setSelectedChild(e.target.value)}
              style={{ padding: '0.5rem', flex: 2 }}
            >
              {children.map(child => (
                <option key={child.id} value={child.id}>{child.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <label htmlFor="template-select" style={{flex: 1}}>Story World:</label>
            <select
              id="template-select"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              style={{ padding: '0.5rem', flex: 2 }}
            >
              {Object.entries(TEMPLATE_WORLDS).map(([world, templates]) => (
                <optgroup key={world} label={world}>
                  {templates.map(template => (
                    <option key={template} value={template}>{template.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <button onClick={handleGenerateStory} disabled={isLoading} style={{ padding: '0.75rem', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {isLoading ? 'Creating...' : 'Generate Story'}
          </button>
          {feedback && <p style={{ marginTop: '1rem', color: isLoading ? '#007bff' : '#dc3545' }}>{feedback}</p>}
        </div>
      ) : (
        <p><em>Please add a child first to generate a story.</em></p>
      )}
    </div>
  );
};

export default StoryGenerator;
