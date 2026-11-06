import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dropdown, Button } from 'react-bootstrap';
import { FiMenu, FiBell, FiZap, FiPlus, FiLayers, FiFilm, FiFolder } from 'react-icons/fi';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { initials, timeAgo } from '../../utils/format';

export default function Topbar({ onOpenMobile }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);

  const loadNotifs = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data.notifications);
      setUnread(data.unread);
    } catch { /* non-critical */ }
  }, []);

  useEffect(() => {
    loadNotifs();
    const t = setInterval(loadNotifs, 60000);
    return () => clearInterval(t);
  }, [loadNotifs]);

  const onNotifToggle = async (open) => {
    if (open) {
      await loadNotifs();
      if (unread > 0) {
        api.post('/notifications/read-all').then(() => setUnread(0)).catch(() => {});
      }
    }
  };

  return (
    <header className="slk-topbar">
      <button type="button" className="slk-icon-btn d-lg-none" onClick={onOpenMobile} aria-label="Open menu">
        <FiMenu />
      </button>

      <div className="ms-auto d-flex align-items-center gap-2 gap-md-3">
        <div className="slk-credit-pill" title="Available credits">
          <FiZap /> <strong>{user?.credits ?? 0}</strong> <span className="d-none d-sm-inline">credits</span>
        </div>

        <Dropdown align="end" onToggle={onNotifToggle}>
          <Dropdown.Toggle as="button" className="slk-icon-btn slk-no-caret position-relative" aria-label="Notifications">
            <FiBell />
            {unread > 0 && <span className="slk-dot">{unread > 9 ? '9+' : unread}</span>}
          </Dropdown.Toggle>
          <Dropdown.Menu className="slk-notif-menu shadow">
            <div className="slk-notif-head">Notifications</div>
            {notifs.length === 0 && <div className="px-3 py-4 text-muted small text-center">You're all caught up.</div>}
            {notifs.map((n) => (
              <Dropdown.Item key={n._id} as={n.link ? Link : 'div'} to={n.link || undefined} className={`slk-notif-item ${n.read ? '' : 'unread'}`}>
                <span className={`slk-notif-dot bg-${n.variant}`} />
                <div className="flex-grow-1 min-w-0">
                  <div className="fw-semibold small">{n.title}</div>
                  {n.message && <div className="small text-muted text-wrap">{n.message}</div>}
                  <div className="slk-notif-time">{timeAgo(n.createdAt)}</div>
                </div>
              </Dropdown.Item>
            ))}
          </Dropdown.Menu>
        </Dropdown>

        <Dropdown align="end">
          <Dropdown.Toggle as={Button} className="slk-btn-primary slk-no-caret">
            <FiPlus className="me-1" /> <span className="d-none d-sm-inline">Create New</span>
          </Dropdown.Toggle>
          <Dropdown.Menu className="shadow border-0">
            <Dropdown.Item onClick={() => navigate('/series-studio/new')}><FiLayers className="me-2" />New Series</Dropdown.Item>
            <Dropdown.Item onClick={() => navigate('/film-studio')}><FiFilm className="me-2" />New Video</Dropdown.Item>
            <Dropdown.Item onClick={() => navigate('/my-projects', { state: { create: true } })}><FiFolder className="me-2" />New Project</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>

        <Dropdown align="end">
          <Dropdown.Toggle as="button" className="slk-avatar-btn slk-no-caret" aria-label="Account">
            <span className="slk-avatar">{initials(user?.name)}</span>
          </Dropdown.Toggle>
          <Dropdown.Menu className="shadow border-0 p-0" style={{ minWidth: 240 }}>
            <div className="p-3 border-bottom">
              <div className="fw-semibold">{user?.name}</div>
              <div className="small text-muted text-truncate">{user?.email}</div>
              <div className="small mt-1"><span className="badge bg-light text-dark">{user?.plan} plan</span></div>
            </div>
            <Dropdown.Item as={Link} to="/dashboard" className="py-2">Account overview</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </header>
  );
}
