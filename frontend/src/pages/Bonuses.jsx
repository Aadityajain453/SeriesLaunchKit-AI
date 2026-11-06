import { useEffect, useState } from 'react';
import { Alert, Button, Card, Col, Row } from 'react-bootstrap';
import { FiGift, FiCopy, FiDownload } from 'react-icons/fi';
import api, { parseError } from '../api/client';
import { useToast } from '../context/ToastContext';
import { EmptyState, LoadingBlock, PageHeader } from '../components/common/ui';

export default function Bonuses() {
  const toast = useToast();
  const [bonuses, setBonuses] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/bonuses').then(({ data }) => setBonuses(data.bonuses)).catch((err) => setError(parseError(err).message));
  }, []);

  const copy = async (text, label = 'Copied') => {
    try { await navigator.clipboard.writeText(text); toast(label, 'info'); } catch { toast('Copy failed', 'danger'); }
  };

  return (
    <>
      <PageHeader icon={FiGift} title="Bonuses" subtitle="Templates, prompt packs and checklists included with your account." />
      {error && <Alert variant="danger">{error}</Alert>}
      {!bonuses && !error && <LoadingBlock />}
      {bonuses && bonuses.length === 0 && <Card className="slk-card"><Card.Body><EmptyState icon={FiGift} title="No bonuses available yet" /></Card.Body></Card>}
      {bonuses && bonuses.length > 0 && (
        <Row className="g-3">
          {bonuses.map((b) => (
            <Col key={b.id} lg={6}>
              <Card className="slk-card h-100">
                <Card.Header className="slk-card-header">
                  <span><FiGift className="me-2 text-olive" />{b.title}</span>
                  <span className="slk-chip">{b.category}</span>
                </Card.Header>
                <Card.Body>
                  <p className="text-muted small">{b.description}</p>
                  {b.items?.length > 0 && (
                    <ul className="slk-bonus-list">
                      {b.items.map((it, i) => (
                        <li key={i}>
                          <span>{it}</span>
                          <button type="button" className="slk-icon-btn sm" onClick={() => copy(it)} aria-label="Copy item"><FiCopy /></button>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="d-flex gap-2 mt-3">
                    {b.items?.length > 0 && (
                      <Button size="sm" variant="light" className="slk-btn-ghost" onClick={() => copy(b.items.join('\n'), 'All items copied')}>
                        <FiCopy className="me-1" />Copy all
                      </Button>
                    )}
                    {b.downloadUrl && (
                      <Button size="sm" className="slk-btn-primary" href={b.downloadUrl} target="_blank" rel="noopener noreferrer">
                        <FiDownload className="me-1" />Download
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </>
  );
}
