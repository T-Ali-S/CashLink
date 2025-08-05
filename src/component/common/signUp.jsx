import React, { useState, useEffect, useContext } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, set, get } from "firebase/database";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { auth, db } from "../../firebase";
import Alert from "./Alert";
// import { sendNotification } from "../utils/sendNotification"; // Keep commented out for now
import { UserContext } from "../Others/UserContext";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [enteredCode, setEnteredCode] = useState("");
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { setUserData } = useContext(UserContext);
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

  const generateReferralCode = (name) => {
    const prefix = name.split(" ")[0].slice(0, 3).toUpperCase();
    const suffix = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}${suffix}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. *** Start with Firebase Authentication ***
      // This is the first step that establishes the user's authenticated state.
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const uid = userCredential.user.uid; // Get the UID from the newly created user

      // Update Firebase Auth profile (displayName and photoURL)
      await updateProfile(user, {
        displayName: name,
        photoURL: randomAvatar,
      });

      // 2. *** NOW, with the user authenticated, perform Realtime Database reads ***
      // This `get` operation will now be allowed by your `.read": "auth != null"` rule.
      const usersSnap = await get(ref(db, "users"));
      const allUsers = usersSnap.exists() ? usersSnap.val() : {};

      const existingNames = usersSnap.exists()
        ? Object.values(allUsers).map((u) => u.name.toLowerCase())
        : [];

      if (existingNames.includes(name.toLowerCase())) {
        // If username exists, we need to clean up the Firebase Auth user that was just created
        await user.delete(); // IMPORTANT: Deletes the Firebase Auth user if the name is taken
        setAlert({
          visible: true,
          type: "error",
          message: "Username already exists. Please choose another.",
        });
        setLoading(false);
        return; // Stop the function here
      }

      const matchedReferrer = Object.entries(allUsers).find(
        ([_, u]) => u.referralCode === enteredCode
      );
      const matchedReferrerUid = matchedReferrer ? matchedReferrer[0] : null;

      // 3. *** Write the new user's data to Realtime Database ***
      // This `set` operation will now be allowed by your `users/$uid` write rules.
      await set(ref(db, `users/${uid}`), {
        name,
        email,
        referralCode: generateReferralCode(name),
        referredBy: matchedReferrerUid || null,
        // balance: 0, // Keep these commented out, as they require admin privileges to write
        // package: null,
        avatarUrl: randomAvatar,
        role: "user",
        createdAt: new Date().toISOString(),
        name_lower: name.toLowerCase(),
        name_slug: name.toLowerCase().replace(/\s+/g, "-"),
      });

      // You can re-enable sendNotification after you implement it via Cloud Functions
      // if (matchedReferrerUid) {
      //   await sendNotification(
      //     matchedReferrerUid,
      //     "🎉 You referred a new user!",
      //     `${name} just signed up using your referral code.`
      //   );
      // }

      setUserData({
        name,
        email,
        avatarUrl: randomAvatar,
        role: "user",
        uid,
      });

      setAlert({
        visible: true,
        type: "success",
        message: "User registered successfully!",
      });

      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      console.error("Signup error:", err); // Log the full error object for debugging
      setAlert({
        visible: true,
        type: "error",
        message:
          err.code === "auth/email-already-in-use"
            ? "This email is already registered."
            : err.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const refCode = searchParams.get("ref");
    if (refCode) setEnteredCode(refCode);
  }, [searchParams]); // Added searchParams to dependency array for useEffect

  return (
    <div className="min-h-screen w-full  flex items-center justify-center px-4">
      {alert.visible && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ ...alert, visible: false })}
        />
      )}
      <div className="bg-white rounded-xl w-full max-w-md p-6 sm:p-10 shadow-lg">
        <h2 className="text-3xl sm:text-5xl font-bold text-center bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B] bg-clip-text text-transparent mb-6">
          Sign-Up
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            className="pl-3 pt-2 pb-2 text-black rounded-md border-2"
            value={name}
            type="text"
            name="name"
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter Name"
            required
          />
          <input
            className="pl-3 pt-2 pb-2 text-black rounded-md border-2"
            value={email}
            type="email"
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter Email"
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
          <button
            type="submit"
            disabled={loading}
            className={`px-4 py-2 rounded text-white ${
              loading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-gold200 hover:bg-yellow-400"
            } text-lg rounded-lg transition-transform active:scale-95`}
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
        <div className="text-xs mt-5 mb-5 flex justify-center items-center flex-wrap gap-1">
          <span className="text-black">Already have an account? </span>
          <Link to="/Signin" className="ml-1 text-blue-800">
            SignIn
          </Link>
        </div>
      </div>
    </div>
  );
}
