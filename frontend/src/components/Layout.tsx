import { ReactNode, useState } from 'react';
import { useStore } from '../store';
import Link from 'next/link';
import { useRouter } from 'next/router';
import NotificationPanel from './NotificationPanel';
import { useNotifications } from '../hooks/useNotifications';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout, sidebarCollapsed, toggleSidebar, theme } = useStore();
  const router = useRouter();
  const [notificationOpen, setNotificationOpen] = useState(false);
  
  // Initialize notifications hook for real-time updates
  const { unreadCount } = useNotifications();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const navItems = [
    { href: '/dashboard', icon: '◈', label: 'Dashboard' },
    { href: '/dashboard/activity', icon: '📊', label: 'Activity' },
    { href: '/dashboard/predictions', icon: '🎯', label: 'Predictions' },
    { href: '/dashboard/analytics', icon: '◉', label: 'Analytics' },
    { href: '/dashboard/twin', icon: '◇', label: 'Digital Twin' },
    { href: '/dashboard/automation', icon: '⚡', label: 'Automation' },
    { href: '/dashboard/system-health', icon: '🛡️', label: 'System Health' },
    { href: '/dashboard/reports', icon: '📄', label: 'Reports' },
    { href: '/dashboard/team', icon: '👥', label: 'Team' },
    { href: '/dashboard/settings', icon: '⚙', label: 'Settings' },
  ];

  return (
    <div className={`min-h-screen bg-gray-900 flex ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Notification Panel */}
      <NotificationPanel isOpen={notificationOpen} onClose={() => setNotificationOpen(false)} />

      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } bg-gray-800/50 backdrop-blur-xl border-r border-gray-700/50 transition-all duration-300 fixed left-0 top-0 h-full z-50`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-gray-700/50">
          <Link href="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            {sidebarCollapsed ? 'AI' : 'DigitalTwin'}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
                router.pathname === item.href
                  ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-400 border border-purple-500/30'
                  : 'text-gray-400 hover:bg-gray-700/30 hover:text-white'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-purple-500 transition-colors"
        >
          {sidebarCollapsed ? '→' : '←'}
        </button>
      </aside>

      {/* Main Content */}
      <main
        className={`flex-1 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        {/* Top Header */}
        <header className="h-16 bg-gray-800/30 backdrop-blur-xl border-b border-gray-700/50 flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-white">
              {navItems.find((item) => item.href === router.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Bell */}
            <button
              onClick={() => setNotificationOpen(true)}
              className="relative p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <span className="text-xl">🔔</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-500 rounded-full text-xs text-white flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* AI Status Indicator */}
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-green-400">AI Active</span>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-white">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-400">{user?.email || 'user@example.com'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="ml-2 px-3 py-1.5 text-sm text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

