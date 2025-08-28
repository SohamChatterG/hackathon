import React from 'react';

const UserList = ({ users, onSelectUser, selectedUserId }) => (
    <div className="zone-list-container">
        <ul className="zone-list">
            {users.map(user => (
                <li key={user._id} className="zone-list-item" onClick={() => onSelectUser(user)}
                    style={{ cursor: user.role !== 'Admin' ? 'pointer' : 'not-allowed', backgroundColor: selectedUserId === user._id ? 'var(--background-light)' : 'transparent' }}>
                    <div>
                        <p className="zone-name">{user.name} <span style={{ fontSize: '0.8rem', color: 'var(--text-medium)' }}>({user.role})</span></p>
                        <p className="zone-description">{user.email}</p>
                        <p className="zone-description" style={{ fontStyle: 'italic', marginTop: '4px' }}>
                            Assigned Zones: {user.zones.map(z => z.name).join(', ') || 'None'}
                        </p>
                    </div>
                </li>
            ))}
        </ul>
    </div>
);

export default UserList;
