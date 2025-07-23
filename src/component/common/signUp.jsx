import React, { useState, useEffect, useContext } from "react";
import axios from "axios";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import { ref, set, get } from "firebase/database";
import Alert from "./Alert";
import { useSearchParams } from "react-router-dom";
import { sendNotification } from "../utils/sendNotification";
import { UserContext } from "../Others/UserContext";
import { updateProfile } from "firebase/auth";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [searchParams] = useSearchParams();
  const [passwordTouched, setPasswordTouched] = useState(false);
  const { setUserData } = useContext(UserContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🛡 Password validation
    const passwordRegex = /^(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{7,}$/;
    if (!passwordRegex.test(password)) {
      setAlert({
        visible: true,
        type: "error",
        message:
          "Password must be at least 7 characters and include one special character.",
      });

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

      // ✅ Update Firebase Auth profile
      await updateProfile(user, {
        displayName: name,
        photoURL: randomAvatar,
      });

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

      setUserData({
        name,
        email,
        avatarUrl: randomAvatar,
        role: "user",
        uid,
      });

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

  const handleSignUp = async () => {
    setLoading(true);
    try {
      // your signup logic here
    } catch (error) {
      console.error(error);
      // show error to user
    } finally {
      setLoading(false);
    }
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
            onFocus={() => setPasswordTouched(true)}
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Enter Password"
            required
          />
          {passwordTouched && (
            <p className="text-sm  text-red-500">
              Password must be at least 7 characters and include one special
              character.
            </p>
          )}

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
          <button
            onClick={handleSignUp}
            disabled={loading}
            className={`px-4 py-2 rounded text-white ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-gold200 hover:bg-yellow-400"
            }`}
          >
            {loading ? "Signing up..." : "Sign Up"}
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
