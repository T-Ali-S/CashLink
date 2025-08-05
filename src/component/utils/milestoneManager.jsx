import { ref, get, update } from "firebase/database";
import { db } from "../../firebase";
import { applyDailyROI } from "./roiManager";

let alreadyProcessing = false;

export async function processROIandUnlock(uid) {
  if (alreadyProcessing) {
    // console.log(`⛔ Duplicate ROI trigger blocked for ${uid}`);
    return null;
  }
  alreadyProcessing = true;

  try {
    const roi = await applyDailyROI(uid);
    console.log(`🧮 Applied ROI for ${uid}: Rs. ${roi || 0}`);

    const unlocked = await checkAndUnlockMilestone(uid);
    if (unlocked) {
      // console.log(
      //   `🎉 Milestone fulfilled for ${uid} at ${new Date().toLocaleString()}`
      // );
    } else {
      // console.log(
      //   `📊 Milestone not yet met for ${uid} at ${new Date().toLocaleString()}`
      // );
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

        console.log(`⏳ Next ROI for ${uid} in ${hrs}h ${mins}m ${secs}s`);
      } else {
        console.log(`⚠️ Next ROI for ${uid} is ready now`);
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
    // console.log(`⛔ Milestone expired — cleared locked rewards for ${uid}`);
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

//   const startUsed = Object.values(user.usedReferrals || {}).flat();
//   const alreadyClaimed = new Set([...previouslyConsumed, ...startUsed]);

//   for (let ref of referrals) {
//     if (alreadyClaimed.has(ref.uid)) continue;
//     if (previouslyConsumed.includes(ref.uid)) continue;

//     const refTierIdx = tierOrder.indexOf(ref.package);
//     if (refTierIdx < userTierIdx) continue;

//     earned++;
//     newRefsToConsume.push(ref.uid);

//     // Only accumulate lockedBonus here — will be paid on unlock
//     const alreadyRewardedRefs = user.highTierBonusRefs || [];

//     if (refTierIdx > userTierIdx && !alreadyRewardedRefs.includes(ref.uid)) {
//       const bonus = bonusValues[ref.package] || 0;
//       lockedBonus += bonus;

//       await update(userRef, {
//         balance: (user.balance || 0) + bonus,
//         highTierBonusRefs: [...alreadyRewardedRefs, ref.uid],
//       });

//       // console.log(
//       //   `💰 Added Rs.${bonus} high-tier bonus to balance for ${uid}, still locked`
//       // );
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
//     // console.log(
//     //   `📊 Milestone not ready or already valid for ${uid}, updating partial bonus/earned for tracking.`
//     // );

//     // Update partial milestone info (show bonus even if not rewarded)
//     const partialUpdate = {
//       [`milestones/${pkg}/earned`]: earned,
//       [`milestones/${pkg}/lockedBonus`]: lockedBonus,
//       [`milestones/${pkg}/deadline`]:
//         user.milestones?.[pkg]?.deadline ||
//         Date.now() + (pkg === "elite" ? 30 : 21) * 24 * 60 * 60 * 1000,
//     };

//     await update(userRef, partialUpdate);
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

// async function finalizeMilestoneUnlock(
//   userRef,
//   user,
//   milestone,
//   pkg,
//   extraRefs = []
// ) {
//   const tierAmount = {
//     bronze: 3000,
//     silver: 5000,
//     gold: 10000,
//     platinum: 50000,
//     elite: 100000,
//   };

//   const roiCap = {
//     bronze: 6300,
//     silver: 10500,
//     gold: 21000,
//     platinum: 105000,
//     elite: 150000,
//   };

//   const bonusValues = {
//     silver: 1000,
//     gold: 2000,
//     platinum: 10000,
//     elite: 20000,
//   };

//   const tierOrder = ["bronze", "silver", "gold", "platinum", "elite"];

//   const eliteRate = user.eliteRate || 10;
//   const now = Date.now();
//   const oneDay = 24 * 60 * 60 * 1000;

//   const roiInjectedFlag = milestone.roiInjectedAtUnlock || false;
//   const lastROIAt = user.lastPayoutAt || 0;

//   // Inject one day ROI if needed
//   if (!roiInjectedFlag && now - lastROIAt >= oneDay) {
//     const roi = await applyDailyROI(userRef.key);
//     // console.log(`🧮 ROI injected before unlock for ${userRef.key}: Rs. ${roi}`);
//     await update(userRef, {
//       [`milestones/${pkg}/roiInjectedAtUnlock`]: true,
//     });
//   }

//   let lockedBonus = milestone.lockedBonus || 0;
//   let lockedROI = milestone.lockedROI || 0;

//   // ⏳ Patch ROI using currentPackageROI instead of balance
//   if (lockedROI === 0 && pkg !== "elite") {
//     const currentTrackedROI = user.currentPackageROI || 0;
//     lockedROI = roiCap[pkg] - currentTrackedROI;
//     // console.log(
//     //   `🔁 Patching missing ROI for ${userRef.key}: roiCap=${roiCap[pkg]} - currentPackageROI=${currentTrackedROI} = ${lockedROI}`
//     // );
//   }

//   // ✅ Patch lockedBonus from high-tier referrals if needed
//   if (lockedBonus === 0 && extraRefs.length > 0) {
//     const allUsersSnap = await get(ref(db, "users"));
//     const allUsers = allUsersSnap.exists() ? allUsersSnap.val() : {};
//     const userTierIdx = tierOrder.indexOf(pkg);

//     for (let refId of extraRefs) {
//       const refUser = allUsers[refId];
//       if (!refUser || !refUser.package) continue;

//       const refTierIdx = tierOrder.indexOf(refUser.package);
//       if (refTierIdx > userTierIdx) {
//         lockedBonus += bonusValues[refUser.package] || 0;
//       }
//     }

//     // console.log(`📥 Patched lockedBonus from referrals: ₹${lockedBonus}`);
//   }

//   const totalUnlock = lockedROI + lockedBonus;
//   const updatePayload = {
//     balance: (user.balance || 0) + totalUnlock,
//     withdrawable: (user.withdrawable || 0) + totalUnlock,
//     [`milestones/${pkg}/lockedROI`]: 0,
//     [`milestones/${pkg}/lockedBonus`]: 0,
//     [`milestones/${pkg}/earned`]: milestone.earned || extraRefs.length,
//     [`milestones/${pkg}/rewarded`]: true,
//     usedPackageRefs: [...(user.usedPackageRefs || []), ...extraRefs],
//     currentPackageROI: 0, // ✅ Reset tracker
//   };

//   if (pkg === "elite") {
//     updatePayload.eliteLocked = false;
//     const currentBalance = user.balance || 0;
//     const initialCredit = milestone.initialCredit || 0;
//     const retroactiveROI = currentBalance - initialCredit;
//     updatePayload.withdrawable = (user.withdrawable || 0) + retroactiveROI;

//     // console.log(
//     //   `💰 Retroactive ROI of ₹${retroactiveROI} made withdrawable for Elite UID: ${userRef.key}`
//     // );
//   }

//   // console.log(
//   //   "🎯 Final milestone unlock payload for",
//   //   userRef.key,
//   //   updatePayload
//   // );
//   await update(userRef, updatePayload);
//   await update(userRef, { package: "" });
//   return true;
// }

// milestoneManager.jsx (Elite logic updated only, others unchanged)

// export async function checkAndUnlockMilestone(uid) {
//   const userRef = ref(db, `users/${uid}`);
//   const snapshot = await get(userRef);
//   if (!snapshot.exists()) return false;

//   const user = snapshot.val();
//   const pkg = user.package;
//   if (!pkg) return false;

//   const milestone = user.milestones?.[pkg] || {};
//   const previouslyConsumed = user.usedPackageRefs || [];
//   const startUsed = Object.values(user.usedReferrals || {}).flat();
//   const alreadyClaimed = new Set([...previouslyConsumed, ...startUsed]);

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
//     if (alreadyClaimed.has(ref.uid)) continue;

//     const refTierIdx = tierOrder.indexOf(ref.package);
//     if (refTierIdx < userTierIdx) continue;

//     // Elite users don't get bonus from same-tier elite refs
//     if (pkg !== "elite" && refTierIdx > userTierIdx) {
//       lockedBonus += bonusValues[ref.package] || 0;
//     }

//     earned++;
//     newRefsToConsume.push(ref.uid);
//     if (earned >= quota) break;
//   }

//   const milestoneAlreadyRewarded = milestone.rewarded;
//   const isNewlyQualified = earned >= quota && !milestoneAlreadyRewarded;

//   if (!isNewlyQualified) {
//     const partialUpdate = {
//       [`milestones/${pkg}/earned`]: earned,
//       [`milestones/${pkg}/lockedBonus`]: lockedBonus,
//       [`milestones/${pkg}/deadline`]:
//         milestone.deadline ||
//         Date.now() + (pkg === "elite" ? 30 : 21) * 24 * 60 * 60 * 1000,
//     };
//     await update(userRef, partialUpdate);
//     return false;
//   }

//   return await finalizeMilestoneUnlock(userRef, user, milestone, pkg, newRefsToConsume);
// }

// async function finalizeMilestoneUnlock(userRef, user, milestone, pkg, extraRefs = []) {
//   const now = Date.now();
//   const oneDay = 86400000;
//   const elite = pkg === "elite";

//   let lockedROI = milestone.lockedROI || 0;
//   let lockedBonus = milestone.lockedBonus || 0;
//   const trackedROI = user.currentPackageROI || 0;

//   if (!elite && lockedROI === 0) lockedROI = roiCap[pkg] - trackedROI;

//   const totalUnlock = lockedROI + lockedBonus;

//   const payload = {
//     balance: (user.balance || 0) + totalUnlock,
//     withdrawable: (user.withdrawable || 0) + totalUnlock,
//     [`milestones/${pkg}/lockedROI`]: 0,
//     [`milestones/${pkg}/lockedBonus`]: 0,
//     [`milestones/${pkg}/earned`]: milestone.earned || extraRefs.length,
//     [`milestones/${pkg}/rewarded`]: true,
//     usedPackageRefs: [...(user.usedPackageRefs || []), ...extraRefs],
//   };

//   if (elite) {
//     const current = user.balance || 0;
//     const initial = milestone.initialCredit || 0;
//     const roiUnlocked = current - initial;

//     payload.withdrawable = (user.withdrawable || 0) + roiUnlocked;
//     payload.eliteLocked = false;
//     payload[`milestones/${pkg}/roiInjectedAtUnlock`] = true;

//     if (trackedROI >= roiCap.elite) {
//       payload.currentPackageROI = 0;
//       await update(userRef, { package: "" });
//     }
//   } else {
//     payload.currentPackageROI = 0;
//     await update(userRef, { package: "" });
//   }

//   await update(userRef, payload);
//   return true;
// }

// milestoneManager.jsx (Elite logic updated only, others unchanged)

// export async function checkAndUnlockMilestone(uid) {
//   const userRef = ref(db, `users/${uid}`);
//   const snapshot = await get(userRef);
//   if (!snapshot.exists()) return false;

//   const user = snapshot.val();
//   const pkg = user.package;
//   if (!pkg) return false;

//   const milestone = user.milestones?.[pkg] || {};
//   const previouslyConsumed = user.usedPackageRefs || [];
//   const startUsed = Object.values(user.usedReferrals || {}).flat();
//   const alreadyClaimed = new Set([...previouslyConsumed, ...startUsed]);

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
//     if (alreadyClaimed.has(ref.uid)) continue;

//     const refTierIdx = tierOrder.indexOf(ref.package);
//     if (refTierIdx < userTierIdx) continue;

//     // Elite users don't get bonus from same-tier elite refs
//     if (pkg !== "elite" && refTierIdx > userTierIdx) {
//       lockedBonus += bonusValues[ref.package] || 0;
//     }

//     earned++;
//     newRefsToConsume.push(ref.uid);
//     if (earned >= quota) break;
//   }

//   const milestoneAlreadyRewarded = milestone.rewarded;
//   const isNewlyQualified = earned >= quota && !milestoneAlreadyRewarded;

//   if (!isNewlyQualified) {
//     const partialUpdate = {
//       [`milestones/${pkg}/earned`]: earned,
//       [`milestones/${pkg}/lockedBonus`]: lockedBonus,
//       [`milestones/${pkg}/deadline`]:
//         milestone.deadline ||
//         Date.now() + (pkg === "elite" ? 30 : 21) * 24 * 60 * 60 * 1000,
//     };
//     await update(userRef, partialUpdate);
//     return false;
//   }

//   return await finalizeMilestoneUnlock(userRef, user, milestone, pkg, newRefsToConsume);
// }

// async function finalizeMilestoneUnlock(userRef, user, milestone, pkg, extraRefs = []) {
//   const now = Date.now();
//   const oneDay = 86400000;
//   const elite = pkg === "elite";

//   let lockedROI = milestone.lockedROI || 0;
//   let lockedBonus = milestone.lockedBonus || 0;
//   const trackedROI = user.currentPackageROI || 0;

//   if (!elite && lockedROI === 0) {
//     lockedROI = roiCap[pkg] - trackedROI;
//   }

//   const payload = {
//     withdrawable: (user.withdrawable || 0), // Base withdrawable
//     [`milestones/${pkg}/lockedROI`]: 0,
//     [`milestones/${pkg}/lockedBonus`]: 0,
//     [`milestones/${pkg}/earned`]: milestone.earned || extraRefs.length,
//     [`milestones/${pkg}/rewarded`]: true,
//     usedPackageRefs: [...(user.usedPackageRefs || []), ...extraRefs],
//   };

//   if (elite) {
//     const currentBalance = user.balance || 0;
//     const initialCredit = milestone.initialCredit || 0;
//     const retroactiveROI = currentBalance - initialCredit;

//     console.log(`💎 Elite Milestone Unlock:`);
//     console.log(`   Balance: ${currentBalance}`);
//     console.log(`   Initial Credit: ${initialCredit}`);
//     console.log(`   Retroactive ROI to unlock: ${retroactiveROI}`);

//     payload.withdrawable += retroactiveROI;
//     payload.eliteLocked = false;
//     payload[`milestones/${pkg}/roiInjectedAtUnlock`] = true;

//     if (trackedROI >= roiCap.elite) {
//       payload.currentPackageROI = 0;
//       console.log(`✅ Elite ROI cap hit, resetting package and ROI tracker.`);
//       await update(userRef, { package: "" });
//     } else {
//       console.log(`📈 Elite user has NOT reached ROI cap. Continuing ROI payout.`);
//     }

//     // ❌ Do NOT touch balance for elite — already correct.
//   } else {
//     // ✅ For non-elite users, unlock both ROI + bonus
//     payload.balance = (user.balance || 0) + lockedROI + lockedBonus;
//     payload.withdrawable += lockedROI + lockedBonus;
//     payload.currentPackageROI = 0;

//     console.log(`🔓 Non-elite Milestone Unlock`);
//     console.log(`   ROI Unlock: ${lockedROI}`);
//     console.log(`   Bonus Unlock: ${lockedBonus}`);
//     await update(userRef, { package: "" });
//   }

//   await update(userRef, payload);
//   return true;
// }

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

      console.log(
        `💰 Rs.${bonus} bonus added to balance (locked) for ${uid}, total lockedBonus=${lockedBonus}`
      );
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
    console.log(
      `📊 Partial milestone update for ${uid}: earned=${earned}, total lockedBonus=${lockedBonus}`
    );
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

  // if (elite) {
  //   const currentBalance = user.balance || 0;
  //   const initialCredit = milestone.initialCredit || 0;
  //   const retroactiveROI = currentBalance - initialCredit;

  //   console.log(`💎 Elite Milestone Unlock:`);
  //   console.log(`   Balance: ${currentBalance}`);
  //   console.log(`   Initial Credit: ${initialCredit}`);
  //   console.log(`   Retroactive ROI unlocked: ${retroactiveROI}`);

  // update start for ELite ROI
  if (elite) {
    const roi = user.roiTracker?.elite || 0;
    const retroactiveROI = roi;

    console.log(`💎 Elite Milestone Unlock:`);
    console.log(`   ROI Tracked: ${roi}`);
    console.log(`   Retroactive ROI unlocked: ${retroactiveROI}`);

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
      console.log(`✅ Elite ROI cap hit. Resetting elite package.`);
      await update(userRef, { package: "" });
    } else {
      console.log(`📈 Elite user still earning ROI.`);
    }
  } else {
    payload.balance = (user.balance || 0) + remainingROIbalance; // Already updated above
    payload.withdrawable += lockedROI + lockedBonus;
    payload.currentPackageROI = 0;

    console.log(`🔓 Non-elite Milestone Unlock`);
    console.log(`   ROI Unlock: ${lockedROI}`);
    console.log(`   Bonus Unlock: ${lockedBonus}`);
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
