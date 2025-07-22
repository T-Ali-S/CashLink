import React, { useState, useEffect } from "react";
import axios from "axios";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import { ref, set, get } from "firebase/database";
import Alert from "./Alert";
import { useSearchParams } from "react-router-dom";
import { sendNotification } from "../utils/sendNotification";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [searchParams] = useSearchParams();
  const availableAvatars = [
    "/avatars/default.png",
    "/avatars/avatar1.png",
    "/avatars/avatar2.png",
    "/avatars/avatar3.png",
    "/avatars/avatar4.png",
    "/avatars/avatar5.png",
    "/avatars/avatar6.png",
    "/avatars/avatar7.png",
  ];
  const randomAvatar =
    availableAvatars[Math.floor(Math.random() * availableAvatars.length)];

  const [alert, setAlert] = useState({
    visible: false,
    message: "",
    type: "success",
  });
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🛡 Password validation
    const passwordRegex = /^(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{7,}$/;
    if (!passwordRegex.test(password)) {
      alert(
        "Password must be at least 7 characters long and contain at least one special character."
      );
      return;
    }

    try {
      // 🔍 Check for unique name (case-insensitive match)
      const usersSnap = await get(ref(db, "users"));
      const allUsers = usersSnap.exists() ? usersSnap.val() : {};
      const matchedReferrer = Object.entries(allUsers).find(
        ([_, u]) => u.referralCode === enteredCode
      );
      const matchedReferrerUid = matchedReferrer ? matchedReferrer[0] : null;
      const existingNames = usersSnap.exists()
        ? Object.values(usersSnap.val()).map((user) => user.name.toLowerCase())
        : [];

      if (existingNames.includes(name.toLowerCase())) {
        setAlert({
          visible: true,
          type: "error",
          message: "Username already exists. Please choose another.",
        });

        return;
      }

      // ✅ Create user with Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const uid = user.uid;

      // 💾 Save to Realtime Database
      set(ref(db, `users/${uid}`), {
        name,
        email,
        referralCode: generateReferralCode(name),
        referredBy: matchedReferrerUid || null,
        balance: 0,
        package: null,
        avatarUrl: randomAvatar,
        // role:"admin",
        role: "user",
        createdAt: new Date().toISOString(),
        name_lower: name.toLowerCase(), // for lookups
        name_slug: name.toLowerCase().replace(/\s+/g, "-"), // for URLs or slugs
      });
      setAlert({
        visible: true,
        type: "success",
        message: "User registered successfully!",
      });
      if (matchedReferrerUid) {
        const referrerRef = ref(db, `users/${matchedReferrerUid}`);
        const refSnap = await get(referrerRef);
      }
      if (matchedReferrerUid) {
        await sendNotification(
          matchedReferrerUid,
          "🎉 You referred a new user!",
          `${name} just signed up using your referral code.`
        );
      }

      // alert("User registered successfully!");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setAlert({
          visible: true,
          type: "error",
          message: "This email is already registered.",
        });
      } else {
        setAlert({
          visible: true,
          type: "error",
          message: err.message || "Something went wrong. Please try again.",
        });
      }
    }
  };

  const generateReferralCode = (name) => {
    const prefix = name.split(" ")[0].slice(0, 3).toUpperCase();
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${suffix}`;
  };

  //autofill refer code
  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) setEnteredCode(refCode);
  }, []);
  return (
    <div className="min-h-screen w-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500  outline outline-red-500 flex items-center justify-center px-4">
      {alert.visible && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ ...alert, visible: false })}
        />
      )}
      <div className="bg-white rounded-xl w-full max-w-md p-6 sm:p-10 shadow-lg">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from primary to-secondary mb-6">
          Sign-Up
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="pl-3 pt-2 pb-2 text-black rounded-md border-2 "
            value={name}
            type="text"
            name="name"
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Name"
            required
          />
          <input
            className="pl-3 pt-2 pb-2 text-black rounded-md border-2  "
            value={email}
            type="email"
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Entrer Email"
            required
          />

          <input
            className="pl-3 pt-2 pb-2 text-black rounded-md border-2"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Enter Password"
            required
          />
          <input
            className="pl-3 pt-2 pb-2 text-black rounded-md border-2"
            value={enteredCode}
            onChange={(e) => setEnteredCode(e.target.value)}
            placeholder="Referral Code (optional)"
            readOnly={searchParams.get("ref") !== null}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="ml-2 text-sm text-blue-500"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
          <button className="bg-blue-500 text-lg py-2 text-white hover:bg-blue-400 active:scale-95 transition-transform rounded-lg ">
            Submit
          </button>
        </form>
        <div className="text-xs mt-5 mb-5 flex justify-center items-center flex-wrap gap-1">
          <span className="text-black">Already have an account? </span>
          <Link to="/Signin" className="ml-1 text-blue-800">
            {" "}
            SignIn
          </Link>
        </div>
      </div>
    </div>
  );
}
