import React, { useState, useEffect } from "react";
import { FaRegCopy } from "react-icons/fa6";
import { auth, db } from "../../firebase";
import { ref, get, update } from "firebase/database";
import {
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail,
  onAuthStateChanged,
} from "firebase/auth";
import { GoPencil } from "react-icons/go";
import Alert from "../common/Alert";
import AvatarPicker from "./AvatarPicker";
import ReferralList from "./ReferralList";
import ProfileEditor from "../Profile/ProfileEditor";
import NotificationPanel from "./NotificationPanel";
import { useSearchParams, useNavigate } from "react-router-dom";

export default function Profile() {
  const [userData, setUserData] = useState(null);
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("profile");

  const [avatarModal, setAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const navigate = useNavigate();
  const [alert, setAlert] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  const handleCopyReferralCode = () => {
    navigator.clipboard.writeText(userData.referralCode);
    setAlert({
      visible: true,
      type: "success",
      message: "Copied successfully.",
    });
  };

  const handleSaveChanges = async () => {
    const user = auth.currentUser;
    if (!user || !currentPassword) {
      return setAlert({
        visible: true,
        type: "error",
        message: "Please confirm your password.",
      });
    }

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      if (emailInput !== user.email) {
        await updateEmail(user, emailInput);
        await user.sendEmailVerification();
        setAlert({
          visible: true,
          type: "info",
          message: "Verification email sent! Please check your inbox.",
        });
        return;
      }

      if (emailInput === user.email && nameInput !== userData?.name) {
        await update(ref(db, `users/${user.uid}`), { name: nameInput });
        setAlert({
          visible: true,
          type: "success",
          message: "Username updated successfully!",
        });
      }
    } catch (err) {
      console.error(err);
      setAlert({
        visible: true,
        type: "error",
        message: err.message || "Something went wrong. Please try again.",
      });
    } finally {
      setCurrentPassword("");
    }
  };

  useEffect(() => {
    const tab = searchParams.get("tab") || "profile";
    if (tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams, activeTab]);

  // Initial user data fetch
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      get(ref(db, `users/${user.uid}`)).then((snap) => {
        if (snap.exists()) {
          setUserData(snap.val());
        }
      });
    }
  }, []);

  // Prefill editable fields
  useEffect(() => {
    if (userData) {
      setNameInput(userData.name);
      setEmailInput(userData.email);
      setSelectedAvatar(userData.avatarUrl || "");
    }
  }, [userData]);

  // Email verified alert
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user?.emailVerified) {
        setAlert({
          visible: true,
          type: "success",
          message: "Email verified! You may now save your changes.",
        });
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen text-white p-6">
      {alert.visible && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert({ ...alert, visible: false })}
        />
      )}

      {avatarModal && (
        <AvatarPicker
          avatars={[
            "/avatars/default.png",
            "/avatars/avatar1.png",
            "/avatars/avatar2.png",
            "/avatars/avatar3.png",
            "/avatars/avatar4.png",
            "/avatars/avatar5.png",
            "/avatars/avatar6.png",
            "/avatars/avatar7.png",
          ]}
          selected={selectedAvatar}
          onSelect={setSelectedAvatar}
          onClose={async (confirm) => {
            setAvatarModal(false);
            if (confirm) {
              await update(ref(db, `users/${auth.currentUser.uid}`), {
                avatarUrl: selectedAvatar,
              });
              setUserData((prev) => ({ ...prev, avatarUrl: selectedAvatar }));
            }
          }}
        />
      )}

      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-6">
          Hi,{" "}
          <span className="text-yellow-400">{userData?.name || "User"}</span>
        </h2>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700 pb-2 text-sm sm:text-base">
          {["profile", "notifications", "referrals"].map((tab) => (
            <button
              key={tab}
              className={`px-3 py-1 rounded-md ${
                activeTab === tab
                  ? "bg-gold200 text-white"
                  : "hover:text-gray-300"
              }`}
              onClick={() => {
                setActiveTab(tab);
                navigate(`/profile?tab=${tab}`);
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Active Tab Content */}
        {activeTab === "referrals" ? (
          <ReferralList />
        ) : activeTab === "notifications" ? (
          <NotificationPanel />
        ) : activeTab === "profile" ? (
          <ProfileEditor
            selectedAvatar={selectedAvatar}
            userData={userData}
            nameInput={nameInput}
            emailInput={emailInput}
            currentPassword={currentPassword}
            setNameInput={setNameInput}
            setEmailInput={setEmailInput}
            setCurrentPassword={setCurrentPassword}
            onSave={handleSaveChanges}
            onAvatarClick={() => setAvatarModal(true)}
            onCopyReferral={handleCopyReferralCode}
            avatarModal={avatarModal}
            alertVisible={alert.visible}
          />
        ) : (
          <p className="text-sm text-gray-400">Coming soon…</p>
        )}
      </div>
    </div>
  );
}
