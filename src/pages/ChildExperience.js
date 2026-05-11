import React from 'react';
import DailyRhythmEngine from '../components/child/DailyRhythmEngine';
import Companion from '../components/child/Companion';

const ChildView = ({ rhythm }) => {
  const getBackgroundColor = () => {
    if (rhythm === 'Morning') return '#f0f8ff'; // Alice Blue
    if (rhythm === 'Day') return '#fffacd'; // Lemon Chiffon
    if (rhythm === 'Night') return '#483d8b'; // Dark Slate Blue
    return '#ffffff';
  };

  const getTextColor = () => {
    return rhythm === 'Night' ? '#ffffff' : '#000000';
  };

  return (
    <div style={{
      textAlign: 'center',
      paddingTop: '5rem',
      height: '100vh',
      backgroundColor: getBackgroundColor(),
      color: getTextColor(),
      transition: 'background-color 0.5s ease'
    }}>
      <h1>Welcome, little explorer!</h1>
      <p>It&apos;s currently <strong>{rhythm}</strong>.</p>
      <p>Your next story is waiting for you.</p>
      <Companion rhythm={rhythm} />
    </div>
  );
};

const ChildExperience = () => {
  return (
    <DailyRhythmEngine>
      <ChildView />
    </DailyRhythmEngine>
  );
};

export default ChildExperience;
