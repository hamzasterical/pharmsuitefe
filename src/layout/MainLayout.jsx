import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import NotificationsPanel from '../components/NotificationsPanel';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const MainLayout = ({ children }) => {
    const [alerts, setAlerts] = useState([]);
    const [alertsLoading, setAlertsLoading] = useState(false);
    const [alertsError, setAlertsError] = useState('');
    const [panelOpen, setPanelOpen] = useState(false);

    const fetchAlerts = async () => {
        setAlertsLoading(true);
        setAlertsError('');

        try {
            const response = await fetch(`${API_BASE}/api/alerts?limit=50`);
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Failed to load alerts');
            }
            setAlerts(data.data || []);
        } catch (error) {
            setAlertsError(error.message || 'Failed to load alerts');
        } finally {
            setAlertsLoading(false);
        }
    };

    useEffect(() => {
        fetchAlerts();
        const intervalId = setInterval(fetchAlerts, 30000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <div className="bg-gray-100 min-h-screen">
            <Sidebar />
            <Topbar
                alertCount={alerts.length}
                onToggleNotifications={() => setPanelOpen((prev) => !prev)}
            />
            <main className="ml-64 mt-16 p-6 flex-1">
                {children}
            </main>
            <NotificationsPanel
                open={panelOpen}
                onClose={() => setPanelOpen(false)}
                alerts={alerts}
                loading={alertsLoading}
                error={alertsError}
            />
        </div>
    );
}


export default MainLayout;