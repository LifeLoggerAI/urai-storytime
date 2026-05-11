import React from 'react';

const Companion = ({ rhythm }) => {
  const getCompanionState = () => {
    switch (rhythm) {
      case 'Morning':
        return {
          emoji: '☀️',
          color: '#FFD700', // Gold
          animation: 'gentleBob 2s ease-in-out infinite',
        };
      case 'Day':
        return {
          emoji: '😊',
          color: '#87CEEB', // Sky Blue
          animation: 'gentleBob 1.5s ease-in-out infinite',
        };
      case 'Night':
        return {
          emoji: '😴',
          color: '#9370DB', // Medium Purple
          animation: 'gentleBob 3s ease-in-out infinite',
        };
      default:
        return {
          emoji: '...',
          color: '#ccc',
          animation: 'none',
        };
    }
  };

  const companionState = getCompanionState();

  const style = {
    fontSize: '5rem',
    padding: '2rem',
    backgroundColor: companionState.color,
    borderRadius: '50%',
    display: 'inline-block',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    animation: companionState.animation,
  };

  // CSS keyframes need to be defined. For this prototype, a <style> tag is used.
  // In a production app, this would be in a dedicated CSS file.
  const keyframes = `
    @keyframes gentleBob {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-10px);
      }
    }
  `;

  return (
    <div style={{ marginTop: '3rem' }}>
      <style>{keyframes}</style>
      <div style={style}>
        {companionState.emoji}
      </div>
    </div>
  );
};

export default Companion;
