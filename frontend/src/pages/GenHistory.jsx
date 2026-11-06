import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Card, Form, Modal, Pagination, Spinner, Table } from 'react-bootstrap';
import { FiClock, FiEye, FiTrash2, FiCopy } from 'react-icons/fi';
import api, { parseError } from '../api/client';
import { useToast } from '../context/ToastContext';
import { ConfirmModal, EmptyState, LoadingBlock, PageHeader, StatusBadge } from '../components/common/ui';
import { formatDateTime, GEN_TYPE_LABELS } from '../utils/format';

export default function GenHistory() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [viewing, setViewing] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.get('/generations', { params: { type: type || undefined, page } });
      setData(d);
    } catch (err) {
      setError(parseError(err).message);
    }
  }, [type, page]);
  useEffect(() => { load(); }, [load]);

  const view = async (g) => {
    setViewLoading(true);
    setViewing({ ...g });
    try {
      const { data: d } = await api.get(`/generations/${g._id}`);
      setViewing(d.generation);
    } catch (err) {
      toast(parseError(err).message, 'danger');
      setViewing(null);
    } finally {
      setViewLoading(false);
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/generations/${toDelete._id}`);
      toast('Removed from history', 'info');
      setToDelete(null);
      load();
    } catch (err) {
      toast(parseError(err).message, 'danger');
    } finally {
      setDeleting(false);
    }
  };

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); toast('Copied', 'info'); } catch { toast('Copy failed', 'danger'); }
  };

  return (
    <>
      <PageHeader icon={FiClock} title="Gen History" subtitle="Every AI generation you've run, with inputs and outputs." />
      <div className="slk-toolbar">
        <Form.Select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="slk-filter" aria-label="Filter by type">
          <option value="">All types</option>
          {Object.entries(GEN_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Form.Select>
        {data && <span className="small text-muted">{data.total} generation{data.total === 1 ? '' : 's'}</span>}
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {!data && !error && <LoadingBlock />}
      {data && data.generations.length === 0 && (
        <Card className="slk-card"><Card.Body><EmptyState icon={FiClock} title="No generations yet" text="AI generations from Series Studio and Film Studio will appear here." /></Card.Body></Card>
      )}
      {data && data.generations.length > 0 && (
        <Card className="slk-card">
          <div className="table-responsive">
            <Table hover className="slk-table mb-0 align-middle">
              <thead><tr><th>Generation</th><th>Type</th><th>Status</th><th>Credits</th><th>Date</th><th className="text-end">Actions</th></tr></thead>
              <tbody>
                {data.generations.map((g) => (
                  <tr key={g._id}>
                    <td className="fw-semibold" style={{ maxWidth: 320 }}><div className="text-truncate">{g.title}</div>{g.error && <div className="small text-danger text-truncate">{g.error}</div>}</td>
                    <td><span className="slk-chip">{GEN_TYPE_LABELS[g.type]}</span></td>
                    <td><StatusBadge status={g.status} /></td>
                    <td>{g.creditsUsed || 0}</td>
                    <td className="small text-muted text-nowrap">{formatDateTime(g.createdAt)}</td>
                    <td className="text-end text-nowrap">
                      <Button size="sm" variant="light" className="slk-btn-ghost me-1" onClick={() => view(g)} aria-label="View"><FiEye /></Button>
                      <Button size="sm" variant="light" className="slk-btn-ghost text-danger" onClick={() => setToDelete(g)} aria-label="Delete"><FiTrash2 /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
          {data.pages > 1 && (
            <Card.Footer className="bg-white d-flex justify-content-center">
              <Pagination className="mb-0">
                <Pagination.Prev disabled={page <= 1} onClick={() => setPage((p) => p - 1)} />
                <Pagination.Item active>{page} / {data.pages}</Pagination.Item>
                <Pagination.Next disabled={page >= data.pages} onClick={() => setPage((p) => p + 1)} />
              </Pagination>
            </Card.Footer>
          )}
        </Card>
      )}

      <Modal show={Boolean(viewing)} onHide={() => setViewing(null)} size="lg" centered scrollable>
        <Modal.Header closeButton><Modal.Title as="h5">{viewing?.title}</Modal.Title></Modal.Header>
        <Modal.Body>
          {viewLoading ? <div className="text-center py-4"><Spinner /></div> : viewing && (
            <>
              <div className="d-flex flex-wrap gap-2 mb-3 small">
                <span className="slk-chip">{GEN_TYPE_LABELS[viewing.type]}</span>
                <StatusBadge status={viewing.status} />
                {viewing.model && <span className="text-muted">Model: {viewing.model}</span>}
                <span className="text-muted">{formatDateTime(viewing.createdAt)}</span>
                {viewing.series && <Link to={`/series-studio/${viewing.series}`} className="slk-link">Open series</Link>}
              </div>
              {viewing.error && <Alert variant="danger" className="small">{viewing.error}</Alert>}
              {viewing.output && (
                <>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <small className="fw-semibold text-uppercase text-muted">Output</small>
                    <Button size="sm" variant="link" className="p-0 slk-link" onClick={() => copy(viewing.output)}><FiCopy className="me-1" />Copy</Button>
                  </div>
                  <pre className="slk-pre">{viewing.output}</pre>
                </>
              )}
              {viewing.input && (
                <>
                  <small className="fw-semibold text-uppercase text-muted">Input</small>
                  <pre className="slk-pre small">{viewing.input}</pre>
                </>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>

      <ConfirmModal
        show={Boolean(toDelete)}
        title="Remove from history?"
        body="This removes the record from your generation history. It doesn't affect series or videos."
        confirmLabel="Remove"
        onConfirm={remove}
        onHide={() => setToDelete(null)}
        busy={deleting}
      />
    </>
  );
}
