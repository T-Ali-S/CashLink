import React from "react";
import { FaRegCopy } from "react-icons/fa6";
import { GoPencil } from "react-icons/go";

export default function ProfileEditor({
  selectedAvatar,
  userData,
  nameInput,
  emailInput,
  currentPassword,
  setNameInput,
  setEmailInput,
  setCurrentPassword,
  onSave,
  onAvatarClick,
  onCopyReferral,
  avatarModal,
  alertVisible,
}) {
  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-8">
      {/* Avatar + Username */}
      <div className="flex items-center gap-6 flex-wrap">
        <div className="relative group">
          <img
            src={
              selectedAvatar || userData?.avatarUrl || "/avatars/default.png"
            }
            alt="Avatar"
            className="w-24 h-24 object-cover rounded-full border-4 border-white cursor-pointer hover:brightness-90 transition"
            onClick={onAvatarClick}
          />
          <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 text-xs text-gray-300 group-hover:block hidden">
            <GoPencil className="text-white text-4xl ms-20 font-bold" />
          </span>
        </div>
        <div>
          <p className="text-sm text-gray-400">USERNAME</p>
          <p className="text-lg font-semibold">{userData?.name}</p>
        </div>
      </div>

      {/* Editable Fields */}
      <div className="space-y-6">
        <div>
          <label className="text-sm text-gray-400 block mb-1">Username</label>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            className="bg-gray-700 text-white p-2 rounded w-full outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>

        {userData?.referralCode && (
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-400 block mb-1">
                Referral Code
              </label>
              <div className="flex bg-gray-700 rounded w-full p-2 items-center gap-2">
                <span className="text-lg font-mono text-white">
                  {userData.referralCode}
                </span>
                <button
                  onClick={onCopyReferral}
                  className="text-lg px-2 py-1 rounded hover:text-gray-300"
                >
                  <FaRegCopy />
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400 block mb-1">
                Referral Link
              </label>
              <div className="flex bg-gray-700 rounded w-full p-2 items-center gap-2 flex-wrap">
                <span className="text-sm font-mono text-white">
                  {`${window.location.origin}/Signup?ref=${userData.referralCode}`}
                </span>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `${window.location.origin}/Signup?ref=${userData.referralCode}`
                    )
                  }
                  className="text-lg px-2 py-1 rounded hover:text-gray-300"
                >
                  <FaRegCopy />
                </button>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="text-sm text-gray-400 block mb-1">
            Confirm Password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="bg-gray-700 text-white p-2 rounded w-full outline-none focus:ring-2 focus:ring-yellow-500"
          />
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={onSave}
        disabled={!userData?.emailVerified || avatarModal || alertVisible}
        className={`mt-6 px-6 py-2 rounded-lg text-white font-semibold transition ${
          !userData?.emailVerified || avatarModal || alertVisible
            ? "bg-gray-600 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-500"
        }`}
      >
        Save Changes
      </button>
    </div>
  );
}
