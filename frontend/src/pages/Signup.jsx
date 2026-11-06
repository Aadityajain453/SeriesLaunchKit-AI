import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Form, InputGroup, ProgressBar, Spinner } from 'react-bootstrap';
import { FiMail, FiUser } from 'react-icons/fi';
import AuthLayout from '../components/layout/AuthLayout';
import PasswordInput from '../components/common/PasswordInput';
import api, { parseError } from '../api/client';
import { useToast } from '../context/ToastContext';
import { EMAIL_RE, PASSWORD_RE } from '../utils/format';

function strength(pw) {
  let s = 0;
  if (pw.length >= 8) s += 1;
  if (pw.length >= 12) s += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 1;
  if (/\d/.test(pw)) s += 1;
  if (/[^A-Za-z0-9]/.test(pw)) s += 1;
  return s;
}
const STRENGTH = [
  ['danger', 'Too weak'], ['danger', 'Weak'], ['warning', 'Fair'], ['info', 'Good'], ['success', 'Strong'], ['success', 'Very strong'],
];

export default function Signup() {
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    const name = form.name.trim();
    if (!name) er.name = 'Full name is required';
    else if (name.length < 2) er.name = 'Full name must be at least 2 characters';
    if (!form.email.trim()) er.email = 'Email is required';
    else if (!EMAIL_RE.test(form.email.trim())) er.email = 'Enter a valid email address';
    if (!form.password) er.password = 'Password is required';
    else if (!PASSWORD_RE.test(form.password)) er.password = 'Use 8+ characters with at least one letter and one number';
    if (!form.confirmPassword) er.confirmPassword = 'Please confirm your password';
    else if (form.password !== form.confirmPassword) er.confirmPassword = 'Passwords do not match';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/signup', { ...form, name: form.name.trim(), email: form.email.trim() });
      toast(data.message, 'success');
      navigate('/login', { replace: true, state: { registered: true, email: form.email.trim() } });
    } catch (err) {
      const { message, fields } = parseError(err);
      setServerError(message);
      setErrors(fields);
    } finally {
      setLoading(false);
    }
  };

  const s = strength(form.password);

  return (
    <AuthLayout>
      <h1 className="slk-auth-title">Create your account</h1>
      <p className="text-muted mb-4">Start planning AI video series in minutes.</p>
      {serverError && <Alert variant="danger" className="py-2 small">{serverError}</Alert>}

      <Form noValidate onSubmit={onSubmit}>
        <Form.Group className="mb-3" controlId="signup-name">
          <Form.Label>Full Name</Form.Label>
          <InputGroup hasValidation className="slk-input-group">
            <InputGroup.Text><FiUser /></InputGroup.Text>
            <Form.Control value={form.name} onChange={set('name')} isInvalid={Boolean(errors.name)} placeholder="Your full name" autoComplete="name" autoFocus disabled={loading} />
            <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
          </InputGroup>
        </Form.Group>

        <Form.Group className="mb-3" controlId="signup-email">
          <Form.Label>Email</Form.Label>
          <InputGroup hasValidation className="slk-input-group">
            <InputGroup.Text><FiMail /></InputGroup.Text>
            <Form.Control type="email" value={form.email} onChange={set('email')} isInvalid={Boolean(errors.email)} placeholder="you@company.com" autoComplete="email" disabled={loading} />
            <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
          </InputGroup>
        </Form.Group>

        <PasswordInput id="signup-password" label="Password" value={form.password} onChange={set('password')} error={errors.password} autoComplete="new-password" disabled={loading} />
        {form.password && (
          <div className="mb-3 mt-n2">
            <ProgressBar now={(s / 5) * 100} variant={STRENGTH[s][0]} style={{ height: 4 }} />
            <small className="text-muted">Password strength: {STRENGTH[s][1]}</small>
          </div>
        )}
        <PasswordInput id="signup-confirm" label="Confirm Password" value={form.confirmPassword} onChange={set('confirmPassword')} error={errors.confirmPassword} autoComplete="new-password" disabled={loading} />

        <Button type="submit" className="slk-btn-primary w-100 py-2 mt-2" disabled={loading}>
          {loading ? <><Spinner size="sm" className="me-2" />Creating account…</> : 'Create Account'}
        </Button>
      </Form>

      <p className="text-center text-muted mt-4 mb-0">
        Already have an account? <Link to="/login" className="slk-link">Log in</Link>
      </p>
    </AuthLayout>
  );
}
