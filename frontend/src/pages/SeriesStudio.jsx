import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Col, Row } from 'react-bootstrap';
import { FiLayers, FiPlus, FiArrowRight, FiFileText } from 'react-icons/fi';
import api, { parseError } from '../api/client';
import { EmptyState, LoadingBlock, PageHeader, StatusBadge } from '../components/common/ui';
import { formatDate } from '../utils/format';

export default function SeriesStudio() {
  const navigate = useNavigate();
  const [items, setItems] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/series').then(({ data }) => setItems(data.series)).catch((err) => setError(parseError(err).message));
  }, []);

  return (
    <>
      <PageHeader
        icon={FiLayers}
        title="Series Studio"
        subtitle="Plan complete AI video series — characters, episodes, scripts and video prompts."
        actions={<Button className="slk-btn-primary" onClick={() => navigate('/series-studio/new')}><FiPlus className="me-1" />New Series</Button>}
      />
      {error && <Alert variant="danger">{error}</Alert>}
      {!items && !error && <LoadingBlock />}
      {items && items.length === 0 && (
        <div className="slk-card card"><div className="card-body">
          <EmptyState
            icon={FiLayers}
            title="Create your first series"
            text="Describe your idea and the AI builds a full series plan with episode hooks, outlines and video prompts."
            action={<Button className="slk-btn-primary" onClick={() => navigate('/series-studio/new')}><FiPlus className="me-1" />New Series</Button>}
          />
        </div></div>
      )}
      {items && items.length > 0 && (
        <Row className="g-3">
          {items.map((s) => (
            <Col key={s._id} md={6} xl={4}>
              <div className="slk-series-card">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <span className="slk-chip">{s.inputs?.genre}</span>
                  <StatusBadge status={s.status} />
                </div>
                <h5 className="slk-series-title">{s.title}</h5>
                <p className="slk-series-logline">{s.content?.logline || 'No plan generated yet.'}</p>
                <div className="slk-project-meta">
                  <span>{s.content?.episodes?.length || 0}/{s.inputs?.episodeCount} episodes</span>
                  <span>{s.inputs?.platform}</span>
                  <span>Created {formatDate(s.createdAt)}</span>
                  {s.pdfExports > 0 && <span><FiFileText /> {s.pdfExports} PDF</span>}
                </div>
                <Button as={Link} to={`/series-studio/${s._id}`} variant="light" className="slk-btn-ghost w-100 mt-3">
                  Open <FiArrowRight className="ms-1" />
                </Button>
              </div>
            </Col>
          ))}
        </Row>
      )}
    </>
  );
}
