import React, { useState } from "react";
import { db } from "../../firebase";
import { ref, get, update, push } from "firebase/database";
import AdminLayout from "../Admin/AdminLayout";

export default function DistributeBonus() {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState(
    "🎉 You've received a bonus for helping us reach our investment goal!"
  );
  const [status, setStatus] = useState("idle");

  const handleDistribute = async () => {
  try {
    const bonus = parseInt(amount);
    if (!bonus || bonus <= 0) return alert("Enter a valid bonus amount");

    setStatus("processing");

    const usersSnap = await get(ref(db, "users"));
    if (!usersSnap.exists()) {
      setStatus("error");
      return alert("No users found");
    }

    const allUsers = usersSnap.val();
    const updates = {};
    const now = Date.now();

    for (const [uid, user] of Object.entries(allUsers)) {
      const hasPackage = !!user.package;
      const milestoneMet =
        user?.milestones?.[user.package]?.rewarded || user.withdrawUnlocked;

      if (!hasPackage && !milestoneMet) continue; // 🚫 Skip ineligible users

      const currentBalance = user.balance || 0;
      const currentBonusWithdrawable = user.bonusWithdrawable || 0;

      const newBonusTotal = currentBonusWithdrawable + bonus;

      // Determine actual milestone-based withdrawable (if any)
      const milestoneUnlocked =
        user?.milestones?.[user.package]?.rewarded || user.withdrawUnlocked;
      const milestoneAmount = milestoneUnlocked ? currentBalance : 300;

      updates[`users/${uid}/balance`] = currentBalance + bonus;
      updates[`users/${uid}/bonusWithdrawable`] = newBonusTotal;
      updates[`users/${uid}/withdrawable`] = milestoneAmount + newBonusTotal;
      updates[`users/${uid}/bonusEarned`] = bonus;

      const newNotification = {
        subject: "🎁 Bonus Credited!",
        message: `${message}\n\nYou've received Rs. ${bonus} as a milestone reward.`,
        timestamp: now,
        read: false,
      };

      await push(ref(db, `notifications/${uid}`), newNotification);
    }

    await update(ref(db), updates);
    setStatus("success");
    alert("✅ Bonus distributed only to eligible users!");
  } catch (err) {
    console.error("🔥 Bonus distribution failed:", err);
    setStatus("error");
    alert("Something went wrong while distributing the bonus.");
  }
};


  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto bg-gray-900 p-6 rounded-lg text-white mt-8">
        <h2 className="text-2xl font-bold mb-4 text-yellow-300">
          Distribute Bonus
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
    </AdminLayout>
  );
}
