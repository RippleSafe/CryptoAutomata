import React from 'react';

const NetworkStats = ({ stats }) => {
  return (
    <div className="network-stats">
      <h3>Network Statistics</h3>
      <div className="stat-item">
        <span className="stat-label">Total States</span>
        <span className="stat-value">{stats.totalStates || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Accepting States</span>
        <span className="stat-value">{stats.acceptingStates || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Total Transitions</span>
        <span className="stat-value">{stats.totalTransitions || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Density</span>
        <span className="stat-value">{stats.density || 0}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Connected</span>
        <span className="stat-value">{stats.connected ? '✓' : '×'}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Deterministic</span>
        <span className="stat-value">{stats.deterministic ? '✓' : '×'}</span>
      </div>
    </div>
  );
};

export default NetworkStats; 