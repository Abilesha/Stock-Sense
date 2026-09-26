import React from 'react';

export default function StatusBadge({ status }) {
  const s = status ? status.toLowerCase() : 'draft';
  const classMap = {
    draft: 'badge-draft',
    waiting: 'badge-waiting',
    ready: 'badge-ready',
    done: 'badge-done',
    canceled: 'badge-canceled',
  };

  const badgeClass = classMap[s] || 'badge-draft';

  return (
    <span className={`badge ${badgeClass}`}>
      {status || 'Draft'}
    </span>
  );
}
