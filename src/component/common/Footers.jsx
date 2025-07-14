import React from "react";
import { MdOutlinePayment, MdDomainVerification } from "react-icons/md";
import { BiSupport } from "react-icons/bi";
import { FaFacebookF, FaInstagram } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Footers() {
  return (
    <footer className=" text-white pt-10 pb-5 px-6 sm:px-12 mt-12 relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm max-w-screen-xl mx-auto">

        {/* About Section */}
        <div>
          <h3 className="text-yellow-400 text-lg font-bold mb-2">About Our Platform</h3>
          <p className="text-gray-300">
            A secure, verified and responsive reward system built for performance, transparency, and user satisfaction.
          </p>
          <div className="flex gap-3 mt-3">
            <FaFacebookF className="w-5 h-5 hover:text-blue-500 cursor-pointer" />
            <FaInstagram className="w-5 h-5 hover:text-pink-500 cursor-pointer" />
          </div>
        </div>

        {/* Base Navigation */}
        <div>
          <h3 className="text-yellow-400 text-lg font-bold mb-2">Navigation</h3>
          <ul className="space-y-2 text-gray-300">
            <li><Link to="#" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Home</Link></li>
            <li><Link to="#">Account Login</Link></li>
            <li><Link to="/contact?mode=contact">Contact</Link></li>
          </ul>
        </div>

        {/* Important Links */}
        <div>
          <h3 className="text-yellow-400 text-lg font-bold mb-2">Important Links</h3>
          <ul className="space-y-2 text-gray-300">
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Ranking</a></li>
            <li><a href="#">Schema</a></li>
            <li><a href="#">FAQ</a></li>
          </ul>
        </div>

        {/* Company Essentials */}
        <div>
          <h3 className="text-yellow-400 text-lg font-bold mb-2">Company</h3>
          <ul className="space-y-2 text-gray-300">
            <li><a href="#">About</a></li>
            <li><a href="#">Terms & Conditions</a></li>
          </ul>
        </div>
      </div>

      {/* System Icons */}
      {/* <div className="mt-10 flex justify-center items-center gap-12 text-center flex-wrap">
        <div className="group hover:text-yellow-400 flex flex-col items-center cursor-pointer">
          <MdOutlinePayment className="text-3xl mb-1" />
          <p className="text-xs">Secure Payment</p>
        </div>
        <div className="group hover:text-gray-500 flex flex-col items-center cursor-pointer">
          <MdDomainVerification className="text-3xl mb-1" />
          <p className="text-xs">Verified System</p>
        </div>
        <div className="group hover:text-green-500 flex flex-col items-center cursor-pointer">
          <BiSupport className="text-3xl mb-1" />
          <p className="text-xs">24/7 Support</p>
        </div>
      </div> */}

      {/* Scroll-to-top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-4 right-4 bg-yellow-400 text-black p-2 rounded-full shadow-lg hover:bg-yellow-500 transition"
      >
        ↑
      </button>
    </footer>
  );
}