import React from 'react';

const ProgressBar = ({ progresso }) => {
  return (
    <div style={{ width: '100%', background: '#eee', borderRadius: '8px', height: '24px', position: 'relative' }}>
      <div
        style={{
          width: `${progresso}%`,
          background: '#4caf50',
          height: '100%',
          borderRadius: '8px',
          transition: 'width 0.3s'
        }}
      />
      <span style={{ 
        position: 'absolute', 
        right: '8px', 
        top: '-28px', 
        fontWeight: 'bold',
        color: '#222',
        background: 'transparent',
        zIndex: 2
      }}>
        {progresso}%
      </span>
    </div>
  );
};

export default ProgressBar;