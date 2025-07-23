import React, { useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "../../firebase";
import { useNavigate } from "react-router-dom";
import AdminLayout from "./AdminLayout";
import TestMilestonePanel from "./test/TestMilestonePanel";
import AdminChatManager from "./AdminChatManager";
import SystemMessageEditor from "./SystemMessageEditor";
import DistributeBonus from "./DistributeBonus";

export default function AdminDashboard() {
  const [tab, setTab] = useState("main");
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
    
      <div className="min-h-screen p-6 max-w-6xl mx-auto">
        <h1 className="text-center text-4xl sm:text-5xl font-bold text-gold200 mb-10">
          Admin Dashboard
        </h1>

        {/* Navigation Tabs */}
        <div className="flex gap-3 mb-8 overflow-x-auto scrollbar-hide px-2 sm:px-0">
          <div className="flex flex-nowrap mx-auto min-w-max space-x-3">
            <button
              onClick={() => setTab("main")}
              className={`whitespace-nowrap px-4 py-2 rounded ${
                tab === "main"
                  ? "bg-yellow-400 text-black"
                  : "bg-gray-700 text-white"
              }`}
            >
              User Search
            </button>
            <button
              onClick={() => setTab("chat")}
              className={`whitespace-nowrap px-4 py-2 rounded ${
                tab === "chat"
                  ? "bg-yellow-400 text-black"
                  : "bg-gray-700 text-white"
              }`}
            >
              Manage Chats
            </button>
            <button
              onClick={() => setTab("welcome")}
              className={`whitespace-nowrap px-4 py-2 rounded ${
                tab === "welcome"
                  ? "bg-yellow-400 text-black"
                  : "bg-gray-700 text-white"
              }`}
            >
              Edit Welcome Messages
            </button>
            <button
              onClick={() => setTab("bonuses")}
              className={`whitespace-nowrap px-4 py-2 rounded ${
                tab === "bonuses"
                  ? "bg-yellow-400 text-black"
                  : "bg-gray-700 text-white"
              }`}
            >
              Distribute Bonuses
            </button>
            {/* Add more tabs here if needed */}
          </div>
        </div>

        {/* Conditional Views */}
        {tab === "main" && (
          <>
            {/* <TestMilestonePanel /> */}

            {/* Search bar */}
            <div className="flex flex-col sm:flex-row items-center  gap-3 mb-8">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </>
        )}

        {tab === "chat" && <AdminChatManager />}
        {tab === "welcome" && <SystemMessageEditor />}
        {tab === "bonuses" && <DistributeBonus />}
      </div>
    
  );
}
