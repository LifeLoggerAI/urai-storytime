import React, { useState, useEffect } from 'react';

const getRhythm = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 18) return 'Day';
  return 'Night';
};

const DailyRhythmEngine = ({ children }) => {
  const [rhythm, setRhythm] = useState(getRhythm());

  useEffect(() => {
    // This is a simple implementation for V1.
    // In V2, this could use a more sophisticated timer or server-side updates.
    const interval = setInterval(() => {
      setRhythm(getRhythm());
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      {React.Children.map(children, child =>
        React.cloneElement(child, { rhythm })
      )}
    </div>
  );
};

export default DailyRhythmEngine;
