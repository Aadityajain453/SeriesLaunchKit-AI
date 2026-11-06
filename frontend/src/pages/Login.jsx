import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Button, Form, InputGroup, Spinner } from 'react-bootstrap';
import { FiMail, FiArrowRight } from 'react-icons/fi';
import AuthLayout from '../components/layout/AuthLayout';
import PasswordInput from '../components/common/PasswordInput';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { parseError } from '../api/client';
import { EMAIL_RE } from '../utils/format';

export default function Login() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: location.state?.email || '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const success = location.state?.registered ? 'Account created successfully. Please log in.' : '';

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.email.trim()) er.email = 'Email is required';
    else if (!EMAIL_RE.test(form.email.trim())) er.email = 'Enter a valid email address';
    if (!form.password) er.password = 'Password is required';
    else if (form.password.length < 8) er.password = 'Password must be at least 8 characters';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await login(form.email.trim(), form.password);
      toast(data.message || 'Logged in successfully', 'success');
      navigate(location.state?.from && location.state.from !== '/login' ? location.state.from : '/dashboard', { replace: true });
    } catch (err) {
      const { message, fields } = parseError(err);
      setServerError(message);
      setErrors(fields);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <h1 className="slk-auth-title">Welcome back</h1>
      <p className="text-muted mb-4">Log in to continue building your series.</p>

      {success && !serverError && <Alert variant="success" className="py-2 small">{success}</Alert>}
      {serverError && <Alert variant="danger" className="py-2 small">{serverError}</Alert>}

      <Form noValidate onSubmit={onSubmit}>
        <Form.Group className="mb-3" controlId="login-email">
          <Form.Label>Email</Form.Label>
          <InputGroup hasValidation className="slk-input-group">
            <InputGroup.Text><FiMail /></InputGroup.Text>
            <Form.Control
              type="email"
              placeholder="you@company.com"
              value={form.email}
              onChange={set('email')}
              isInvalid={Boolean(errors.email)}
              autoComplete="email"
              autoFocus
              disabled={loading}
            />
            <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
          </InputGroup>
        </Form.Group>

        <PasswordInput id="login-password" label="Password" value={form.password} onChange={set('password')} error={errors.password} disabled={loading} />

        <Button type="submit" className="slk-btn-primary w-100 py-2 mt-2" disabled={loading}>
          {loading ? <><Spinner size="sm" className="me-2" />Logging in…</> : <>Login <FiArrowRight className="ms-1" /></>}
        </Button>
      </Form>

      <div className="slk-divider"><span>New to SeriesLaunchKit AI?</span></div>
      <Button as={Link} to="/signup" variant="outline-dark" className="w-100 py-2 slk-btn-outline">
        Sign Up
      </Button>
    </AuthLayout>
  );
}
