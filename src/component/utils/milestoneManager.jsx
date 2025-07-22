import { ref, get, update } from "firebase/database";
import { db } from "../../firebase";
import { applyDailyROI } from "./roiManager";

let alreadyProcessing = false;

export async function processROIandUnlock(uid) {
  if (alreadyProcessing) {
    console.log(`⛔ Duplicate ROI trigger blocked for ${uid}`);
    return null;
  }
  alreadyProcessing = true;

  try {
    const roi = await applyDailyROI(uid);
    console.log(`🧮 Applied ROI for ${uid}: Rs. ${roi || 0}`);

    const unlocked = await checkAndUnlockMilestone(uid);
    if (unlocked) {
      console.log(
        `🎉 Milestone fulfilled for ${uid} at ${new Date().toLocaleString()}`
      );
    } else {
      console.log(
        `📊 Milestone not yet met for ${uid} at ${new Date().toLocaleString()}`
      );
    }

    return { roi, unlocked };
  } catch (error) {
    console.error(`⚠️ Error during ROI + milestone process for ${uid}:`, error);
    return null;
  }
}

export async function expireMilestoneIfOverdue(uid) {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  const lockedROI = milestone.lockedROI || 0;
  const bonusLocked = user.milestones?.[pkg]?.lockedBonus || 0;
  const totalUnlock = lockedROI + bonusLocked;
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
      withdrawable: (user.withdrawable || 0) + totalUnlock,
      balance: (user.balance || 0) + totalUnlock, // ✅ ensures balance reflects the real total
      [`milestones/${pkg}/lockedROI`]: 0,
      [`milestones/${pkg}/roiInjectedAtUnlock`]: false,
      [`milestones/${pkg}/lockedBonus`]: 0,
      [`milestones/${pkg}/rewarded`]: true,
    };

    if (pkg === "elite") {
      updatePayload.eliteLocked = false;
    }

    console.log("🎁 Unlocking rewards:", {
      lockedROI: updatedLockedROI,
      lockedBonus: updatedBonusLocked,
      balanceBefore: updatedUser.balance,
      withdrawableBefore: updatedUser.withdrawable,
      updatePayload,
    });
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
  const bonusLocked = user.milestones?.[pkg]?.lockedBonus || 0;

  if (earned >= quota) {
    let roi = 0;
    const lastROIAt = user.lastPayoutAt || 0;
    const oneDay = 24 * 60 * 60 * 1000;

    const roiInjectedFlag =
      user.milestones?.[pkg]?.roiInjectedAtUnlock || false;

    if (!roiInjectedFlag && now - lastROIAt >= oneDay) {
      roi = await applyDailyROI(uid);
      console.log(`🧮 ROI injected before unlock for ${uid}: Rs. ${roi}`);

      await update(userRef, {
        [`milestones/${pkg}/roiInjectedAtUnlock`]: true,
      });
    } else {
      console.log(`⛔ Skipped ROI — Already injected or less than 24h`);
    }

    const updatedSnapshot = await get(userRef);
    const updatedUser = updatedSnapshot.val();
    const updatedMilestone = updatedUser.milestones?.[pkg];
    const updatedLockedROI = updatedMilestone?.lockedROI || 0;
    const updatedBonusLocked = updatedMilestone?.lockedBonus || 0;
    const totalUnlock = updatedLockedROI + updatedBonusLocked;

    const updatePayload = {
      withdrawable: (updatedUser.withdrawable || 0) + totalUnlock,
      balance: (updatedUser.balance || 0) + totalUnlock,
      [`milestones/${pkg}/rewarded`]: true,
      [`milestones/${pkg}/lockedROI`]: 0,
      [`milestones/${pkg}/lockedBonus`]: 0,
    };

    if (pkg === "elite") {
      // 1️⃣ Unlock elite withdrawal
      updatePayload.eliteLocked = false;

      // 2️⃣ Move past ROI from balance to withdrawable
      const currentBalance = updatedUser.balance || 0;
      const currentWithdrawable = updatedUser.withdrawable || 0;
      const initialCredit = updatedMilestone.initialCredit || 0;

      const retroactiveROI = currentBalance - initialCredit;

      updatePayload.withdrawable = currentWithdrawable + retroactiveROI;
      console.log(
        `💰 Retroactive ROI of ₹${retroactiveROI} made withdrawable for Elite UID: ${uid}`
      );
    }
    console.log("🎯 Final milestone unlock payload for", uid, updatePayload);
    await update(userRef, updatePayload);

    return true;
  }

  return false;
}
