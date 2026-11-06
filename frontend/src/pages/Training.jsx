import { useEffect, useState } from 'react';
import { Accordion, Alert, Badge } from 'react-bootstrap';
import { FiBookOpen, FiClock } from 'react-icons/fi';
import api, { parseError } from '../api/client';
import { LoadingBlock, PageHeader } from '../components/common/ui';

export default function Training() {
  const [modules, setModules] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/training').then(({ data }) => setModules(data.modules)).catch((err) => setError(parseError(err).message));
  }, []);

  return (
    <>
      <PageHeader icon={FiBookOpen} title="Training" subtitle="Step-by-step guides to get the most out of SeriesLaunchKit AI." />
      {error && <Alert variant="danger">{error}</Alert>}
      {!modules && !error && <LoadingBlock />}
      {modules && (
        <Accordion defaultActiveKey={modules[0]?.id} className="slk-training">
          {modules.map((m, i) => (
            <Accordion.Item eventKey={m.id} key={m.id} className="slk-card mb-3">
              <Accordion.Header>
                <span className="slk-ep-num">{i + 1}</span>
                <div className="me-3">
                  <div className="fw-semibold">{m.title}</div>
                  <div className="small text-muted">{m.summary}</div>
                </div>
                <div className="ms-auto d-none d-md-flex gap-2 me-2">
                  <Badge bg="light" text="dark">{m.level}</Badge>
                  <Badge bg="light" text="dark"><FiClock className="me-1" />{m.duration}</Badge>
                </div>
              </Accordion.Header>
              <Accordion.Body>
                {m.videoUrl && (
                  <div className="ratio ratio-16x9 mb-3 rounded overflow-hidden">
                    <iframe src={m.videoUrl} title={m.title} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />
                  </div>
                )}
                <ol className="slk-steps">{m.steps.map((s, idx) => <li key={idx}>{s}</li>)}</ol>
              </Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </>
  );
}
