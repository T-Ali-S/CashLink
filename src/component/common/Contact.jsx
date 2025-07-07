import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { ref, push, get } from "firebase/database";

export default function Contact() {
  const [form, setForm] = useState({
    email: "",
    username: "",
    selectedPackage: "",
    message: "",
  });
  const [loading, setLoading] = useState(true);

  const whatsappNumber = "923001234567"; // Replace with your number (no +)

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

    if (!form.email || !form.username) {
      alert("Please provide both name and email.");
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

      const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
        message
      )}`;

      window.open(whatsappLink, "_blank");

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

  if (loading)
    return <p className="text-white text-center mt-20">Loading...</p>;

  return (
    <div className="px-4 sm:px-6  md:px-0 mt-24 mb-52">
      <div className="max-w-lg mx-auto bg-gray-900 p-6 sm:p-8 md:p-10 rounded-2xl shadow-2xl text-white">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-center text-gold200">
          Contact Us
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
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
              required
            />
          </div>

          {/* Package Dropdown */}
          <div>
            <label className="block mb-1 text-sm">Select Package</label>
            <select
              name="selectedPackage"
              className="w-full p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-gold100"
              value={form.selectedPackage}
              onChange={handleChange}
            >
              <option value="">-- Optional: Select Package --</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
              <option value="elite">Elite</option>
            </select>
          </div>

          {/* Message */}
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
            className="w-full bg-gold200 hover:bg-yellow-500 p-3 rounded-lg font-bold text-white transition-transform transform hover:scale-105"
          >
            Submit & Contact on WhatsApp
          </button>
        </form>
      </div>
    </div>
  );
}
