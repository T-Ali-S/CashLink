import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { ref, get } from "firebase/database";

export default function ReferralList() {
  const [referrals, setReferrals] = useState([]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    get(ref(db, "users")).then((snap) => {
      if (snap.exists()) {
        const all = snap.val();
        const referred = Object.entries(all)
          .filter(([_, u]) => u.referredBy === user.uid)
          .map(([uid, u]) => ({
            uid,
            ...u,
            completed: !!u.package,
          }));

        setReferrals(referred);
      }
    });
  }, []);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-yellow-300">Your Referrals</h3>
      {referrals.length > 0 ? (
        referrals.map((refUser) => (
          <div
            key={refUser.uid}
            className="bg-gray-700 p-4 rounded-lg flex items-center justify-between relative"
          >
            <div className="flex items-center gap-3">
              <img
                src={refUser.avatarUrl || "/avatars/default.png"}
                alt="avatar"
                className="w-12 h-12 rounded-full"
              />
              <div>
                <p className="text-white font-semibold">{refUser.name}</p>
                <p className="text-xs text-gray-400">{refUser.email}</p>
                <p className="text-xs text-blue-400">
                  Package: {refUser.package || "None"}
                </p>
              </div>
            </div>
            {refUser.completed && (
              <span className="absolute top-2 right-2 bg-green-600 text-xs px-2 py-1 rounded shadow text-white">
                Completed
              </span>
            )}
          </div>
        ))
      ) : (
        <p className="text-gray-400">You haven’t referred anyone yet.</p>
      )}
    </div>
  );
}