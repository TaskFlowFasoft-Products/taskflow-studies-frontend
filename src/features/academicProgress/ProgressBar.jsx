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
        left: '50%', 
        top: '0', 
        width: '100%', 
        textAlign: 'center', 
        lineHeight: '24px', 
        fontWeight: 'bold' 
      }}>
        {progresso}%
      </span>
    </div>
  );
};

export default ProgressBar;