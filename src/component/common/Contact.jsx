import React, { useContext, useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { ref, push, get } from "firebase/database";
import { IoIosArrowBack } from "react-icons/io";
import { AlertContext } from "../context/AlertContext";
import { useNavigate } from "react-router-dom";

export default function Contact() {
  const [form, setForm] = useState({
    email: "",
    username: "",
    selectedPackage: "",
    message: "",
  });
  const [loading, setLoading] = useState(true);
  const { setAlert } = useContext(AlertContext);
  const navigate = useNavigate();
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("");

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      get(ref(db, `users/${user.uid}`)).then((snap) => {
        if (snap.exists()) {
          const data = snap.val();
          setForm((prev) => ({
            ...prev,
            email: data.email || "",
            username: data.name || "",
          }));
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.username || !form.selectedPackage) {
      setAlert({
        visible: true,
        type: "error",
        message: "Please provide both name and email.",
      });
      return;
    }

    const entry = {
      ...form,
      submittedAt: Date.now(),
    };

    try {
      await push(ref(db, "contacts"), entry);

      const message = `📩 Contact Form Submission:
        Name: ${form.username}
        Email: ${form.email}
        Selected Package: ${form.selectedPackage || "N/A"}
        Message: ${form.message || "N/A"}`;

      setShowPaymentOptions(true);

      setForm({
        email: form.email,
        username: form.username,
        selectedPackage: "",
        message: "",
      });
    } catch (err) {
      console.error("❌ Submission error:", err);
      alert("There was an error. Please try again.");
    }
  };

  const handleMethodSelect = async (method) => {
    setSelectedMethod(method);

    const user = auth.currentUser;
    if (!user) return;

    const welcomeSnap = await get(ref(db, "settings/chatWelcomeMessage"));
    const allMessages = welcomeSnap.exists() ? welcomeSnap.val() : {};
    const welcomeMsg =
      allMessages[method] || `Welcome! You selected ${method}.`;

    // Send system message
    await push(ref(db, `chats/${user.uid}`), {
      from: "system",
      method,
      content: welcomeMsg,
      timestamp: Date.now(),
    });

    // Send user form data to admin
    const infoMsg = `
📦 New Package Activation Request

👤 Name: ${form.username}
📧 Email: ${form.email}
💼 Package: ${form.selectedPackage}
💳 Payment Method: ${method}
📝 Message: ${form.message || "—"}
`.trim();

    await push(ref(db, `chats/${user.uid}`), {
      from: "user",
      content: infoMsg,
      adminOnly: true,
      timestamp: Date.now(),
    });

    navigate(`/chat?method=${method}`);
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setForm((prev) => ({
        ...prev,
        username: user.displayName || "",
        email: user.email || "",
      }));
    }
  }, []);

  if (loading)
    return <p className="text-white text-center mt-20">Loading...</p>;

  return (
    <div className="px-4 sm:px-6  md:px-0 mt-24 mb-52">
      <div className="max-w-lg mx-auto bg-gray-900 p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl text-white">
        <button
          onClick={() => navigate(-1)}
          className="px-2 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
        >
          <IoIosArrowBack />
        </button>
        <span className="text-2xl sm:text-3xl font-bold text-gold200">
          Buy Package
        </span>

        <form onSubmit={handleSubmit} className="space-y-5 mt-6">
          {/* Email */}
          <div>
            <label className="block mb-1 text-sm">Email</label>
            <input
              name="email"
              type="email"
              placeholder="Your Email"
              className="w-full p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-gold100"
              value={form.email}
              onChange={handleChange}
              readOnly
              required
            />
          </div>

          {/* Username */}
          <div>
            <label className="block mb-1 text-sm">Name</label>
            <input
              name="username"
              type="text"
              placeholder="Your Name"
              className="w-full p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-gold100"
              value={form.username}
              onChange={handleChange}
              readOnly
              required
            />
          </div>

          {/* Package Dropdown */}
          <div>
            <label className="block mb-1 text-sm">Select Package</label>
            <select
              value={form.selectedPackage || ""}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  selectedPackage: e.target.value,
                }))
              }
              className="w-full p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-gold100"
              required
            >
              <option value="" disabled>
                Select Package
              </option>
              <option value="Bronze">Bronze</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
              <option value="Elite">Elite</option>
            </select>
          </div>

          {/* Message Field */}
          <div>
            <label className="block mb-1 text-sm">Message (Optional)</label>
            <textarea
              name="message"
              rows={4}
              placeholder="Your message..."
              className="w-full p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-gold100"
              value={form.message}
              onChange={handleChange}
            ></textarea>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className=" w-full bg-gold200 hover:bg-yellow-500 p-3 rounded-lg font-bold text-white transition-transform transform hover:scale-105"
          >
            Submit
          </button>
        </form>
        {showPaymentOptions && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-3">
              Choose a Payment Method:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {["Easypaisa", "JazzCash", "BankTransfer"].map((method) => (
                <div
                  key={method}
                  onClick={() => handleMethodSelect(method)}
                  className="bg-gray-800 hover:bg-gray-700 text-white rounded-lg p-4 cursor-pointer text-center shadow-md"
                >
                  {method}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
