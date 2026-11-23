import { getEstimatedVideoProgress } from '../../utils/videoProgress';
import { useState } from 'react';
import { Button, ProgressBar, Spinner } from 'react-bootstrap';
import {
  FiDownload,
  FiTrash2,
  FiAlertTriangle,
  FiPlay,
} from 'react-icons/fi';

import { StatusBadge } from './ui';
import { downloadFile, parseError } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { timeAgo } from '../../utils/format';

export default function VideoCard({ video, onDelete, onSelect }) {
  const toast = useToast();
  const [downloading, setDownloading] = useState(false);

  const videoTitle = video.title || video.prompt || 'Untitled video';

  const displayProgress = getEstimatedVideoProgress(video);

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

  const handleThumbnailKeyDown = (event) => {
    if (!onSelect) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect();
    }
  };

  const ratioClass =
    video.aspectRatio === '9:16' ? 'ratio-9x16' : 'ratio-16x9';

  return (
    <div className="slk-video-card">

      <div
        className={`slk-video-thumb ${ratioClass}`}
        onClick={onSelect}
        onKeyDown={handleThumbnailKeyDown}
        role={onSelect ? 'button' : undefined}
        tabIndex={onSelect ? 0 : undefined}
        aria-label={onSelect ? `Open video: ${videoTitle}` : undefined}
      >

        {video.status === 'completed' && video.videoUrl ? (
          <video
            src={video.videoUrl}
            preload="metadata"
            muted
            playsInline
            controls={!onSelect}
            aria-label={`Video preview: ${videoTitle}`}
          />
        ) : video.status === 'failed' ? (
          <div
            className="slk-video-state text-danger"
            role="status"
          >
            <FiAlertTriangle aria-hidden="true" />
            <span>Failed</span>
          </div>
        ) : (
          <div
            className="slk-video-state"
            role="status"
            aria-label={`Video rendering: ${displayProgress}% complete`}
          >
            <Spinner size="sm" aria-hidden="true" />
            <span>Rendering… {displayProgress}%</span>
          </div>
        )}

        {onSelect && video.status === 'completed' && (
          <div className="slk-play-overlay" aria-hidden="true">
            <FiPlay />
          </div>
        )}

      </div>

      <div className="p-3">

        <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
          <StatusBadge status={video.status} />

          <small className="text-muted">
            {timeAgo(video.createdAt)}
          </small>
        </div>

        <div
          className="fw-semibold small text-truncate"
          title={videoTitle}
        >
          {videoTitle}
        </div>

        <div className="slk-video-meta">
          {video.resolution} · {video.aspectRatio}
          {video.project?.title ? ` · ${video.project.title}` : ''}
        </div>

        {['queued', 'processing'].includes(video.status) && (
          <ProgressBar
            now={displayProgress}
            className="slk-progress mt-2"
            aria-label={`Rendering progress: ${displayProgress}%`}
          />
        )}

        {video.status === 'failed' && video.error && (
          <div
            className="small text-danger mt-1 text-wrap"
            role="alert"
          >
            {video.error}
          </div>
        )}

        <div className="d-flex gap-2 mt-2">

          {video.status === 'completed' && (
            <Button
              size="sm"
              variant="light"
              className="slk-btn-ghost flex-grow-1"
              onClick={download}
              disabled={downloading}
              aria-label={`Download ${videoTitle}`}
            >
              {downloading ? (
                <Spinner size="sm" aria-hidden="true" />
              ) : (
                <>
                  <FiDownload className="me-1" aria-hidden="true" />
                  Download
                </>
              )}
            </Button>
          )}

          {onDelete && (
            <Button
              size="sm"
              variant="light"
              className="slk-btn-ghost text-danger"
              onClick={() => onDelete(video)}
              aria-label={`Delete ${videoTitle}`}
            >
              <FiTrash2 aria-hidden="true" />
            </Button>
          )}

        </div>
      </div>
    </div>
  );
}
