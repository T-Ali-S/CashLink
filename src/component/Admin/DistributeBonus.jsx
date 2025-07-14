import React, { useContext, useState } from "react";
import { db } from "../../firebase";
import { ref, get, update, push } from "firebase/database";
import AdminLayout from "../Admin/AdminLayout";
import { AlertContext } from "../context/AlertContext";

export default function DistributeBonus() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState(
    "🎉 You've received a bonus for helping us reach our investment goal!"
  );
  const { setAlert } = useContext(AlertContext);
  const [status, setStatus] = useState("idle");
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // ✅ Only validate & show modal
  const handleDistribute = () => {
    const bonus = parseInt(amount);
    if (!bonus || bonus <= 0) {
      setAlert({
        visible: true,
        type: "error",
        message: "Enter a valid bonus amount",
      });
      return;
    }
    setShowConfirmModal(true);
  };

  // ✅ Run real bonus logic *after* confirmation
  const confirmDistribution = async () => {
    try {
      setStatus("processing");
      setShowConfirmModal(false); // close modal

      const usersSnap = await get(ref(db, "users"));
      if (!usersSnap.exists()) {
        setStatus("idle");
        return setAlert({
          visible: true,
          type: "error",
          message: "No users found",
        });
      }

      const allUsers = usersSnap.val();
      const updates = {};
      const now = Date.now();
      const bonus = parseInt(amount);
      let recipientCount = 0;

      for (const [uid, user] of Object.entries(allUsers)) {
        const hasPackage = !!user.package;
        const milestoneMet =
          user?.milestones?.[user.package]?.rewarded || user.withdrawUnlocked;

        if (!hasPackage && !milestoneMet) continue;

        const currentBalance = user.balance || 0;
        const currentBonusWithdrawable = user.bonusWithdrawable || 0;
        const currentWithdrawable = user.withdrawable || 0;

        updates[`users/${uid}/balance`] = currentBalance + bonus;
        updates[`users/${uid}/bonusWithdrawable`] =
          currentBonusWithdrawable + bonus;
        updates[`users/${uid}/withdrawable`] = currentWithdrawable + bonus;
        updates[`users/${uid}/bonusEarned`] = bonus;

        const newNotification = {
          subject: "🎁 Bonus Credited!",
          message: `${message}\n\nYou've received Rs. ${bonus} as a milestone reward.`,
          timestamp: now,
          read: false,
        };

        await push(ref(db, `notifications/${uid}`), newNotification);
        recipientCount++;
      }

      await update(ref(db), updates);
      setStatus("success");
      setAlert({
        visible: true,
        type: "success",
        message: `✅ Bonus distributed to ${recipientCount} eligible user${
          recipientCount === 1 ? "" : "s"
        }!`,
      });
    } catch (err) {
      console.error("🔥 Bonus distribution failed:", err);
      setStatus("error");
      setAlert({
        visible: true,
        type: "error",
        message: "Something went wrong while distributing the bonus.",
      });
    } finally {
      setStatus("idle"); // always reset
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto bg-gray-900 p-6 rounded-lg text-white mt-8">
        <h2 className="text-4xl text-center font-bold mb-4 text-yellow-300">
          Distribute Bonuses
        </h2>

        <label className="block mb-2 text-sm">Bonus Amount (Rs.)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full bg-gray-800 p-2 rounded mb-4"
          placeholder="Enter bonus amount"
        />

        <label className="block mb-2 text-sm">
          Custom Notification Message
        </label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-gray-800 p-2 rounded mb-4"
          rows="3"
        />

        <button
          className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-semibold"
          onClick={handleDistribute}
          disabled={status === "processing"}
        >
          {status === "processing" ? "Sending..." : "Send Bonus to All"}
        </button>
      </div>

      {/* ✅ Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white text-black p-6 rounded-xl shadow-xl w-full max-w-sm">
            <h3 className="text-xl font-bold mb-2">Confirm Distribution</h3>
            <p className="mb-4">
              Are you sure you want to send <strong>Rs. {amount}</strong> bonus
              to all eligible users?
            </p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
                onClick={() => {
                  setShowConfirmModal(false);
                  setStatus("idle");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={confirmDistribution}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
