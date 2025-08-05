import React from "react";

export default function TermsAndConditions() {
  return (
    <section className="w-full px-4 sm:px-6 md:px-10 lg:px-16 py-20 text-white">
      <div className="max-w-5xl mx-auto">
        <div className="relative bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B] p-[4px] rounded-2xl shadow-lg">
          <div className="bg-[#192846] p-6 sm:p-10 md:p-12 rounded-[16px]">
            <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6 bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B] bg-clip-text text-transparent">
              Terms and Conditions
            </h1>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
              <strong className="text-yellow-400">1. Introduction</strong><br />
              By accessing or using Coinlink25.com, you agree to be legally bound by these Terms and Conditions. If you do not agree, please do not use our platform.
            </p>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mt-6">
              <strong className="text-yellow-400">2. Services Offered</strong><br />
              Coinlink25 offers investment packages where users deposit funds that are invested in stocks, cryptocurrencies, and other financial instruments. Returns are distributed based on package terms and market performance.
            </p>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mt-6">
              <strong className="text-yellow-400">3. Eligibility</strong><br />
              Users must be 18 years or older and legally capable of entering into binding agreements. We may require ID verification for compliance purposes.
            </p>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mt-6">
              <strong className="text-yellow-400">4. Investment Risk</strong><br />
              All investments involve risk. Coinlink25 does not guarantee profits. Past performance is not indicative of future results. You accept full responsibility for your investment decisions.
            </p>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mt-6">
              <strong className="text-yellow-400">5. User Responsibilities</strong><br />
              You agree to:<br />
              - Provide accurate information during registration<br />
              - Keep login credentials confidential<br />
              - Avoid using the platform for illegal activities
            </p>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mt-6">
              <strong className="text-yellow-400">6. Package Terms</strong><br />
              Each investment package has a specified duration, return rate, and withdrawal conditions. By purchasing a package, you agree to its individual terms.
            </p>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mt-6">
              <strong className="text-yellow-400">7. Withdrawal & Refund Policy</strong><br />
              Profits are withdrawable as per package schedule. Principal amounts may be locked for the duration of the investment. Early withdrawal rules, if available, will be clearly defined per package.
            </p>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mt-6">
              <strong className="text-yellow-400">8. Account Termination</strong><br />
              We reserve the right to suspend or terminate accounts found violating platform rules, including misuse, fraud, or suspicious activity.
            </p>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mt-6">
              <strong className="text-yellow-400">9. Limitation of Liability</strong><br />
              Coinlink25 is not liable for:<br />
              - Losses due to market volatility<br />
              - Technical downtime or data breaches beyond our control<br />
              - Third-party service disruptions
            </p>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mt-6">
              <strong className="text-yellow-400">10. Modifications</strong><br />
              We reserve the right to modify these terms at any time. Continued use of the site after updates constitutes acceptance of the new terms.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
