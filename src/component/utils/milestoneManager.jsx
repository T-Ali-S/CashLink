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
    console.log(`⛔ Milestone expired — cleared locked rewards for ${uid}`);
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

// export async function checkAndUnlockMilestone(uid) {
//   const userRef = ref(db, `users/${uid}`);
//   const snapshot = await get(userRef);
//   if (!snapshot.exists()) return false;

//   const user = snapshot.val();
//   const pkg = user.package;
//   if (!pkg) return false;

//   const tierOrder = ["bronze", "silver", "gold", "platinum", "elite"];
//   const bonusValues = {
//     silver: 1000,
//     gold: 2000,
//     platinum: 10000,
//     elite: 20000,
//   };
//   const referralQuotas = {
//     bronze: 5,
//     silver: 3,
//     gold: 2,
//     platinum: 2,
//     elite: 1,
//   };

//   const milestone = user.milestones?.[pkg] || {};
//   const previouslyConsumed = user.usedPackageRefs || [];

//   const allUsersSnap = await get(ref(db, "users"));
//   const allUsers = allUsersSnap.exists() ? allUsersSnap.val() : {};

//   const referrals = Object.entries(allUsers)
//     .filter(([refId, u]) => u.referredBy === uid && u.package)
//     .map(([refId, u]) => ({ uid: refId, ...u }));

//   const quota = referralQuotas[pkg];
//   const userTierIdx = tierOrder.indexOf(pkg);
//   let earned = 0;
//   let lockedBonus = 0;
//   const newRefsToConsume = [];

//   for (let ref of referrals) {
//     if (previouslyConsumed.includes(ref.uid)) continue;

//     const refTierIdx = tierOrder.indexOf(ref.package);
//     if (refTierIdx < userTierIdx) continue;

//     earned++;
//     newRefsToConsume.push(ref.uid);

//     if (refTierIdx > userTierIdx) {
//       lockedBonus += bonusValues[ref.package] || 0;
//     }

//     if (earned >= quota) break;
//   }

//   const milestoneAlreadyRewarded = milestone.rewarded;
//   const isNewlyQualified = earned >= quota && !milestoneAlreadyRewarded;

//   const needsPatch =
//     milestoneAlreadyRewarded &&
//     milestone.earned === 0 &&
//     (milestone.lockedROI || 0) === 0 &&
//     (milestone.lockedBonus || 0) === 0 &&
//     earned >= quota;

//   if (!isNewlyQualified && !needsPatch) {
//     console.log(
//       `📊 Milestone not ready or already valid for ${uid}, skipping.`
//     );
//     return false;
//   }

//   return await finalizeMilestoneUnlock(
//     userRef,
//     user,
//     milestone,
//     pkg,
//     newRefsToConsume
//   );
// }

export async function checkAndUnlockMilestone(uid) {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  if (!snapshot.exists()) return false;

  const user = snapshot.val();
  const pkg = user.package;
  if (!pkg) return false;

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

  const milestone = user.milestones?.[pkg] || {};
  const previouslyConsumed = user.usedPackageRefs || [];

  const allUsersSnap = await get(ref(db, "users"));
  const allUsers = allUsersSnap.exists() ? allUsersSnap.val() : {};

  const referrals = Object.entries(allUsers)
    .filter(([refId, u]) => u.referredBy === uid && u.package)
    .map(([refId, u]) => ({ uid: refId, ...u }));

  const quota = referralQuotas[pkg];
  const userTierIdx = tierOrder.indexOf(pkg);
  let earned = 0;
  let lockedBonus = 0;
  const newRefsToConsume = [];

  for (let ref of referrals) {
    if (previouslyConsumed.includes(ref.uid)) continue;

    const refTierIdx = tierOrder.indexOf(ref.package);
    if (refTierIdx < userTierIdx) continue;

    earned++;
    newRefsToConsume.push(ref.uid);

    // Only accumulate lockedBonus here — will be paid on unlock
    const alreadyRewardedRefs = user.highTierBonusRefs || [];

    if (refTierIdx > userTierIdx && !alreadyRewardedRefs.includes(ref.uid)) {
      const bonus = bonusValues[ref.package] || 0;
      lockedBonus += bonus;

      await update(userRef, {
        balance: (user.balance || 0) + bonus,
        highTierBonusRefs: [...alreadyRewardedRefs, ref.uid],
      });

      console.log(
        `💰 Added Rs.${bonus} high-tier bonus to balance for ${uid}, still locked`
      );
    }

    if (earned >= quota) break;
  }

  const milestoneAlreadyRewarded = milestone.rewarded;
  const isNewlyQualified = earned >= quota && !milestoneAlreadyRewarded;

  const needsPatch =
    milestoneAlreadyRewarded &&
    milestone.earned === 0 &&
    (milestone.lockedROI || 0) === 0 &&
    (milestone.lockedBonus || 0) === 0 &&
    earned >= quota;

  if (!isNewlyQualified && !needsPatch) {
    console.log(
      `📊 Milestone not ready or already valid for ${uid}, updating partial bonus/earned for tracking.`
    );

    // Update partial milestone info (show bonus even if not rewarded)
    const partialUpdate = {
      [`milestones/${pkg}/earned`]: earned,
      [`milestones/${pkg}/lockedBonus`]: lockedBonus,
      [`milestones/${pkg}/deadline`]:
        user.milestones?.[pkg]?.deadline ||
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

  const bonusValues = {
    silver: 1000,
    gold: 2000,
    platinum: 10000,
    elite: 20000,
  };

  const tierOrder = ["bronze", "silver", "gold", "platinum", "elite"];

  const eliteRate = user.eliteRate || 10;
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  const roiInjectedFlag = milestone.roiInjectedAtUnlock || false;
  const lastROIAt = user.lastPayoutAt || 0;

  // Inject one day ROI if needed
  if (!roiInjectedFlag && now - lastROIAt >= oneDay) {
    const roi = await applyDailyROI(userRef.key);
    console.log(`🧮 ROI injected before unlock for ${userRef.key}: Rs. ${roi}`);
    await update(userRef, {
      [`milestones/${pkg}/roiInjectedAtUnlock`]: true,
    });
  }

  let lockedBonus = milestone.lockedBonus || 0;
  let lockedROI = milestone.lockedROI || 0;

  // ⏳ Patch ROI using currentPackageROI instead of balance
  if (lockedROI === 0 && pkg !== "elite") {
    const currentTrackedROI = user.currentPackageROI || 0;
    lockedROI = roiCap[pkg] - currentTrackedROI;
    console.log(
      `🔁 Patching missing ROI for ${userRef.key}: roiCap=${roiCap[pkg]} - currentPackageROI=${currentTrackedROI} = ${lockedROI}`
    );
  }

  // ✅ Patch lockedBonus from high-tier referrals if needed
  if (lockedBonus === 0 && extraRefs.length > 0) {
    const allUsersSnap = await get(ref(db, "users"));
    const allUsers = allUsersSnap.exists() ? allUsersSnap.val() : {};
    const userTierIdx = tierOrder.indexOf(pkg);

    for (let refId of extraRefs) {
      const refUser = allUsers[refId];
      if (!refUser || !refUser.package) continue;

      const refTierIdx = tierOrder.indexOf(refUser.package);
      if (refTierIdx > userTierIdx) {
        lockedBonus += bonusValues[refUser.package] || 0;
      }
    }

    console.log(`📥 Patched lockedBonus from referrals: ₹${lockedBonus}`);
  }

  const totalUnlock = lockedROI + lockedBonus;
  const updatePayload = {
    balance: (user.balance || 0) + totalUnlock,
    withdrawable: (user.withdrawable || 0) + totalUnlock,
    [`milestones/${pkg}/lockedROI`]: 0,
    [`milestones/${pkg}/lockedBonus`]: 0,
    [`milestones/${pkg}/earned`]: milestone.earned || extraRefs.length,
    [`milestones/${pkg}/rewarded`]: true,
    usedPackageRefs: [...(user.usedPackageRefs || []), ...extraRefs],
    currentPackageROI: 0, // ✅ Reset tracker
  };

  if (pkg === "elite") {
    updatePayload.eliteLocked = false;
    const currentBalance = user.balance || 0;
    const initialCredit = milestone.initialCredit || 0;
    const retroactiveROI = currentBalance - initialCredit;
    updatePayload.withdrawable = (user.withdrawable || 0) + retroactiveROI;

    console.log(
      `💰 Retroactive ROI of ₹${retroactiveROI} made withdrawable for Elite UID: ${userRef.key}`
    );
  }

  console.log(
    "🎯 Final milestone unlock payload for",
    userRef.key,
    updatePayload
  );
  await update(userRef, updatePayload);
  await update(userRef, { package: "" });
  return true;
}
