import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ref, get, update, push } from "firebase/database";
import { db } from "../../../firebase";
import TransactionAdminView from "../user/TransactionAdminView";
import { runTransaction } from "firebase/database";
import AdminLayout from "/Work/My own/Project/Frontend/Pyramid/src/component/Admin/AdminLayout";

export default function ManageUser() {
  const { uid } = useParams();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [referrals, setReferrals] = useState([]);
  const [referredByUser, setReferredByUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const snapshot = await get(ref(db, `users/${uid}`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        setUserInfo(data);
        setSelectedPackage(data.package || "");

        // Load who referred this user
        if (data.referredBy) {
          const referrerSnap = await get(ref(db, `users/${data.referredBy}`));
          if (referrerSnap.exists()) {
            setReferredByUser(referrerSnap.val());
          }
        }

        // Load users they referred
        const allUsersSnap = await get(ref(db, `users`));
        if (allUsersSnap.exists()) {
          const allUsers = allUsersSnap.val();
          const referred = Object.entries(allUsers).filter(
            ([id, u]) => u.referredBy === uid && u.package
          );
          setReferrals(referred);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, [uid]);

  const sendToAllUsers = async (subject, message) => {
    const usersSnap = await get(ref(db, "users"));
    if (!usersSnap.exists()) return;

    const allUsers = usersSnap.val();
    const now = Date.now();

    for (const [uid] of Object.entries(allUsers)) {
      const newNotification = {
        subject,
        message,
        timestamp: now,
        read: false,
      };
      await push(ref(db, `notifications/${uid}`), newNotification);
    }

    console.log("📣 Notifications sent to all users.");
  };

  const assignPackage = async () => {
    const packageValues = {
      bronze: { amount: 3000, requiredReferrals: 3 },
      silver: { amount: 6000, requiredReferrals: 3 },
      gold: { amount: 10000, requiredReferrals: 2 },
      platinum: { amount: 25000, requiredReferrals: 1 },
      elite: { amount: 100000, requiredReferrals: 0, dailyROI: 0.05 },
    };

    const selected = packageValues[selectedPackage];
    if (!selected) {
      alert("Please select a valid package.");
      return;
    }

    const packageAmount = selected.amount;

    const snapshot = await get(ref(db, `users/${uid}`));
    if (!snapshot.exists()) return;

    const userData = snapshot.val();
    if (userData.package === selectedPackage) {
      return alert("This package is already assigned to the user.");
    }
    const currentBalance = userData.balance || 0;
    const newBalance =
      selectedPackage === "elite"
        ? currentBalance // no bonus immediately
        : currentBalance + selected.amount * 0.1;

    await update(ref(db, `users/${uid}`), {
      package: selectedPackage,
      balance: newBalance,
    });

    const trackerSnap = await get(ref(db, "liveTracker"));
    const tracker = trackerSnap.exists() ? trackerSnap.val() : null;

    const totalSnap = await get(ref(db, "liveTracker/total"));

    await runTransaction(ref(db, "liveTracker/total"), (prev) => {
      return (prev || 0) + packageAmount;
    });

    if (trackerSnap.exists()) {
      const totalSnap = await get(ref(db, "liveTracker/total"));
      const updatedTotal = totalSnap.exists() ? totalSnap.val() : 0;

      const goalEnd = tracker.goalEnd || 200000000;
      console.log(
        "🏁 Assigning package:",
        selectedPackage,
        "Amount:",
        packageAmount
      );
      console.log(
        "🧮 Before update: current total =",
        tracker.total,
        "→ new total =",
        updatedTotal
      );

      if (updatedTotal >= goalEnd) {
        const newStart = goalEnd;
        const newEnd = newStart + 50000000;

        await sendToAllUsers(
          "🎯 Investment Goal Reached!",
          `Congratulations! The community just crossed Rs. ${goalEnd.toLocaleString()} in total investments! You’ll receive a special bonus soon.`
        );

        await update(ref(db, "liveTracker"), {
          total: updatedTotal,
          goalStart: newStart,
          goalEnd: newEnd,
          lastGoalAchievedAt: Date.now(),
        })
          .then(() => console.log("✅ Tracker total updated!"))
          .catch((err) => console.error("🔥 Update failed:", err));

        console.log(`🎯 New goal set: Rs. ${newStart} to Rs. ${newEnd}`);
      } else {
        await update(ref(db, "liveTracker"), {
          total: updatedTotal,
        });
      }
    }

    // 2. If referred, check if their referrer qualifies for reward
    if (userData.referredBy && selectedPackage !== "elite") {
      const referrerSnap = await get(ref(db, `users/${userData.referredBy}`));
      if (referrerSnap.exists()) {
        const referrer = referrerSnap.val();
        const allUsersSnap = await get(ref(db, "users"));
        const allUsers = allUsersSnap.exists() ? allUsersSnap.val() : {};

        const qualifyingReferrals = Object.values(allUsers).filter(
          (u) => u.referredBy === userData.referredBy && u.package
        );

        const threshold = selected.requiredReferrals;

        if (qualifyingReferrals.length >= threshold) {
          const bonus = selected.amount * 0.1;
          const referrerBalance = referrer.balance || 0;

          await update(ref(db, `users/${userData.referredBy}`), {
            balance: referrerBalance + bonus,
          });
          await sendNotification(
            userData.referredBy,
            "💰 Bonus Earned!",
            `You've earned Rs. ${bonus} because ${userData.name} activated their ${selectedPackage} package.`
          );

          console.log(
            `✅ Referrer ${referrer.name} rewarded with Rs. ${bonus}`
          );
        }
      }
    }

    setUserInfo((prev) => ({
      ...prev,
      package: selectedPackage,
      balance: newBalance,
    }));

    alert(
      `✅ ${userData.name} assigned "${selectedPackage}" and rewarded Rs. ${
        selected.amount * 0.1
      }`
    );
  };

  if (loading) return <p className="p-6">Loading user info...</p>;

  return (
    <AdminLayout>
      <h2 className="text-2xl text-white font-bold mb-4">
        Managing:{" "}
        <span className="text-gold200">
          {userInfo.name.toUpperCase() || "No username found"}
        </span>
      </h2>

      <p className="text-white">Email: {userInfo.email}</p>
      <p className="mb-4 text-sm text-gold200">UID: {uid}</p>

      <div className="mt-4">
        <h4 className="font-semibold text-white">
          Current Package: {userInfo.package || "None"}
        </h4>

        <select
          className="mt-2 p-2 border rounded text-black"
          value={selectedPackage}
          onChange={(e) => setSelectedPackage(e.target.value)}
        >
          <option value="">-- Select Package --</option>
          <option value="bronze">Bronze</option>
          <option value="silver">Silver</option>
          <option value="gold">Gold</option>
          <option value="platinum">Platinum</option>
        </select>

        <button
          className="ml-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
          onClick={assignPackage}
        >
          Assign Package
        </button>

        <h4 className="text-lg font-bold mt-6 text-yellow-400">
          Withdrawal Requests
        </h4>

        {userInfo && <TransactionAdminView userId={uid} />}

        <div className="mt-8 bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-2">Referral Info</h3>

          {referredByUser ? (
            <p className="text-sm text-gray-600 mb-2">
              Referred By:{" "}
              <span className="font-medium">{referredByUser.name}</span>
            </p>
          ) : (
            <p className="text-sm text-gray-500 mb-2">
              This user was not referred by anyone.
            </p>
          )}

          <h4 className="text-sm font-semibold mb-1">Users Referred:</h4>
          {referrals.length > 0 ? (
            <ul className="list-disc list-inside text-sm text-gray-700">
              {referrals.map(([refUid, u]) => (
                <li key={refUid}>
                  {u.name} ({u.email})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No referrals by this user.</p>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
