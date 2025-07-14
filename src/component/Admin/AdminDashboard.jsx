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
        user.email?.toLowerCase().includes(query.toLowerCase()) ||
        user.name?.toLowerCase().includes(query.toLowerCase())
    );
    setUserResults(filtered);
    setLoading(false);
  };

  return (
    <AdminLayout>
      <div className="min-h-screen p-6 max-w-5xl mx-auto">
        <h1 className="text-center text-4xl sm:text-5xl font-bold text-gold200 mb-10">
          Admin Dashboard
        </h1>

        {/* Search bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-8">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username or email"
            className="w-full sm:w-2/3 p-3 rounded-md border border-gray-300 text-black focus:outline-none focus:ring-2 focus:ring-gold200"
          />
          <button
            onClick={handleSearch}
            className="bg-gold200 hover:bg-yellow-400 transition text-white font-semibold px-6 py-2 rounded-md w-full sm:w-auto"
          >
            Search
          </button>
        </div>

        {/* Results */}
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          {loading ? (
            <p className="text-gray-600 text-center text-lg sm:text-2xl py-10">
              Searching...
            </p>
          ) : userResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ">
              {userResults.map(([uid, user]) => (
                <div
                  key={uid}
                  className="flex items-start gap-4 p-4 rounded-lg border hover:shadow-md cursor-pointer transition hover:bg-gray-100"
                  onClick={() => navigate(`/admin/user/${uid}`)}
                >
                  <img
                    src={user.avatarUrl || "/avatars/default.png"}
                    alt="avatar"
                    className="w-12 h-12 rounded-full border object-cover"
                  />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-lg font-semibold text-gold200 truncate">
                      {user.name?.toUpperCase() || "No Name"}
                    </p>
                    <p className="text-sm text-gray-500 truncate">
                      {user.email}
                    </p>
                    <p className="text-xs text-gray-400 font-mono break-all truncate">
                      UID: {uid}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center text-lg sm:text-2xl py-10">
              No users found.
            </p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
