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

  const now = Date.now();
  const last = userData.lastPayoutAt || 0;
  const oneDay = 24 * 60 * 60 * 1000;

  // ⛔ Stop if ROI already applied within 24h
  if (now - last < oneDay) return null;

  // 🔒 Elite cap check (before anything else)
  // const rate = userData.eliteRate || 10;
  // const dailyAmount = (tierAmount[pkg] * rate) / 100;
  // if (pkg === "elite") {
  //   const eliteCap = 150000;
  //   const projectedBalance = (userData.balance || 0) + dailyAmount;
  //   if (projectedBalance > eliteCap) return null;
  // }
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
  await update(userRef, {
    balance: (userData.balance || 0) + dailyAmount,
    withdrawable: newWithdrawable,
    [`milestones/${pkg}/lockedROI`]: newLockedROI,
    lastPayoutAt: now,
  });

  console.log(`✅ Daily ROI added for ${uid}: Rs. ${dailyAmount}`);
  return dailyAmount;
}
