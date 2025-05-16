import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    setUser(JSON.parse(userData));
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Horse Race Dashboard</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">
                Welcome, {user.first_name || user.username}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 p-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to your Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Information</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Username:</span> {user.username}</p>
                  <p><span className="font-medium">Email:</span> {user.email}</p>
                  {user.phone && <p><span className="font-medium">Phone:</span> {user.phone}</p>}
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Account Status</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Role:</span> {user.role}</p>
                  <p><span className="font-medium">Status:</span> {user.is_active ? 'Active' : 'Inactive'}</p>
                  {user.last_login && (
                    <p><span className="font-medium">Last Login:</span> {new Date(user.last_login).toLocaleString()}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard; 