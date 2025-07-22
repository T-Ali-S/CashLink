import { ref, get, update } from "firebase/database";
import { db } from "../../firebase";
import { processROIandUnlock } from "./milestoneManager";

export async function simulateMilestoneUnlock(uid, pkg = "platinum") {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  if (!snapshot.exists()) return console.error("❌ UID not found");

  const user = snapshot.val();
  const mockMilestone = {
    goal: 2,
    earned: 2,
    lockedROI: 100000,
    lockedBonus: 40000,
    rewarded: false,
    deadline: Date.now() + 24 * 60 * 60 * 1000,
  };

  await update(userRef, {
    package: pkg,
    eliteRate: 10, // ✅ Add this here
    milestones: {
      ...user.milestones,
      [pkg]: mockMilestone,
    },
    bonusLocked: 40000,
    lastPayoutAt: Date.now() - 2 * 86400000,
  });

  const result = await processROIandUnlock(uid);
  console.log("✅ Simulated Milestone Unlock:", result);
}
