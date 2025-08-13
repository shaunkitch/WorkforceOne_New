'use client'

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
              </div>
              <span className="text-2xl font-bold text-gray-900">WorkforceOne</span>
            </div>
            <div className="flex items-center space-x-4">
              <a className="text-gray-600 hover:text-gray-900 font-medium" href="/">Home</a>
              <a className="text-gray-600 hover:text-gray-900 font-medium" href="/login">Sign In</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          
          <p className="text-gray-600 mb-8">
            <strong>Effective Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            <br />
            <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 mb-4">
                WorkforceOne ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our workforce management platform, including our website, mobile application, and related services (collectively, the "Service").
              </p>
              <p className="text-gray-700">
                By using our Service, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, do not use our Service.
              </p>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">2.1 Personal Information</h3>
              <p className="text-gray-700 mb-4">We may collect personally identifiable information that you provide directly to us, including:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Name and contact information (email address, phone number)</li>
                <li>Employment information (job title, department, employee ID, hire date)</li>
                <li>Attendance and time tracking data</li>
                <li>Profile information (avatar, bio, work preferences)</li>
                <li>Account credentials and security information</li>
                <li>Payment and billing information (for premium features)</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.2 Usage and Technical Information</h3>
              <p className="text-gray-700 mb-4">We automatically collect certain information when you use our Service:</p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Device information (device type, operating system, device identifiers)</li>
                <li>Log data (IP address, browser type, pages visited, time stamps)</li>
                <li>Usage analytics (feature usage, session duration, click patterns)</li>
                <li>Location data (with your permission, for attendance tracking)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.3 Location Information</h3>
              <p className="text-gray-700 mb-4">
                With your explicit consent, our mobile app may collect precise location information for attendance tracking purposes. You can disable location services at any time through your device settings, but this may limit certain functionality.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">2.4 Camera and Media Access</h3>
              <p className="text-gray-700">
                Our mobile app may request access to your device's camera for profile photos and document uploads. We only access these features with your permission and for the specific purposes you authorize.
              </p>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 mb-4">We use the collected information for various purposes:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Provide and maintain our workforce management services</li>
                <li>Process attendance tracking and time management</li>
                <li>Facilitate team collaboration and project management</li>
                <li>Generate reports and analytics for organizational insights</li>
                <li>Communicate with you about service updates and support</li>
                <li>Ensure platform security and prevent fraud</li>
                <li>Comply with legal obligations and resolve disputes</li>
                <li>Improve our services and develop new features</li>
                <li>Send administrative information and service notifications</li>
                <li>Personalize your experience and provide customer support</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Information Sharing and Disclosure</h2>
              <p className="text-gray-700 mb-4">We do not sell, trade, or rent your personal information. We may share your information in the following circumstances:</p>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">4.1 Within Your Organization</h3>
              <p className="text-gray-700 mb-4">
                Information is shared with authorized members of your organization (managers, HR personnel, administrators) as necessary for workforce management purposes.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.2 Service Providers</h3>
              <p className="text-gray-700 mb-4">
                We may share information with third-party service providers who assist us in operating our platform, conducting business, or serving our users, provided they agree to keep this information confidential.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.3 Legal Requirements</h3>
              <p className="text-gray-700 mb-4">
                We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., court orders, government agencies).
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">4.4 Business Transfers</h3>
              <p className="text-gray-700">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of the business transaction, with notice provided to affected users.
              </p>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-700 mb-4">
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Encryption of data in transit and at rest</li>
                <li>Regular security assessments and vulnerability testing</li>
                <li>Access controls and authentication mechanisms</li>
                <li>Employee training on data protection practices</li>
                <li>Incident response and breach notification procedures</li>
              </ul>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
              <p className="text-gray-700">
                We retain your personal information only as long as necessary to fulfill the purposes outlined in this Privacy Policy, comply with legal obligations, resolve disputes, and enforce our agreements. When data is no longer needed, we securely delete or anonymize it.
              </p>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Privacy Rights</h2>
              <p className="text-gray-700 mb-4">Depending on your location, you may have the following rights regarding your personal information:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li><strong>Access:</strong> Request information about the personal data we have about you</li>
                <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                <li><strong>Portability:</strong> Request a copy of your data in a structured, machine-readable format</li>
                <li><strong>Restriction:</strong> Request limitation of processing under certain circumstances</li>
                <li><strong>Objection:</strong> Object to processing based on legitimate interests or for direct marketing</li>
                <li><strong>Withdrawal of Consent:</strong> Withdraw consent for processing where consent is the legal basis</li>
              </ul>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 mb-4">
                We use cookies and similar tracking technologies to enhance your experience on our platform. These technologies help us:
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Remember your preferences and settings</li>
                <li>Authenticate and maintain your session</li>
                <li>Analyze usage patterns and improve our services</li>
                <li>Provide personalized content and features</li>
              </ul>
              <p className="text-gray-700">
                You can control cookie preferences through your browser settings, but disabling certain cookies may affect the functionality of our Service.
              </p>
            </section>

            {/* Third Party Services */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Third-Party Services</h2>
              <p className="text-gray-700 mb-4">
                Our Service may contain links to third-party websites or integrate with third-party services. We are not responsible for the privacy practices of these external services. We encourage you to review their privacy policies before providing any personal information.
              </p>
              <p className="text-gray-700">
                Third-party services we may integrate with include analytics providers, payment processors, and cloud infrastructure services, all of which are carefully selected and contractually bound to protect your data.
              </p>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
              <p className="text-gray-700">
                Our Service is not intended for use by children under the age of 13 (or 16 in the EU). We do not knowingly collect personal information from children under these ages. If we become aware that we have collected such information, we will take steps to delete it promptly.
              </p>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. International Data Transfers</h2>
              <p className="text-gray-700">
                Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and implement appropriate safeguards, including standard contractual clauses and adequacy decisions where applicable.
              </p>
            </section>

            {/* Updates */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you of any material changes by posting the updated policy on our website and, where appropriate, through email or in-app notifications. Your continued use of the Service after such changes constitutes acceptance of the updated policy.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have any questions about this Privacy Policy or wish to exercise your privacy rights, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2"><strong>Email:</strong> privacy@workforceone.com</p>
                <p className="text-gray-700 mb-2"><strong>Address:</strong> [Your Business Address]</p>
                <p className="text-gray-700 mb-2"><strong>Phone:</strong> [Your Phone Number]</p>
                <p className="text-gray-700"><strong>Data Protection Officer:</strong> dpo@workforceone.com</p>
              </div>
            </section>

            {/* GDPR Specific */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Additional Information for EU Residents (GDPR)</h2>
              <p className="text-gray-700 mb-4">
                If you are located in the European Economic Area (EEA), you have additional rights under the General Data Protection Regulation (GDPR):
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Right to lodge a complaint with a supervisory authority</li>
                <li>Right to data portability</li>
                <li>Right to restriction of processing</li>
                <li>Rights related to automated decision-making and profiling</li>
              </ul>
              <p className="text-gray-700">
                Our legal basis for processing your personal data includes consent, contract performance, legal obligations, and legitimate interests as outlined in this policy.
              </p>
            </section>

            {/* CCPA Specific */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Additional Information for California Residents (CCPA)</h2>
              <p className="text-gray-700 mb-4">
                California residents have specific rights under the California Consumer Privacy Act (CCPA):
              </p>
              <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
                <li>Right to know what personal information is collected and how it's used</li>
                <li>Right to request deletion of personal information</li>
                <li>Right to opt-out of the sale of personal information (we do not sell personal information)</li>
                <li>Right to non-discrimination for exercising CCPA rights</li>
              </ul>
              <p className="text-gray-700">
                To exercise these rights, please contact us using the information provided above.
              </p>
            </section>
          </div>

          {/* Back to Home */}
          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}