import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { toast } from 'react-hot-toast';
import ManagementLayout from '../components/admin/ManagementLayout';
// ...existing code...
import UserList from '../components/admin/UserList';
import AssignZonesForm from '../components/admin/AssignZoneForm';

const ManageUsersPage = () => {
    const [users, setUsers] = useState([]);
    const [zones, setZones] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [usersRes, zonesRes] = await Promise.all([
                apiClient.get('/users'),
                apiClient.get('/zones')
            ]);
            setUsers(usersRes.data.data);
            setZones(zonesRes.data.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleSelectUser = (user) => {
        if (user.role === 'Admin') {
            setSelectedUser(null);
            return;
        }
        setSelectedUser(user);
    };

    const handleZoneAssignment = async (userId, assignedZoneIds) => {
        try {
            await apiClient.put(`/users/${userId}/zones`, { zones: assignedZoneIds });
            fetchData();
            setSelectedUser(null);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update user zones.');
        }
    };


    // Calculate user statistics
    const totalUsers = users.length;
    const adminUsers = users.filter(u => u.role === 'Admin').length;
    const operatorUsers = users.filter(u => u.role === 'Operator').length;
    const managerUsers = users.filter(u => u.role === 'Manager').length;


    return (
        <ManagementLayout title="Manage Users & Zone Assignments">
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
                {/* Left: Assign Zones and User List (stacked, not overlapping) */}
                <div style={{ flex: 2, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="admin-card admin-form-panel" style={{ marginBottom: '1.5rem' }}>
                        <h3 className="admin-card-title" style={{ fontSize: '1rem' }}>Assign Zones</h3>
                        <p className="admin-card-sub" style={{ marginTop: '-4px' }}>
                            {selectedUser
                                ? `Assign one or more zones to the selected user. Check or uncheck the boxes and click 'Update Assignments' to save.`
                                : `Select a user from the list below (excluding admins) to manage their zone assignments.`}
                        </p>
                        {selectedUser ? (
                            <AssignZonesForm user={selectedUser} allZones={zones} onSubmit={handleZoneAssignment} />
                        ) : null}
                    </div>
                    <div className="admin-card" style={{ padding: '0', overflow: 'hidden' }}>
                        <div style={{ padding: '1rem 1rem .25rem', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '.65rem', letterSpacing: '.5px', color: 'var(--admin-text-soft)', fontWeight: 600 }}>USER LIST</div>
                        <div style={{ padding: '1rem' }}>
                            {isLoading ? (
                                <p className="admin-card-sub" style={{ margin: 0 }}>Loading...</p>
                            ) : error ? (
                                <p className="form-error" style={{ margin: 0 }}>{error}</p>
                            ) : (
                                <UserList users={users} onSelectUser={handleSelectUser} selectedUserId={selectedUser?._id} />
                            )}
                        </div>
                    </div>
                </div>
                {/* Right: User Statistics */}
                <div style={{ flex: 1, minWidth: 260, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div>
                        <h3 className="admin-card-title" style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--primary-color)' }}>User Statistics</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '2rem', color: '#0ea5b7' }}>👤</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{totalUsers}</div>
                                    <div style={{ fontSize: '.9rem', color: 'var(--admin-text-soft)' }}>Total Users</div>
                                </div>
                            </div>
                            <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '2rem', color: '#fbbf24' }}>🛡️</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{adminUsers}</div>
                                    <div style={{ fontSize: '.9rem', color: 'var(--admin-text-soft)' }}>Admins</div>
                                </div>
                            </div>
                            <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '2rem', color: '#22d3ee' }}>🧑‍🔧</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{operatorUsers}</div>
                                    <div style={{ fontSize: '.9rem', color: 'var(--admin-text-soft)' }}>Operators</div>
                                </div>
                            </div>
                            <div className="admin-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <span style={{ fontSize: '2rem', color: '#a3e635' }}>🧑‍💼</span>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '1.2rem' }}>{managerUsers}</div>
                                    <div style={{ fontSize: '.9rem', color: 'var(--admin-text-soft)' }}>Managers</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </ManagementLayout>
    );
};

export default ManageUsersPage;