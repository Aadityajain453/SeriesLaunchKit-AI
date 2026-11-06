import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Alert, Button, Card, Col, Row } from 'react-bootstrap';
import { FiFolder, FiArrowLeft, FiEdit3, FiFilm, FiVideo, FiLayers, FiArrowRight } from 'react-icons/fi';
import api, { parseError } from '../api/client';
import { EmptyState, LoadingBlock, PageHeader, StatusBadge } from '../components/common/ui';
import VideoCard from '../components/common/VideoCard';
import { ProjectFormModal } from './MyProjects';
import { formatDate } from '../utils/format';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const load = useCallback(() => {
    api.get(`/projects/${id}`).then(({ data: d }) => setData(d)).catch((err) => setError(parseError(err).message));
  }, [id]);
  useEffect(load, [load]);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!data) return <LoadingBlock />;
  const { project, series, videos } = data;

  return (
    <>
      <PageHeader
        icon={FiFolder}
        title={project.title}
        subtitle={project.description || `Created ${formatDate(project.createdAt)}`}
        actions={(
          <>
            <Button variant="light" className="slk-btn-ghost" onClick={() => navigate('/my-projects')}><FiArrowLeft className="me-1" />Projects</Button>
            <Button variant="light" className="slk-btn-ghost" onClick={() => setEditing(true)}><FiEdit3 className="me-1" />Edit</Button>
            <Button className="slk-btn-primary" onClick={() => navigate('/film-studio', { state: { projectId: project._id } })}><FiFilm className="me-1" />Add video</Button>
          </>
        )}
      />
      <Row className="g-3 mb-3">
        <Col md={4}><Card className="slk-card"><Card.Body><small className="text-muted d-block">Status</small><StatusBadge status={project.status} /></Card.Body></Card></Col>
        <Col md={4}><Card className="slk-card"><Card.Body><small className="text-muted d-block">Type</small><span className="fw-semibold text-capitalize">{project.kind}</span></Card.Body></Card></Col>
        <Col md={4}><Card className="slk-card"><Card.Body><small className="text-muted d-block">Last updated</small><span className="fw-semibold">{formatDate(project.updatedAt)}</span></Card.Body></Card></Col>
      </Row>

      {series && (
        <Card className="slk-card mb-3">
          <Card.Header className="slk-card-header"><span><FiLayers className="me-2" />Series</span><StatusBadge status={series.status} /></Card.Header>
          <Card.Body className="d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div>
              <div className="fw-semibold">{series.title}</div>
              <div className="small text-muted">{series.content?.logline}</div>
              <div className="small text-muted">{series.content?.episodes?.length || 0} episodes</div>
            </div>
            <Button as={Link} to={`/series-studio/${series._id}`} className="slk-btn-primary">Open series <FiArrowRight className="ms-1" /></Button>
          </Card.Body>
        </Card>
      )}

      <h5 className="fw-bold mb-3">Videos</h5>
      {videos.length === 0 ? (
        <Card className="slk-card"><Card.Body><EmptyState icon={FiVideo} title="No videos in this project" text="Generate a video in Film Studio and add it to this project." /></Card.Body></Card>
      ) : (
        <Row className="g-3">{videos.map((v) => <Col key={v._id} sm={6} lg={4} xl={3}><VideoCard video={v} /></Col>)}</Row>
      )}

      <ProjectFormModal show={editing} initial={project} onHide={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />
    </>
  );
}
