import React from 'react';
import { Link } from 'react-router-dom';

const Terms: React.FC = () => {
  return (
    <div className="min-h-screen bg-background page-transition flex flex-col items-center py-16 px-6 relative z-10">
      <div className="w-full max-w-3xl bg-surface-container-lowest rounded-2xl p-8 md:p-12 shadow-[0_40px_60px_-5px_rgba(45,51,56,0.04)] ring-1 ring-surface-container-highest/50">
        <Link to="/login" className="inline-flex items-center text-sm font-bold text-on-surface-variant hover:text-primary transition-colors mb-8 uppercase tracking-widest">
          <span className="material-symbols-outlined mr-2 text-[18px]">arrow_back</span>
          Back
        </Link>

        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-4">Terms of Service</h1>
        <p className="text-outline-variant text-sm font-medium mb-10">Last updated: March 28, 2026</p>

        <div className="space-y-8 text-on-surface-variant font-body leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Pady, you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you do not have permission to access the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">2. User Responsibilities</h2>
            <p>You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password. You agree not to disclose your password to any third party.</p>
            <p className="mt-3">You retain all your ownership rights to the content you create and upload to Pady. We claim no intellectual property rights over the material you provide.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">3. Acceptable Use</h2>
            <p>You agree not to use Pady to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Upload or distribute content that is illegal, defamatory, or infringes on intellectual property.</li>
              <li>Attempt to bypass or exploit any security mechanisms of the service.</li>
              <li>Engage in any automated use of the system, such as using scripts to send spam or harvest data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">4. Limitation of Liability</h2>
            <p>In no event shall Pady, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full h-1/2 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] right-[-10%] w-[30%] h-[40%] rounded-full bg-tertiary-fixed opacity-15 blur-[120px]"></div>
      </div>
    </div>
  );
};

export default Terms;
