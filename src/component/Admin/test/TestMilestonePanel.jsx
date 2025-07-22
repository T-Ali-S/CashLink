import { useState } from "react";
import { simulateMilestoneUnlock } from "../../utils/milestoneTester";

export default function TestMilestonePanel() {
  const [uid, setUid] = useState("");
  const [pkg, setPkg] = useState("platinum");
  const [snapshot, setSnapshot] = useState(null);

  const handleSimulate = async () => {
    if (!uid) return alert("Enter a UID");
    await simulateMilestoneUnlock(uid, pkg);
  };

  return (
    <div className="p-6 bg-gray-900 text-white rounded m-5">
      <h2 className="text-xl mb-4 font-semibold text-yellow-400">
        🧪 Milestone Test Panel
      </h2>

      <input
        placeholder="Enter UID..."
        className="px-3 py-2 mb-2 w-full text-black rounded"
        value={uid}
        onChange={(e) => setUid(e.target.value)}
      />

      <select
        value={pkg}
        onChange={(e) => setPkg(e.target.value)}
        className="px-3 py-2 mb-4 text-black rounded"
      >
        <option value="bronze">Bronze</option>
        <option value="silver">Silver</option>
        <option value="gold">Gold</option>
        <option value="platinum">Platinum</option>
        <option value="elite">Elite</option>
      </select>

      <button
        onClick={handleSimulate}
        className="bg-yellow-400 hover:bg-yellow-500 text-black m-5 px-4 py-2 rounded"
      >
        Simulate Milestone Unlock
      </button>
      {snapshot && (
        <div className="mt-6 p-4 bg-gray-800 rounded text-sm">
          <h3 className="text-yellow-400 font-bold mb-2">
            🔍 Post-Unlock Snapshot
          </h3>
          <p>
            <strong>Package:</strong> {snapshot.package}
          </p>
          <p>
            <strong>Balance:</strong> ₹{snapshot.balance}
          </p>
          <p>
            <strong>Withdrawable:</strong> ₹{snapshot.withdrawable}
          </p>
          <p>
            <strong>Locked ROI:</strong> ₹
            {snapshot.milestones?.[snapshot.package]?.lockedROI || 0}
          </p>
          <p>
            <strong>Bonus Locked:</strong> ₹
            {snapshot.milestones?.[snapshot.package]?.lockedBonus || 0}
          </p>
          <p>
            <strong>Milestone Status:</strong>{" "}
            {snapshot.milestones?.[snapshot.package]?.rewarded
              ? "✅ Fulfilled"
              : "❌ Pending"}
          </p>
        </div>
      )}
    </div>
  );
}
