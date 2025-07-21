import { ref, get, update } from "firebase/database";
import { db } from "../../firebase";

export async function expireMilestoneIfOverdue(uid) {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  if (!snapshot.exists()) return false;

  const user = snapshot.val();
  const pkg = user.package;
  if (!pkg) return false;

  const milestone = user.milestones?.[pkg];
  if (!milestone || milestone.rewarded) return false;

  const now = Date.now();
  const expired = milestone.deadline && now > milestone.deadline;

  if (expired && milestone.earned < milestone.goal) {
    // 👎 Milestone failed — clean up locked rewards
    const safeBalance = user.balance || 0;

    const updatePayload = {
      withdrawable: user.withdrawable || 0,
      balance: user.withdrawable || 0, // ✅ overwrite full balance
      [`milestones/${pkg}/rewarded`]: true,
      [`milestones/${pkg}/lockedBonus`]: 0,
      [`milestones/${pkg}/lockedROI`]: 0,
    };

    if (pkg === "elite") {
      updatePayload.eliteLocked = false;
    }

    await update(userRef, updatePayload);

    console.log(`⛔ Milestone expired — cleared locked rewards for ${uid}`);
    return true;
  }

  return false;
}

export async function checkAndUnlockMilestone(uid) {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  if (!snapshot.exists()) return false;

  const user = snapshot.val();
  const pkg = user.package;
  if (!pkg) return false;

  const milestone = user.milestones?.[pkg];
  if (!milestone || milestone.rewarded) return false;

  const referralsEarned = milestone.earned || 0;
  const referralsNeeded = milestone.goal || 0;

  // ⏰ Optional: Check time limit
  const now = Date.now();
  const expired = milestone.deadline && now > milestone.deadline;
  if (expired) {
    console.log(`⏳ Milestone expired for ${uid} — cleaning up...`);
    await update(userRef, {
      balance: user.balance || 0,
      lockedBonus: 0,
      eliteLocked: pkg === "elite" ? true : undefined,
      [`milestones/${pkg}/rewarded`]: false,
      [`milestones/${pkg}/lockedBonus`]: 0,
      [`milestones/${pkg}/lockedROI`]: 0,
    });
    return false;
  }

  // ✅ Milestone fulfilled
  const requiredRefs = {
    bronze: 5,
    silver: 3,
    gold: 2,
    platinum: 2,
    elite: 1,
  };

  const quota = requiredRefs[pkg];
  const earned = milestone.earned || 0;
  const lockedROI = milestone.lockedROI || 0;
  const bonusLocked = user.bonusLocked || 0;

  if (earned >= quota) {
    const updatePayload = {
      withdrawable: (user.withdrawable || 0) + lockedROI + bonusLocked,
      [`milestones/${pkg}/rewarded`]: true,
      [`milestones/${pkg}/lockedROI`]: 0,
      bonusLocked: 0,
    };

    if (pkg === "elite") {
      updatePayload.eliteLocked = false;
    }

    await update(userRef, updatePayload);
    console.log(
      `🎉 Milestone unlocked for ${uid} — ROI + bonus now withdrawable`
    );
    return true;
  }

  return false;
}
