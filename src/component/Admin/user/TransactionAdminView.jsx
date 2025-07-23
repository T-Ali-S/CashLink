import React, { useEffect, useState } from "react";
import { db } from "../../../firebase";
import { ref, onValue, update, get, remove } from "firebase/database";
import { format } from "date-fns";

export default function TransactionAdminView({ userId }) {
  const [transactions, setTransactions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);

  useEffect(() => {
    const txnRef = ref(db, `withdrawals/${userId}`);
    const unsubscribe = onValue(txnRef, (snap) => {
      if (snap.exists()) {
        const data = Object.entries(snap.val()).map(([id, txn]) => ({
          id,
          ...txn,
        }));
        setTransactions(data.reverse());
      } else {
        setTransactions([]);
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const handleStatusChange = (txn, newStatus) => {
    if (
      (txn.status === "Pending" || txn.status === "Processing") &&
      newStatus === "Cancelled"
    ) {
      setSelectedTxn({ ...txn, newStatus });
      setShowModal(true);
    } else {
      update(ref(db, `withdrawals/${userId}/${txn.id}`), {
        status: newStatus,
      });
    }
  };

  const handleRefund = async (shouldRefund) => {
    if (!selectedTxn) return;
    const txnRef = ref(db, `withdrawals/${userId}/${selectedTxn.id}`);
    const userRef = ref(db, `users/${userId}`);

    if (shouldRefund && !selectedTxn.refunded) {
      const snap = await get(userRef);
      if (snap.exists()) {
        const user = snap.val();
        const newBalance = (user.balance || 0) + selectedTxn.amount;
        const newWithdrawable = (user.withdrawable || 0) + selectedTxn.amount;
        await update(userRef, {
          balance: newBalance,
          withdrawable: newWithdrawable,
        });
      }
    }

    // Always remove the transaction after refund prompt is handled
    await remove(txnRef);

    setShowModal(false);
    setSelectedTxn(null);
  };

  if (transactions.length === 0) {
    return (
      <p className="text-sm text-center text-gray-400">
        No withdrawal history for this user.
      </p>
    );
  }

  return (
    <div className="mt-4 max-h-80 overflow-y-auto text-sm border border-gray-700 rounded">
      <table className="min-w-[640px] w-full text-left sticky top-0 z-10 shadow-sm">
        <thead className="bg-gray-800 text-gray-300 sticky top-0 z-10">
          <tr>
            <th className="py-2 px-3">Amount</th>
            <th className="py-2 px-3">Method</th>
            <th className="py-2 px-3">Account</th>
            <th className="py-2 px-3">Status</th>
            <th className="py-2 px-3">Date</th>
          </tr>
        </thead>
        <tbody className="bg-white">
          {transactions.map((txn) => (
            <tr key={txn.id} className="border-t border-gray-700">
              <td className="py-2 px-3 text-green-400 font-semibold">
                Rs. {txn.amount}
              </td>
              <td className="py-2 px-3 capitalize">{txn.method}</td>
              <td className="py-2 px-3 font-mono">{txn.accountNumber}</td>
              <td className="py-2 px-3">
                <select
                  value={txn.status}
                  onChange={(e) => handleStatusChange(txn, e.target.value)}
                  className="bg-gray-800 text-white border border-gray-600 p-1 rounded text-sm"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Approved">Approved</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </td>
              <td className="py-2 px-3 text-gray-400">
                {format(new Date(txn.createdAt), "PPPp")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm">
            <h2 className="text-lg font-semibold mb-4">Refund Balance?</h2>
            <p className="mb-4">
              Do you want to return Rs. {selectedTxn?.amount} back to the
              user's balance & withdrawable?
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                onClick={() => handleRefund(true)}
              >
                Yes
              </button>
              <button
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                onClick={() => handleRefund(false)}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
