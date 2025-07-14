import React, { useState, useEffect, useContext } from "react";
import { auth, db } from "../../firebase";
import { ref, push, get, update } from "firebase/database";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../Admin/AdminLayout";
import { AlertContext } from "../context/AlertContext";

export default function Withdraw() {
  const [form, setForm] = useState({
    email: "",
    username: "",
    amount: "",
    method: "easypaisa",
    accountNumber: "",
  });
  const [withdrawable, setWithdrawable] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { setAlert } = useContext(AlertContext);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const fetchUser = async () => {
      const snap = await get(ref(db, `users/${user.uid}`));
      if (snap.exists()) {
        const data = snap.val();

        const isElite = data.package === "elite";

        const milestoneUnlocked = isElite
          ? true
          : data?.milestones?.[data.package]?.rewarded || data.withdrawUnlocked;

        setWithdrawable(data.withdrawable || 0);

        setForm((prev) => ({
          ...prev,
          email: data.email || "",
          username: data.name || "",
        }));

        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const user = auth.currentUser;
      const requestAmount = parseInt(form.amount);

      if (!user || !requestAmount || !form.accountNumber) return;

      const userRef = ref(db, `users/${user.uid}`);
      const userSnap = await get(userRef);

      if (!userSnap.exists()) return;

      const userData = userSnap.val();
      const currentWithdrawable = userData.withdrawable || 0;
      const currentBalance = userData.balance || 0;

      if (requestAmount > currentWithdrawable) {
        setAlert({
          visible: true,
          type: "error",
          message: "❌ You cannot withdraw more than your allowed limit.",
        });
        // alert("❌ You cannot withdraw more than your allowed limit.");
        return;
      }

      // 1️⃣ Create the withdrawal transaction
      const newTxn = {
        ...form,
        amount: requestAmount,
        status: "Pending",
        createdAt: Date.now(),
      };

      await push(ref(db, `withdrawals/${user.uid}`), newTxn);

      // 2️⃣ Update Firebase to subtract the withdrawn amount
      await update(userRef, {
        withdrawable: currentWithdrawable - requestAmount,
        balance: currentBalance - requestAmount,
      });

      // 3️⃣ Confirm and navigate
      setAlert({
        visible: true,
        type: "success",
        message: "✅ Withdrawal request submitted successfully!",
      });
      // alert("✅ Withdrawal request submitted successfully!");
      navigate("/profile?tab=transaction");
    } catch (error) {
      console.error("Withdrawal failed:", error);
      setAlert({
        visible: true,
        type: "error",
        message: "❌ Something went wrong. Please try again later.",
      });
    }
  };
  if (loading) return <p className="text-white">Loading...</p>;

  return (
    <AdminLayout>
      <div className="max-w-xl mx-auto bg-gray-900 p-6 rounded-lg text-white mt-8">
        <h2 className="text-2xl font-bold mb-4 text-yellow-300">
          Withdraw Funds
        </h2>
        <p className="text-sm text-gray-400 mb-2">
          Available to withdraw: Rs. {withdrawable}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-gray-800 p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              className="w-full bg-gray-800 p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Amount</label>
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              max={withdrawable}
              className="w-full bg-gray-800 p-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Method</label>
            <select
              name="method"
              value={form.method}
              onChange={handleChange}
              className="w-full bg-gray-800 p-2 rounded"
            >
              <option value="easypaisa">Easypaisa</option>
              <option value="jazzcash">Jazzcash</option>
              <option value="bank">Bank Transfer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm mb-1">
              {form.method === "bank" ? "Bank Account Number" : "Wallet Number"}
            </label>
            <input
              type="text"
              name="accountNumber"
              value={form.accountNumber}
              onChange={handleChange}
              className="w-full bg-gray-800 p-2 rounded"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-semibold"
          >
            Submit Request
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
