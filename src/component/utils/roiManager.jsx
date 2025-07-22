import { ref, get, update } from "firebase/database";
import { db } from "../../firebase";

const tierAmount = {
  bronze: 3000,
  silver: 5000,
  gold: 10000,
  platinum: 50000,
  elite: 100000,
};

export async function applyDailyROI(uid) {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  if (!snapshot.exists()) return null;

  const userData = snapshot.val();
  const { package: pkg } = userData;
  if (!pkg) return null;

  const rate = userData.eliteRate || 10;
  const dailyAmount = (tierAmount[pkg] * rate) / 100;
  const now = Date.now();
  const last = userData.lastPayoutAt || 0;
  const oneDay = 24 * 60 * 60 * 1000;

  // ⛔ Stop if ROI already applied within 24h
  if (now - last < oneDay) return null;

  const roiCap = {
    bronze: 6300,
    silver: 10500,
    gold: 21000,
    platinum: 105000,
    elite: 150000,
  };

  const maxCap = roiCap[pkg];
  const nextBalance = (userData.balance || 0) + dailyAmount;
  if (nextBalance > maxCap) return null;

  // 🧠 Milestone logic
  const milestone = userData?.milestones?.[pkg];
  const isElite = pkg === "elite";
  const milestoneCompleted = milestone?.rewarded;

  // 📤 ROI destination decision
  let newWithdrawable = userData.withdrawable || 0;
  let newLockedROI = milestone?.lockedROI || 0;

  if (isElite) {
    const canWithdrawElite = !userData.eliteLocked;
    newWithdrawable = canWithdrawElite
      ? newWithdrawable + dailyAmount
      : newWithdrawable;
    newLockedROI = canWithdrawElite ? newLockedROI : newLockedROI + dailyAmount;
  } else {
    newWithdrawable = milestoneCompleted
      ? newWithdrawable + dailyAmount
      : newWithdrawable;
    newLockedROI = milestoneCompleted
      ? newLockedROI
      : newLockedROI + dailyAmount;
  }

  // 🛠 Unified Firebase update
  await runTransaction(userRef, (data) => {
    if (!data) return;

    const last = data.lastPayoutAt || 0;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (now - last < oneDay) return; // 🚫 Block if already paid within 24h

    const dailyAmount =
      (tierAmount[data.package] * (data.eliteRate || 10)) / 100;

    data.balance = (data.balance || 0) + dailyAmount;

    const milestone = data.milestones?.[data.package] || {};
    const milestoneCompleted = milestone.rewarded || false;

    if (data.package === "elite") {
      const canWithdrawElite = !data.eliteLocked;
      if (canWithdrawElite) {
        data.withdrawable = (data.withdrawable || 0) + dailyAmount;
      } else {
        milestone.lockedROI = (milestone.lockedROI || 0) + dailyAmount;
      }
    } else {
      if (milestoneCompleted) {
        data.withdrawable = (data.withdrawable || 0) + dailyAmount;
      } else {
        milestone.lockedROI = (milestone.lockedROI || 0) + dailyAmount;
      }
    }

    data.milestones = {
      ...data.milestones,
      [data.package]: milestone,
    };
    data.lastPayoutAt = now;

    return data;
  });

  console.log(`✅ Daily ROI added for ${uid}: Rs. ${dailyAmount}`);
  return dailyAmount;
}
