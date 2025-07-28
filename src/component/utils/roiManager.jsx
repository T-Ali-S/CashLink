import { ref, get, runTransaction } from "firebase/database";
import { db } from "../../firebase";

const tierAmount = {
  bronze: 3000,
  silver: 5000,
  gold: 10000,
  platinum: 50000,
  elite: 100000,
};

const roiCap = {
  bronze: 6300,
  silver: 10500,
  gold: 21000,
  platinum: 105000,
  elite: 150000,
};

export async function applyDailyROI(uid) {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  if (!snapshot.exists()) {
    console.warn(`❌ No user data found for UID: ${uid}`);
    return null;
  }

  const userData = snapshot.val();
  const { package: pkg } = userData;
  if (!pkg) {
    console.warn(`⚠️ No package assigned for UID: ${uid}`);
    return null;
  }

  const rate = userData.eliteRate || 10;
  const dailyAmount = (tierAmount[pkg] * rate) / 100;
  const now = Date.now();
  const last = userData.lastPayoutAt || 0;
  const oneDay = 24 * 60 * 60 * 1000;

  if (now - last < oneDay) {
    // console.log(`⏱️ ROI already applied within 24h for ${uid}`);
    return null;
  }

  const maxCap = roiCap[pkg];
  const nextBalance = (userData.balance || 0) + dailyAmount;
  if (nextBalance > maxCap) {
    // console.log(`💰 Cap reached for ${uid}, skipping ROI`);
    return null;
  }

  // Firebase Transaction
  await runTransaction(userRef, (data) => {
    if (!data) {
      // console.warn(`⛔ runTransaction found no data for ${uid}`);
      return data;
    }

    const last = data.lastPayoutAt || 0;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (now - last < oneDay) {
      // console.log(`⏱️ Duplicate ROI block inside transaction for ${uid}`);
      return data;
    }

    const rate = data.eliteRate || 10;
    const dailyAmount = (tierAmount[data.package] * rate) / 100;
    const pkg = data.package;
    const milestone = data.milestones?.[pkg] || {};
    const milestoneCompleted = milestone.rewarded || false;

    data.balance = (data.balance || 0) + dailyAmount;

    if (pkg === "elite") {
      const canWithdrawElite = !data.eliteLocked;
      if (canWithdrawElite) {
        data.withdrawable = (data.withdrawable || 0) + dailyAmount;
      } else {
        milestone.lockedROI = (milestone.lockedROI || 0) + dailyAmount;
        data.currentPackageROI = (data.currentPackageROI || 0) + dailyAmount;
      }
    } else {
      if (milestoneCompleted) {
        data.withdrawable = (data.withdrawable || 0) + dailyAmount;
      } else {
        milestone.lockedROI = (milestone.lockedROI || 0) + dailyAmount;
        data.currentPackageROI = (data.currentPackageROI || 0) + dailyAmount;
      }
    }

    data.milestones = {
      ...data.milestones,
      [pkg]: milestone,
    };

    data.lastPayoutAt = now;
    return data;
  });

  const postSnapshot = await get(userRef);
  const postData = postSnapshot.val();
  // console.log("📬 Post-transaction user data:", postData);
  // console.log(`✅ Daily ROI added for ${uid}: Rs. ${dailyAmount}`);
  return dailyAmount;
}
