import { React, useEffect, useState, useContext } from "react";
import { FaFacebookF } from "react-icons/fa";
import { Link, useNavigate} from "react-router-dom";
import { AlertContext } from "../context/AlertContext";
import { auth } from "../../firebase";

export default function Footers() {
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { setAlert } = useContext(AlertContext);
  const navigate = useNavigate();

  const handleContClick = () => {
    const user = auth.currentUser;
        if (user) {
          navigate("/chat");
        } else {
          setAlert({
            visible: true,
            type: "error",
            message: "Please sign in to send message.",
          });
        }
  }

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;

      // Show only if user is near the bottom 20% of the page
      const scrolledToBottom = scrollY + winHeight >= docHeight * 0.8;
      setShowScrollButton(scrolledToBottom);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <footer className=" text-white pt-10 pb-5 px-6 sm:px-12 mt-12 relative">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm max-w-screen-xl mx-auto">
        {/* About Section */}
        <div>
          <h3 className="text-yellow-400 text-lg font-bold mb-2">
            About Our Platform
          </h3>
          <p className="text-gray-300">
            A secure, verified and responsive reward system built for
            performance, transparency, and user satisfaction.
          </p>
          <Link
            className="flex gap-3 mt-3"
            to="https://web.facebook.com/profile.php?id=61552686513404"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaFacebookF className="w-5 h-5 hover:text-blue-500 cursor-pointer" />
            {/* <FaInstagram className="w-5 h-5 hover:text-pink-500 cursor-pointer" /> */}
          </Link>
        </div>

        {/* Base Navigation */}
        <div>
          <h3 className="text-yellow-400 text-lg font-bold mb-2">Navigation</h3>
          <ul className="space-y-2 text-gray-300">
            <li>
              <Link
                to="#"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              >
                Home
              </Link>
            </li>
            <li>
              <Link to="#">Account Login</Link>
            </li>
            <li>
              <button onClick={handleContClick}>Contact</button>
              {/* <Link to="/contact?mode=contact">Contact</Link> */}
            </li>
          </ul>
        </div>

        {/* Important Links */}
        <div>
          <h3 className="text-yellow-400 text-lg font-bold mb-2">
            Important Links
          </h3>
          <ul className="space-y-2 text-gray-300">
            <li>
              <Link to="/privPolicy">Privacy</Link>
            </li>
            <li>
              <a href="#">Ranking</a>
            </li>
            <li>
              <a href="#">Schema</a>
            </li>
            <li>
              <a href="#">FAQ</a>
            </li>
          </ul>
        </div>

        {/* Company Essentials */}
        <div>
          <h3 className="text-yellow-400 text-lg font-bold mb-2">Company</h3>
          <ul className="space-y-2 text-gray-300">
            <li>
              <a href="/aboutus">About</a>
            </li>
            <li>
              <Link to="/terms">Terms & Conditions</Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Scroll-to-top */}
      {showScrollButton && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-4 right-4 bg-yellow-400 text-black p-2 rounded-full shadow-lg hover:bg-yellow-500 transition"
        >
          ↑
        </button>
      )}
    </footer>
  );
}
