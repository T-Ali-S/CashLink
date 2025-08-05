// import { get, ref } from "firebase/database";
// import { db } from "../../firebase";

// export const getLiveTrackerTotal = async () => {

//   const snap = await get(ref(db, "liveTracker/total"));
//   return snap.exists() ? snap.val() : 0;
// };

import { get, ref } from "firebase/database";
import { auth, db } from "../../firebase"; // Import auth too

export const getLiveTrackerTotal = async () => {
  const user = auth.currentUser;
  if (!user) return 0; // Prevent error after logout

  try {
    const snap = await get(ref(db, "liveTracker/total"));
    return snap.exists() ? snap.val() : 0;
  } catch (err) {
    console.error("🔥 Live tracker fetch failed:", err.message);
    return 0;
  }
};
