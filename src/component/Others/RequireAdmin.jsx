import { Navigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";

export default function RequireAdmin({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthorized(false);
        return;
      }

      const snapshot = await get(ref(db, `users/${user.uid}`));
      const role = snapshot.val()?.role;
      setIsAuthorized(role === "admin");
    });

    return () => unsubscribe();
  }, []);

  if (isAuthorized === null) return null; // Or loading spinner
  if (!isAuthorized) return <Navigate to="/" replace />;

  return children;
}
