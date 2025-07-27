import { useState, useEffect } from "react";
import { ref, get } from "firebase/database";
import { db } from "../../../firebase";

export default function useMilestoneStatus(uid, pkg) {
  const [status, setStatus] = useState({
    loading: true,
    rewarded: false,
    lockedROI: 0,
    lockedBonus: 0,
    deadline: null,
    earned: 0,
    goal: 0,
    expired: false,
    referralsNeeded: 0,
    progressRatio: 0,
    timeLeft: null,
    statusText: "⏳ Checking...",
    tooltip: "Milestone data is loading...",
  });

  const referralQuotas = {
    bronze: 5,
    silver: 3,
    gold: 2,
    platinum: 2,
    elite: 1,
  };

  const tierOrder = ["bronze", "silver", "gold", "platinum", "elite"];
  const bonusValues = {
    silver: 1000,
    gold: 2000,
    platinum: 10000,
    elite: 20000,
  };

  useEffect(() => {
    const fetchMilestone = async () => {
      if (!uid || !pkg) return;
      const userSnap = await get(ref(db, `users/${uid}`));
      if (!userSnap.exists()) return;

      const user = userSnap.val();
      const milestone = user?.milestones?.[pkg] || {};
      const now = Date.now();
      const deadline = milestone.deadline || 0;
      const timeLeftMs = deadline - now;
      const timeLeftDays = timeLeftMs > 0 ? Math.ceil(timeLeftMs / (1000 * 60 * 60 * 24)) : 0;
      const expired = deadline && timeLeftMs < 0;

      const allSnap = await get(ref(db, "users"));
      const allUsers = allSnap.exists() ? allSnap.val() : {};

      const referrals = Object.entries(allUsers)
        .filter(([refId, u]) => u.referredBy === uid && u.package)
        .map(([refId, u]) => ({ uid: refId, ...u }));

      const userTierIdx = tierOrder.indexOf(pkg);
      const quota = referralQuotas[pkg];

      let earned = 0;
      let bonus = 0;

      for (const ref of referrals) {
        const refTierIdx = tierOrder.indexOf(ref.package);
        if (refTierIdx < userTierIdx) continue;
        earned++;
        if (refTierIdx > userTierIdx) {
          bonus += bonusValues[ref.package] || 0;
        }
      }

      const referralsNeeded = Math.max(quota - earned, 0);
      const progressRatio = quota > 0 ? earned / quota : 0;

      let statusText = "⏳ Pending";
      let tooltip = "Milestone is in progress.";
      if (expired) {
        statusText = "⛔ Expired";
        tooltip = "Milestone deadline has passed.";
      } else if (milestone.rewarded) {
        statusText = "✅ Fulfilled";
        tooltip = "Milestone is completed and rewards are unlocked.";
      }

      setStatus({
        loading: false,
        rewarded: milestone.rewarded || false,
        lockedROI: milestone.lockedROI || 0,
        lockedBonus: milestone.lockedBonus || 0,
        deadline,
        earned,
        goal: quota,
        expired,
        referralsNeeded,
        progressRatio,
        timeLeft: timeLeftDays,
        statusText,
        tooltip,
      });
    };

    fetchMilestone();
    const interval = setInterval(fetchMilestone, 10000);
    return () => clearInterval(interval);
  }, [uid, pkg]);

  return status;
}
