import React, { useEffect, useState } from "react";
import { db } from "../../../firebase";
import { ref, onValue, update } from "firebase/database";
import { format } from "date-fns";

export default function TransactionAdminView({ userId }) {
  const [transactions, setTransactions] = useState([]);

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

  const handleStatusChange = async (txnId, newStatus) => {
    await update(ref(db, `withdrawals/${userId}/${txnId}`), {
      status: newStatus,
    });
  };

  if (transactions.length === 0) {
    return <p className="text-sm text-gray-400">No withdrawal history for this user.</p>;
  }

  return (
    <div className="mt-4 max-h-80 overflow-y-auto text-sm border border-gray-700 rounded">
      <table className="w-full text-left">
        <thead className="bg-gray-800 text-gray-300">
          <tr>
            <th className="py-2 px-3">Amount</th>
            <th className="py-2 px-3">Method</th>
            <th className="py-2 px-3">Account</th>
            <th className="py-2 px-3">Status</th>
            <th className="py-2 px-3">Date</th>
          </tr>
        </thead>
        <tbody>
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
                  onChange={(e) => handleStatusChange(txn.id, e.target.value)}
                  className="bg-gray-800 text-white border border-gray-600 p-1 rounded text-sm"
                >
                  <option value="Pending">Pending</option>
                  <option value="Processing">Processing</option>
                  <option value="Approved">Approved</option>
                </select>
              </td>
              <td className="py-2 px-3 text-gray-400">
                {format(new Date(txn.createdAt), "PPPp")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}