import React from "react";
import { MdOutlinePayment, MdDomainVerification } from "react-icons/md";
import { BiSupport } from "react-icons/bi";

export default function Footers() {
  return (
    <section className="my-10 flex justify-center items-center gap-20 sm:gap-16 text-center flex-wrap">
      {/* Payment */}
      <div className="group hover:text-yellow-400 flex flex-col items-center cursor-pointer">
        <MdOutlinePayment className="text-4xl mb-1" />
        <p className="text-xs sm:text-base hidden group-hover:block sm:block mt-1">
          Secure Payment
        </p>
      </div>

      {/* Verified */}
      <div className="group hover:text-gray-500 flex flex-col items-center cursor-pointer">
        <MdDomainVerification className="text-4xl mb-1" />
        <p className="text-xs sm:text-base hidden group-hover:block sm:block mt-1">
          Verified System
        </p>
      </div>

      {/* Support */}
      <div className="group hover:text-green-600 flex flex-col items-center cursor-pointer">
        <BiSupport className="text-4xl mb-1" />
        <p className="text-xs sm:text-base hidden group-hover:block sm:block mt-1">
          24/7 Support
        </p>
      </div>
    </section>
  );
}
