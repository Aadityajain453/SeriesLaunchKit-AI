import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';

export default function NotFound() {
  return (
    <div className="slk-fullpage-loader text-center">
      <h1 className="display-4 fw-bold">404</h1>
      <p className="text-muted">This page doesn't exist.</p>
      <Button as={Link} to="/" className="slk-btn-primary">Go home</Button>
    </div>
  );
}
