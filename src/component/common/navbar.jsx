import { useState } from "react";
import { Link } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { ref, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useContext } from "react";
import { UserContext } from "../Others/UserContext";
import { AlertContext } from "../context/AlertContext";

export default function Navbar({ userData }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef();
  const menuToggleRef = useRef();
  const mobileMenuRef = useRef();
  const avatarToggleRef = useRef();
  const { setAlert } = useContext(AlertContext);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/Signin");
  };

  const handleContactClick = () => {
    if (userData) {
      navigate("/chat");
    } else {
      setAlert({
        visible: true,
        type: "error",
        message: "Sign in to contact us",
      });
      // navigate("/signup");
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        menuToggleRef.current &&
        !menuToggleRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleAvatarClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        avatarToggleRef.current &&
        !avatarToggleRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleAvatarClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleAvatarClickOutside);
    };
  }, [dropdownOpen]);

  return (
    <nav className="fixed w-full bg-gray-800 top-0 left-0 text-white p-4 z-50">
      <div className="flex items-center justify-between">
        <div className="flex-1 flex items-center gap-2">
          <Link to="/">
            <img
              src="/assets/coinlink.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
          </Link>
          <Link className="text-lg text-gold200 font-bold" to="/">
            CoinLink
          </Link>
        </div>

        {/* Right side: Avatar or Hamburger */}
        <div className="md:hidden flex items-center">
          <button
            ref={menuToggleRef}
            onClick={() => setIsOpen(!isOpen)}
            className="focus:outline-none"
          >
            {userData ? (
              <img
                src={userData.avatarUrl || "/avatars/default.png"}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover border-2 border-white"
              />
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            )}
          </button>
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex flex-1 justify-center gap-6 items-center">
          <Link className="hover:text-gray-300" to="/">
            Home
          </Link>
          {/* <Link className="hover:text-gray-300" to="">
            About
          </Link> */}
          <Link to="/#packages" className="hover:text-gold200 transition">
            Plan
          </Link>

          <button onClick={handleContactClick} className="hover:text-gold200">
            Contact
          </button>
        </div>

        <div className="hidden md:flex justify-end flex-1 items-center gap-2">
          {userData ? (
            <div className="relative" ref={dropdownRef}>
              <button
                ref={avatarToggleRef}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 hover:text-gray-300 focus:outline-none"
              >
                <img
                  src={userData?.avatarUrl || "/avatars/default.png"}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border border-white"
                />
                <span className="font-medium">{userData?.name}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    dropdownOpen ? "rotate-180" : "rotate-0"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {dropdownOpen && (
                <div
                  className={`absolute right-0 mt-2 w-64 bg-white text-black shadow-lg rounded-lg overflow-hidden z-50
                              transform transition-all duration-200 origin-top-right
                              ${
                                dropdownOpen
                                  ? "scale-100 opacity-100"
                                  : "scale-95 opacity-0 pointer-events-none"
                              }`}
                >
                  <div className="p-4 border-b">
                    <h4 className="font-bold">{userData?.name}</h4>
                    <p className="text-sm text-gray-600">{userData?.email}</p>
                  </div>

                  {userData?.role === "admin" && (
                    <>
                      <Link
                        to="/admin"
                        className="block w-full text-left px-4 py-3 bg-gray-100 hover:bg-gold200 hover:text-white text-sm"
                      >
                        📊 Dashboard
                      </Link>
                    </>
                  )}
                  <div className="flex flex-col px-4 py-2 text-sm">
                    {/* <Link to="/profile" className="block w-full text-left px-4 py-3 bg-gray-100 hover:bg-gold200 hover:text-white text-sm">
                      Dashboard
                    </Link> */}
                    <Link to="/profile" className="py-2 hover:text-yellow-600">
                      👤 Profile
                    </Link>
                    <Link
                      to="/profile?tab=notifications"
                      className="py-2 hover:text-yellow-600 "
                    >
                      🔔 Notification
                    </Link>
                    <Link
                      to="/profile?tab=referrals"
                      className="py-2 hover:text-yellow-600 "
                    >
                      🤝 Referrals
                    </Link>
                    <Link
                      to="/profile?tab=transaction"
                      className="py-2 hover:text-yellow-600 "
                    >
                      📄 Transaction Logs
                    </Link>
                    <Link to="/chat" className="py-2 hover:text-yellow-600 ">
                      💬 Inbox
                    </Link>

                    {userData?.role === "admin" && (
                      <>
                        <Link
                          to="/admin/users"
                          className="py-2 hover:text-yellow-600"
                        >
                          Admin Panel
                        </Link>
                        <Link
                          to="/distribute-bonus"
                          className="py-2 hover:text-yellow-600"
                        >
                          Distribute Bonuses
                        </Link>
                      </>
                    )}
                  </div>

                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-3 bg-gray-100 hover:bg-red-500 hover:text-white text-sm"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link className="hover:text-gray-300" to="/Signin">
              SignIn
            </Link>
          )}
        </div>
      </div>

      {/* Mobile dropdown links */}
      {isOpen && (
        <div
          ref={mobileMenuRef}
          className="mt-4 flex flex-col gap-2 md:hidden bg-gray-700 p-4 rounded-lg"
        >
          <Link to="/" className="hover:text-gray-300">
            Home
          </Link>
          {/* <Link to="#" className="hover:text-gray-300">
            About
          </Link> */}
          <Link to="/#packages" className="hover:text-gray-300">
            Plan
          </Link>
          <button
            onClick={handleContactClick}
            className="hover:text-gray-300 text-left"
          >
            Contact
          </button>

          {userData ? (
            <>
              <div className="border-t border-gray-600 mt-3 pt-3">
                <p className="font-semibold text-white">{userData.name}</p>
                <p className="text-sm text-gray-300 mb-2">{userData.email}</p>
                {userData?.role === "admin" && (
                    
                    <Link
                  to="/admin"
                  className=" py-1 text-sm w-full text-left  text-gold200 hover:text-white"
                >
                  📊 Dashboard
                </Link>
                  )}
                <Link
                  to="/profile?tab=profile"
                  className="block py-1 text-sm hover:text-yellow-600"
                >
                  👤 Profile
                </Link>
                <Link
                  to="/profile?tab=notifications"
                  className="block py-1 text-sm hover:text-yellow-600"
                >
                  🔔 Notifications
                </Link>
                <Link
                  to="/profile?tab=referrals"
                  className="block py-1 hover:text-yellow-600 "
                >
                  🤝 Referrals
                </Link>
                <Link
                  to="/profile?tab=transactions"
                  className="block py-1 hover:text-yellow-600 "
                >
                  📄 Transaction Logs
                </Link>
                <Link to="/chat" className="block py-1 hover:text-yellow-600 ">
                  💬 Inbox
                </Link>
                {userData?.role === "admin" && (
                  <>
                    <Link
                      to="/admin/users"
                      className="block py-1 hover:text-yellow-600"
                    >
                      Admin Panel
                    </Link>
                    <Link
                      to="/distribute-bonus"
                      className="block py-1 hover:text-yellow-600"
                    >
                      Distribute Bonuses
                    </Link>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="mt-3 w-full text-left text-sm text-red-400 hover:text-white"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <Link to="/Signin" className="hover:text-gray-300">
              SignIn
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
