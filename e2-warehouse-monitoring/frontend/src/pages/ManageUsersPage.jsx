import React, { useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { toast } from 'react-hot-toast';
import ManagementLayout from '../components/admin/ManagementLayout';
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

    return (
        <ManagementLayout title="Manage Users & Zone Assignments">
            <div className="manage-zones-grid">
                <div className="card">
                    <h3 className="card-title">All Users</h3>
                    {isLoading ? <p>Loading...</p> : error ? <p className="form-error">{error}</p> : (
                        <UserList users={users} onSelectUser={handleSelectUser} selectedUserId={selectedUser?._id} />
                    )}
                </div>
                <div className="card">
                    <h3 className="card-title">Assign Zones</h3>
                    {selectedUser ? (
                        <AssignZonesForm user={selectedUser} allZones={zones} onSubmit={handleZoneAssignment} />
                    ) : (
                        <p>Select a non-Admin user from the list to manage their zone assignments.</p>
                    )}
                </div>
            </div>
        </ManagementLayout>
    );
};


export default ManageUsersPage;