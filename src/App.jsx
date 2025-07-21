import React, { useEffect, useState } from "react";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import Navbar from "./component/common/navbar";
import Signin from "./component/common/signIn";
import Home from "./component/common/Home";
import Signup from "./component/common/signUp";
import Profile from "./component/Others/profile";
import AdminDashboard from "./component/Admin/AdminDashboard";
import RequireAdmin from "./component/Others/RequireAdmin";
import ManageUser from "./component/Admin/user/uid";
import StartWithNothing from "./component/Others/StartWithNothing";
import NotificationPanel from "./component/Others/NotificationPanel";
import Withdraw from "./component/Others/Withdraw";
import TransactionLog from "./component/Others/TransactionLog";
import TransactionAdminView from "./component/Admin/user/TransactionAdminView";
import DistributeBonus from "./component/Admin/DistributeBonus";
import InitLiveTracker from "./component/common/InitLiveTracker";
import { auth } from "./firebase";
import Contact from "./component/common/Contact";
import { useContext } from "react";
import { AlertContext } from "./component/context/AlertContext";
import Alert from "./component/common/Alert";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "./firebase";
import { ref, get } from "firebase/database";

function App() {
  const [userData, setUserData] = useState(null);

  function WithNavbar({ children }) {
    return (
      <>
        <Navbar userData={userData} />
        {children}
      </>
    );
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snap = await get(ref(db, `users/${user.uid}`));
        if (snap.exists()) {
          const data = snap.val();
          setUserData({
            ...data,
            uid: user.uid,
            role: data.role || "user",
          });
        }
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <WithNavbar>
          <Home />
        </WithNavbar>
      ),
    },
    {
      path: "/admin",
      element: (
        <RequireAdmin>
          <WithNavbar>
            <AdminDashboard />
          </WithNavbar>
        </RequireAdmin>
      ),
    },
    {
      path: "/admin/user/:uid",
      element: (
        <RequireAdmin>
          <WithNavbar>
            <ManageUser />
          </WithNavbar>
        </RequireAdmin>
      ),
    },

    {
      path: "/Signin",
      element: (
        <>
          {/* <WithNavbar>

          <Signin />
          </WithNavbar> */}
          {userData === null ? (
             <WithNavbar>
              <Signin />
          </WithNavbar> 
          ) : userData.role === "admin" ? (
            <RequireAdmin>
              <Navigate to="/admin" />
            </RequireAdmin>
          ) : (
            <Navigate to="/" />
          )}

          {/* {
            user ? <Navigate to="/" />: <Signin/>
          } */}
        </>
      ),
    },
    {
      path: "/Signup",
      element: (
        <>
          {/* <WithNavbar>
            <Signup />
          </WithNavbar> */}

          {userData === null ? (
             <WithNavbar>
              <Signup />
          </WithNavbar> 
          ) : userData.role === "admin" ? (
            <RequireAdmin>
              <Navigate to="/admin" />
            </RequireAdmin>
          ) : (
            <Navigate to="/" />
          )}
        </>
      ),
    },
    {
      path: "/profile",
      element: (
        <>
          <WithNavbar>
            <Profile />
          </WithNavbar>
        </>
      ),
    },
    {
      path: "/contact",
      element: (
        <>
          <WithNavbar>
            <Contact />
          </WithNavbar>
        </>
      ),
    },
    {
      path: "/start-with-nothing",
      element: (
        <>
          <WithNavbar>
            <StartWithNothing />
          </WithNavbar>
        </>
      ),
    },
    {
      path: "/NotificationPanel",
      element: (
        <>
          <WithNavbar>
            <NotificationPanel />
          </WithNavbar>
        </>
      ),
    },
    {
      path: "/withdraw",
      element: (
        <>
          <WithNavbar>
            <Withdraw />
          </WithNavbar>
        </>
      ),
    },
    {
      path: "/transactions",
      element: (
        <>
          <WithNavbar>
            <TransactionLog />
          </WithNavbar>
        </>
      ),
    },
    {
      path: "/transactionsAdminView",
      element: (
        <>
          <WithNavbar>
            <RequireAdmin>
              <TransactionAdminView />
            </RequireAdmin>
            
          </WithNavbar>
        </>
      ),
    },
    {
      path: "/distribute-bonus",
      element: (
        <>
          <WithNavbar>
            <RequireAdmin>
              <DistributeBonus />
            </RequireAdmin>
          </WithNavbar>
        </>
      ),
    },
  ]);

  return (
    <>
      {!import.meta.env.PROD && <InitLiveTracker />}
      <RouterProvider router={router} />
    </>
  );
}

export default App;
