import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { ref, get, update } from "firebase/database";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../Admin/AdminLayout";
import { RewardManager } from "../utils/RewardManager";

export default function StartWithNothing() {
  const [userData, setUserData] = useState(null);
  const [referralCounts, setReferralCounts] = useState({});
  const navigate = useNavigate();

  const packageOrder = ["bronze", "silver", "gold", "platinum", "elite"];
  const packageGoals = {
    bronze: { target: 10, reward: 5000 },
    silver: { target: 8, reward: 10000 },
    gold: { target: 5, reward: 15000 },
    platinum: { target: 3, reward: 20000 },
    elite: { target: 1, reward: 25000 },
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return navigate("/Signup");

    const loadProgress = async () => {
      const snap = await get(ref(db, `users/${user.uid}`));
      if (!snap.exists()) return;

      const userInfo = snap.val();
      const allUsersSnap = await get(ref(db, "users"));
      const allUsers = allUsersSnap.exists() ? allUsersSnap.val() : {};

      const usedStartRefs = Object.values(userInfo.usedReferrals || {}).flat();
      const usedPackageRefs = userInfo.usedPackageRefs || [];
      const allUsed = new Set([...usedStartRefs, ...usedPackageRefs]);

      const allReferrals = Object.entries(allUsers)
        .filter(([uid, u]) => u.referredBy === user.uid && u.package)
        .map(([uid, u]) => ({ uid, ...u }));

      const currentTier = userInfo.package || "";
      const packageTierIndex = packageOrder.indexOf(currentTier);

      const reconsumable = [];
      const remainingRefs = [];

      console.log("📦 Current package tier:", currentTier);
      console.log("🔁 All referrals:", allReferrals.map((r) => r.uid));
      console.log("🚫 All used (start + package):", [...allUsed]);
      console.log("📄 usedStartRefs before reconsume logic:", usedStartRefs);

      allReferrals.forEach((ref) => {
        const refTierIndex = packageOrder.indexOf(ref.package);
        const isUsedInPackage = usedPackageRefs.includes(ref.uid);
        const isUsedInStart = usedStartRefs.includes(ref.uid);

        if (!isUsedInPackage && refTierIndex >= packageTierIndex) {
          reconsumable.push(ref.uid);
        } else if (!isUsedInStart && !isUsedInPackage) {
          remainingRefs.push(ref);
        }
      });

      console.log("✅ Reconsumable referrals to migrate:", reconsumable);
      console.log(
        "🆕 Remaining valid referrals for StartWithNothing:",
        remainingRefs.map((r) => r.uid)
      );

      if (reconsumable.length > 0) {
        const updatedUsedReferrals = { ...userInfo.usedReferrals };
        for (const pkg in updatedUsedReferrals) {
          updatedUsedReferrals[pkg] = updatedUsedReferrals[pkg].filter(
            (id) => !reconsumable.includes(id)
          );
        }

        const updatedPackageRefs = [...usedPackageRefs, ...reconsumable];

        await update(ref(db, `users/${user.uid}`), {
          usedReferrals: updatedUsedReferrals,
          usedPackageRefs: updatedPackageRefs,
        });

        userInfo.usedReferrals = updatedUsedReferrals;
        userInfo.usedPackageRefs = updatedPackageRefs;
      }

      const counts = {};
      Object.keys(packageGoals).forEach((pkg) => {
        counts[pkg] = remainingRefs.filter((u) => u.package === pkg).length;
      });

      setUserData({ ...userInfo, uid: user.uid });
      setReferralCounts(counts);
    };

    loadProgress();
  }, []);

  const claimReward = async (pkg) => {
    const count = referralCounts[pkg];
    const goal = packageGoals[pkg].target;
    if (count < goal) return;

    const allUsersSnap = await get(ref(db, "users"));
    const allUsers = allUsersSnap.exists() ? allUsersSnap.val() : {};

    const used = Object.values(userData.usedReferrals || {}).flat();
    const usedPackageRefs = userData.usedPackageRefs || [];

    const newRefs = Object.entries(allUsers)
      .filter(
        ([uid, u]) =>
          u.referredBy === userData.uid &&
          u.package &&
          !used.includes(uid) &&
          !usedPackageRefs.includes(uid)
      )
      .slice(0, goal)
      .map(([uid]) => uid);

    await RewardManager.addMilestoneReward(
      userData.uid,
      pkg,
      packageGoals[pkg].reward
    );

    await update(ref(db, `users/${userData.uid}`), {
      [`usedReferrals/${pkg}`]: [
        ...(userData.usedReferrals?.[pkg] || []),
        ...newRefs,
      ],
    });

    alert(
      `🎉 You've earned Rs. ${packageGoals[pkg].reward} for ${pkg} referrals!`
    );

    setUserData((prev) => ({
      ...prev,
      usedReferrals: {
        ...(prev.usedReferrals || {}),
        [pkg]: [...(prev.usedReferrals?.[pkg] || []), ...newRefs],
      },
    }));

    setReferralCounts((prev) => ({ ...prev, [pkg]: 0 }));
  };

  return (
    <AdminLayout>
      <div className="max-w-3xl mx-auto py-10 px-4 text-white">
        <h2 className="text-3xl font-bold text-center mb-8 text-yellow-300">
          Start With Nothing
        </h2>
        <p className="text-center text-sm text-gray-400 mb-6">
          Invite users with your referral code. Earn rewards when they buy
          packages.
        </p>

        {userData && (
          <div className="bg-white rounded-lg p-4 mb-6 shadow text-center">
            <h3 className="text-2xl font-bold text-black mb-1">
              Your Referral Code
            </h3>
            <p className="text-xl font-bold text-gold100 font-mono mb-2">
              {userData.referralCode}
            </p>
            <h4 className="text-sm text-gray-600 mb-1">Your Invite Link</h4>
            <div className="flex justify-center items-center gap-2 flex-wrap">
              <span className="text-sm bg-gray-700 px-4 py-1 rounded-md font-mono text-white">
                {`${window.location.origin}/Signup?ref=${userData.referralCode}`}
              </span>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    `${window.location.origin}/Signup?ref=${userData.referralCode}`
                  )
                }
                className="bg-green-600 hover:bg-green-500 text-white text-sm px-3 py-1 rounded"
              >
                Copy
              </button>
            </div>
          </div>
        )}

        {Object.entries(packageGoals).map(([pkg, data]) => {
          const current = referralCounts[pkg] || 0;
          const progress = Math.min((current / data.target) * 100, 100);
          const completed = current >= data.target;

          return (
            <div
              key={pkg}
              className="bg-gray-800 rounded-lg p-4 mb-6 shadow relative"
            >
              <h4 className="font-bold capitalize text-lg mb-2">
                {pkg} Package
              </h4>
              <p className="text-sm text-gray-300 mb-1">
                {current}/{data.target} referrals | Reward: Rs. {data.reward}
              </p>
              <div className="h-3 bg-gray-600 rounded">
                <div
                  className={`h-full transition-all duration-500 ${
                    completed ? "bg-green-500" : "bg-blue-400"
                  }`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              {completed && (
                <button
                  className="absolute top-4 right-4 bg-green-700 hover:bg-green-600 text-white px-4 py-1 text-sm rounded"
                  onClick={() => claimReward(pkg)}
                >
                  Claim Rs. {data.reward}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </AdminLayout>
  );
}
