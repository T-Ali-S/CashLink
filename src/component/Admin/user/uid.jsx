import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ref, get, update } from "firebase/database";
import { db } from "../../../firebase";
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

    const snapshot = await get(ref(db, `users/${uid}`));
    if (!snapshot.exists()) return;

    const userData = snapshot.val();
    const currentBalance = userData.balance || 0;
    const newBalance =
      selectedPackage === "elite"
        ? currentBalance // no bonus immediately
        : currentBalance + selected.amount * 0.1;

    // 1. Update this user with package + balance
    await update(ref(db, `users/${uid}`), {
      package: selectedPackage,
      balance: newBalance,
    });

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
