import { ReactNode, useEffect, useRef } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';
import Breadcrumb from './Breadcrumb';
import { useSidebar } from '../../context/SidebarContext';
import { useTheme } from '../../context/ThemeContext';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { collapsed, toggle } = useSidebar();
  const { syncFromBackend } = useTheme();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!hasSynced.current) {
      hasSynced.current = true;
      syncFromBackend();
    }
  }, [syncFromBackend]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={toggle} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header onToggleSidebar={toggle} sidebarCollapsed={collapsed} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {/* Breadcrumb */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
            <Breadcrumb />
          </div>

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
