import { Navigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";

export default function RequireAdmin({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return setIsAuthorized(false);

    get(ref(db, `users/${user.uid}`)).then((snapshot) => {
      const role = snapshot.val()?.role;
      setIsAuthorized(role === "admin");
    });
  }, []);

  if (isAuthorized === null) return null; // or loading spinner
  if (!isAuthorized) return <Navigate to="/" replace />;

  return children;
}