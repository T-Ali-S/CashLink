// import { ref, get, runTransaction } from "firebase/database";
// import { db } from "../../firebase";

// const tierAmount = {
//   bronze: 3000,
//   silver: 5000,
//   gold: 10000,
//   platinum: 50000,
//   elite: 100000,
// };

// const roiCap = {
//   bronze: 6300,
//   silver: 10500,
//   gold: 21000,
//   platinum: 105000,
//   elite: 150000,
// };

// // export async function applyDailyROI(uid) {
// //   const userRef = ref(db, `users/${uid}`);
// //   const snapshot = await get(userRef);
// //   if (!snapshot.exists()) {
// //     console.warn(`❌ No user data found for UID: ${uid}`);
// //     return null;
// //   }

// //   const userData = snapshot.val();
// //   const { package: pkg } = userData;
// //   if (!pkg) {
// //     console.warn(`⚠️ No package assigned for UID: ${uid}`);
// //     return null;
// //   }

// //   const rate = userData.eliteRate || 10;
// //   const dailyAmount = (tierAmount[pkg] * rate) / 100;
// //   const now = Date.now();
// //   const last = userData.lastPayoutAt || 0;
// //   const oneDay = 24 * 60 * 60 * 1000;

// //   if (now - last < oneDay) {
// //     console.log(`⏱️ ROI already applied within 24h for ${uid}`);
// //     return null;
// //   }

// //   const maxCap = roiCap[pkg];
// //   const nextBalance = (userData.balance || 0) + dailyAmount;
// //   if (nextBalance > maxCap) {
// //     console.log(`💰 Cap reached for ${uid}, skipping ROI`);
// //     return null;
// //   }

// //   // Firebase Transaction
// //   await runTransaction(userRef, (data) => {
// //     if (!data) {
// //       console.warn(`⛔ runTransaction found no data for ${uid}`);
// //       return data;
// //     }

// //     // const last = data.lastPayoutAt || 0;
// //     // const now = Date.now();
// //     // const oneDay = 24 * 60 * 60 * 1000;
// //     // if (now - last < oneDay) {
// //     //   console.log(`⏱️ Duplicate ROI block inside transaction for ${uid}`);
// //     //   return data;
// //     // }

// //     const rate = data.eliteRate || 10;
// //     const dailyAmount = (tierAmount[data.package] * rate) / 100;

// //     const last = data.lastPayoutAt || 0;
// //     const now = Date.now();
// //     const interval = 6000; // ✅ 6 seconds for testing, change to 24*60*60*1000 later

// //     const missedPeriods = Math.floor((now - last) / interval);
// //     if (missedPeriods <= 0) return data;

// //     const totalEarned = dailyAmount * missedPeriods;

// //     const pkg = data.package;
// //     const milestone = data.milestones?.[pkg] || {};
// //     const milestoneCompleted = milestone.rewarded || false;

// //     data.balance = (data.balance || 0) + totalEarned;

// //     // update start
// //     // Track elite ROI separately
// //     data.roiTracker = data.roiTracker || {};
// //     data.roiTracker[data.package] =
// //       (data.roiTracker[data.package] || 0) + totalEarned;
// //     // update end

// //     if (pkg === "elite") {
// //       const canWithdrawElite = !data.eliteLocked;
// //       if (canWithdrawElite) {
// //         data.withdrawable = (data.withdrawable || 0) + totalEarned;
// //       } else {
// //         milestone.lockedROI = (milestone.lockedROI || 0) + totalEarned;
// //         data.currentPackageROI = (data.currentPackageROI || 0) + totalEarned;
// //       }
// //     } else {
// //       if (milestoneCompleted) {
// //         data.withdrawable = (data.withdrawable || 0) + totalEarned;
// //       } else {
// //         milestone.lockedROI = (milestone.lockedROI || 0) + totalEarned;
// //         data.currentPackageROI = (data.currentPackageROI || 0) + totalEarned;
// //       }
// //     }

// //     data.milestones = {
// //       ...data.milestones,
// //       [pkg]: milestone,
// //     };

// //     data.lastPayoutAt = last + missedPeriods * interval;
// //     return data;
// //   });

// //   const postSnapshot = await get(userRef);
// //   const postData = postSnapshot.val();
// //   // console.log("📬 Post-transaction user data:", postData);
// //   console.log(`✅ Daily ROI added for ${uid}: Rs. ${dailyAmount}`);
// //   return dailyAmount;
// // }
// export async function applyDailyROI(uid) {
//   const userRef = ref(db, `users/${uid}`);
//   const snapshot = await get(userRef);
//   if (!snapshot.exists()) {
//     console.warn(`❌ No user data found for UID: ${uid}`);
//     return null;
//   }

//   const userData = snapshot.val();
//   const { package: pkg } = userData;
//   if (!pkg) {
//     console.warn(`⚠️ No package assigned for UID: ${uid}`);
//     return null;
//   }

//   const rate = userData.eliteRate || 10;
//   const dailyAmount = (tierAmount[pkg] * rate) / 100;
//   const now = Date.now();
//   const last = userData.lastPayoutAt || 0;
//   const interval = 6000; // ⏱️ 6 seconds for testing

//   const elapsed = now - last;
//   if (elapsed < interval) {
//     console.log(
//       `⏱️ ROI SKIPPED for ${uid} — only ${elapsed}ms passed, waiting for ${interval}ms`
//     );
//     return null;
//   }

//   const maxCap = roiCap[pkg];
//   const currentROI = userData.roiTracker?.[pkg] || 0;
//   const roiRemaining = maxCap - currentROI;
//   const missedPeriods = Math.floor(elapsed / interval);
//   const potentialEarned = dailyAmount * missedPeriods;

//   if (roiRemaining <= 0) {
//     console.log(
//       `💰 ROI SKIPPED for ${uid} — ROI cap (${maxCap}) already reached`
//     );
//     return 0;
//   }

//   const actualEarned = Math.min(roiRemaining, potentialEarned);
//   console.log(
//     `✅ Applying ROI for ${uid}: missedPeriods=${missedPeriods}, actualEarned=${actualEarned}, roiRemaining=${roiRemaining}`
//   );

//   // Firebase Transaction
//   // await runTransaction(userRef, (data) => {
//   //   if (!data) {
//   //     console.warn(`⛔ runTransaction found no data for ${uid}`);
//   //     return data;
//   //   }

//   //   const pkg = data.package;
//   //   const milestone = data.milestones?.[pkg] || {};
//   //   const milestoneCompleted = milestone.rewarded || false;

//   //   data.balance = (data.balance || 0) + actualEarned;

//   //   // Track ROI separately
//   //   data.roiTracker = data.roiTracker || {};
//   //   data.roiTracker[pkg] = (data.roiTracker[pkg] || 0) + actualEarned;

//   //   if (pkg === "elite") {
//   //     const canWithdrawElite = !data.eliteLocked;
//   //     if (canWithdrawElite) {
//   //       data.withdrawable = (data.withdrawable || 0) + actualEarned;
//   //     } else {
//   //       milestone.lockedROI = (milestone.lockedROI || 0) + actualEarned;
//   //       data.currentPackageROI = (data.currentPackageROI || 0) + actualEarned;
//   //     }
//   //   } else {
//   //     if (milestoneCompleted) {
//   //       data.withdrawable = (data.withdrawable || 0) + actualEarned;
//   //     } else {
//   //       milestone.lockedROI = (milestone.lockedROI || 0) + actualEarned;
//   //       data.currentPackageROI = (data.currentPackageROI || 0) + actualEarned;
//   //     }
//   //   }

//   //   data.milestones = {
//   //     ...data.milestones,
//   //     [pkg]: milestone,
//   //   };

//   //   data.lastPayoutAt = last + missedPeriods * interval;
//   //   return data;
//   // });
//   await runTransaction(userRef, (data) => {
//     if (!data) return data;

//     const pkg = data.package;
//     const milestone = data.milestones?.[pkg] || {};
//     const milestoneCompleted = milestone.rewarded || false;

//     const rate = data.eliteRate || 10;
//     const dailyAmount = (tierAmount[pkg] * rate) / 100;

//     const last = data.lastPayoutAt || 0;
//     const now = Date.now();
//     const interval = 6000;
//     const missedPeriods = Math.floor((now - last) / interval);
//     if (missedPeriods <= 0) return data;

//     const potentialEarned = dailyAmount * missedPeriods;

//     // ✅ Recalculate cap inside transaction
//     data.roiTracker = data.roiTracker || {};
//     const currentROI = data.roiTracker[pkg] || 0;
//     const roiRemaining = roiCap[pkg] - currentROI;

//     const actualEarned = Math.min(roiRemaining, potentialEarned);
//     if (actualEarned <= 0) {
//       console.log(`⚠️ Skipping ROI inside transaction for ${uid} — cap hit`);
//       return data;
//     }

//     data.balance = (data.balance || 0) + actualEarned;
//     data.roiTracker[pkg] = currentROI + actualEarned;

//     if (pkg === "elite") {
//       const canWithdrawElite = !data.eliteLocked;
//       if (canWithdrawElite) {
//         data.withdrawable = (data.withdrawable || 0) + actualEarned;
//       } else {
//         milestone.lockedROI = (milestone.lockedROI || 0) + actualEarned;
//         data.currentPackageROI = (data.currentPackageROI || 0) + actualEarned;
//       }
//     } else {
//       if (milestoneCompleted) {
//         data.withdrawable = (data.withdrawable || 0) + actualEarned;
//       } else {
//         milestone.lockedROI = (milestone.lockedROI || 0) + actualEarned;
//         data.currentPackageROI = (data.currentPackageROI || 0) + actualEarned;
//       }
//     }

//     data.milestones = {
//       ...data.milestones,
//       [pkg]: milestone,
//     };

//     data.lastPayoutAt = last + missedPeriods * interval;
//     return data;
//   });

//   console.log(`📬 ROI transaction completed for ${uid}`);
//   return actualEarned;
// }

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

  const elapsed = now - last;
  if (elapsed < interval) {
    console.log(
      `⏱️ ROI SKIPPED for ${uid} — only ${elapsed}ms passed, waiting for ${interval}ms`
    );
    return null;
  }

  const maxCap = roiCap[pkg];
  const currentROI = userData.roiTracker?.[pkg] || 0;
  const roiRemaining = maxCap - currentROI;
  const missedPeriods = Math.floor(elapsed / interval);
  const potentialEarned = dailyAmount * missedPeriods;

  if (roiRemaining <= 0) {
    console.log(
      `💰 ROI SKIPPED for ${uid} — ROI cap (${maxCap}) already reached`
    );
    return 0;
  }

  const actualEarned = Math.min(roiRemaining, potentialEarned);
  console.log(
    `✅ Applying ROI for ${uid}: missedPeriods=${missedPeriods}, actualEarned=${actualEarned}, roiRemaining=${roiRemaining}`
  );

  await runTransaction(userRef, (data) => {
    if (!data) return data;

    const pkg = data.package;
    const rate = data.eliteRate || 10;
    const dailyAmount = (tierAmount[pkg] * rate) / 100;
    const now = Date.now();
    const last = data.lastPayoutAt || 0;
    const interval = 24 * 60 * 60 * 1000;
    const missedPeriods = Math.floor((now - last) / interval);
    if (missedPeriods <= 0) return data;

    const potentialEarned = dailyAmount * missedPeriods;
    const currentROI = data.roiTracker?.[pkg] || 0;
    const roiRemaining = roiCap[pkg] - currentROI;
    const actualEarned = Math.min(roiRemaining, potentialEarned);

    if (actualEarned <= 0) {
      console.log(`⚠️ Skipping ROI inside transaction for ${uid} — cap hit`);
      return data;
    }

    // ✅ Safe balance/withdrawable update within cap
    const newBalance = (data.balance || 0) + actualEarned;
    data.balance = Math.min(newBalance, roiCap[pkg]);

    data.roiTracker = data.roiTracker || {};
    data.roiTracker[pkg] = Math.min(currentROI + actualEarned, roiCap[pkg]);

    const milestone = data.milestones?.[pkg] || {};
    const milestoneCompleted = milestone.rewarded || false;

    if (pkg === "elite") {
      const canWithdrawElite = !data.eliteLocked;
      if (canWithdrawElite) {
        const newWithdrawable = (data.withdrawable || 0) + actualEarned;
        data.withdrawable = Math.min(newWithdrawable, roiCap[pkg]);
      } else {
        milestone.lockedROI = (milestone.lockedROI || 0) + actualEarned;
        data.currentPackageROI = (data.currentPackageROI || 0) + actualEarned;
      }
    } else {
      if (milestoneCompleted) {
        const newWithdrawable = (data.withdrawable || 0) + actualEarned;
        data.withdrawable = Math.min(newWithdrawable, roiCap[pkg]);
      } else {
        milestone.lockedROI = (milestone.lockedROI || 0) + actualEarned;
        data.currentPackageROI = (data.currentPackageROI || 0) + actualEarned;
      }
    }

    data.milestones = {
      ...data.milestones,
      [pkg]: milestone,
    };

    data.lastPayoutAt = last + missedPeriods * interval;
    return data;
  });

  console.log(`📬 ROI transaction completed for ${uid}`);
  return actualEarned;
}
