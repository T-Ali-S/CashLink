import React, { useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";

export default function AdminDashboard() {
  const [query, setQuery] = useState("");
  const [userResults, setUserResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    setLoading(true);
    const snapshot = await get(ref(db, "users"));
    const users = snapshot.exists() ? snapshot.val() : {};
    const filtered = Object.entries(users).filter(
      ([uid, user]) =>
        user.email.toLowerCase().includes(query.toLowerCase()) ||
        user.name.toLowerCase().includes(query.toLowerCase())
    );
    setUserResults(filtered);
    setLoading(false);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen p-6">
        <h1 className="text-3xl text-white font-bold mb-6">Admin Dashboard</h1>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username or email"
            className="p-2 rounded border text-black w-full"
          />
          <button
            onClick={handleSearch}
            className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800"
          >
            Search
          </button>
        </div>

        {loading ? (
          <p>Searching...</p>
        ) : userResults.length > 0 ? (
          <div className="space-y-4">
            {userResults.map(([uid, user]) => (
              <div
                key={uid}
                className="bg-white p-4 shadow rounded flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-gray-100 cursor-pointer"
                onClick={() => navigate(`/admin/user/${uid}`)}
                // onClick={() => navigate(`/admin/user/uid`)}
              >
                <div>
                  <img
                    src={user.avatarUrl || "/avatars/default.png"}
                    alt="avatar"
                    className=" w-10 h-10 rounded-full border mr-4"
                  />
                  <p className=" font-bold text-black">{user.name.toUpperCase()}</p>
                  <p className=" text-sm text-gray-600">{user.email}</p>
                </div>
                <span className=" text-xs text-gray-500 font-mono break-all">
                  UID: {uid}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gold100">No users found.</p>
        )}
      </div>
    </AdminLayout>
  );
}
