// component/utils/RewardManager.js

import { ref, get, update } from "firebase/database";
import { db } from "../../firebase";
import { sendNotification } from "./sendNotification"; // Already in your utils folder

export const RewardManager = {
  async addMilestoneReward(userId, tier, amount) {
    const userSnap = await get(ref(db, `users/${userId}`));
    if (!userSnap.exists()) return;

    const user = userSnap.val();
    const currentBalance = user.balance || 0;
    const currentWithdrawable = user.withdrawable || 0;

    const newBalance = currentBalance + amount;
    const newWithdrawable = currentWithdrawable + amount;

    await update(ref(db, `users/${userId}`), {
      balance: newBalance,
      withdrawable: newWithdrawable,
    });

    await sendNotification(
      userId,
      "🎯 Milestone Achieved!",
      `You've earned Rs. ${amount} for hitting the ${tier} referral target.`
    );
  },

  async addPackageReward(userId, tier, reward) {
    // Called during package assignment
    const userSnap = await get(ref(db, `users/${userId}`));
    if (!userSnap.exists()) return;

    const user = userSnap.val();
    const newBalance = (user.balance || 0) + reward;
    const newWithdrawable = (user.withdrawable || 0) + reward;

    await update(ref(db, `users/${userId}`), {
      balance: newBalance,
      withdrawable: newWithdrawable,
    });

    await sendNotification(
      userId,
      "💼 Package Activated!",
      `You've received Rs. ${reward} as initial activation reward for the ${tier} package.`
    );
  },

  async addDailyROI(userId, roiAmount) {
    // Called in Home.jsx during daily ROI
    const userSnap = await get(ref(db, `users/${userId}`));
    if (!userSnap.exists()) return;

    const user = userSnap.val();
    const balance = user.balance || 0;
    const withdrawable = user.withdrawable || 0;

    const newBalance = balance + roiAmount;
    const newWithdrawable = withdrawable + roiAmount;

    await update(ref(db, `users/${userId}`), {
      balance: newBalance,
      withdrawable: newWithdrawable,
      lastPayoutAt: Date.now(),
    });

    await sendNotification(
      userId,
      "⏳ Daily ROI Added",
      `You've earned Rs. ${roiAmount} as your daily package return.`
    );
  },

  async addAdminBonus(userId, bonusAmount, customMsg = null) {
    const userSnap = await get(ref(db, `users/${userId}`));
    if (!userSnap.exists()) return;

    const user = userSnap.val();
    const balance = user.balance || 0;
    const withdrawable = user.withdrawable || 0;
    const bonusWithdrawable = user.bonusWithdrawable || 0;

    await update(ref(db, `users/${userId}`), {
      balance: balance + bonusAmount,
      withdrawable: withdrawable + bonusAmount,
      bonusWithdrawable: bonusWithdrawable + bonusAmount,
    });

    await sendNotification(
      userId,
      "🎁 Bonus Credited!",
      customMsg ||
        `You've received Rs. ${bonusAmount} as a milestone or admin reward.`
    );
  },
};