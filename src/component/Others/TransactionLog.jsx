import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { ref, onValue } from "firebase/database";
import { format } from "date-fns";
import AdminLayout from "../Admin/AdminLayout";

export default function TransactionLog() {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const txnRef = ref(db, `withdrawals/${user.uid}`);
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
  }, []);

  return (
    // <AdminLayout>
    <div className="max-w-5xl mx-auto p-6 text-white ">
      <h2 className="text-2xl font-bold text-yellow-400 mb-4">
        Transaction History
      </h2>

      {transactions.length === 0 ? (
        <p className="text-sm text-gray-400">No withdrawals yet.</p>
      ) : (
        <div className="overflow-x-auto">
          {/* Mobile View (Cards) */}
          <div className="md:hidden space-y-4">
            {transactions.map((txn) => (
              <div key={txn.id} className="bg-gray-800 p-4 rounded shadow">
                <div className="flex justify-between mb-2">
                  <span className="font-bold text-green-400">
                    Rs. {txn.amount}
                  </span>
                  <span
                    className={`font-semibold ${
                      txn.status === "Pending"
                        ? "text-yellow-400"
                        : txn.status === "Processing"
                        ? "text-blue-400"
                        : "text-green-500"
                    }`}
                  >
                    {txn.status}
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  Method: <span className="capitalize">{txn.method}</span>
                </p>
                <p className="text-sm text-gray-300">
                  Account: {txn.accountNumber}
                </p>
                <p className="text-xs text-gray-400 mt-2">
                  {format(new Date(txn.createdAt), "PPPp")}
                </p>
              </div>
            ))}
          </div>

          {/* Desktop View (Table) */}
          <div className="hidden md:block overflow-x-auto mt-4">
            <table className="min-w-[600px] w-full text-left text-sm border border-gray-700">
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
                  <tr
                    key={txn.id}
                    className="border-t border-gray-700 bg-gray-500 hover:bg-gray-800"
                  >
                    <td className="py-2 px-3 font-medium text-green-400">
                      Rs. {txn.amount}
                    </td>
                    <td className="py-2 px-3 capitalize">{txn.method}</td>
                    <td className="py-2 px-3 font-mono">{txn.accountNumber}</td>
                    <td
                      className={`py-2 px-3 font-semibold ${
                        txn.status === "Pending"
                          ? "text-yellow-400"
                          : txn.status === "Processing"
                          ? "text-blue-400"
                          : "text-green-500"
                      }`}
                    >
                      {txn.status}
                    </td>
                    <td className="py-2 px-3 text-gray-800">
                      {format(new Date(txn.createdAt), "PPPp")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
    // </AdminLayout>
  );
}
