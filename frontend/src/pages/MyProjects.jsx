import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Col, Dropdown, Form, InputGroup, Modal, Row, Spinner } from 'react-bootstrap';
import { FiFolder, FiPlus, FiSearch, FiArrowRight, FiLayers, FiFilm, FiMoreVertical, FiEdit3, FiTrash2 } from 'react-icons/fi';
import api, { parseError } from '../api/client';
import { useToast } from '../context/ToastContext';
import { ConfirmModal, EmptyState, LoadingBlock, PageHeader, StatusBadge } from '../components/common/ui';
import { formatDate, timeAgo } from '../utils/format';

const EMPTY = { title: '', description: '', kind: 'general', status: 'draft' };

export function ProjectFormModal({ show, initial, onHide, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const editing = Boolean(initial?._id);

  useEffect(() => {
    if (show) { setForm(initial ? { ...EMPTY, ...initial } : EMPTY); setErrors({}); }
  }, [show, initial]);

  const set = (k) => (e) => { setForm((f) => ({ ...f, [k]: e.target.value })); setErrors((er) => ({ ...er, [k]: undefined })); };

  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (form.title.trim().length < 2) er.title = 'Title must be at least 2 characters';
    if (form.description.length > 1000) er.description = 'Keep it under 1000 characters';
    setErrors(er);
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      const payload = { title: form.title.trim(), description: form.description.trim(), kind: form.kind, status: form.status };
      const { data } = editing ? await api.patch(`/projects/${initial._id}`, payload) : await api.post('/projects', payload);
      toast(data.message, 'success');
      onSaved(data.project);
    } catch (err) {
      const { message, fields } = parseError(err);
      setErrors(fields);
      toast(message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={saving ? undefined : onHide} centered>
      <Form noValidate onSubmit={submit}>
        <Modal.Header closeButton={!saving}><Modal.Title as="h5">{editing ? 'Edit project' : 'New project'}</Modal.Title></Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3" controlId="pf-title">
            <Form.Label>Title <span className="text-danger">*</span></Form.Label>
            <Form.Control value={form.title} onChange={set('title')} isInvalid={Boolean(errors.title)} maxLength={120} autoFocus />
            <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
          </Form.Group>
          <Form.Group className="mb-3" controlId="pf-desc">
            <Form.Label>Description</Form.Label>
            <Form.Control as="textarea" rows={3} value={form.description} onChange={set('description')} isInvalid={Boolean(errors.description)} maxLength={1000} />
            <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
          </Form.Group>
          <Row className="g-3">
            <Col sm={6}>
              <Form.Group controlId="pf-kind">
                <Form.Label>Type</Form.Label>
                <Form.Select value={form.kind} onChange={set('kind')} disabled={editing && initial.kind === 'series'}>
                  <option value="general">General</option>
                  <option value="film">Film</option>
                  {(editing && initial.kind === 'series') && <option value="series">Series</option>}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col sm={6}>
              <Form.Group controlId="pf-status">
                <Form.Label>Status</Form.Label>
                <Form.Select value={form.status} onChange={set('status')}>
                  <option value="draft">Draft</option>
                  <option value="in_progress">In progress</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="light" onClick={onHide} disabled={saving}>Cancel</Button>
          <Button type="submit" className="slk-btn-primary" disabled={saving}>{saving && <Spinner size="sm" className="me-2" />}{editing ? 'Save changes' : 'Create project'}</Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}

export default function MyProjects() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();
  const [projects, setProjects] = useState(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal] = useState({ show: false, initial: null });
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/projects', { params: { q: q || undefined, status: status || undefined } });
      setProjects(data.projects);
    } catch (err) {
      setError(parseError(err).message);
    }
  }, [q, status]);

  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  useEffect(() => {
    if (location.state?.create) {
      setModal({ show: true, initial: null });
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/projects/${toDelete._id}`);
      toast('Project deleted', 'info');
      setToDelete(null);
      load();
    } catch (err) {
      toast(parseError(err).message, 'danger');
    } finally {
      setDeleting(false);
    }
  };

  const openLink = (p) => (p.seriesId ? `/series-studio/${p.seriesId}` : `/my-projects/${p._id}`);

  return (
    <>
      <PageHeader
        icon={FiFolder}
        title="My Projects"
        subtitle="Every series and video, organised by project."
        actions={<Button className="slk-btn-primary" onClick={() => setModal({ show: true, initial: null })}><FiPlus className="me-1" />New Project</Button>}
      />

      <div className="slk-toolbar">
        <InputGroup className="slk-input-group slk-search">
          <InputGroup.Text><FiSearch /></InputGroup.Text>
          <Form.Control placeholder="Search projects…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search projects" />
        </InputGroup>
        <Form.Select value={status} onChange={(e) => setStatus(e.target.value)} className="slk-filter" aria-label="Filter by status">
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </Form.Select>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}
      {!projects && !error && <LoadingBlock />}
      {projects && projects.length === 0 && (
        <div className="card slk-card"><div className="card-body">
          <EmptyState icon={FiFolder} title={q || status ? 'No matching projects' : 'No projects yet'}
            text={q || status ? 'Try a different search or filter.' : 'Projects are created automatically for each series, or you can create one yourself.'}
            action={!q && !status && <Button className="slk-btn-primary" onClick={() => setModal({ show: true, initial: null })}><FiPlus className="me-1" />New Project</Button>} />
        </div></div>
      )}
      {projects && projects.length > 0 && (
        <Row className="g-3">
          {projects.map((p) => (
            <Col key={p._id} md={6} xl={4}>
              <div className="slk-project-card h-100 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                  <div className="slk-project-kind">{p.kind === 'series' ? <FiLayers /> : p.kind === 'film' ? <FiFilm /> : <FiFolder />}</div>
                  <div className="d-flex align-items-center gap-1">
                    <StatusBadge status={p.status} />
                    <Dropdown align="end">
                      <Dropdown.Toggle as="button" className="slk-icon-btn slk-no-caret sm" aria-label="Project actions"><FiMoreVertical /></Dropdown.Toggle>
                      <Dropdown.Menu className="shadow border-0">
                        <Dropdown.Item onClick={() => setModal({ show: true, initial: p })}><FiEdit3 className="me-2" />Edit</Dropdown.Item>
                        <Dropdown.Item className="text-danger" onClick={() => setToDelete(p)}><FiTrash2 className="me-2" />Delete</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </div>
                <h6 className="slk-project-title">{p.title}</h6>
                {p.description && <p className="small text-muted slk-clamp-2 mb-2">{p.description}</p>}
                <div className="slk-project-meta mt-auto">
                  <span>Created {formatDate(p.createdAt)}</span>
                  <span>Updated {timeAgo(p.updatedAt)}</span>
                  {p.kind === 'series' && <span>{p.episodes} episodes</span>}
                  <span>{p.videos} video{p.videos === 1 ? '' : 's'}</span>
                </div>
                <Button as={Link} to={openLink(p)} size="sm" variant="light" className="slk-btn-ghost mt-3">Open <FiArrowRight className="ms-1" /></Button>
              </div>
            </Col>
          ))}
        </Row>
      )}

      <ProjectFormModal
        show={modal.show}
        initial={modal.initial}
        onHide={() => setModal({ show: false, initial: null })}
        onSaved={() => { setModal({ show: false, initial: null }); load(); }}
      />
      <ConfirmModal
        show={Boolean(toDelete)}
        title="Delete project?"
        body={toDelete && `"${toDelete.title}"${toDelete.seriesId ? ' and its series' : ''} will be permanently deleted. Videos stay in My Videos.`}
        onConfirm={remove}
        onHide={() => setToDelete(null)}
        busy={deleting}
      />
    </>
  );
}
