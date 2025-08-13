'use client'

export default function TermsOfServicePage() {
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
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          
          <p className="text-gray-600 mb-8">
            <strong>Effective Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            <br />
            <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <div className="space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-700 mb-4">
                Welcome to WorkforceOne. These Terms of Service ("Terms") govern your access to and use of the WorkforceOne workforce management platform, including our website, mobile applications, and related services (collectively, the "Service").
              </p>
              <p className="text-gray-700 mb-4">
                By accessing or using our Service, you agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
              </p>
              <p className="text-gray-700">
                These Terms apply to all users of the Service, including organizations, administrators, managers, and employees.
              </p>
            </section>

            {/* Service Description */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 mb-4">
                WorkforceOne is a comprehensive workforce management platform that provides:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Employee attendance tracking and time management</li>
                <li>Team collaboration and project management tools</li>
                <li>Task assignment and progress tracking</li>
                <li>Analytics and reporting capabilities</li>
                <li>Leave management and approval workflows</li>
                <li>Mobile applications for remote workforce management</li>
                <li>Integration capabilities with third-party services</li>
              </ul>
            </section>

            {/* User Accounts */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts and Registration</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">3.1 Account Creation</h3>
              <p className="text-gray-700 mb-4">
                To access certain features of the Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information as necessary.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.2 Account Security</h3>
              <p className="text-gray-700 mb-4">
                You are responsible for safeguarding your account credentials and for all activities under your account. You must immediately notify us of any unauthorized use of your account.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">3.3 Account Types</h3>
              <p className="text-gray-700">
                The Service offers different account types (Admin, Manager, Employee) with varying levels of access and functionality. Your organization's administrator controls your account permissions.
              </p>
            </section>

            {/* Acceptable Use */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use Policy</h2>
              <p className="text-gray-700 mb-4">You agree not to use the Service to:</p>
              <ul className="list-disc list-inside text-gray-700 space-y-1">
                <li>Violate any laws, regulations, or third-party rights</li>
                <li>Upload, transmit, or distribute malicious code or harmful content</li>
                <li>Attempt to gain unauthorized access to our systems or other users' accounts</li>
                <li>Use the Service for any fraudulent, deceptive, or misleading purposes</li>
                <li>Interfere with or disrupt the Service or servers/networks connected to the Service</li>
                <li>Reverse engineer, decompile, or attempt to extract source code</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Share your account credentials with unauthorized parties</li>
              </ul>
            </section>

            {/* Data and Privacy */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data and Privacy</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">5.1 Data Ownership</h3>
              <p className="text-gray-700 mb-4">
                You and your organization retain ownership of all data you upload, input, or generate through the Service ("Customer Data"). We do not claim ownership rights to your Customer Data.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.2 Data Processing</h3>
              <p className="text-gray-700 mb-4">
                We process your data in accordance with our Privacy Policy and applicable data protection laws. By using the Service, you consent to such processing.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">5.3 Data Security</h3>
              <p className="text-gray-700">
                We implement appropriate technical and organizational measures to protect your data, but cannot guarantee absolute security. You are responsible for backing up your important data.
              </p>
            </section>

            {/* Subscription and Payment */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Subscription and Payment Terms</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">6.1 Subscription Plans</h3>
              <p className="text-gray-700 mb-4">
                We offer various subscription plans with different features and usage limits. Current pricing and plan details are available on our website.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.2 Payment Terms</h3>
              <p className="text-gray-700 mb-4">
                Subscription fees are charged in advance and are non-refundable except as required by law. You authorize us to charge your chosen payment method for recurring subscription fees.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.3 Free Trial</h3>
              <p className="text-gray-700 mb-4">
                We may offer free trial periods for new users. Trial periods are subject to the terms outlined during signup and may convert to paid subscriptions automatically.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">6.4 Price Changes</h3>
              <p className="text-gray-700">
                We may change our pricing with 30 days' advance notice. Changes will not affect your current billing cycle but will apply to subsequent renewals.
              </p>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Intellectual Property Rights</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">7.1 Our Rights</h3>
              <p className="text-gray-700 mb-4">
                The Service, including its software, content, trademarks, and other intellectual property, is owned by us or our licensors and is protected by intellectual property laws.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">7.2 License to Use</h3>
              <p className="text-gray-700 mb-4">
                We grant you a limited, non-exclusive, non-transferable license to use the Service in accordance with these Terms during your subscription period.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">7.3 Feedback</h3>
              <p className="text-gray-700">
                Any feedback, suggestions, or improvements you provide to us may be used by us without restriction or compensation to you.
              </p>
            </section>

            {/* Service Availability */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Availability and Modifications</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">8.1 Availability</h3>
              <p className="text-gray-700 mb-4">
                We strive to maintain high service availability but cannot guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or technical issues.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">8.2 Service Modifications</h3>
              <p className="text-gray-700 mb-4">
                We may modify, update, or discontinue features of the Service at any time. We will provide reasonable notice for material changes that negatively impact functionality.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">8.3 Third-Party Services</h3>
              <p className="text-gray-700">
                The Service may integrate with third-party services. We are not responsible for the availability or functionality of third-party services.
              </p>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Account Termination</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">9.1 Termination by You</h3>
              <p className="text-gray-700 mb-4">
                You may cancel your subscription at any time through your account settings. Cancellation will be effective at the end of your current billing period.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">9.2 Termination by Us</h3>
              <p className="text-gray-700 mb-4">
                We may suspend or terminate your account if you violate these Terms, fail to pay fees, or if we discontinue the Service.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">9.3 Effect of Termination</h3>
              <p className="text-gray-700">
                Upon termination, your access to the Service will cease, and we may delete your account data after a reasonable period. You remain responsible for any outstanding fees.
              </p>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Disclaimers and Limitation of Liability</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">10.1 Service Disclaimer</h3>
              <p className="text-gray-700 mb-4">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">10.2 Limitation of Liability</h3>
              <p className="text-gray-700 mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">10.3 Maximum Liability</h3>
              <p className="text-gray-700">
                Our total liability to you for any claims arising from or related to the Service shall not exceed the amount you paid us for the Service in the twelve months preceding the claim.
              </p>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-700">
                You agree to indemnify and hold us harmless from any claims, damages, losses, and expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any rights of third parties.
              </p>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law and Dispute Resolution</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">12.1 Governing Law</h3>
              <p className="text-gray-700 mb-4">
                These Terms are governed by and construed in accordance with the laws of [Your Jurisdiction], without regard to conflict of law principles.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">12.2 Dispute Resolution</h3>
              <p className="text-gray-700 mb-4">
                Any disputes arising from these Terms or the Service shall be resolved through binding arbitration, except for claims that may be brought in small claims court.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">12.3 Class Action Waiver</h3>
              <p className="text-gray-700">
                You agree to resolve disputes on an individual basis and waive any right to participate in class action lawsuits or class-wide arbitration.
              </p>
            </section>

            {/* General Provisions */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. General Provisions</h2>
              
              <h3 className="text-xl font-medium text-gray-800 mb-3">13.1 Entire Agreement</h3>
              <p className="text-gray-700 mb-4">
                These Terms, together with our Privacy Policy and any additional terms for specific features, constitute the entire agreement between you and us regarding the Service.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">13.2 Severability</h3>
              <p className="text-gray-700 mb-4">
                If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions will remain in full force and effect.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">13.3 Waiver</h3>
              <p className="text-gray-700 mb-4">
                Our failure to enforce any provision of these Terms does not constitute a waiver of that provision or any other provision.
              </p>

              <h3 className="text-xl font-medium text-gray-800 mb-3">13.4 Assignment</h3>
              <p className="text-gray-700">
                You may not assign or transfer these Terms or your account without our written consent. We may assign these Terms without restriction.
              </p>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Changes to Terms</h2>
              <p className="text-gray-700">
                We may update these Terms from time to time. We will notify you of material changes by email or through the Service. Your continued use of the Service after changes become effective constitutes acceptance of the updated Terms.
              </p>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact Information</h2>
              <p className="text-gray-700 mb-4">
                If you have questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-gray-700 mb-2"><strong>Email:</strong> legal@workforceone.com</p>
                <p className="text-gray-700 mb-2"><strong>Address:</strong> [Your Business Address]</p>
                <p className="text-gray-700"><strong>Phone:</strong> [Your Phone Number]</p>
              </div>
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