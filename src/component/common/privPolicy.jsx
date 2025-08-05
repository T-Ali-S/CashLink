import React from "react";

export default function PrivPolicy() {
  return (
    <section className="w-full px-4 sm:px-6 md:px-10 lg:px-16 py-20 bg-[#0F172A] text-white">
      <div className="max-w-5xl mx-auto">
        {/* Gradient-bordered card */}
        <div className="relative bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B] p-[4px] rounded-2xl shadow-lg">
          {/* Inner content */}
          <div className="bg-[#192846] p-6 sm:p-10 md:p-12 rounded-[16px]">
            <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6 bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B] bg-clip-text text-transparent">
              Privacy Policy
            </h1>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mb-6">
              At <span className="text-yellow-400 font-semibold">Coinlink25</span>, we value your privacy and are committed to protecting your personal information. This policy outlines how we collect, use, store, and protect your data when you use our services.
            </p>

            {/* Section 1 */}
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">1. Information We Collect</h2>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
              <li><strong>Personal Data:</strong> Name, email, contact number, national ID (if applicable), and payment details.</li>
              <li><strong>Activity Data:</strong> Login history, package purchases, transaction records, and IP addresses.</li>
            </ul>

            {/* Section 2 */}
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">2. How We Use Your Information</h2>
            <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
              <li>To process package subscriptions and returns</li>
              <li>To communicate important updates and earnings</li>
              <li>To comply with legal and regulatory requirements</li>
              <li>To improve our services and user experience</li>
            </ul>

            {/* Section 3 */}
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">3. Data Security</h2>
            <p className="text-gray-300 mb-4">
              We implement strict data protection measures, including encryption, secure servers, and multi-factor authentication to prevent unauthorized access.
            </p>

            {/* Section 4 */}
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">4. Sharing of Information</h2>
            <p className="text-gray-300 mb-4">
              We do not sell or rent your personal information. Data may only be shared with regulatory bodies or legal authorities when required by law.
            </p>

            {/* Section 5 */}
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">5. Cookies & Tracking</h2>
            <p className="text-gray-300 mb-4">
              We use cookies to enhance your experience. These help us understand user behavior, improve site performance, and personalize content.
            </p>

            {/* Section 6 */}
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">6. Your Rights</h2>
            <p className="text-gray-300 mb-4">
              You may request access to your data, update it, or ask for its deletion by contacting our support team.
            </p>

            {/* Section 7 */}
            <h2 className="text-xl font-semibold text-yellow-400 mb-2">7. Policy Updates</h2>
            <p className="text-gray-300">
              This privacy policy may be updated from time to time. Continued use of <span className="text-yellow-400 font-semibold">Coinlink25</span> implies agreement with the latest version.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
