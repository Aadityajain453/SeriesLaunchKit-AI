
import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Dropdown, Button, Modal, Form, Alert, Spinner } from 'react-bootstrap';
import {
  FiMenu, FiBell, FiZap, FiPlus, FiLayers, FiFilm, FiFolder
} from 'react-icons/fi';
import api, { parseError } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { initials, timeAgo } from '../../utils/format';

export default function Topbar({ onOpenMobile }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [notifs, setNotifs] = useState([]);
  const [unread, setUnread] = useState(0);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const loadNotifs = useCallback(async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data.notifications);
      setUnread(data.unread);
    } catch {
      /* non-critical */
    }
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
        api.post('/notifications/read-all')
          .then(() => setUnread(0))
          .catch(() => { });
      }
    }
  };

  const openDeleteModal = () => {
    setDeletePassword('');
    setDeleteError('');
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    if (deleting) return;
    setShowDeleteModal(false);
    setDeletePassword('');
    setDeleteError('');
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();
    setDeleteError('');

    if (!deletePassword) {
      setDeleteError('Please enter your password to continue.');
      return;
    }

    setDeleting(true);

    try {
      await api.delete('/account/me', {
        data: { password: deletePassword },
      });

      window.dispatchEvent(new Event('slk:unauthorized'));
      navigate('/login', { replace: true });
    } catch (error) {
      setDeleteError(
        parseError(error, 'Unable to delete your account. Please try again.').message
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <header className="slk-topbar">
        <button
          type="button"
          className="slk-icon-btn d-lg-none"
          onClick={onOpenMobile}
          aria-label="Open menu"
        >
          <FiMenu />
        </button>

        <div className="ms-auto d-flex align-items-center gap-2 gap-md-3">
          <div className="slk-credit-pill" title="Available credits">
            <FiZap /> <strong>{user?.credits ?? 0}</strong>{' '}
            <span className="d-none d-sm-inline">credits</span>
          </div>

          <Dropdown align="end" onToggle={onNotifToggle}>
            <Dropdown.Toggle
              as="button"
              className="slk-icon-btn slk-no-caret position-relative"
              aria-label="Notifications"
            >
              <FiBell />
              {unread > 0 && (
                <span className="slk-dot">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </Dropdown.Toggle>

            <Dropdown.Menu className="slk-notif-menu shadow">
              <div className="slk-notif-head">Notifications</div>

              {notifs.length === 0 && (
                <div className="px-3 py-4 text-muted small text-center">
                  You're all caught up.
                </div>
              )}

              {notifs.map((n) => (
                <Dropdown.Item
                  key={n._id}
                  as={n.link ? Link : 'div'}
                  to={n.link || undefined}
                  className={`slk-notif-item ${n.read ? '' : 'unread'}`}
                >
                  <span className={`slk-notif-dot bg-${n.variant}`} />
                  <div className="flex-grow-1 min-w-0">
                    <div className="fw-semibold small">{n.title}</div>
                    {n.message && (
                      <div className="small text-muted text-wrap">
                        {n.message}
                      </div>
                    )}
                    <div className="slk-notif-time">
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown align="end">
            <Dropdown.Toggle as={Button} className="slk-btn-primary slk-no-caret">
              <FiPlus className="me-1" />
              <span className="d-none d-sm-inline">Create New</span>
            </Dropdown.Toggle>

            <Dropdown.Menu className="shadow border-0">
              <Dropdown.Item onClick={() => navigate('/series-studio/new')}>
                <FiLayers className="me-2" />New Series
              </Dropdown.Item>
              <Dropdown.Item onClick={() => navigate('/film-studio')}>
                <FiFilm className="me-2" />New Video
              </Dropdown.Item>
              <Dropdown.Item
                onClick={() => navigate('/my-projects', { state: { create: true } })}
              >
                <FiFolder className="me-2" />New Project
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>

          <Dropdown align="end">
            <Dropdown.Toggle
              as="button"
              className="slk-avatar-btn slk-no-caret"
              aria-label="Account"
            >
              <span className="slk-avatar">{initials(user?.name)}</span>
            </Dropdown.Toggle>

            <Dropdown.Menu
              className="shadow border-0 p-0"
              style={{ minWidth: 240 }}
            >
              <div className="p-3 border-bottom">
                <div className="fw-semibold">{user?.name}</div>
                <div className="small text-muted text-truncate">
                  {user?.email}
                </div>
                <div className="small mt-1">
                  <span className="badge bg-light text-dark">
                    {user?.plan} plan
                  </span>
                </div>
              </div>

              <Dropdown.Item as={Link} to="/dashboard" className="py-2">
                Account overview
              </Dropdown.Item>

              <Dropdown.Divider />

              <Dropdown.Item
                onClick={openDeleteModal}
                className="py-2 text-danger"
              >
                Delete Account
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </header>

      <Modal
        show={showDeleteModal}
        onHide={closeDeleteModal}
        centered
        backdrop={deleting ? 'static' : true}
        keyboard={!deleting}
      >
        <Form onSubmit={handleDeleteAccount}>
          <Modal.Header closeButton={!deleting}>
            <Modal.Title className="text-danger">
              Delete Your Account
            </Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <Alert variant="danger">
              <strong>Warning:</strong> This action is permanent and cannot be
              undone. Your account and associated application data will be
              deleted.
            </Alert>

            <p className="small text-muted">
              Enter your account password to confirm that you want to
              permanently delete your account.
            </p>

            {deleteError && (
              <Alert variant="danger" className="py-2">
                {deleteError}
              </Alert>
            )}

            <Form.Group controlId="deleteAccountPassword">
              <Form.Label>Account Password</Form.Label>
              <Form.Control
                type="password"
                placeholder="Enter your password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                autoComplete="current-password"
                required
                disabled={deleting}
                autoFocus
              />
            </Form.Group>
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={closeDeleteModal}
              disabled={deleting}
            >
              Cancel
            </Button>

            <Button
              variant="danger"
              type="submit"
              disabled={deleting || !deletePassword}
            >
              {deleting ? (
                <>
                  <Spinner size="sm" animation="border" className="me-2" />
                  Deleting...
                </>
              ) : (
                'Permanently Delete Account'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  );
}
