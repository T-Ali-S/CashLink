import { useState } from "react";
import { Link } from "react-router-dom";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { ref, get } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  // const [username, setUsername] = useState("");
  const [userData, setUserData] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef();

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/Signin");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snapshot = await get(ref(db, `users/${user.uid}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          setUserData({
            ...data,
            uid: user.uid,
            role: data.role || "user",
          });
        }
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <nav className="fixed w-full bg-gray-800 top-0 left-0 text-white p-4 z-50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <Link className="text-lg font-bold" to="/">
            Pyramid Scheme
          </Link>
        </div>

        {/* Right side: Avatar or Hamburger */}
        <div className="md:hidden flex items-center">
          {userData ? (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="focus:outline-none"
            >
              <img
                src={userData.avatarUrl || "/avatars/default.png"}
                alt="avatar"
                className="w-8 h-8 rounded-full object-cover border-2 border-white"
              />
            </button>
          ) : (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="focus:outline-none"
            >
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
            </button>
          )}
        </div>

        {/* Desktop nav links */}
        <div className="hidden md:flex flex-1 justify-center gap-6 items-center">
          <Link className="hover:text-gray-300" to="/">
            Home
          </Link>
          <Link className="hover:text-gray-300" to="">
            About
          </Link>
          <Link
            onClick={(e) => {
              e.preventDefault();
              if (window.location.pathname === "/") {
                // Already on home → just scroll
                const el = document.querySelector("[data-scroll='packages']");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              } else {
                // Navigate to home and scroll after load
                navigate("/#packages");
              }
            }}
            className="hover:text-gray-300"
            to="/#packages"
          >
            Plan
          </Link>

          <Link className="hover:text-gray-300" to="">
            Contact
          </Link>
        </div>

        <div className="hidden md:flex justify-end flex-1 items-center gap-2">
          {userData ? (
            <div className="relative" ref={dropdownRef}>
              <button
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

                  <div className="flex flex-col px-4 py-2 text-sm">
                    <Link to="/profile" className="py-2 hover:text-yellow-600">
                      Profile
                    </Link>
                    <Link
                      to="/profile?tab=notifications"
                      className="py-2 hover:text-yellow-600 "
                    >
                      Notification
                    </Link>
                    <Link
                      to="/profile?tab=referrals"
                      className="py-2 hover:text-yellow-600 "
                    >
                      Referrals
                    </Link>
                    <Link
                      to="/profile?tab=transaction"
                      className="py-2 hover:text-yellow-600 "
                    >
                      Transaction Logs
                    </Link>
                    {userData?.role === "admin" && (
                      <Link to="/admin" className="py-2 hover:text-yellow-600">
                        Admin Panel
                      </Link>
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
        <div className="mt-4 flex flex-col gap-2 md:hidden bg-gray-700 p-4 rounded-lg">
          <Link to="/" className="hover:text-gray-300">
            Home
          </Link>
          <Link to="#" className="hover:text-gray-300">
            About
          </Link>
          <Link to="#" className="hover:text-gray-300">
            Plan
          </Link>
          <Link to="#" className="hover:text-gray-300">
            Contact
          </Link>

          {userData ? (
            <>
              <div className="border-t border-gray-600 mt-3 pt-3">
                <p className="font-semibold text-white">{userData.name}</p>
                <p className="text-sm text-gray-300 mb-2">{userData.email}</p>
                <Link
                  to="/profile?tab=profile"
                  className="block py-1 text-sm hover:text-yellow-600"
                >
                  Profile
                </Link>
                <Link
                  to="/profile?tab=notifications"
                  className="block py-1 text-sm hover:text-yellow-600"
                >
                  Notifications
                </Link>
                <Link
                      to="/profile?tab=referrals"
                      className="py-2 hover:text-yellow-600 "
                    >
                      Referrals
                    </Link>
                    <Link
                      to="/profile?tab=transactions"
                      className="py-2 hover:text-yellow-600 "
                    >
                      Transaction Logs
                    </Link>
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
