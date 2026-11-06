import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Alert, Button, Card, Col, Form, ProgressBar, Row, Spinner } from 'react-bootstrap';
import { FiFilm, FiZap, FiDownload, FiStar, FiAlertTriangle, FiArrowRight, FiVideo } from 'react-icons/fi';
import api, { downloadFile, parseError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CreditCost, EmptyState, LoadingBlock, PageHeader, StatusBadge } from '../components/common/ui';
import VideoCard from '../components/common/VideoCard';

const RATIO_LABELS = { '16:9': 'Landscape · YouTube', '9:16': 'Vertical · Shorts / Reels / TikTok', '1:1': 'Square · Feed' };

export default function FilmStudio() {
  const location = useLocation();
  const { refreshUser } = useAuth();
  const toast = useToast();
  const prefill = location.state || {};

  const [options, setOptions] = useState(null);
  const [projects, setProjects] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [form, setForm] = useState({
    title: prefill.title || '',
    prompt: prefill.prompt || '',
    description: '',
    resolution: '',
    aspectRatio: '',
    projectId: prefill.projectId || '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [active, setActive] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const pollRef = useRef(null);

  const loadHistory = useCallback(async () => {
    const { data } = await api.get('/videos', { params: { limit: 8 } });
    setHistory(data.videos);
    return data.videos;
  }, []);

  useEffect(() => {
    Promise.all([api.get('/videos/options'), api.get('/projects'), loadHistory()])
      .then(([o, p, vids]) => {
        setOptions(o.data);
        setProjects(p.data.projects.filter((x) => x.status !== 'archived'));
        setForm((f) => ({
          ...f,
          resolution: f.resolution || o.data.resolutions[0] || '',
          aspectRatio: f.aspectRatio || o.data.aspectRatios[0] || '',
        }));
        const running = vids.find((v) => ['queued', 'processing'].includes(v.status));
        if (running) setActive(running);
      })
      .catch((err) => setLoadError(parseError(err).message));
  }, [loadHistory]);

  // Poll the active job until it finishes.
  useEffect(() => {
    clearInterval(pollRef.current);
    if (!active || !['queued', 'processing'].includes(active.status)) return undefined;
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/videos/${active._id}`);
        setActive(data.video);
        if (data.video.status === 'completed') {
          toast('Your video is ready!', 'success');
          loadHistory();
        } else if (data.video.status === 'failed') {
          toast('Video generation failed. Credits were refunded.', 'danger');
          refreshUser();
          loadHistory();
        }
      } catch { /* keep polling */ }
    }, 5000);
    return () => clearInterval(pollRef.current);
  }, [active, toast, loadHistory, refreshUser]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (form.prompt.trim().length < 10) er.prompt = 'Describe your video in at least 10 characters';
    if (options && form.prompt.length > options.maxPromptLength) er.prompt = `Keep the prompt under ${options.maxPromptLength} characters`;
    if (!form.resolution) er.resolution = 'Choose a resolution';
    if (!form.aspectRatio) er.aspectRatio = 'Choose an aspect ratio';
    if (form.resolution === '1080p' && form.aspectRatio !== '16:9' && options?.provider === 'kie') {
      er.resolution = '1080p is only available for 16:9 videos';
    }
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const enhance = async () => {
    if (form.prompt.trim().length < 3) { setErrors({ prompt: 'Write a short idea first, then enhance it' }); return; }
    setEnhancing(true);
    try {
      const { data } = await api.post('/videos/enhance-prompt', { prompt: form.prompt, aspectRatio: form.aspectRatio });
      setForm((f) => ({ ...f, prompt: data.prompt }));
      toast('Prompt enhanced with AI', 'success');
      refreshUser();
    } catch (err) {
      toast(parseError(err).message, 'danger');
    } finally {
      setEnhancing(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { data } = await api.post('/videos', { ...form, projectId: form.projectId || undefined });
      setActive(data.video);
      toast('Generation started. This usually takes 1–3 minutes.', 'info');
      refreshUser();
      loadHistory();
    } catch (err) {
      const { message, fields } = parseError(err);
      setErrors(fields);
      toast(message, 'danger');
      refreshUser();
    } finally {
      setSubmitting(false);
    }
  };

  const download = async () => {
    setDownloading(true);
    try {
      await downloadFile(`/videos/${active._id}/download`, 'video.mp4');
    } catch (err) {
      toast(parseError(err, 'Download failed').message, 'danger');
    } finally {
      setDownloading(false);
    }
  };

  if (loadError) return <Alert variant="danger">{loadError}</Alert>;
  if (!options) return <LoadingBlock label="Loading Film Studio…" />;

  const busy = active && ['queued', 'processing'].includes(active.status);

  return (
    <>
      <PageHeader icon={FiFilm} title="Film Studio" subtitle="Turn a text prompt into a video." />

      {!options.configured && (
        <Alert variant="warning" className="d-flex gap-2 align-items-start">
          <FiAlertTriangle className="mt-1 flex-shrink-0" />
          <div>
            <strong>Video generation isn't configured yet.</strong> An administrator needs to set <code>VIDEO_PROVIDER</code> and the
            provider API key in the backend <code>.env</code>. Your existing videos are still listed below.
          </div>
        </Alert>
      )}

      <Row className="g-3">
        <Col lg={6}>
          <Card className="slk-card h-100">
            <Card.Header className="slk-card-header"><span>Video settings</span>{options.label && <small className="text-muted">{options.label}</small>}</Card.Header>
            <Card.Body>
              <Form noValidate onSubmit={submit}>
                <Form.Group className="mb-3" controlId="fs-title">
                  <Form.Label>Video title <span className="text-muted small">(optional)</span></Form.Label>
                  <Form.Control value={form.title} onChange={set('title')} maxLength={120} placeholder="e.g. Episode 1 — The Locked Door" />
                </Form.Group>

                <Form.Group className="mb-3" controlId="fs-prompt">
                  <div className="d-flex justify-content-between align-items-end mb-1">
                    <Form.Label className="mb-0">Text prompt <span className="text-danger">*</span></Form.Label>
                    <Button size="sm" variant="light" className="slk-btn-ghost" onClick={enhance} disabled={enhancing || !options.aiConfigured} title={options.aiConfigured ? '' : 'AI text generation not configured'}>
                      {enhancing ? <Spinner size="sm" className="me-1" /> : <FiStar className="me-1" />}
                      Enhance with AI · <CreditCost cost={options.enhanceCost} />
                    </Button>
                  </div>
                  <Form.Control as="textarea" rows={5} value={form.prompt} onChange={set('prompt')} isInvalid={Boolean(errors.prompt)}
                    placeholder="A lone detective walks through a rain-soaked neon alley at night, slow tracking shot, cinematic lighting…" />
                  <div className="d-flex justify-content-between">
                    <Form.Control.Feedback type="invalid" className="d-block">{errors.prompt}</Form.Control.Feedback>
                    <small className="text-muted ms-auto">{form.prompt.length}/{options.maxPromptLength}</small>
                  </div>
                </Form.Group>

                <Form.Group className="mb-3" controlId="fs-desc">
                  <Form.Label>Video description <span className="text-muted small">(optional — extra scene details)</span></Form.Label>
                  <Form.Control as="textarea" rows={2} value={form.description} onChange={set('description')} isInvalid={Boolean(errors.description)} maxLength={2000}
                    placeholder="Mood, colours, what must appear on screen…" />
                  <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                </Form.Group>

                <Row className="g-3 mb-3">
                  <Col sm={6}>
                    <Form.Group controlId="fs-res">
                      <Form.Label>Resolution</Form.Label>
                      <Form.Select value={form.resolution} onChange={set('resolution')} isInvalid={Boolean(errors.resolution)}>
                        {options.resolutions.map((r) => <option key={r} value={r}>{r}</option>)}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.resolution}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group controlId="fs-project">
                      <Form.Label>Add to project <span className="text-muted small">(optional)</span></Form.Label>
                      <Form.Select value={form.projectId} onChange={set('projectId')} isInvalid={Boolean(errors.projectId)}>
                        <option value="">No project</option>
                        {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">{errors.projectId}</Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Label>Aspect ratio</Form.Label>
                <div className="slk-ratio-grid mb-2">
                  {options.aspectRatios.map((r) => (
                    <button type="button" key={r} className={`slk-ratio ${form.aspectRatio === r ? 'active' : ''}`} onClick={() => set('aspectRatio')({ target: { value: r } })}>
                      <span className={`slk-ratio-shape r-${r.replace(':', 'x')}`} />
                      <span className="fw-semibold">{r}</span>
                      <small className="text-muted">{RATIO_LABELS[r] || ''}</small>
                    </button>
                  ))}
                </div>
                {errors.aspectRatio && <div className="small text-danger mb-2">{errors.aspectRatio}</div>}
                {options.notes && <p className="small text-muted">{options.notes}</p>}

                <Button type="submit" className="slk-btn-primary w-100 py-2" disabled={submitting || busy || !options.configured}>
                  {submitting ? <><Spinner size="sm" className="me-2" />Starting…</>
                    : busy ? <><Spinner size="sm" className="me-2" />A video is rendering…</>
                      : <><FiZap className="me-1" />Generate Video · <CreditCost cost={options.cost} /></>}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        <Col lg={6}>
          <Card className="slk-card h-100">
            <Card.Header className="slk-card-header"><span>Preview</span>{active && <StatusBadge status={active.status} />}</Card.Header>
            <Card.Body className="d-flex flex-column">
              {!active ? (
                <EmptyState icon={FiVideo} title="No video yet" text="Your generated video will appear here." />
              ) : (
                <>
                  <div className={`slk-preview ${active.aspectRatio === '9:16' ? 'ratio-9x16' : 'ratio-16x9'}`}>
                    {active.status === 'completed' && active.videoUrl ? (
                      <video src={active.videoUrl} controls autoPlay muted playsInline />
                    ) : active.status === 'failed' ? (
                      <div className="slk-video-state text-danger"><FiAlertTriangle size={28} /><span>{active.error || 'Generation failed'}</span></div>
                    ) : (
                      <div className="slk-video-state">
                        <Spinner />
                        <span>Rendering your video… {active.progress || 0}%</span>
                        <small className="text-muted">You can leave this page — it will appear in My Videos.</small>
                      </div>
                    )}
                  </div>
                  {busy && <ProgressBar animated now={Math.max(active.progress || 0, 3)} className="slk-progress mt-3" />}
                  <div className="mt-3 small">
                    <div className="fw-semibold">{active.title || 'Untitled video'}</div>
                    <div className="text-muted text-wrap">{active.prompt}</div>
                    <div className="text-muted mt-1">{active.resolution} · {active.aspectRatio}</div>
                    {active.status === 'completed' && active.error && <div className="text-warning mt-1">{active.error}</div>}
                  </div>
                  {active.status === 'completed' && (
                    <Button className="slk-btn-primary mt-3" onClick={download} disabled={downloading}>
                      {downloading ? <Spinner size="sm" className="me-2" /> : <FiDownload className="me-2" />}Download video
                    </Button>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="d-flex justify-content-between align-items-center mt-4 mb-3">
        <h5 className="mb-0 fw-bold">Previous videos</h5>
        <Link to="/my-videos" className="slk-link small">All videos <FiArrowRight /></Link>
      </div>
      {history.length === 0 ? (
        <Card className="slk-card"><Card.Body><EmptyState icon={FiVideo} title="No videos yet" text="Videos you generate will be listed here." /></Card.Body></Card>
      ) : (
        <Row className="g-3">
          {history.map((v) => (
            <Col key={v._id} sm={6} lg={4} xl={3}>
              <VideoCard video={v} onSelect={() => setActive(v)} />
            </Col>
          ))}
        </Row>
      )}
    </>
  );
}
