import React from 'react'
import { MdOutlinePayment, MdDomainVerification } from "react-icons/md";
import { BiSupport } from "react-icons/bi";


export default function Footers() {
  return (
    <>
    <section className="my-10 flex flex-col sm:flex-row sm:justify-around items-center text-center gap-6">
            <div className="hover:text-yellow-400">
              <MdOutlinePayment className="text-4xl mx-auto mb-2" />
              <p>Secure Payment</p>
            </div>
            <div className="hover:text-gray-500">
              <MdDomainVerification className="text-4xl mx-auto mb-2" />
              <p>Verified System</p>
            </div>
            <div className="hover:text-green-600">
              <BiSupport className="text-4xl mx-auto mb-2" />
              <p>24/7 Support</p>
            </div>
          </section>
    </>
  )
}
