import React from "react";

export default function AboutUs() {
  return (
    <section className="w-full px-4 sm:px-6 md:px-10 lg:px-16 py-20 ] text-white">
      <div className="max-w-5xl mx-auto">
        {/* Card Wrapper with gradient border */}
        <div className="relative bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B] p-[4px] rounded-2xl shadow-lg">
          {/* Inner Card */}
          <div className="bg-[#192846] p-6 sm:p-10 md:p-12 rounded-[16px]">
            <h1 className="text-3xl sm:text-4xl font-bold text-center mb-6 bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B] bg-clip-text text-transparent">
              About Us
            </h1>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed">
              <span className="text-yellow-400 font-semibold">Coinlink25</span>{" "}
              is a forward-thinking investment platform built to empower
              individuals through simple, secure, and high-yield financial
              opportunities. We offer a unique model where users invest through
              structured packages, and in return, receive profitable payouts
              based on our diversified investment strategy. Our expert team
              actively manages capital across global stock markets,
              cryptocurrency assets, and other emerging financial instruments,
              ensuring optimal performance and minimal risk.
            </p>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mt-6">
              At the heart of{" "}
              <span className="text-yellow-400 font-semibold">Coinlink25</span>{" "}
              is a commitment to transparency, accessibility, and long-term
              trust. Our system is designed for everyone—from first-time
              investors looking for guided entry into modern finance, to
              experienced individuals seeking passive income through managed
              returns. With real-time progress tracking, automated earnings
              distribution, and a strong community focus, we make it easy to
              watch your investments grow—week after week, month after month.
            </p>

            <p className="text-gray-300 text-base sm:text-lg leading-relaxed mt-6">
              Driven by financial innovation and user empowerment,{" "}
              <span className="text-yellow-400 font-semibold">Coinlink25</span>{" "}
              stands as a gateway to smart wealth generation in a digital world.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
