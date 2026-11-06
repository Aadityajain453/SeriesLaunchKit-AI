import { FiPlay, FiLayers, FiFilm, FiFileText } from 'react-icons/fi';

const FEATURES = [
  { icon: FiLayers, title: 'Series Studio', text: 'Turn one idea into a full multi-episode series plan.' },
  { icon: FiFilm, title: 'Film Studio', text: 'Generate cinematic videos from text prompts.' },
  { icon: FiFileText, title: 'PDF Series Bibles', text: 'Export polished plans to share with your team.' },
];

export default function AuthLayout({ children }) {
  return (
    <div className="slk-auth">
      <section className="slk-auth-visual d-none d-lg-flex">
        <div className="slk-auth-brand">
          <div className="slk-logo"><FiPlay /></div>
          <span>SeriesLaunchKit <b>AI</b></span>
        </div>
        <div>
          <h2 className="slk-auth-headline">Plan, write and launch<br /><span>AI video series</span> in minutes.</h2>
          <div className="slk-auth-features">
            {FEATURES.map(({ icon: Icon, title, text }) => (
              <div className="slk-auth-feature" key={title}>
                <div className="slk-auth-feature-icon"><Icon /></div>
                <div>
                  <div className="fw-semibold">{title}</div>
                  <div className="small opacity-75">{text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="small opacity-50">© {new Date().getFullYear()} SeriesLaunchKit AI</div>
        <div className="slk-auth-orb one" /><div className="slk-auth-orb two" />
      </section>
      <section className="slk-auth-form-wrap">
        <div className="slk-auth-card">
          <div className="slk-auth-brand d-lg-none mb-4 text-dark">
            <div className="slk-logo"><FiPlay /></div>
            <span>SeriesLaunchKit <b>AI</b></span>
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}
