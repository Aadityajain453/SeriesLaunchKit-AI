import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Col, Row } from 'react-bootstrap';
import {
  FiLayers, FiFolder, FiVideo, FiCpu, FiFileText, FiZap, FiArrowRight, FiFilm, FiEdit3, FiClock, FiPlus,
} from 'react-icons/fi';
import api, { parseError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { EmptyState, LoadingBlock, StatusBadge } from '../components/common/ui';
import { formatDate, initials, timeAgo } from '../utils/format';

const ACTIVITY_ICONS = {
  series_created: FiLayers,
  project_created: FiFolder,
  project_updated: FiEdit3,
  video_generated: FiVideo,
  ai_generation: FiCpu,
  pdf_export: FiFileText,
};

function StatCard({ icon: Icon, label, value, tone, hint }) {
  return (
    <Card className="slk-card slk-stat h-100">
      <Card.Body>
        <div className={`slk-stat-icon tone-${tone}`}><Icon /></div>
        <div className="slk-stat-value">{value.toLocaleString()}</div>
        <div className="slk-stat-label">{label}</div>
        {hint && <div className="slk-stat-hint">{hint}</div>}
      </Card.Body>
    </Card>
  );
}

function projectLink(p) {
  return p.seriesId ? `/series-studio/${p.seriesId}` : `/my-projects/${p._id}`;
}

export default function Dashboard() {
  const { setCredits } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    api.get('/dashboard')
      .then(({ data: d }) => { if (alive) { setData(d); setCredits(d.stats.credits); } })
      .catch((err) => alive && setError(parseError(err).message));
    return () => { alive = false; };
  }, [setCredits]);

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!data) return <LoadingBlock label="Loading your dashboard…" />;

  const { user, stats, recentActivity, recentProjects } = data;
  const firstName = user.name.split(' ')[0];

  return (
    <>
      <section className="slk-hero">
        <div className="d-flex align-items-center gap-3">
          <div className="slk-avatar slk-avatar-lg">{initials(user.name)}</div>
          <div>
            <h1 className="slk-hero-title">Welcome back, {firstName} 👋</h1>
            <div className="slk-hero-sub">{user.email}</div>
          </div>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <Button className="slk-btn-primary" onClick={() => navigate('/series-studio/new')}>
            <FiZap className="me-1" /> Try Now — New Series
          </Button>
          <Button variant="light" className="slk-btn-ghost" onClick={() => navigate('/film-studio')}>
            <FiFilm className="me-1" /> Generate Video
          </Button>
        </div>
      </section>

      <Row className="g-3 mb-4">
        <Col xs={6} md={4} xl={2}><StatCard icon={FiLayers} label="Series Created" value={stats.totalSeries} tone="lime" /></Col>
        <Col xs={6} md={4} xl={2}><StatCard icon={FiFolder} label="Total Projects" value={stats.totalProjects} tone="blue" /></Col>
        <Col xs={6} md={4} xl={2}><StatCard icon={FiVideo} label="Videos Created" value={stats.totalVideos} tone="purple" hint={`${stats.completedVideos} completed`} /></Col>
        <Col xs={6} md={4} xl={2}><StatCard icon={FiCpu} label="AI Generations" value={stats.totalGenerations} tone="orange" /></Col>
        <Col xs={6} md={4} xl={2}><StatCard icon={FiFileText} label="PDFs Exported" value={stats.totalPdfExports} tone="pink" /></Col>
        <Col xs={6} md={4} xl={2}><StatCard icon={FiZap} label="Available Credits" value={stats.credits} tone="dark" /></Col>
      </Row>

      <Row className="g-3">
        <Col xl={8}>
          <Card className="slk-card mb-3">
            <Card.Header className="slk-card-header">
              <span>Recent Projects</span>
              <Link to="/my-projects" className="slk-link small">View all <FiArrowRight /></Link>
            </Card.Header>
            <Card.Body>
              {recentProjects.length === 0 ? (
                <EmptyState
                  icon={FiFolder}
                  title="No projects yet"
                  text="Create your first series and it will appear here as a project."
                  action={<Button className="slk-btn-primary" onClick={() => navigate('/series-studio/new')}><FiPlus className="me-1" />Create a Series</Button>}
                />
              ) : (
                <Row className="g-3">
                  {recentProjects.map((p) => (
                    <Col md={6} key={p._id}>
                      <div className="slk-project-card">
                        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                          <div className="slk-project-kind">{p.kind === 'series' ? <FiLayers /> : p.kind === 'film' ? <FiFilm /> : <FiFolder />}</div>
                          <StatusBadge status={p.status} />
                        </div>
                        <h6 className="slk-project-title text-truncate" title={p.title}>{p.title}</h6>
                        <div className="slk-project-meta">
                          <span>Created {formatDate(p.createdAt)}</span>
                          {p.kind === 'series' && <span>{p.episodes} episodes</span>}
                          <span>{p.videos} video{p.videos === 1 ? '' : 's'}</span>
                        </div>
                        <Button size="sm" variant="light" className="slk-btn-ghost mt-3 w-100" as={Link} to={projectLink(p)}>
                          Open <FiArrowRight className="ms-1" />
                        </Button>
                      </div>
                    </Col>
                  ))}
                </Row>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col xl={4}>
          <Card className="slk-card mb-3">
            <Card.Header className="slk-card-header"><span>Account</span></Card.Header>
            <Card.Body>
              <dl className="slk-dl">
                <dt>Name</dt><dd>{user.name}</dd>
                <dt>Email</dt><dd className="text-break">{user.email}</dd>
                <dt>Plan</dt><dd>{user.plan}</dd>
                <dt>Credits</dt><dd>{user.credits}</dd>
                <dt>Member since</dt><dd>{formatDate(user.createdAt)}</dd>
                <dt>Last login</dt><dd>{user.lastLoginAt ? timeAgo(user.lastLoginAt) : '—'}</dd>
              </dl>
            </Card.Body>
          </Card>

          <Card className="slk-card">
            <Card.Header className="slk-card-header">
              <span>Recent Activity</span>
              <Link to="/gen-history" className="slk-link small">History <FiArrowRight /></Link>
            </Card.Header>
            <Card.Body className="p-0">
              {recentActivity.length === 0 ? (
                <div className="p-4 text-center text-muted small">No activity yet. Everything you create will show up here.</div>
              ) : (
                <ul className="slk-activity">
                  {recentActivity.map((a) => {
                    const Icon = ACTIVITY_ICONS[a.type] || FiClock;
                    return (
                      <li key={a._id}>
                        <span className={`slk-activity-icon type-${a.type}`}><Icon /></span>
                        <div className="min-w-0">
                          <div className="small text-wrap">{a.message}</div>
                          <div className="slk-activity-time">{timeAgo(a.createdAt)}</div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}
