import React, { useEffect, useState } from 'react';
import { Bell, User } from 'lucide-react';

const Topbar = ({ alertCount = 0, onToggleNotifications }) => {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const storedUser = localStorage.getItem('pharmsuite_user');
    if (!storedUser) {
      setUserName('');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      const name = parsedUser?.name || parsedUser?.fullName || '';
      setUserName(name);
    } catch (error) {
      setUserName('');
    }
  }, []);

  const displayName = userName || 'User';

  return (
    <div className="fixed top-0 right-0 h-16 bg-white shadow-sm z-10">
      <div className="flex items-center justify-between h-full px-6 w-[calc(100vw-256px)]">

        {/* Left side - Welcome message */}
        <div>
          <h2 className="text-gray-800 font-semibold">Welcome back, {displayName}!</h2>
          <p className="text-sm text-gray-500">Here's what's happening today</p>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center space-x-4">

          {/* Notifications Button */}
          <button
            type="button"
            onClick={onToggleNotifications}
            className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="h-5 w-5" />
            {alertCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            )}
          </button>

          {/* User Profile Button */}
          <button className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="text-gray-700">{displayName}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Topbar;