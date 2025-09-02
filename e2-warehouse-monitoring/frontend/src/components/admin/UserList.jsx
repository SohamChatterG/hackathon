import React from 'react';

const UserList = ({ users, onSelectUser, selectedUserId }) => {
    return (
        <ul className="admin-list">
            {users.map(u => {
                const active = selectedUserId === u._id;
                const clickable = u.role !== 'Admin';
                return (
                    <li key={u._id} className={"admin-list-item" + (active ? ' active' : '')} style={{ cursor: clickable ? 'pointer' : 'not-allowed', opacity: clickable ? 1 : .65 }} onClick={() => clickable && onSelectUser(u)}>
                        <div style={{ flex:1, minWidth:0 }}>
                            <p className="primary" style={{ margin:0 }}>{u.name} <span style={{ fontSize:'.6rem', fontWeight:600, letterSpacing:'.5px' }} className={"badge " + (u.role === 'Admin' ? 'badge-warning' : 'badge-neutral')}>{u.role}</span></p>
                            <p className="secondary" style={{ margin:0 }}>{u.email}</p>
                            <p className="secondary" style={{ marginTop:'.25rem', fontStyle:'italic' }}>Zones: {u.zones.map(z => z.name).join(', ') || 'None'}</p>
                        </div>
                    </li>
                );
            })}
        </ul>
    );
};

export default UserList;
