import { useState } from 'react';
import { Button, ProgressBar, Spinner } from 'react-bootstrap';
import { FiDownload, FiTrash2, FiAlertTriangle, FiPlay } from 'react-icons/fi';
import { StatusBadge } from './ui';
import { downloadFile, parseError } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { timeAgo } from '../../utils/format';

export default function VideoCard({ video, onDelete, onSelect }) {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    setDownloading(true);
    try {
      await downloadFile(`/videos/${video._id}/download`, 'video.mp4');
    } catch (err) {
      toast(parseError(err, 'Download failed').message, 'danger');
    } finally {
      setDownloading(false);
    }
  };

  const ratioClass = video.aspectRatio === '9:16' ? 'ratio-9x16' : 'ratio-16x9';

  return (
    <div className="slk-video-card">
      <div className={`slk-video-thumb ${ratioClass}`} onClick={onSelect} role={onSelect ? 'button' : undefined}>
        {video.status === 'completed' && video.videoUrl ? (
          <video src={video.videoUrl} preload="metadata" muted playsInline controls={!onSelect} />
        ) : video.status === 'failed' ? (
          <div className="slk-video-state text-danger"><FiAlertTriangle /><span>Failed</span></div>
        ) : (
          <div className="slk-video-state"><Spinner size="sm" /><span>Rendering… {video.progress || 0}%</span></div>
        )}
        {onSelect && video.status === 'completed' && <div className="slk-play-overlay"><FiPlay /></div>}
      </div>
      <div className="p-3">
        <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
          <StatusBadge status={video.status} />
          <small className="text-muted">{timeAgo(video.createdAt)}</small>
        </div>
        <div className="fw-semibold small text-truncate" title={video.title || video.prompt}>{video.title || video.prompt}</div>
        <div className="slk-video-meta">{video.resolution} · {video.aspectRatio}{video.project?.title ? ` · ${video.project.title}` : ''}</div>
        {['queued', 'processing'].includes(video.status) && <ProgressBar now={video.progress || 2} className="slk-progress mt-2" />}
        {video.status === 'failed' && video.error && <div className="small text-danger mt-1 text-wrap">{video.error}</div>}
        <div className="d-flex gap-2 mt-2">
          {video.status === 'completed' && (
            <Button size="sm" variant="light" className="slk-btn-ghost flex-grow-1" onClick={download} disabled={downloading}>
              {downloading ? <Spinner size="sm" /> : <><FiDownload className="me-1" />Download</>}
            </Button>
          )}
          {onDelete && (
            <Button size="sm" variant="light" className="slk-btn-ghost text-danger" onClick={() => onDelete(video)} aria-label="Delete video">
              <FiTrash2 />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
