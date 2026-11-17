
import { Link } from 'react-router-dom';

const COMPANY_NAME = 'LogicBeam Softwares';
const CONTACT_EMAIL = 'ravikukreja2010@gmail.com';

export default function PrivacyPolicy() {
    const sections = [
        {
            title: '1. Information We Collect',
            content: (
                <>
                    <p>When you use SeriesLaunchKit AI, we may collect:</p>
                    <ul>
                        <li>Account information, including your name and email address.</li>
                        <li>Authentication and account-related information.</li>
                        <li>Projects, series details, scripts, prompts and generation history.</li>
                        <li>Images, videos and other files you upload or generate.</li>
                        <li>Credits, subscription and usage information.</li>
                        <li>Technical information, such as browser details, device information and application activity, where collected.</li>
                    </ul>
                </>
            ),
        },
        {
            title: '2. How We Use Your Information',
            content: (
                <p>
                    We use information to create and manage your account, provide
                    application features, process AI generation requests, manage
                    credits and subscriptions, store your projects and generated
                    content, provide customer support, maintain security and
                    improve the performance of our services.
                </p>
            ),
        },
        {
            title: '3. AI Services and Third-Party Providers',
            content: (
                <>
                    <p>
                        SeriesLaunchKit AI integrates with third-party services to
                        provide AI-powered functionality. These may include:
                    </p>
                    <ul>
                        <li>
                            <strong>OpenAI:</strong> Used for applicable AI text and
                            image generation features.
                        </li>
                        <li>
                            <strong>KIE.ai:</strong> Used for applicable AI video
                            generation features.
                        </li>
                    </ul>
                    <p>
                        When you request an AI generation, relevant prompts, text,
                        reference images or other input may be transmitted to the
                        provider responsible for that feature.
                    </p>
                    <p>
                        These providers process information under their own terms
                        and privacy policies. Their retention and processing
                        practices may differ from ours. Please review their
                        respective policies before submitting information that
                        you consider confidential or sensitive.
                    </p>
                </>
            ),
        },
        {
            title: '4. Cookies and Local Storage',
            content: (
                <>
                    <p>
                        SeriesLaunchKit AI uses browser storage and cookies for
                        essential application functionality, including authentication,
                        security and remembering your cookie preferences.
                    </p>
                    <p>
                        Our application uses an HTTP-only authentication cookie
                        to maintain your login session. We also use local storage
                        to remember your cookie consent choices.
                    </p>
                    <p>
                        Optional analytics and marketing technologies may be used
                        only where implemented and according to your selected
                        preferences and applicable requirements. You can change
                        your choices through the Cookie Settings control.
                    </p>
                </>
            ),
        },
        {
            title: '5. Data Storage and Security',
            content: (
                <>
                    <p>
                        Account information and application records are stored
                        using MongoDB database infrastructure. Uploaded files
                        are maintained using the application's configured file
                        storage infrastructure.
                    </p>
                    <p>
                        We use reasonable technical and organizational measures
                        intended to protect information against unauthorized
                        access, alteration, disclosure or destruction.
                    </p>
                    <p>
                        However, no internet transmission or electronic storage
                        system can be guaranteed to be completely secure.
                    </p>
                </>
            ),
        },
        {
            title: '6. Data Retention',
            content: (
                <p>
                    We retain personal information and application content for
                    as long as reasonably necessary to provide our services,
                    maintain your account, meet legal obligations, resolve
                    disputes and enforce our agreements. Some information may
                    remain with third-party providers under their respective
                    retention policies.
                </p>
            ),
        },
        {
            title: '7. Your Privacy Rights',
            content: (
                <>
                    <p>
                        Depending on your location and applicable law, you may
                        have rights to:
                    </p>
                    <ul>
                        <li>Request access to personal information we hold about you.</li>
                        <li>Request correction of inaccurate information.</li>
                        <li>Request deletion of your personal information.</li>
                        <li>Request a copy of certain information.</li>
                        <li>Withdraw optional cookie consent.</li>
                    </ul>
                    <p>
                        To exercise these rights, contact us using the email
                        address provided in the Contact Us section.
                    </p>
                </>
            ),
        },
        {
            title: '8. Account and Data Deletion',
            content: (
                <>
                    <p>
                        You can permanently delete your account through the
                        account deletion option available in the application.
                        Your password is required to confirm this action.
                    </p>
                    <p>
                        When account deletion is successfully processed, we
                        delete the associated account and application records
                        handled by our deletion process, including relevant
                        projects, series, videos, generation history, activities
                        and notifications.
                    </p>
                    <p>
                        Deletion of application records does not necessarily
                        delete information already transmitted to AI providers,
                        information retained in backups, or information we are
                        legally required to preserve. Third-party providers
                        maintain their own deletion and retention procedures.
                    </p>
                    <p>
                        Videos generated through KIE.ai are hosted by the provider.
                        According to its published documentation, generated media
                        files are retained for 14 days and task logs and metadata
                        for 2 months before automatic deletion. Deleting your
                        SeriesLaunchKit AI account does not immediately delete
                        information already held by KIE.ai.
                    </p>
                </>
            ),
        },
        {
            title: "9. Children's Privacy",
            content: (
                <p>
                    SeriesLaunchKit AI is not intended for children under the
                    age of 13. We do not knowingly collect personal information
                    from children under 13. If you believe a child has provided
                    us with personal information, please contact us.
                </p>
            ),
        },
        {
            title: '10. Changes to This Policy',
            content: (
                <p>
                    We may update this Privacy Policy periodically to reflect
                    changes in our services, practices or applicable requirements.
                    Updates will be published on this page with a revised date.
                </p>
            ),
        },
    ];

    return (
        <div className="container py-5">
            <div className="mx-auto" style={{ maxWidth: '850px' }}>
                <div className="mb-4">
                    <Link to="/login" className="text-decoration-none">
                        ← Back to SeriesLaunchKit AI
                    </Link>
                </div>

                <div className="mb-5">
                    <div className="text-success fw-semibold mb-2">
                        SERIESLAUNCHKIT AI
                    </div>

                    <h1 className="fw-bold mb-3">Privacy Policy</h1>

                    <p className="text-muted">
                        Last Updated: November 17, 2026
                    </p>

                    <p className="text-muted">
                        This Privacy Policy explains how {COMPANY_NAME} collects,
                        uses, stores and protects information when you use
                        SeriesLaunchKit AI.
                    </p>
                </div>

                <div className="mb-4 p-4 bg-light rounded-3">
                    <h5 className="fw-bold">About This Policy</h5>
                    <p className="mb-0 text-muted">
                        This policy describes our information practices and
                        your available privacy choices. It should be read
                        together with any applicable service terms.
                    </p>
                </div>

                {sections.map((section) => (
                    <section className="mb-4" key={section.title}>
                        <h4 className="fw-bold mb-3">{section.title}</h4>
                        <div className="text-muted" style={{ lineHeight: 1.8 }}>
                            {section.content}
                        </div>
                    </section>
                ))}

                <hr className="my-5" />

                <section className="mb-4">
                    <h4 className="fw-bold mb-3">11. Contact Us</h4>

                    <p className="text-muted" style={{ lineHeight: 1.8 }}>
                        If you have questions about this Privacy Policy or want
                        to submit a privacy-related request, contact:
                    </p>

                    <p className="mb-1">
                        <strong>Company:</strong> {COMPANY_NAME}
                    </p>

                    <p className="mb-1">
                        <strong>Product:</strong> SeriesLaunchKit AI
                    </p>

                    <p className="mb-0">
                        <strong>Email:</strong>{' '}
                        <a href={`mailto:${CONTACT_EMAIL}`}>
                            {CONTACT_EMAIL}
                        </a>
                    </p>
                </section>

                <div className="border-top pt-4 mt-5 text-muted small">
                    © {new Date().getFullYear()} {COMPANY_NAME}.
                    All rights reserved.
                </div>
            </div>
        </div>
    );
}
