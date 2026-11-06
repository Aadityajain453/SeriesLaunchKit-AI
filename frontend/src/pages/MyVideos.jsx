import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Col, Form, Row } from 'react-bootstrap';
import { FiVideo, FiFilm } from 'react-icons/fi';
import api, { parseError } from '../api/client';
import { useToast } from '../context/ToastContext';
import { ConfirmModal, EmptyState, LoadingBlock, PageHeader } from '../components/common/ui';
import VideoCard from '../components/common/VideoCard';

export default function MyVideos() {
  const navigate = useNavigate();
  const toast = useToast();
  const [videos, setVideos] = useState(null);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get('/videos', { params: { status: status || undefined, limit: 100 } });
      setVideos(data.videos);
    } catch (err) {
      setError(parseError(err).message);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  // Keep refreshing while any video is still rendering.
  useEffect(() => {
    if (!videos?.some((v) => ['queued', 'processing'].includes(v.status))) return undefined;
    const t = setInterval(load, 8000);
    return () => clearInterval(t);
  }, [videos, load]);

  const remove = async () => {
    setDeleting(true);
    try {
      await api.delete(`/videos/${toDelete._id}`);
      toast('Video removed', 'info');
      setVideos((vs) => vs.filter((v) => v._id !== toDelete._id));
      setToDelete(null);
    } catch (err) {
      toast(parseError(err).message, 'danger');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        icon={FiVideo}
        title="My Videos"
        subtitle="All the videos you've generated."
        actions={<Button className="slk-btn-primary" onClick={() => navigate('/film-studio')}><FiFilm className="me-1" />Generate Video</Button>}
      />
      <div className="slk-toolbar">
        <Form.Select value={status} onChange={(e) => setStatus(e.target.value)} className="slk-filter" aria-label="Filter by status">
          <option value="">All videos</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </Form.Select>
        {videos && <span className="small text-muted">{videos.length} video{videos.length === 1 ? '' : 's'}</span>}
      </div>
      {error && <Alert variant="danger">{error}</Alert>}
      {!videos && !error && <LoadingBlock />}
      {videos && videos.length === 0 && (
        <div className="card slk-card"><div className="card-body">
          <EmptyState icon={FiVideo} title="No videos yet" text="Generate your first video in Film Studio."
            action={<Button className="slk-btn-primary" onClick={() => navigate('/film-studio')}><FiFilm className="me-1" />Open Film Studio</Button>} />
        </div></div>
      )}
      {videos && videos.length > 0 && (
        <Row className="g-3">
          {videos.map((v) => <Col key={v._id} sm={6} lg={4} xl={3}><VideoCard video={v} onDelete={setToDelete} /></Col>)}
        </Row>
      )}
      <ConfirmModal
        show={Boolean(toDelete)}
        title="Remove video?"
        body="This removes the video from your library. Download it first if you want to keep a copy."
        confirmLabel="Remove"
        onConfirm={remove}
        onHide={() => setToDelete(null)}
        busy={deleting}
      />
    </>
  );
}
