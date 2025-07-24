import React, { useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue, update, get, remove } from "firebase/database";
import { format } from "date-fns";
import { useAdminTab } from "../context/AdminTabContext";

export default function AdminAllWithdrawals() {
  const [transactions, setTransactions] = useState([]);
  const [userMap, setUserMap] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedTxn, setSelectedTxn] = useState(null);
  const { transactionFilter } = useAdminTab();
  const [filter, setFilter] = useState(transactionFilter || "All");

  useEffect(() => {
    const fetchData = async () => {
      const txnRef = ref(db, "withdrawals");
      const userRef = ref(db, "users");

      const txnSnap = await get(txnRef);
      const userSnap = await get(userRef);

      const allTxns = [];
      const users = userSnap.exists() ? userSnap.val() : {};

      const userMapTemp = {};
      for (const uid in users) {
        const { name, email } = users[uid];
        userMapTemp[uid] = { name, email };
      }

      if (txnSnap.exists()) {
        const data = txnSnap.val();
        for (const userId in data) {
          const userTxns = data[userId];
          for (const txnId in userTxns) {
            allTxns.push({
              id: txnId,
              userId,
              ...userTxns[txnId],
            });
          }
        }

        allTxns.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      }

      setUserMap(userMapTemp);
      setTransactions(allTxns);
    };

    fetchData();
  }, []);

  const handleStatusChange = (txn, newStatus) => {
    if (
      (txn.status === "Pending" || txn.status === "Processing") &&
      newStatus === "Cancelled"
    ) {
      setSelectedTxn({ ...txn, newStatus });
      setShowModal(true);
    } else {
      update(ref(db, `withdrawals/${txn.userId}/${txn.id}`), {
        status: newStatus,
      });

      setTransactions((prev) =>
        prev.map((t) =>
          t.userId === txn.userId && t.id === txn.id
            ? { ...t, status: newStatus }
            : t
        )
      );
    }
  };

  const handleRefund = async (shouldRefund) => {
    if (!selectedTxn) return;

    const txnRef = ref(
      db,
      `withdrawals/${selectedTxn.userId}/${selectedTxn.id}`
    );
    const userRef = ref(db, `users/${selectedTxn.userId}`);

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

    await remove(txnRef);

    setTransactions((prev) =>
      prev.filter(
        (t) => !(t.userId === selectedTxn.userId && t.id === selectedTxn.id)
      )
    );

    setShowModal(false);
    setSelectedTxn(null);
  };

  const filteredTransactions =
    filter === "All"
      ? transactions
      : transactions.filter((t) => t.status === filter);


  return (
    <div className="mt-4 text-sm border border-gray-700 rounded p-4">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <label className="text-gray-600 font-medium">
          <span className="text-white text-lg">Filter by Status:</span>
          <select
            className="ml-2 px-2 py-1 border border-gray-400 rounded text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Processing">Processing</option>
            <option value="Approved">Approved</option>
          </select>
        </label>
      </div>

      {filteredTransactions.length === 0 ? (
        <p className="text-sm text-center text-gray-400">
          No transactions to show.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full w-full text-left shadow-sm">
            <thead className="bg-gray-800 text-gray-300">
              <tr>
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3">Amount</th>
                <th className="py-2 px-3">Method</th>
                <th className="py-2 px-3">Account</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredTransactions.map((txn) => (
                <tr
                  key={`${txn.userId}_${txn.id}`}
                  className="border-t border-gray-700"
                >
                  <td className="py-2 px-3 text-gray-800 font-medium">
                    {userMap[txn.userId]?.name || "Unknown"}
                  </td>
                  <td className="py-2 px-3 text-gray-600">
                    {userMap[txn.userId]?.email || "Unknown"}
                  </td>
                  <td className="py-2 px-3 text-green-500 font-semibold">
                    Rs. {txn.amount}
                  </td>
                  <td className="py-2 px-3 text-black capitalize">
                    {txn.method}
                  </td>
                  <td className="py-2 px-3 text-black font-mono">
                    {txn.accountNumber}
                  </td>
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
                  <td className="py-2 px-3 text-gray-400 whitespace-nowrap">
                    {format(new Date(txn.createdAt), "PPPp")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-gray-300 p-6 rounded shadow-lg max-w-sm">
            <h2 className="text-lg font-semibold mb-4 text-gold200">
              Refund Balance?
            </h2>
            <p className="mb-4 text-black">
              Do you want to return Rs. {selectedTxn?.amount} back to the user's
              balance & withdrawable?
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
