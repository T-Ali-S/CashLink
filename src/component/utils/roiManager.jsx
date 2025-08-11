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
  const interval = 24 * 60 * 60 * 1000; 
  // const interval = 6 * 1000; 

  const elapsed = now - last;
  if (elapsed < interval) {
    return null;
  }

  const maxCap = roiCap[pkg];
  const currentROI = userData.roiTracker?.[pkg] || 0;
  const roiRemaining = maxCap - currentROI;
  const missedPeriods = Math.floor(elapsed / interval);
  const potentialEarned = dailyAmount * missedPeriods;

  if (roiRemaining <= 0) {
    return 0;
  }

  const actualEarned = Math.min(roiRemaining, potentialEarned);

  await runTransaction(userRef, (data) => {
    if (!data) return data;

    const pkg = data.package;
    const rate = data.eliteRate || 10;
    const dailyAmount = (tierAmount[pkg] * rate) / 100;
    const now = Date.now();
    const last = data.lastPayoutAt || 0;
    const interval = 24 * 60 * 60 * 1000;
    // const interval = 6 * 1000;
    const missedPeriods = Math.floor((now - last) / interval);
    if (missedPeriods <= 0) return data;

    const potentialEarned = dailyAmount * missedPeriods;
    const currentROI = data.roiTracker?.[pkg] || 0;
    const roiRemaining = roiCap[pkg] - currentROI;
    const actualEarned = Math.min(roiRemaining, potentialEarned);

    if (actualEarned <= 0) {
      return data;
    }

    const milestone = data.milestones?.[pkg] || {};
    const milestoneCompleted = milestone.rewarded || false;
    const maxFreeWithdrawable = 4 * dailyAmount;

    if (pkg === "elite") {
      const eliteLocked = data.eliteLocked;

      if (!eliteLocked) {
        // All ROI withdrawable if milestone completed
        data.withdrawable = (data.withdrawable || 0) + actualEarned;
      } else {
        // Apply same 5 ROI logic
        if (currentROI < maxFreeWithdrawable) {
          const remainingFreeROI = maxFreeWithdrawable - currentROI;
          const toWithdraw = Math.min(remainingFreeROI, actualEarned);
          const toLock = actualEarned - toWithdraw;

          if (toWithdraw > 0) {
            data.withdrawable = (data.withdrawable || 0) + toWithdraw;
          }

          if (toLock > 0) {
            milestone.lockedROI = (milestone.lockedROI || 0) + toLock;
            data.currentPackageROI = (data.currentPackageROI || 0) + toLock;
          }
        } else {
          milestone.lockedROI = (milestone.lockedROI || 0) + actualEarned;
          data.currentPackageROI = (data.currentPackageROI || 0) + actualEarned;
        }
      }
    } else {
      if (currentROI < maxFreeWithdrawable) {
        const remainingFreeROI = maxFreeWithdrawable - currentROI;
        const toWithdraw = Math.min(remainingFreeROI, actualEarned);
        const toLock = actualEarned - toWithdraw;

        if (toWithdraw > 0) {
          data.withdrawable = (data.withdrawable || 0) + toWithdraw;
        }

        if (toLock > 0) {
          milestone.lockedROI = (milestone.lockedROI || 0) + toLock;
          data.currentPackageROI = (data.currentPackageROI || 0) + toLock;
        }
      } else {
        milestone.lockedROI = (milestone.lockedROI || 0) + actualEarned;
        data.currentPackageROI = (data.currentPackageROI || 0) + actualEarned;
      }
    }

    // Final updates
    data.milestones = {
      ...data.milestones,
      [pkg]: milestone,
    };

    data.roiTracker = data.roiTracker || {};
    data.roiTracker[pkg] = Math.min(
      (data.roiTracker[pkg] || 0) + actualEarned,
      roiCap[pkg]
    );

    data.balance = Math.min((data.balance || 0) + actualEarned, roiCap[pkg]);
    data.lastPayoutAt = last + missedPeriods * interval;

    return data;
  });

  return actualEarned;
}
