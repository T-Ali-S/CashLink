import { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ref, get, update } from "firebase/database";

export default function InitLiveTracker() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await get(ref(db, `users/${user.uid}/role`));
        const role = snap.exists() ? snap.val() : null;
        if (role === "admin") {
          setIsAdmin(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const trackerRef = ref(db, "liveTracker");
    get(trackerRef).then((snapshot) => {
      if (!snapshot.exists()) {
        update(trackerRef, {
          total: 150000000,
          goalStart: 150000000,
          goalEnd: 200000000,
          lastGoalAchievedAt: null,
        }).then(() => {
          ""
        });
      }
    });
  }, [isAdmin]);

  return null;
}