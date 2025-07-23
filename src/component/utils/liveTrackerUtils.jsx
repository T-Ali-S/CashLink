import { get, ref } from "firebase/database";
import { db } from "../../firebase";

export const getLiveTrackerTotal = async () => {
  const snap = await get(ref(db, "liveTracker/total"));
  return snap.exists() ? snap.val() : 0;
};
