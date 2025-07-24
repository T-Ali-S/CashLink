import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue, get } from "firebase/database";
import { db, auth } from "../../firebase";
import AdminLayout from "../Admin/AdminLayout";
import { useAdminTab } from "../context/AdminTabContext";
import { getLiveTrackerTotal } from "../utils/liveTrackerUtils";
import { useChat } from "../context/ChatContext";

export default function MainAdminDashboard() {
  const navigate = useNavigate();
  const [userCounts, setUserCounts] = useState({
    bronze: 0,
    silver: 0,
    gold: 0,
    platinum: 0,
    elite: 0,
  });
  const [transactions, setTransactions] = useState({
    pending: 0,
    processing: 0,
    completed: 0,
  });
  const [activeUsers, setActiveUsers] = useState(0);
  const [liveTrackerAmount, setLiveTrackerAmount] = useState(0);
  const [bonusTotal, setBonusTotal] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { unreadCount } = useChat();
  const [adminUser, setAdminUser] = useState(null);
  const { setTransactionFilter, setTab } = useAdminTab();

  function ChatCard() {
    const { setTab } = useAdminTab();
    const navigate = useNavigate();

    const handleClick = () => {
      setTab("chat");
      navigate("/admin/users");
    };

    return (
      <div onClick={handleClick} className="your-card-class">
        🗨️ Chat
      </div>
    );
  }
  ///////////Tracking active pacakge
  
  useEffect(() => {
  const fetchPackageCounts = async () => {
    const snapshot = await get(ref(db, "users"));
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    const counts = {
      bronze: 0,
      silver: 0,
      gold: 0,
      platinum: 0,
      elite: 0,
    };

    for (const uid in data) {
      const user = data[uid];
      const pkg = user?.package?.toLowerCase(); // safely handle undefined
      console.log(`🧾 User ${uid} has package: ${pkg}`);
      if (pkg && counts.hasOwnProperty(pkg)) {
        counts[pkg]++;
      }
    }

    console.log("📊 Count result:", counts);
    setUserCounts(counts); // <-- this is the correct function
  };

  fetchPackageCounts();
}, []);


  //////////////withdraw card
  useEffect(() => {
    const withdrawalRef = ref(db, "withdrawals");

    onValue(withdrawalRef, (snap) => {
      if (!snap.exists()) return;
      let pending = 0;
      let processing = 0;
      let completed = 0;

      const data = snap.val();
      for (const userId in data) {
        for (const txnId in data[userId]) {
          const txn = data[userId][txnId];
          if (txn.status === "Pending") pending++;
          else if (txn.status === "Processing") processing++;
          else if (txn.status === "Approved") completed++;
        }
      }

      setTransactions({ pending, processing, completed });
    });
  }, []);

  ///////////LiveTracker Goal
  useEffect(() => {
    const trackerRef = ref(db, "liveTracker/total");
    onValue(trackerRef, (snap) => {
      if (snap.exists()) setLiveTrackerAmount(snap.val());
    });
  }, []);

  useEffect(() => {
    const chatRef = ref(db, "chats");
    onValue(chatRef, (snap) => {
      if (!snap.exists()) return;
      let count = 0;

      Object.values(snap.val()).forEach((chatList) => {
        Object.values(chatList).forEach((msg) => {
          if (msg.from === "user" && msg.read === false) {
            count++;
          }
        });
      });

      setUnreadMessages(count);
    });
  }, []);

  const Card = ({ title, value, onClick, extra }) => (
    <div
      className={`bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-lg shadow-md ${
        onClick ? "cursor-pointer" : "cursor-default"
      } break-words w-full min-w-0`}
      onClick={onClick}
    >
      <h4 className="text-xl font-semibold truncate">{title}</h4>
      <p className="text-2xl mt-2 break-words overflow-hidden text-ellipsis max-w-full text-wrap">
        {value}
      </p>
      {extra && (
        <p className="text-sm mt-1 text-white/80 break-words max-w-full text-wrap">
          {extra}
        </p>
      )}
    </div>
  );

  useEffect(() => {
    const fetchLiveTotal = async () => {
      const total = await getLiveTrackerTotal();
      setLiveTrackerAmount(total);
    };
    fetchLiveTotal();
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const dbRef = ref(db, `users/${user.uid}`);
      get(dbRef).then((snap) => {
        if (snap.exists()) {
          const data = snap.val();
          setAdminUser({
            ...user,
            displayName: data.name,
            photoURL: data.avatarUrl,
          });
        }
      });
    }
  }, []);

  /////////Testing users Pacakges data from database

  useEffect(() => {
    const usersRef = ref(db, "users");
    const unsub = onValue(usersRef, (snap) => {
      if (!snap.exists()) return;
      const users = snap.val();

      let active = 0;
      let bronze = 0,
        silver = 0,
        gold = 0,
        platinum = 0,
        elite = 0;
      let bonusSum = 0;

      Object.entries(users).forEach(([uid, user]) => {
        console.log(`🧾 User ${uid} has package:`, user.package);

        if (user.package) {
          active++;
          if (user.package === "Bronze") bronze++;
          if (user.package === "Silver") silver++;
          if (user.package === "Gold") gold++;
          if (user.package === "Platinum") platinum++;
          if (user.package === "Elite") elite++;
        }
        bonusSum += user.bonusWithdrawable || 0;
      });

      console.log("📊 Count result:", {
        bronze,
        silver,
        gold,
        platinum,
        elite,
      });

      setActiveUsers(active);
      setUserCounts({ bronze, silver, gold, platinum, elite });
      setBonusTotal(bonusSum);
    });

    return () => unsub();
  }, []);

  return (
    <AdminLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Top Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-gray-800 p-6 rounded-xl text-white">
          <div className="flex items-center gap-4">
            <img
              src={adminUser?.photoURL || "/avatars/admin.png"}
              alt="Admin"
              className="w-16 h-16 rounded-full border"
            />
            <div>
              <h2 className="text-4xl font-bold">
                {adminUser?.displayName || "Admin User"}
              </h2>
              <p className="text-gray-300 text-lg">{adminUser?.email}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full lg:w-auto">
            <Card
              title="Activate a Package"
              value="➡"
              onClick={() => {
                setTab("main");
                navigate("/admin/users");
              }}
            />
            <Card title="Active Users" value={activeUsers} />
            <Card
              value="💬"
              title="Chat"
              onClick={() => {
                setTab("chat");
                navigate("/admin/users");
              }}
            />
            <Card title="Live Tracker" value={`Rs. ${liveTrackerAmount}`} />
          </div>
        </div>

        {/* Grid Section */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-10">
          {/* Package Stats */}
          <Card
            title="BP"
            value={userCounts.bronze}
            extra="Bronze Package Users"
          />
          <Card
            title="SP"
            value={userCounts.silver}
            extra="Silver Package Users"
          />
          <Card title="GP" value={userCounts.gold} extra="Gold Package Users" />
          <Card
            title="PP"
            value={userCounts.platinum}
            extra="Platinum Package Users"
          />
          <Card
            title="EP"
            value={userCounts.elite}
            extra="Elite Package Users"
          />

          {/* Transaction & Bonus Stats */}
          <Card
            title="PT"
            value={transactions.pending}
            extra="Pending Transactions"
            onClick={() => {
              setTransactionFilter("Pending");
              navigate("/admin/users");
              setTab("withdrawals");
            }}
          />
          <Card
            title="PT"
            value={transactions.processing}
            extra="Processing Transactions"
            onClick={() => {
              setTransactionFilter("Processing");
              navigate("/admin/users");
              setTab("withdrawals");
            }}
          />
          <Card
            title="TC"
            value={transactions.completed}
            extra="Completed Transactions"
            onClick={() => {
              setTransactionFilter("Approved");
              navigate("/admin/users");
              setTab("withdrawals");
            }}
          />
          <Card
            title="BA"
            value={`Rs. ${bonusTotal}`}
            extra="Total Bonuses Given"
          />
          <Card title="URM" value={unreadCount} extra="Unread User Messages" />
        </div>
      </div>
    </AdminLayout>
  );
}
