import { ref, get, update } from "firebase/database";
import { db } from "../../firebase";
import { applyDailyROI } from "./roiManager";

let alreadyProcessing = false;

export async function processROIandUnlock(uid) {
  if (alreadyProcessing) {
    return null;
  }
  alreadyProcessing = true;

  try {
    const roi = await applyDailyROI(uid);

    const unlocked = await checkAndUnlockMilestone(uid);
    if (unlocked) {
    } else {
    }
    /////updated Start
    // ROI countdown
    const oneDay = 24 * 60 * 60 * 1000;
    const now = Date.now();

    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const user = snapshot.val();
      const lastROI = user.lastPayoutAt || 0;
      const nextROI = lastROI + oneDay;

      const msRemaining = nextROI - now;
      if (msRemaining > 0) {
        const hrs = Math.floor(msRemaining / (1000 * 60 * 60));
        const mins = Math.floor((msRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((msRemaining % (1000 * 60)) / 1000);

      } else {
        ""
      }
    }

    /////updated End

    return { roi, unlocked };
  } catch (error) {
    console.error(`⚠️ Error during ROI + milestone process for ${uid}:`, error);
    return null;
  }
}

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
    const lockedROI = milestone.lockedROI || 0;
    const bonusLocked = milestone.lockedBonus || 0;
    const totalUnlock = lockedROI + bonusLocked;

    const updatePayload = {
      withdrawable: (user.withdrawable || 0) + totalUnlock,
      balance: (user.balance || 0) + totalUnlock,
      currentPackageROI: 0, // ✅ Reset ROI tracker
      [`milestones/${pkg}/lockedROI`]: 0,
      [`milestones/${pkg}/roiInjectedAtUnlock`]: false,
      [`milestones/${pkg}/lockedBonus`]: 0,
      [`milestones/${pkg}/rewarded`]: true,
    };

    if (pkg === "elite") updatePayload.eliteLocked = false;

    await update(userRef, updatePayload);
    await update(userRef, { package: "" });
    return true;
  }

  return false;
}

const roiCap = {
  bronze: 6300,
  silver: 10500,
  gold: 21000,
  platinum: 105000,
  elite: 150000,
};



export async function checkAndUnlockMilestone(uid) {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  if (!snapshot.exists()) return false;

  const user = snapshot.val();
  const pkg = user.package;
  if (!pkg) return false;

  const milestone = user.milestones?.[pkg] || {};
  const previouslyConsumed = user.usedPackageRefs || [];
  const startUsed = Object.values(user.usedReferrals || {}).flat();
  const alreadyClaimed = new Set([...previouslyConsumed, ...startUsed]);

  const tierOrder = ["bronze", "silver", "gold", "platinum", "elite"];
  const bonusValues = {
    silver: 1000,
    gold: 2000,
    platinum: 10000,
    elite: 20000,
  };
  const referralQuotas = {
    bronze: 5,
    silver: 3,
    gold: 2,
    platinum: 2,
    elite: 1,
  };

  const allUsersSnap = await get(ref(db, "users"));
  const allUsers = allUsersSnap.exists() ? allUsersSnap.val() : {};

  const referrals = Object.entries(allUsers)
    .filter(([refId, u]) => u.referredBy === uid && u.package)
    .map(([refId, u]) => ({ uid: refId, ...u }));

  const quota = referralQuotas[pkg];
  const userTierIdx = tierOrder.indexOf(pkg);
  let earned = 0;
  let lockedBonus = milestone.lockedBonus || 0; // ✅ Preserve past bonuses
  const newRefsToConsume = [];

  const alreadyBonused = new Set(user.highTierBonusRefs || []);
  const newHighTierRefs = [];

  for (let ref of referrals) {
    if (alreadyClaimed.has(ref.uid)) continue;

    const refTierIdx = tierOrder.indexOf(ref.package);
    if (refTierIdx < userTierIdx) continue;

    // Non-elite users get bonus from higher-tier referrals
    if (
      pkg !== "elite" &&
      refTierIdx > userTierIdx &&
      !alreadyBonused.has(ref.uid)
    ) {
      const bonus = bonusValues[ref.package] || 0;
      lockedBonus += bonus;
      newHighTierRefs.push(ref.uid);

      user.balance = (user.balance || 0) + bonus;
      await update(userRef, { balance: user.balance });

      
      
    }

    earned++;
    newRefsToConsume.push(ref.uid);
    if (earned >= quota) break;
  }

  // Update highTierBonusRefs
  if (newHighTierRefs.length > 0) {
    const updatedRefs = [...(user.highTierBonusRefs || []), ...newHighTierRefs];
    await update(userRef, { highTierBonusRefs: updatedRefs });
  }

  const milestoneAlreadyRewarded = milestone.rewarded;
  const isNewlyQualified = earned >= quota && !milestoneAlreadyRewarded;

  if (!isNewlyQualified) {
    const partialUpdate = {
      [`milestones/${pkg}/earned`]: earned,
      [`milestones/${pkg}/lockedBonus`]: lockedBonus,
      [`milestones/${pkg}/deadline`]:
        milestone.deadline ||
        Date.now() + (pkg === "elite" ? 30 : 21) * 24 * 60 * 60 * 1000,
    };
    
    
    await update(userRef, partialUpdate);
    return false;
  }

  return await finalizeMilestoneUnlock(
    userRef,
    user,
    milestone,
    pkg,
    newRefsToConsume
  );
}

async function finalizeMilestoneUnlock(
  userRef,
  user,
  milestone,
  pkg,
  extraRefs = []
) {
  const elite = pkg === "elite";
  const trackedROI = user.currentPackageROI || 0;
  const remainingROIbalance = roiCap[pkg] - trackedROI;

  let lockedROI = milestone.lockedROI || 0;
  let lockedBonus = milestone.lockedBonus || 0;

  if (!elite && lockedROI === 0) {
    lockedROI = roiCap[pkg] - trackedROI;
  }

  const payload = {
    withdrawable: user.withdrawable || 0,
    [`milestones/${pkg}/lockedROI`]: 0,
    [`milestones/${pkg}/lockedBonus`]: 0,
    [`milestones/${pkg}/earned`]: milestone.earned || extraRefs.length,
    [`milestones/${pkg}/rewarded`]: true,
    usedPackageRefs: [...(user.usedPackageRefs || []), ...extraRefs],
  };

  // update start for ELite ROI
  if (elite) {
    const roi = user.roiTracker?.elite || 0;
    const retroactiveROI = roi;



    // update end for ELite ROI

    payload.withdrawable += retroactiveROI;
    payload.eliteLocked = false;
    payload[`milestones/${pkg}/roiInjectedAtUnlock`] = true;
    payload.roiTracker = {
      ...(user.roiTracker || {}),
      elite: 0, // Reset elite tracker
    };


    if (trackedROI >= roiCap.elite) {
      payload.currentPackageROI = 0;
      await update(userRef, { package: "" });
    } else {
    }
  } else {
    payload.balance = (user.balance || 0) + remainingROIbalance; // Already updated above
    payload.withdrawable += lockedROI + lockedBonus;
    payload.currentPackageROI = 0;

    await update(userRef, { package: "" });
  }

  await update(userRef, payload);
  return true;
}

export async function calculateEarnedReferrals(uid, pkg) {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  if (!snapshot.exists()) return { earned: 0, validRefUIDs: [] };

  const user = snapshot.val();

  const milestone = user.milestones?.[pkg] || {};
  const previouslyConsumed = user.usedPackageRefs || [];
  const startUsed = Object.values(user.usedReferrals || {}).flat();
  const alreadyClaimed = new Set([...previouslyConsumed, ...startUsed]);

  const tierOrder = ["bronze", "silver", "gold", "platinum", "elite"];
  const referralQuotas = {
    bronze: 5,
    silver: 3,
    gold: 2,
    platinum: 2,
    elite: 1,
  };

  const allUsersSnap = await get(ref(db, "users"));
  const allUsers = allUsersSnap.exists() ? allUsersSnap.val() : {};

  const referrals = Object.entries(allUsers)
    .filter(([refId, u]) => u.referredBy === uid && u.package)
    .map(([refId, u]) => ({ uid: refId, ...u }));

  const quota = referralQuotas[pkg];
  const userTierIdx = tierOrder.indexOf(pkg);

  let earned = 0;
  let validRefUIDs = [];

  for (let ref of referrals) {
    if (alreadyClaimed.has(ref.uid)) continue;

    const refTierIdx = tierOrder.indexOf(ref.package);
    if (refTierIdx < userTierIdx) continue;

    earned++;
    validRefUIDs.push(ref.uid);
    if (earned >= quota) break;
  }

  return { earned, validRefUIDs };
}
