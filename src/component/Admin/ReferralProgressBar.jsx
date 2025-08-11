import React from "react";

export default function ReferralProgressBar({ milestone }) {
  if (!milestone) return null;

  const { goal, earned, deadline } = milestone;
  const percent = Math.min((earned / goal) * 100, 100);

  const now = Date.now();
  const timeLeft = deadline - now;
  const daysLeft = Math.max(Math.floor(timeLeft / (1000 * 60 * 60 * 24)), 0);

  let barColor = "bg-green-500";
  if (daysLeft <= 5) barColor = "bg-red-500";
  else if (daysLeft <= 10) barColor = "bg-yellow-500";

  return (
    <div className="mt-4 mb-6">
      <h4 className="font-semibold  text-yellow-400 text-2xl text-center mb-5">Referral Progress</h4>
      <div className="w-full bg-gray-700 rounded-full h-4">
        <div
          className={`${barColor} h-4 rounded-full transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="text-xs text-black mt-3">
        {earned} / {goal} referrals completed
        {daysLeft > 0
          ? ` • ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
          : " • Deadline passed"}
      </p>
    </div>
  );
}

