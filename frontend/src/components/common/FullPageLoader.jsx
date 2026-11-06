import { Spinner } from 'react-bootstrap';

export default function FullPageLoader({ label = 'Loading…' }) {
  return (
    <div className="slk-fullpage-loader" role="status">
      <Spinner animation="border" className="text-olive" />
      <span className="mt-3 text-muted small">{label}</span>
    </div>
  );
}
