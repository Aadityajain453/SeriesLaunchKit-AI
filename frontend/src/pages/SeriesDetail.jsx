import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Accordion, Alert, Badge, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import {
  FiLayers, FiDownload, FiRefreshCw, FiTrash2, FiFilm, FiEdit3, FiSave, FiX, FiFileText, FiArrowLeft, FiCopy, FiUsers,
} from 'react-icons/fi';
import api, { downloadFile, parseError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { ConfirmModal, CreditCost, LoadingBlock, PageHeader, StatusBadge } from '../components/common/ui';
import { formatDate } from '../utils/format';

function EpisodePanel({ series, episode, scriptCost, onUpdated }) {
  const toast = useToast();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(episode);
  const [saving, setSaving] = useState(false);
  const [writing, setWriting] = useState(false);

  useEffect(() => { setDraft(episode); }, [episode]);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch(`/series/${series._id}/episodes/${episode._id}`, {
        title: draft.title, hook: draft.hook, summary: draft.summary, videoPrompt: draft.videoPrompt, script: draft.script,
      });
      onUpdated(data.episode);
      setEditing(false);
      toast('Episode saved', 'success');
    } catch (err) {
      toast(parseError(err).message, 'danger');
    } finally {
      setSaving(false);
    }
  };

  const writeScript = async () => {
    setWriting(true);
    try {
      const { data } = await api.post(`/series/${series._id}/episodes/${episode._id}/script`);
      onUpdated(data.episode);
      toast(`Script ready for episode ${episode.number}`, 'success');
    } catch (err) {
      toast(parseError(err).message, 'danger');
    } finally {
      setWriting(false);
      refreshUser();
    }
  };

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); toast('Copied to clipboard', 'info'); } catch { toast('Copy failed', 'danger'); }
  };

  const toFilm = () => navigate('/film-studio', {
    state: { prompt: episode.videoPrompt, title: `${series.title} — Ep ${episode.number}: ${episode.title}`, projectId: series.project },
  });

  if (editing) {
    const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));
    return (
      <div className="slk-episode-edit">
        <Form.Group className="mb-2"><Form.Label>Title</Form.Label><Form.Control value={draft.title} onChange={set('title')} maxLength={200} /></Form.Group>
        <Form.Group className="mb-2"><Form.Label>Hook</Form.Label><Form.Control as="textarea" rows={2} value={draft.hook} onChange={set('hook')} maxLength={500} /></Form.Group>
        <Form.Group className="mb-2"><Form.Label>Summary</Form.Label><Form.Control as="textarea" rows={4} value={draft.summary} onChange={set('summary')} maxLength={3000} /></Form.Group>
        <Form.Group className="mb-2"><Form.Label>Video prompt</Form.Label><Form.Control as="textarea" rows={3} value={draft.videoPrompt} onChange={set('videoPrompt')} maxLength={2000} /></Form.Group>
        <Form.Group className="mb-3"><Form.Label>Script</Form.Label><Form.Control as="textarea" rows={8} className="font-monospace small" value={draft.script || ''} onChange={set('script')} maxLength={20000} /></Form.Group>
        <div className="d-flex gap-2">
          <Button className="slk-btn-primary" onClick={save} disabled={saving}>{saving ? <Spinner size="sm" className="me-1" /> : <FiSave className="me-1" />}Save</Button>
          <Button variant="light" onClick={() => { setDraft(episode); setEditing(false); }} disabled={saving}><FiX className="me-1" />Cancel</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {episode.hook && <div className="slk-hook"><span>HOOK</span>{episode.hook}</div>}
      <p className="mb-3">{episode.summary}</p>
      {episode.keyBeats?.length > 0 && (
        <ul className="slk-beats">{episode.keyBeats.map((b, i) => <li key={i}>{b}</li>)}</ul>
      )}
      {episode.videoPrompt && (
        <div className="slk-prompt-box">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small className="fw-semibold text-uppercase text-muted">Video prompt</small>
            <Button size="sm" variant="link" className="p-0 slk-link" onClick={() => copy(episode.videoPrompt)}><FiCopy className="me-1" />Copy</Button>
          </div>
          <div className="small">{episode.videoPrompt}</div>
        </div>
      )}
      {episode.script && (
        <div className="slk-script mt-3">
          <div className="d-flex justify-content-between align-items-center mb-1">
            <small className="fw-semibold text-uppercase text-muted">Script</small>
            <Button size="sm" variant="link" className="p-0 slk-link" onClick={() => copy(episode.script)}><FiCopy className="me-1" />Copy</Button>
          </div>
          <pre>{episode.script}</pre>
        </div>
      )}
      <div className="d-flex flex-wrap gap-2 mt-3">
        <Button size="sm" className="slk-btn-primary" onClick={toFilm} disabled={!episode.videoPrompt}><FiFilm className="me-1" />Create video</Button>
        <Button size="sm" variant="light" className="slk-btn-ghost" onClick={writeScript} disabled={writing}>
          {writing ? <Spinner size="sm" className="me-1" /> : <FiFileText className="me-1" />}
          {episode.script ? 'Rewrite script' : 'Write script'} · <CreditCost cost={scriptCost} />
        </Button>
        <Button size="sm" variant="light" className="slk-btn-ghost" onClick={() => setEditing(true)}><FiEdit3 className="me-1" />Edit</Button>
      </div>
    </>
  );
}

export default function SeriesDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshUser } = useAuth();
  const [series, setSeries] = useState(null);
  const [meta, setMeta] = useState(null);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    Promise.all([api.get(`/series/${id}`), api.get('/series/fields')])
      .then(([s, f]) => { setSeries(s.data.series); setMeta(f.data); })
      .catch((err) => setError(parseError(err).message));
  }, [id]);

  const exportPdf = async () => {
    setExporting(true);
    try {
      await downloadFile(`/series/${id}/pdf`, `${series.title}.pdf`);
      setSeries((s) => ({ ...s, pdfExports: (s.pdfExports || 0) + 1 }));
      toast('PDF exported', 'success');
    } catch (err) {
      let message = 'PDF export failed';
      if (err.response?.data instanceof Blob) {
        try { message = JSON.parse(await err.response.data.text()).message || message; } catch { /* ignore */ }
      }
      toast(message, 'danger');
    } finally {
      setExporting(false);
    }
  };

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const { data } = await api.post(`/series/${id}/regenerate`);
      setSeries(data.series);
      toast('Series regenerated', 'success');
    } catch (err) {
      toast(parseError(err).message, 'danger');
    } finally {
      setRegenerating(false);
      refreshUser();
    }
  };

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/series/${id}`);
      toast('Series deleted', 'info');
      navigate('/series-studio', { replace: true });
    } catch (err) {
      toast(parseError(err).message, 'danger');
      setDeleting(false);
    }
  };

  const updateEpisode = (ep) => {
    setSeries((s) => ({ ...s, content: { ...s.content, episodes: s.content.episodes.map((e) => (e._id === ep._id ? ep : e)) } }));
  };

  if (error) return <Alert variant="danger">{error}</Alert>;
  if (!series || !meta) return <LoadingBlock label="Loading series…" />;

  const c = series.content || {};
  const ready = series.status === 'ready';
  const detailFields = meta.fields.filter((f) => f.key !== 'title' && series.inputs?.[f.key] !== undefined && series.inputs?.[f.key] !== '');

  return (
    <>
      <PageHeader
        icon={FiLayers}
        title={series.title}
        subtitle={c.logline || `Created ${formatDate(series.createdAt)}`}
        actions={(
          <>
            <Button variant="light" className="slk-btn-ghost" onClick={() => navigate('/series-studio')}><FiArrowLeft className="me-1" />All series</Button>
            <Button className="slk-btn-primary" onClick={exportPdf} disabled={!ready || exporting}>
              {exporting ? <Spinner size="sm" className="me-1" /> : <FiDownload className="me-1" />}Export PDF
            </Button>
            <Button variant="light" className="slk-btn-ghost" onClick={regenerate} disabled={regenerating || series.status === 'generating'}>
              {regenerating ? <Spinner size="sm" className="me-1" /> : <FiRefreshCw className="me-1" />}Regenerate · <CreditCost cost={meta.cost} />
            </Button>
            <Button variant="light" className="slk-btn-ghost text-danger" onClick={() => setConfirmDelete(true)} aria-label="Delete series"><FiTrash2 /></Button>
          </>
        )}
      />

      {series.status === 'failed' && (
        <Alert variant="danger">Generation failed: {series.error || 'unknown error'}. Your credits were refunded — click Regenerate to try again.</Alert>
      )}
      {regenerating && <Alert variant="info" className="d-flex align-items-center gap-2"><Spinner size="sm" />Regenerating your series. This can take up to a minute…</Alert>}

      <Row className="g-3">
        <Col xl={8}>
          {c.synopsis && (
            <Card className="slk-card mb-3">
              <Card.Header className="slk-card-header"><span>Synopsis</span><StatusBadge status={series.status} /></Card.Header>
              <Card.Body>
                <p className="mb-2" style={{ whiteSpace: 'pre-line' }}>{c.synopsis}</p>
                {c.themes?.length > 0 && <div className="d-flex flex-wrap gap-2">{c.themes.map((t) => <span key={t} className="slk-chip">{t}</span>)}</div>}
              </Card.Body>
            </Card>
          )}

          {c.episodes?.length > 0 && (
            <Card className="slk-card mb-3">
              <Card.Header className="slk-card-header"><span>Episodes ({c.episodes.length})</span></Card.Header>
              <Card.Body className="p-0">
                <Accordion alwaysOpen defaultActiveKey={[c.episodes[0]._id]} className="slk-accordion">
                  {c.episodes.map((ep) => (
                    <Accordion.Item eventKey={ep._id} key={ep._id}>
                      <Accordion.Header>
                        <span className="slk-ep-num">{ep.number}</span>
                        <span className="fw-semibold me-2">{ep.title}</span>
                        {ep.script && <Badge bg="light" text="dark" className="ms-auto me-2">Script</Badge>}
                      </Accordion.Header>
                      <Accordion.Body>
                        <EpisodePanel series={series} episode={ep} scriptCost={meta.scriptCost} onUpdated={updateEpisode} />
                      </Accordion.Body>
                    </Accordion.Item>
                  ))}
                </Accordion>
              </Card.Body>
            </Card>
          )}
        </Col>

        <Col xl={4}>
          {c.characters?.length > 0 && (
            <Card className="slk-card mb-3">
              <Card.Header className="slk-card-header"><span><FiUsers className="me-2" />Characters</span></Card.Header>
              <Card.Body>
                {c.characters.map((ch) => (
                  <div key={ch.name} className="slk-character">
                    <div className="fw-semibold">{ch.name}</div>
                    {ch.role && <div className="small text-olive">{ch.role}</div>}
                    <div className="small text-muted">{ch.description}</div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}

          {(c.marketing?.tagline || c.marketing?.hashtags?.length > 0) && (
            <Card className="slk-card mb-3">
              <Card.Header className="slk-card-header"><span>Marketing kit</span></Card.Header>
              <Card.Body>
                {c.marketing.tagline && <p className="fst-italic">“{c.marketing.tagline}”</p>}
                {c.marketing.hashtags?.length > 0 && <div className="d-flex flex-wrap gap-1 mb-3">{c.marketing.hashtags.map((h) => <span key={h} className="slk-chip">{h}</span>)}</div>}
                {c.marketing.thumbnailIdeas?.length > 0 && (
                  <>
                    <small className="fw-semibold text-uppercase text-muted">Thumbnail ideas</small>
                    <ul className="small ps-3 mt-1 mb-0">{c.marketing.thumbnailIdeas.map((t) => <li key={t}>{t}</li>)}</ul>
                  </>
                )}
              </Card.Body>
            </Card>
          )}

          <Card className="slk-card">
            <Card.Header className="slk-card-header"><span>Series brief</span></Card.Header>
            <Card.Body>
              <dl className="slk-dl">
                {detailFields.map((f) => (
                  <div key={f.key} className="contents">
                    <dt>{f.label}</dt><dd className="text-break" style={{ whiteSpace: 'pre-line' }}>{String(series.inputs[f.key])}</dd>
                  </div>
                ))}
                <dt>PDF exports</dt><dd>{series.pdfExports || 0}</dd>
              </dl>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <ConfirmModal
        show={confirmDelete}
        title="Delete this series?"
        body={`"${series.title}" and its episodes will be permanently deleted. Videos you generated stay in My Videos.`}
        onConfirm={remove}
        onHide={() => setConfirmDelete(false)}
        busy={deleting}
      />
    </>
  );
}
