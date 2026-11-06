import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const KEY = 'slk.sidebarCollapsed';
const readCollapsed = () => {
  try { return localStorage.getItem(KEY) === '1'; } catch { return false; }
};

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    try { localStorage.setItem(KEY, collapsed ? '1' : '0'); } catch { /* storage unavailable */ }
  }, [collapsed]);

  useEffect(() => { setMobileOpen(false); window.scrollTo(0, 0); }, [location.pathname]);

  return (
    <div className={`slk-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className="slk-main">
        <Topbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="slk-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
