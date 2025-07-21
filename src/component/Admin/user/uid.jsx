import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { ref, get, update, push } from "firebase/database";
import { db } from "../../../firebase";
import TransactionAdminView from "../user/TransactionAdminView";
import { runTransaction } from "firebase/database";
import { AlertContext } from "../../context/AlertContext";
import { useNavigate } from "react-router-dom";
import { IoIosArrowBack } from "react-icons/io";
import AdminLayout from "/Work/My own/Project/Frontend/Pyramid/src/component/Admin/AdminLayout";
import { SiPantheon } from "react-icons/si";
import ReferralProgressBar from "../../Admin/ReferralProgressBar";
import {
  expireMilestoneIfOverdue,
  checkAndUnlockMilestone,
} from "../../utils/milestoneManager";

export default function ManageUser() {
  const { uid } = useParams();
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPackage, setSelectedPackage] = useState("");
  const [referrals, setReferrals] = useState([]);
  const [referredByUser, setReferredByUser] = useState(null);
  const { setAlert } = useContext(AlertContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      const snapshot = await get(ref(db, `users/${uid}`));
      await expireMilestoneIfOverdue(uid);
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
        // ✅ Trigger milestone check passively when admin views profile
        await checkAndUnlockMilestone(uid);
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
    const tierOrder = ["bronze", "silver", "gold", "platinum", "elite"];
    const referralQuotas = {
      bronze: 5,
      silver: 3,
      gold: 2,
      platinum: 2,
      elite: 1,
    };
    const tierAmount = {
      bronze: 3000,
      silver: 5000,
      gold: 10000,
      platinum: 50000,
      elite: 100000,
    };
    const bonusValues = {
      silver: 1000,
      gold: 2000,
      platinum: 10000,
      elite: 20000,
    };

    const selected = selectedPackage;
    const packageAmount = tierAmount[selected];
    if (!packageAmount) {
      return setAlert({
        visible: true,
        type: "error",
        message: "Please select a valid package.",
      });
    }

    // Load user data
    const snapshot = await get(ref(db, `users/${uid}`));
    if (!snapshot.exists()) return;
    const userData = snapshot.val();

    // ❌ Prevent reassignment of different package if current milestone not completed
    if (
      userData.package &&
      userData.package !== selected &&
      !userData?.milestones?.[userData.package]?.rewarded
    ) {
      return setAlert({
        visible: true,
        type: "error",
        message: `❌ User already has "${userData.package}" active and it's not completed.`,
      });
    }

    // 🎯 Set up milestone and reward logic
    const roiRate =
      selected === "elite" ? Math.floor(Math.random() * 3) + 1 : 10;
    const dailyROI = (packageAmount * roiRate) / 100;
    const firstReward = selected === "elite" ? dailyROI : dailyROI;
    const rewardPercent = roiRate / 100;
    const duration = selected === "elite" ? 30 : 20;
    const deadline = Date.now() + duration * 24 * 60 * 60 * 1000;

    const updatedMilestone = {
      goal: referralQuotas[selected],
      earned: 0,
      rewarded: false,
      deadline,
      lockedBonus: 0,
      lockedROI: selected === "elite" ? dailyROI : 0,
    };

    const eliteRate = selected === "elite" ? roiRate : null;
    const eliteLocked = selected === "elite";

    const newBalance = (userData.balance || 0) + firstReward;
    const newWithdrawable = firstReward;

    // 🔒 Track referrals used for this package
    const allUsersSnap = await get(ref(db, "users"));
    const allUsers = allUsersSnap.exists() ? allUsersSnap.val() : {};
    const previouslyConsumed = userData.usedPackageRefs || [];

    const referrals = Object.entries(allUsers)
      .filter(([refId, u]) => u.referredBy === uid && u.package)
      .map(([refId, u]) => ({ uid: refId, ...u }));
    const availableRefs = referrals.filter(
      (ref) => !previouslyConsumed.includes(ref.uid)
    );
    const refsToConsume = availableRefs
      .slice(0, referralQuotas[selected])
      .map((u) => u.uid);

    // ✅ Update user record
    await update(ref(db, `users/${uid}`), {
      package: selected,
      balance: newBalance,
      withdrawable: newWithdrawable,
      eliteDailyROI: eliteLocked ? dailyROI : null,
      eliteRate,
      eliteLocked,
      lastPayoutAt: Date.now(),
      milestones: {
        ...userData.milestones,
        [selected]: updatedMilestone,
      },
      usedPackageRefs: [...previouslyConsumed, ...refsToConsume],
    });

    // 🎁 Referral bonus for referrer (if eligible)
    if (userData.referredBy) {
      const refSnap = await get(ref(db, `users/${userData.referredBy}`));
      if (refSnap.exists()) {
        const refData = refSnap.val();
        const refTierIndex = tierOrder.indexOf(refData.package);
        const newTierIndex = tierOrder.indexOf(selected);

        if (
          newTierIndex >= refTierIndex && // ✅ Still count toward milestone
          newTierIndex > refTierIndex && // 🧠 Only assign bonus for upward-tier
          refTierIndex !== -1
        ) {
          const bonus = bonusValues[selected] || 0;
          const refMilestone = refData.milestones?.[refData.package] || {};
          await update(ref(db, `users/${userData.referredBy}`), {
            bonusLocked: (refData.bonusLocked || 0) + bonus,
            milestones: {
              ...refData.milestones,
              [refData.package]: {
                ...refMilestone,
                earned: (refMilestone.earned || 0) + 1,
              },
            },
          });
        }

        await checkAndUnlockMilestone(userData.referredBy);
      }
    }

    // 📈 Update investment tracker
    await runTransaction(ref(db, "liveTracker/total"), (prev) => {
      return (prev || 0) + packageAmount;
    });

    // 🎯 Trigger milestone unlock for current user
    await checkAndUnlockMilestone(uid);

    // ✅ Confirmation
    setUserInfo((prev) => ({
      ...prev,
      package: selected,
      balance: newBalance,
    }));
    setAlert({
      visible: true,
      type: "success",
      message:
        `✅ ${userData.name} assigned "${selected}" and rewarded Rs. ${firstReward}.\n` +
        `${refsToConsume.length} referral${
          refsToConsume.length === 1 ? "" : "s"
        } used to unlock milestone progress.`,
    });
  };

  if (loading) return <p className="p-6">Loading user info...</p>;

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 md:px-8 lg:px-10 max-w-3xl mx-auto">
        <h2 className="text-2xl text-white font-bold mb-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 px-2 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
          >
            <IoIosArrowBack />
          </button>{" "}
          Managing:{" "}
          <span className="text-gold200">
            {userInfo.name.toUpperCase() || "No username found"}
          </span>
        </h2>

        <p className="text-white text-sm">Email: {userInfo.email}</p>
        <p className="mb-4 text-xs text-gold200">UID: {uid}</p>

        <div className="mt-4">
          <h4 className="font-semibold text-white">
            Current Package: {""}
            <span className="text-xl text-gold200 font-bold">
              {userInfo?.package
                ? userInfo.package.charAt(0).toUpperCase() +
                  userInfo.package.slice(1)
                : "None"}
            </span>
          </h4>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center mt-4">
            <select
              className="p-2 border rounded w-full sm:w-auto text-black"
              value={selectedPackage}
              onChange={(e) => setSelectedPackage(e.target.value)}
            >
              <option value="">-- Select Package --</option>
              <option value="bronze">Bronze</option>
              <option value="silver">Silver</option>
              <option value="gold">Gold</option>
              <option value="platinum">Platinum</option>
              <option value="elite">Elite</option>
            </select>
            <button
              className="bg-gold200 text-white px-4 py-2 rounded hover:bg-yellow-500 w-full sm:w-auto"
              onClick={assignPackage}
            >
              Assign Package
            </button>
          </div>

          <hr className="mt-10" />
          <h4 className="text-2xl text-center font-bold mt-6 mb-6 text-yellow-400">
            Withdrawal Requests
          </h4>
          <div
          //  className="border border-1 p-20 border-white border-rounded"
          >
            {userInfo && <TransactionAdminView userId={uid} />}
          </div>

          <hr className="mt-10" />
          <div className="mt-8 bg-white p-4 rounded shadow mb-5">
            <h3 className="text-2xl text-center font-bold  mb-6 text-yellow-400">
              Referral Info
            </h3>

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

            <h4 className="text-center text-yellow-400 text-2xl font-semibold mb-1">
              Users Referred:
            </h4>
            {referrals.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-gray-700 max-h-[300px] overflow-auto pr-2">
                {referrals.map(([refUid, u]) => (
                  <li key={refUid}>
                    {u.name} ({u.email})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">
                No referrals by this user.
              </p>
            )}
          </div>
          {userInfo?.milestones?.[userInfo.package] && (
            <ReferralProgressBar
              milestone={userInfo.milestones[userInfo.package]}
              referrals={referrals}
            />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
