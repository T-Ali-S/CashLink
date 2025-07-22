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

  useEffect(() => {
    const fetchMilestone = async () => {
      if (!uid || !pkg) return;
      const snap = await get(ref(db, `users/${uid}/milestones/${pkg}`));
      if (!snap.exists()) {
        setStatus((prev) => ({ ...prev, loading: false }));
        return;
      }

      const data = snap.val();
      const now = Date.now();
      const deadline = data.deadline || 0;
      const timeLeftMs = deadline - now;
      const timeLeftDays = timeLeftMs > 0 ? Math.ceil(timeLeftMs / (1000 * 60 * 60 * 24)) : 0;

      const expired = deadline && timeLeftMs < 0;
      const progressRatio = data.goal > 0 ? data.earned / data.goal : 0;
      const referralsNeeded = Math.max(data.goal - data.earned, 0);

      let statusText = "⏳ Pending";
      let tooltip = "Milestone is in progress.";
      if (expired) {
        statusText = "⛔ Expired";
        tooltip = "Milestone deadline has passed.";
      } else if (data.rewarded) {
        statusText = "✅ Fulfilled";
        tooltip = "Milestone is completed and rewards are unlocked.";
      }

      setStatus({
        ...data,
        loading: false,
        expired,
        referralsNeeded,
        progressRatio,
        timeLeft: timeLeftDays,
        statusText,
        tooltip,
      });
    };

    fetchMilestone();

    const interval = setInterval(fetchMilestone, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [uid, pkg]);

  return status;
}