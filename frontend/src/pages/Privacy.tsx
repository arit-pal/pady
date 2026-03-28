import React from 'react';
import { Link } from 'react-router-dom';

const Privacy: React.FC = () => {
  return (
    <div className="min-h-screen bg-background page-transition flex flex-col items-center py-16 px-6 relative z-10">
      <div className="w-full max-w-3xl bg-surface-container-lowest rounded-2xl p-8 md:p-12 shadow-[0_40px_60px_-5px_rgba(45,51,56,0.04)] ring-1 ring-surface-container-highest/50">
        <Link to="/login" className="inline-flex items-center text-sm font-bold text-on-surface-variant hover:text-primary transition-colors mb-8 uppercase tracking-widest">
          <span className="material-symbols-outlined mr-2 text-[18px]">arrow_back</span>
          Back
        </Link>

        <h1 className="font-headline text-4xl font-extrabold tracking-tight text-on-surface mb-4">Privacy Policy</h1>
        <p className="text-outline-variant text-sm font-medium mb-10">Last updated: March 28, 2026</p>

        <div className="space-y-8 text-on-surface-variant font-body leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly to us when you create an account, create or modify documents, or communicate with us. This includes your name, email address, password, and the content of your documents.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to provide, maintain, and improve Pady. Specifically, we use your information to:</p>
            <ul className="list-disc pl-6 mt-3 space-y-2">
              <li>Authenticate your account and keep it secure.</li>
              <li>Store and sync your documents across your devices.</li>
              <li>Send you technical notices, updates, and support messages.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">3. Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal information and documents from unauthorized access, alteration, disclosure, or destruction. However, no internet transmission is completely secure, and we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-on-surface mb-3">4. Contact Us</h2>
            <p>If you have any questions about this Privacy Policy, please contact us at itsaritpal@gmail.com.</p>
          </section>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full h-1/2 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[60%] rounded-full bg-primary-fixed opacity-10 blur-[120px]"></div>
      </div>
    </div>
  );
};

export default Privacy;
