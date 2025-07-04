import React,{ useEffect, useState } from 'react'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Navbar from './component/common/navbar'
import Signin from './component/common/signIn'
import Home from './component/common/Home';
import Signup from './component/common/signUp';
import Profile from './component/Others/profile';
import AdminDashboard from './component/Admin/AdminDashboard';
import RequireAdmin from './component/Others/RequireAdmin';
import ManageUser from "./component/Admin/user/uid";
import StartWithNothing from './component/Others/StartWithNothing';
import NotificationPanel from './component/Others/NotificationPanel';
import Withdraw from './component/Others/Withdraw';
import TransactionLog from './component/Others/TransactionLog';
import TransactionAdminView from './component/Admin/user/TransactionAdminView';


function App() {
  const router = createBrowserRouter([
    {
      path:"/",
      element:(
        <>
        <Navbar/>
        <Home/>
        </>
      )
    },
    {
    path: "/admin",
    element: (
      <RequireAdmin>
        <Navbar />
        <AdminDashboard />
      </RequireAdmin>
    ),
  },
  {
    path:"/admin/user/:uid",
    element:(
      <RequireAdmin>
        <Navbar />
        <ManageUser />
      </RequireAdmin>
    )
  },

    {
     path:"/Signin",
     element:(
      <>
      <Navbar/>
      <Signin/>
      </>
     )
      
    },{
      path:"/Signup",
      element:(
        <>
        <Navbar/>
        <Signup/>
        </>
      )
    },{
      path:"/profile",
      element:(
        <>
        <Navbar/>
        <Profile/>
        </>
      )
    },
    {
  path: "/start-with-nothing",
  element: (
    <>
      <Navbar />
      <StartWithNothing/>
    </>
  ),
},
    {
  path: "/NotificationPanel",
  element: (
    <>
      <Navbar />
      <NotificationPanel />
    </>
  ),
}
,
    {
  path: "/withdraw",
  element: (
    <>
      <Navbar />
      <Withdraw />
    </>
  ),
}
,
    {
  path: "/transactions",
  element: (
    <>
      <Navbar />
      <TransactionLog />
    </>
  ),
}
,
    {
  path: "/transactionsAdminView",
  element: (
    <>
      <Navbar />
      <TransactionAdminView />
    </>
  ),
}

  ])

  return <RouterProvider router={router} />;
}

export default App
