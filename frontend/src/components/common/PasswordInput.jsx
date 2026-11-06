import { useState } from 'react';
import { Form, InputGroup } from 'react-bootstrap';
import { FiEye, FiEyeOff, FiLock } from 'react-icons/fi';

export default function PasswordInput({ id, label, value, onChange, error, autoComplete = 'current-password', placeholder = 'Enter your password', disabled }) {
  const [show, setShow] = useState(false);
  return (
    <Form.Group className="mb-3" controlId={id}>
      <Form.Label>{label}</Form.Label>
      <InputGroup hasValidation className="slk-input-group">
        <InputGroup.Text><FiLock /></InputGroup.Text>
        <Form.Control
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          isInvalid={Boolean(error)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          className="input-group-text slk-eye"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          tabIndex={0}
        >
          {show ? <FiEyeOff /> : <FiEye />}
        </button>
        <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>
      </InputGroup>
    </Form.Group>
  );
}
