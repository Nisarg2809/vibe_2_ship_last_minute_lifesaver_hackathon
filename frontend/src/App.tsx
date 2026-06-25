import { useState, useEffect } from 'react';
import { apiRequest } from './utils/api';
import Sidebar from './components/Sidebar';
import AIChatDrawer from './components/AIChatDrawer';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Calendar from './pages/Calendar';
import Analytics from './pages/Analytics';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tasks, setTasks] = useState<any[]>([]);
  const [slots, setSlots] = useState<any[]>([]);

  // Initialize and check current user
  useEffect(() => {
    if (token) {
      // In a real app we'd fetch current user, for MVP we parse the token or fetch details.
      // Since our signup/login returns the user profile, we store it in localStorage.
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        // Fallback: logout if no details
        handleLogout();
      }
    }
  }, [token]);

  // Load Tasks and Slots when logged in
  const fetchData = async () => {
    if (!token) return;
    try {
      const taskList = await apiRequest('/api/tasks');
      setTasks(taskList);
      
      const slotList = await apiRequest('/api/ai/schedule');
      setSlots(slotList);
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  useEffect(() => {
    if (token) {
      fetchData();
    }
  }, [token]);

  const handleLoginSuccess = (loggedInUser: any, userToken: string) => {
    localStorage.setItem('token', userToken);
    localStorage.setItem('user', JSON.stringify(loggedInUser));
    setUser(loggedInUser);
    setToken(userToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return (
      <>
        <div className="nebula-bg">
          <div className="nebula-orb orb-violet"></div>
          <div className="nebula-orb orb-pink"></div>
          <div className="nebula-orb orb-cyan"></div>
        </div>
        <Login onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  return (
    <>
      {/* Dynamic drifting background glows */}
      <div className="nebula-bg">
        <div className="nebula-orb orb-violet"></div>
        <div className="nebula-orb orb-pink"></div>
        <div className="nebula-orb orb-cyan"></div>
      </div>

      <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflow: 'hidden' }}>
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          user={user}
          onLogout={handleLogout}
        />

        {/* Core Tab Routing */}
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
          {activeTab === 'dashboard' && <Dashboard tasks={tasks} slots={slots} onRefresh={fetchData} />}
          {activeTab === 'tasks' && <Tasks tasks={tasks} onRefresh={fetchData} />}
          {activeTab === 'calendar' && <Calendar tasks={tasks} slots={slots} onRefresh={fetchData} />}
          {activeTab === 'analytics' && <Analytics tasks={tasks} slots={slots} />}
        </div>

        {/* Conversational Assistant Drawer */}
        <AIChatDrawer onRefresh={fetchData} />
      </div>
    </>
  );
}
