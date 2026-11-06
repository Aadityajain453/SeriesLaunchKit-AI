import { Badge, Button, Modal, Spinner } from 'react-bootstrap';

const STATUS_MAP = {
  draft: ['secondary', 'Draft'],
  in_progress: ['info', 'In progress'],
  completed: ['success', 'Completed'],
  archived: ['dark', 'Archived'],
  generating: ['warning', 'Generating'],
  ready: ['success', 'Ready'],
  failed: ['danger', 'Failed'],
  queued: ['secondary', 'Queued'],
  processing: ['warning', 'Processing'],
  success: ['success', 'Success'],
};

export function StatusBadge({ status }) {
  const [bg, label] = STATUS_MAP[status] || ['secondary', status];
  return <Badge bg={bg} className={`slk-status slk-status-${bg}`}>{label}</Badge>;
}

export function PageHeader({ title, subtitle, icon: Icon, actions }) {
  return (
    <div className="slk-page-header">
      <div className="d-flex align-items-center gap-3">
        {Icon && <div className="slk-page-icon"><Icon /></div>}
        <div>
          <h1 className="slk-page-title">{title}</h1>
          {subtitle && <p className="slk-page-subtitle">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="d-flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="slk-empty">
      {Icon && <div className="slk-empty-icon"><Icon /></div>}
      <h5>{title}</h5>
      {text && <p className="text-muted mb-3">{text}</p>}
      {action}
    </div>
  );
}

export function LoadingBlock({ label = 'Loading…' }) {
  return (
    <div className="slk-loading-block">
      <Spinner animation="border" size="sm" className="me-2" /> {label}
    </div>
  );
}

export function ConfirmModal({ show, title, body, confirmLabel = 'Delete', onConfirm, onHide, busy }) {
  return (
    <Modal show={show} onHide={busy ? undefined : onHide} centered>
      <Modal.Header closeButton={!busy}><Modal.Title as="h5">{title}</Modal.Title></Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant="light" onClick={onHide} disabled={busy}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={busy}>
          {busy && <Spinner size="sm" className="me-2" />}{confirmLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export function CreditCost({ cost }) {
  return <span className="slk-cost">{cost} credit{cost === 1 ? '' : 's'}</span>;
}
