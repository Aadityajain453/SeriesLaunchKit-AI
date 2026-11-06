import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FiLogOut, FiChevronsLeft, FiChevronsRight, FiX, FiPlay } from 'react-icons/fi';
import { NAV_ITEMS } from './navItems';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { initials } from '../../utils/format';

function WithTip({ show, label, children }) {
  if (!show) return children;
  return (
    <OverlayTrigger placement="right" overlay={<Tooltip>{label}</Tooltip>}>
      {children}
    </OverlayTrigger>
  );
}

export default function Sidebar({ collapsed, onToggle, mobileOpen, onCloseMobile }) {
  const { user, logout } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
      toast('You have been logged out', 'info');
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  const showTips = collapsed && !mobileOpen;

  return (
    <>
      <div className={`slk-sidebar-backdrop ${mobileOpen ? 'show' : ''}`} onClick={onCloseMobile} aria-hidden="true" />
      <aside className={`slk-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`} aria-label="Main navigation">
        <div className="slk-sidebar-brand">
          <div className="slk-logo"><FiPlay /></div>
          <span className="slk-brand-text">SeriesLaunchKit <b>AI</b></span>
          <button type="button" className="slk-icon-btn d-lg-none ms-auto" onClick={onCloseMobile} aria-label="Close menu">
            <FiX />
          </button>
        </div>

        <nav className="slk-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <WithTip key={to} show={showTips} label={label}>
              <NavLink to={to} className={({ isActive }) => `slk-nav-link ${isActive ? 'active' : ''}`} onClick={onCloseMobile}>
                <Icon className="slk-nav-icon" />
                <span className="slk-nav-label">{label}</span>
              </NavLink>
            </WithTip>
          ))}
        </nav>

        <div className="slk-sidebar-footer">
          <WithTip show={showTips} label="Logout">
            <button type="button" className="slk-nav-link slk-logout" onClick={handleLogout} disabled={loggingOut}>
              <FiLogOut className="slk-nav-icon" />
              <span className="slk-nav-label">{loggingOut ? 'Logging out…' : 'Logout'}</span>
            </button>
          </WithTip>

          {user && (
            <div className="slk-user-card">
              <div className="slk-avatar">{initials(user.name)}</div>
              <div className="slk-user-meta">
                <div className="slk-user-name text-truncate">{user.name}</div>
                <div className="slk-user-credits">{user.credits} credits</div>
              </div>
            </div>
          )}

          <button type="button" className="slk-collapse-btn d-none d-lg-flex" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            {collapsed ? <FiChevronsRight /> : <><FiChevronsLeft /><span className="slk-nav-label">Collapse</span></>}
          </button>
        </div>
      </aside>
    </>
  );
}
