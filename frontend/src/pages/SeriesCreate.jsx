import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Card, Col, Form, Row, Spinner } from 'react-bootstrap';
import { FiLayers, FiZap, FiAlertTriangle, FiArrowLeft } from 'react-icons/fi';
import api, { parseError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { CreditCost, LoadingBlock, PageHeader } from '../components/common/ui';

const STEPS = ['Reading your brief', 'Designing characters', 'Outlining episodes', 'Writing hooks & video prompts', 'Packaging your marketing kit'];

function Field({ field, value, error, onChange }) {
  const common = { value: value ?? '', onChange: (e) => onChange(field.key, e.target.value), isInvalid: Boolean(error) };
  let control;
  if (field.type === 'textarea') {
    control = <Form.Control as="textarea" rows={3} maxLength={field.maxLength} placeholder={field.placeholder} {...common} />;
  } else if (field.type === 'select') {
    control = (
      <Form.Select {...common}>
        <option value="">Select {field.label.toLowerCase()}…</option>
        {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
      </Form.Select>
    );
  } else if (field.type === 'number') {
    control = <Form.Control type="number" min={field.min} max={field.max} step={1} {...common} />;
  } else {
    control = <Form.Control type="text" maxLength={field.maxLength} placeholder={field.placeholder} {...common} />;
  }
  return (
    <Form.Group controlId={`sf-${field.key}`}>
      <Form.Label>{field.label} {field.required && <span className="text-danger">*</span>}</Form.Label>
      {control}
      {field.help && <Form.Text muted>{field.help}</Form.Text>}
      <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
    </Form.Group>
  );
}

export default function SeriesCreate() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [meta, setMeta] = useState(null);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    api.get('/series/fields')
      .then(({ data }) => {
        setMeta(data);
        const defaults = {};
        data.fields.forEach((f) => { if (f.type === 'number') defaults[f.key] = f.min ?? 1; });
        defaults.episodeCount = 5;
        setValues(defaults);
      })
      .catch((err) => setLoadError(parseError(err).message));
  }, []);

  useEffect(() => {
    if (!submitting) return undefined;
    setStep(0);
    const t = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 9000);
    return () => clearInterval(t);
  }, [submitting]);

  const groups = useMemo(() => {
    if (!meta) return [];
    const map = new Map();
    meta.fields.forEach((f) => {
      const g = f.group || 'Details';
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(f);
    });
    return [...map.entries()];
  }, [meta]);

  const onChange = (key, v) => {
    setValues((s) => ({ ...s, [key]: v }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    meta.fields.forEach((f) => {
      const v = typeof values[f.key] === 'string' ? values[f.key].trim() : values[f.key];
      if (f.required && (v === undefined || v === '' || v === null)) { er[f.key] = `${f.label} is required`; return; }
      if (v === undefined || v === '') return;
      if (f.type === 'number') {
        const n = Number(v);
        if (!Number.isInteger(n)) er[f.key] = 'Enter a whole number';
        else if (f.min !== undefined && n < f.min) er[f.key] = `Minimum is ${f.min}`;
        else if (f.max !== undefined && n > f.max) er[f.key] = `Maximum is ${f.max}`;
      }
      if (f.maxLength && String(v).length > f.maxLength) er[f.key] = `Keep it under ${f.maxLength} characters`;
    });
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast('Please fill in the required fields', 'warning');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post('/series', values);
      toast(data.message, 'success');
      refreshUser();
      navigate(`/series-studio/${data.series._id}`, { replace: true });
    } catch (err) {
      const { message, fields } = parseError(err);
      setErrors(fields);
      toast(message, 'danger');
      refreshUser();
      setSubmitting(false);
    }
  };

  if (loadError) return <Alert variant="danger">{loadError}</Alert>;
  if (!meta) return <LoadingBlock label="Loading Series Studio…" />;

  const lowCredits = user && user.credits < meta.cost;

  return (
    <>
      <PageHeader
        icon={FiLayers}
        title="New Series"
        subtitle="Fill in your series brief. The AI will plan every episode for you."
        actions={<Button variant="light" className="slk-btn-ghost" onClick={() => navigate('/series-studio')}><FiArrowLeft className="me-1" />Back</Button>}
      />

      {!meta.aiConfigured && (
        <Alert variant="warning" className="d-flex gap-2"><FiAlertTriangle className="mt-1" />
          <div><strong>AI generation isn't configured.</strong> Add <code>ANTHROPIC_API_KEY</code> to the backend <code>.env</code> to generate series.</div>
        </Alert>
      )}

      <Form noValidate onSubmit={submit}>
        <fieldset disabled={submitting}>
          {groups.map(([group, fields]) => (
            <Card className="slk-card mb-3" key={group}>
              <Card.Header className="slk-card-header"><span>{group}</span></Card.Header>
              <Card.Body>
                <Row className="g-3">
                  {fields.map((f) => (
                    <Col md={f.col || 6} key={f.key}>
                      <Field field={f} value={values[f.key]} error={errors[f.key]} onChange={onChange} />
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          ))}
        </fieldset>

        <Card className="slk-card slk-sticky-action">
          <Card.Body className="d-flex flex-wrap align-items-center gap-3">
            {submitting ? (
              <div className="d-flex align-items-center gap-3 flex-grow-1">
                <Spinner />
                <div>
                  <div className="fw-semibold">{STEPS[step]}…</div>
                  <small className="text-muted">This usually takes 30–90 seconds. Please keep this page open.</small>
                </div>
              </div>
            ) : (
              <div className="flex-grow-1 small text-muted">
                Generating a series uses <CreditCost cost={meta.cost} />. You have <strong>{user?.credits ?? 0}</strong>. Credits are refunded if generation fails.
                {lowCredits && <div className="text-danger mt-1">You don't have enough credits for this generation.</div>}
              </div>
            )}
            <Button type="submit" className="slk-btn-primary px-4 py-2" disabled={submitting || lowCredits || !meta.aiConfigured}>
              {submitting ? 'Generating…' : <><FiZap className="me-1" />Generate Series</>}
            </Button>
          </Card.Body>
        </Card>
      </Form>
    </>
  );
}
