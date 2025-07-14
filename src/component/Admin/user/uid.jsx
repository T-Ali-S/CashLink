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
      platinum: { amount: 50000, requiredReferrals: 1 },
      elite: { amount: 100000, requiredReferrals: 0, dailyROI: 0.05 },
    };

    const selected = packageValues[selectedPackage];
    if (!selected) {
      setAlert({
        visible: true,
        type: "error",
        message: "Please select a valid package.",
      });
      return;
    }

    const packageAmount = selected.amount;

    const snapshot = await get(ref(db, `users/${uid}`));
    if (!snapshot.exists()) return;

    const userData = snapshot.val();
    const allUsersSnap = await get(ref(db, "users"));
    const allUsers = allUsersSnap.exists() ? allUsersSnap.val() : {};

    const tierOrder = ["bronze", "silver", "gold", "platinum", "elite"];

    const currentTierIndex = tierOrder.indexOf(userData.package);
    const selectedTierIndex = tierOrder.indexOf(selectedPackage);

    // ✅ Block any assignment if the current package is not completed
    if (
      userData.package && // A package is already active
      userData.package !== selectedPackage // Prevent reassignment of same package
    ) {
      const milestoneComplete =
        userData?.milestones?.[userData.package]?.rewarded || false;

      if (!milestoneComplete) {
        return setAlert({
          visible: true,
          type: "error",
          message: `❌ User already has "${userData.package}" active and it's not completed.\nComplete the current milestone before assigning "${selectedPackage}".`,
        });
      }
    }

    const referrals = Object.entries(allUsers)
      .filter(([refId, u]) => u.referredBy === uid && u.package)
      .map(([refId, u]) => ({ uid: refId, ...u }));

    const previouslyConsumed = userData.usedPackageRefs || [];

    const availableRefs = referrals.filter(
      (ref) => !previouslyConsumed.includes(ref.uid)
    );

    const refsToConsume = availableRefs
      .slice(0, selected.requiredReferrals)
      .map((u) => u.uid);
    if (userData.package === selectedPackage) {
      return setAlert({
        visible: true,
        type: "error",
        message: `⚠️ "${selectedPackage}" is already assigned to this user.`,
      });
    }
    const currentBalance = userData.balance || 0;
    // const userAlreadyHasPackage = userData.package === selectedPackage;

    const isElite = selectedPackage === "elite";
    const rewardPercent = isElite ? 0.05 : 0.1;
    const firstReward = selected.amount * rewardPercent;

    // 💰 User gets this as initial balance + withdrawable
    const newBalance = (userData.balance || 0) + firstReward;

    // 📤 For elite: all earnings are withdrawable immediately
    // 🛑 For other users: only the first reward is withdrawable, rest unlocks via referrals
    const newWithdrawable = isElite ? newBalance : firstReward;

    await update(ref(db, `users/${uid}`), {
      package: selectedPackage,
      [`milestones/${selectedPackage}/rewarded`]: false,
      usedPackageRefs: [...previouslyConsumed, ...refsToConsume],
    });

    await RewardManager.addPackageReward(uid, selectedPackage, firstReward);

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

        if (
          qualifyingReferrals.length >= threshold &&
          selectedPackage !== "elite"
        ) {
          console.log(
            `🔒 Referrer qualifies for milestone — handled in StartWithNothing`
          );
          // No immediate bonus — user will claim milestone manually
        }
      }
    }

    setUserInfo((prev) => ({
      ...prev,
      package: selectedPackage,
      balance: newBalance,
    }));
    setAlert({
      visible: true,
      type: "success",
      message: `✅ ${userData.name} assigned "${selectedPackage}" and rewarded Rs. ${firstReward}`,
    });

    // alert(`✅ ${userData.name} assigned "${selectedPackage}" and rewarded Rs. ${firstReward}`);
    setAlert({
      visible: true,
      type: "success",
      message:
        `✅ ${userData.name} assigned "${selectedPackage}" and rewarded Rs. ${firstReward}.\n` +
        `${refsToConsume.length} referral${
          refsToConsume.length === 1 ? "" : "s"
        } used to unlock milestone progress.`,
    });

    // alert(
    //   `✅ ${userData.name} assigned "${selectedPackage}" and rewarded Rs. ${firstReward}.\n` +
    //     `${refsToConsume.length} referral${
    //       refsToConsume.length === 1 ? "" : "s"
    //     } used to unlock milestone progress.`
    // );
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
        </button>
          {" "}Managing:{" "}
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
        </div>
      </div>
    </AdminLayout>
  );
}
