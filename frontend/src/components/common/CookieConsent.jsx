
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const CONSENT_KEY = 'slk_cookie_consent';
const CONSENT_EVENT = 'slk:cookie-consent-changed';

const defaultPreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export function getCookieConsent() {
  try {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (!saved) return null;

    const parsed = JSON.parse(saved);

    return {
      necessary: true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      updatedAt: parsed.updatedAt || null,
    };
  } catch {
    return null;
  }
}

export function hasCookieConsent(category) {
  if (category === 'necessary') return true;

  const consent = getCookieConsent();
  return consent?.[category] === true;
}

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState(defaultPreferences);

  useEffect(() => {
    const saved = getCookieConsent();

    if (saved) {
      setPreferences(saved);
    } else {
      setVisible(true);
    }

    const openSettings = () => {
      const current = getCookieConsent();
      setPreferences(current || defaultPreferences);
      setShowPreferences(true);
      setVisible(true);
    };

    window.addEventListener('slk:open-cookie-settings', openSettings);

    return () => {
      window.removeEventListener(
        'slk:open-cookie-settings',
        openSettings
      );
    };
  }, []);

  const saveConsent = (choices) => {
    const consentData = {
      ...choices,
      necessary: true,
      updatedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify(consentData)
      );

      setPreferences(consentData);
      setVisible(false);
      setShowPreferences(false);

      window.dispatchEvent(
        new CustomEvent(CONSENT_EVENT, {
          detail: consentData,
        })
      );
    } catch (error) {
      console.error('Unable to save cookie preferences:', error);
    }
  };

  const acceptAll = () => {
    saveConsent({
      necessary: true,
      analytics: true,
      marketing: true,
    });
  };

  const rejectOptional = () => {
    saveConsent({
      necessary: true,
      analytics: false,
      marketing: false,
    });
  };

  const openPreferences = () => {
    setPreferences(getCookieConsent() || defaultPreferences);
    setShowPreferences(true);
    setVisible(true);
  };

  const togglePreference = (key) => {
    setPreferences((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  };

  const styles = {
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.35)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    banner: {
      width: '100%',
      background: '#fff',
      padding: '24px',
      boxShadow: '0 -8px 35px rgba(0,0,0,0.12)',
      borderTop: '3px solid #c6f04d',
      maxHeight: '90vh',
      overflowY: 'auto',
    },
    content: {
      maxWidth: '1100px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: '25px',
      flexWrap: 'wrap',
    },
    title: {
      fontSize: '18px',
      fontWeight: 700,
      marginBottom: '8px',
      color: '#1d2215',
    },
    description: {
      color: '#6b7064',
      fontSize: '13px',
      lineHeight: 1.7,
      margin: 0,
      maxWidth: '650px',
    },
    actions: {
      display: 'flex',
      gap: '10px',
      flexWrap: 'wrap',
      marginTop: '18px',
    },
    button: {
      padding: '10px 16px',
      borderRadius: '9px',
      fontSize: '13px',
      fontWeight: 600,
      cursor: 'pointer',
      border: '1px solid #e6e8e1',
    },
    primary: {
      background: '#1f2a14',
      color: '#fff',
      border: '1px solid #1f2a14',
    },
    secondary: {
      background: '#fff',
      color: '#1d2215',
    },
    settingsButton: {
      position: 'fixed',
      bottom: '16px',
      left: '16px',
      zIndex: 1500,
      padding: '9px 14px',
      borderRadius: '9px',
      border: '1px solid #dfe3d5',
      background: '#fff',
      color: '#1f2a14',
      fontSize: '12px',
      fontWeight: 600,
      cursor: 'pointer',
      boxShadow: '0 3px 12px rgba(0,0,0,0.12)',
    },
  };

  return (
    <>
      {!visible && (
        <button
          type="button"
          style={styles.settingsButton}
          onClick={openPreferences}
          aria-label="Open cookie settings"
        >
          Cookie Settings
        </button>
      )}

      {visible && (
        <div style={styles.overlay}>
          <div
            style={styles.banner}
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-title"
          >
            {!showPreferences ? (
              <div style={styles.content}>
                <div>
                  <h3 id="cookie-title" style={styles.title}>
                    We Value Your Privacy 🍪
                  </h3>

                  <p style={styles.description}>
                    SeriesLaunchKit AI uses essential storage to keep
                    the application working. With your permission,
                    we may also use optional analytics and marketing
                    technologies. You can accept all, reject optional
                    technologies, or customize your preferences.
                    {' '}
                    <Link to="/privacy-policy">
                      Privacy Policy
                    </Link>
                  </p>
                </div>

                <div style={styles.actions}>
                  <button
                    type="button"
                    style={{ ...styles.button, ...styles.secondary }}
                    onClick={rejectOptional}
                  >
                    Reject Non-Essential
                  </button>

                  <button
                    type="button"
                    style={{ ...styles.button, ...styles.secondary }}
                    onClick={() => setShowPreferences(true)}
                  >
                    Cookie Preferences
                  </button>

                  <button
                    type="button"
                    style={{ ...styles.button, ...styles.primary }}
                    onClick={acceptAll}
                  >
                    Accept All
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                <h3 id="cookie-title" style={styles.title}>
                  Cookie Preferences
                </h3>

                <p style={styles.description}>
                  Choose which optional technologies you allow.
                  Essential storage is always enabled because it is
                  required for the application to function.
                </p>

                <div className="mt-4">
                  <PreferenceRow
                    title="Essential"
                    description="Required for authentication and core application functionality."
                    checked={true}
                    disabled={true}
                  />

                  <PreferenceRow
                    title="Analytics"
                    description="Helps us understand application usage and improve the experience."
                    checked={preferences.analytics}
                    onChange={() => togglePreference('analytics')}
                  />

                  <PreferenceRow
                    title="Marketing"
                    description="Allows marketing-related storage and technologies where implemented."
                    checked={preferences.marketing}
                    onChange={() => togglePreference('marketing')}
                  />
                </div>

                <div style={styles.actions}>
                  <button
                    type="button"
                    style={{ ...styles.button, ...styles.secondary }}
                    onClick={() => setShowPreferences(false)}
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    style={{ ...styles.button, ...styles.primary }}
                    onClick={() => saveConsent(preferences)}
                  >
                    Save My Preferences
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

function PreferenceRow({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}) {
  return (
    <div className="d-flex justify-content-between align-items-center border-bottom py-3 gap-3">
      <div>
        <strong>{title}</strong>
        <p className="text-muted small mb-0">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-label={`${title} cookies`}
        style={{
          width: '20px',
          height: '20px',
          accentColor: '#1f2a14',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      />
    </div>
  );
}
