import React from 'react';

function PowerBIDashboard({ darkMode }) {
  return (
    <div style={{ 
      width: '100%', 
      height: 'calc(100vh - 70px)',
      background: darkMode ? '#0f172a' : '#f8fafc',
      padding: 20
    }}>
      <iframe
        title="Power BI Dashboard"
        src="/dashboard.pdf"
        width="100%"
        height="100%"
        style={{ 
          border: 'none',
          borderRadius: 12,
          background: darkMode ? '#1e293b' : '#ffffff'
        }}
      />
    </div>
  );
}

export default PowerBIDashboard;
