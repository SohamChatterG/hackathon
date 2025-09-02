import React from 'react';

const NotificationDropdown = ({ notifications = [], onClose }) => {
  return (
    <div style={{
      position: 'absolute',
      top: 48,
      right: 0,
      minWidth: 280,
      background: 'var(--admin-surface)',
      color: 'var(--admin-text)',
      borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
      zIndex: 100,
      padding: '1rem',
      border: '1.5px solid var(--admin-border-muted)'
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <span style={{fontWeight:700,fontSize:'1.05rem'}}>Notifications</span>
        <button onClick={onClose} style={{background:'none',border:'none',color:'var(--admin-text-soft)',fontSize:'1.2rem',cursor:'pointer'}}>×</button>
      </div>
      {notifications.length === 0 ? (
        <div style={{color:'var(--admin-text-soft)',fontSize:'.97rem',textAlign:'center',padding:'1.2rem 0'}}>No notifications</div>
      ) : (
        <ul style={{listStyle:'none',padding:0,margin:0}}>
          {notifications.map((n,i) => (
            <li key={i} style={{padding:'.7rem 0',borderBottom:'1px solid var(--admin-border-muted)'}}>{n}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationDropdown;
