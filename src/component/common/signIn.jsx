import axios from "axios";
import React, {useContext} from "react";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
// import Alert from "./Alert";
import { Link, useNavigate } from "react-router-dom";
import { sendPasswordResetEmail } from "firebase/auth";
import { getDatabase, ref, get } from "firebase/database";
import { AlertContext } from "../context/AlertContext";

export default function Signin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  // const [alert, setAlert] = useState({
  //   visible: false,
  //   message: "",
  //   type: "success",
  // });
  const { setAlert } = useContext(AlertContext);
  const [loading, setLoading] = useState(false);
  const db = getDatabase();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!email || !password) {
      setAlert({
        visible: true,
        message: "Please fill out all fields.",
        type: "error",
      });
      setLoading(false);
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const snapshot = await get(ref(db, `users/${user.uid}`));
      const data = snapshot.val();

      if (!data) {
        setAlert({
          visible: true,
          message: "User profile not found.",
          type: "error",
        });
        setLoading(false);
        return;
      }
      console.log("User logged in with role:", data.role);

      setAlert({
        visible: true,
        message: "Login successful!",
        type: "success",
      });
      console.log("🚀 Navigating to:", data.role === "admin" ? "/admin" : "/");
navigate(data.role === "admin" ? "/admin" : "/");


    } catch (error) {
      const errorMessage =
        error.code === "auth/user-not-found"
          ? "No user found with this email."
          : error.code === "auth/wrong-password"
          ? "Incorrect password."
          : "Login failed. Please try again.";

      setAlert({
        visible: true,
        message: errorMessage,
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 flex items-center justify-center px-4">
      {alert.visible && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ ...alert, visible: false })}
        />
      )}
      <div className="bg-white rounded-xl w-full max-w-md p-6 sm:p-10 shadow-lg">
        <h2 className="text-3xl sm:text-4xl font-bold text-center text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-6">
          Sign-In
        </h2>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            className="pl-3 pt-2 pb-2 rounded-md border-2 text-black"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            placeholder="Enter Email"
          />
          <input
            className="pl-3 pt-2 pb-2 rounded-md text-black border-2"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            type="password"
            placeholder="Enter Password"
          />

          <Link
            to="#"
            onClick={async () => {
              if (!email) {
                setAlert({
                  visible: true,
                  type: "error",
                  message: "Please enter your email first.",
                });
                return;
              }
              try {
                await sendPasswordResetEmail(auth, email);
                setAlert({
                  visible: true,
                  type: "info",
                  message: "Reset email sent! Check your inbox.",
                });
              } catch (err) {
                setAlert({
                  visible: true,
                  type: "error",
                  message: "Failed to send reset email. please try again.",
                });
              }
            }}
            className="text-xs text-blue-800 text-center"
          >
            Forgot password?
          </Link>

          <button
            type="submit"
            disabled={loading}
            className={`${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-400"
            } text-white text-lg py-2 rounded-lg transition-transform active:scale-95`}
          >
            {loading ? "Logging in..." : "Submit"}
          </button>
        </form>

        <div className="text-xs mt-5 flex justify-center items-center flex-wrap gap-1">
          <span className="text-black">Don't have an account?</span>
          <Link to="/SignUp" className="text-blue-800">
            Create new account
          </Link>
        </div>
      </div>
    </div>
  );
}
