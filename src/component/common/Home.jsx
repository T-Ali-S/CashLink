import React, { useState, useEffect, useRef } from "react";
import InvestmentCalculator from "../Others/InvestmentCalculator";
import PackagesCards from "../Others/PackagesCards";
import Footers from "./Footers";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { get, ref, update } from "firebase/database";
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Home() {
  const [userData, setUserData] = useState(null);
  const [liveTotal, setLiveTotal] = useState(150000000);
  const navigate = useNavigate();
  const location = useLocation();
  const packageRef = useRef(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snapshot = await get(ref(db, `users/${user.uid}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.package !== "elite") {
            const allUsersSnap = await get(ref(db, "users"));
            const allUsers = allUsersSnap.exists() ? allUsersSnap.val() : {};

            const referrals = Object.values(allUsers).filter(
              (u) => u.referredBy === user.uid
            );
            const activated = referrals.filter((u) => u.package);

            const packageRewards = {
              bronze: 6300,
              silver: 10500,
              gold: 21000,
              platinum: 105000, // ✅ correct value
            };

            const reward = packageRewards[data.package] || 0;
            // 🚨 Defensive check for unexpected package values
            if (data.package !== "elite" && !packageRewards[data.package]) {
              console.warn("⚠️ Unrecognized package:", data.package);
            }

            const now = Date.now();
            const last = data.lastPayoutAt || 0;
            const oneDay = 24 * 60 * 60 * 1000;

            if (now - last >= oneDay) {
              const baseBonus = 300;
              const fullPaid =
                data?.milestones?.[data.package]?.rewarded || false;

              if (activated.length >= 3 && !fullPaid) {
                // All referrals are active → give full reward
                await update(ref(db, `users/${user.uid}`), {
                  balance: (data.balance || 0) + reward,
                  lastPayoutAt: now,
                  [`milestones/${data.package}/rewarded`]: true,
                });
                console.log("🎯 Full reward granted instantly:", reward);
              } else {
                // Incomplete → grow at 10% daily
                const growth = (reward - baseBonus) * 0.1;
                await update(ref(db, `users/${user.uid}`), {
                  balance: (data.balance || 0) + growth,
                  lastPayoutAt: now,
                });
                console.log("⏳ ROI added at 10% growth:", growth);
              }
            }
          }
          if (data.package === "elite") {
            const now = Date.now();
            const last = data.lastPayoutAt || 0;
            const oneDay = 24 * 60 * 60 * 1000;
            const eliteCap = 200000;
            const roi = 5000;

            if (now - last >= oneDay && (data.balance || 0) < eliteCap) {
              const nextBalance = Math.min((data.balance || 0) + roi, eliteCap);

              await update(ref(db, `users/${user.uid}`), {
                balance: nextBalance,
                withdrawable: nextBalance, // 🔓 elite is always unlocked
                lastPayoutAt: now,
              });

              data.balance = nextBalance;
              data.withdrawable = nextBalance;
              data.lastPayoutAt = now;

              console.log("💸 Elite ROI added:", roi);
            }
          }
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

  useEffect(() => {
    if (location.hash === "#packages" && packageRef.current) {
      packageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  useEffect(() => {
    const fetchLiveTotal = async () => {
      const snap = await get(ref(db, "liveTracker/total"));
      if (snap.exists()) {
        setLiveTotal(snap.val());
      }
    };
    fetchLiveTotal();
  }, []);

  let milestoneUnlocked = false;
  let baseWithdrawable = 0;

  if (userData) {
    milestoneUnlocked =
      userData.package === "elite" ||
      userData?.milestones?.[userData.package]?.rewarded ||
      userData?.withdrawUnlocked;

    baseWithdrawable = milestoneUnlocked ? userData?.balance || 0 : 300;
  }

  const bonusOnly = userData?.bonusWithdrawable || 0;
  const totalWithdrawable = baseWithdrawable + bonusOnly;
  return (
    <div className="max-w-6xl mx-auto p-4">
      <section className="h-screen w-full flex flex-col md:flex-row items-center justify-center text-center md:text-left">
        {/* Left Side: Video */}
        <div className="relative w-full md:w-1/2 h-64 md:h-full">
          <video
            autoPlay
            muted
            loop
            className="w-full h-full object-cover [mask-image:radial-gradient(ellipse_at_center,white,transparent)]"
          >
            <source src="/assets/myvideo.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>

        {/* Right Side: Text Content */}
        <div className="w-full md:w-1/2 p-6 md:p-12">
          {userData?.balance > 0 ||
          userData?.withdrawable > 0 ||
          userData?.package ? (
            <div className="bg-gray-200 text-black p-4 rounded-xl shadow text-center mb-6">
              <h3 className="text-2xl font-medium text-gold200">
                Your Balance
              </h3>
              <p className="text-3xl font-bold mt-2">
                Rs. {userData.balance || 0}
              </p>
              {!userData.package && (
                <p className="text-xs mt-1 text-red-500 italic">
                  No package currently active
                </p>
              )}
              {userData.package && (
                <p className="text-sm text-gray-500 mt-1">
                  Currently Active Package: <br />
                  <span className="text-xl font-bold text-green-800">
                    {userData.package.toUpperCase()}
                  </span>
                </p>
              )}

              <p className="text-sm text-gray-500 mt-2">
                Withdrawable:{" "}
                <span className="text-green-700 font-bold">
                  Rs. {totalWithdrawable}
                </span>
                <p className="text-xs text-gray-400 mt-1">
                  (Includes Rs. {userData?.bonusWithdrawable || 0} bonus
                  rewards)
                </p>
              </p>

              <button
                onClick={() => navigate("/withdraw")}
                className="mt-3 bg-gold200 hover:bg-gold100 text-white px-4 py-1 rounded"
              >
                Withdraw
              </button>
            </div>
          ) : (
            <div>
              <h1 className="text-gold100 text-3xl md:text-5xl font-bold mb-4">
                Grow Your Wealth with Us
              </h1>
              <p className="mb-6 text-lg text-white">
                Invest in secure packages, earn daily, withdraw anytime.
              </p>
              <button
                onClick={() => {
                  const user = auth.currentUser;
                  if (!user) {
                    navigate("/Signin");
                  } else {
                    // Scroll to package section
                    packageRef.current?.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="bg-gold200 text-white font-bold px-6 py-2 rounded hover:bg-gold100"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="h-screen w-full flex flex-col md:flex-row items-center justify-center  text-white">
        {/* Left Side: Dummy Content */}
        <div className="w-full md:w-1/2 p-6 md:p-12 text-center md:text-left">
          <h2 className="text-4xl md:text-5xl font-bold mb-5 text-yellow-300">
            Real-Time Progress
          </h2>
          <p className="text-lg text-gray-300">
            Monitor your investments as they grow. Stay informed and inspired
            with our transparent, up-to-the-minute progress tracker.
            <br />
          </p>
          <div className="mt-5">
            <span className="text-2xl font-bold text-white ">
              {" "}
              Get Bouses at every MileStone!
            </span>
          </div>
        </div>

        {/* Right Side: Investment Tracker */}
        <div className="w-full md:w-1/2 p-6 md:p-12">
          <h2 className="text-2xl font-semibold mb-4">
            Live Investment Tracker
          </h2>

          <div className="relative bg-gray-700 h-4 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 h-full transition-all duration-700"
              style={{
                width: `${Math.min((liveTotal / 200000000) * 100, 100)}%`,
              }}
            ></div>
            {/* moving Gif */}
            <div
              className="absolute top-1/2 -translate-y-1/2"
              style={{
                left: `${Math.min((liveTotal / 200000000) * 100, 100)}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* <video
                src="/assets/finalcat.webm" // Place your mp4 in public/assets and use correct path
                autoPlay
                loop
                muted
                className="h-8 sm:h-10 aspect-square object-contain"
              /> */}
            </div>
          </div>

          <p className="text-gray-300 mt-4 text-sm sm:text-base">
            Rs. {liveTotal.toLocaleString()} raised — goal: Rs. 20 Crore
          </p>
        </div>
      </section>

      {/*PackageCards*/}
      <hr />
      <div ref={packageRef}>
        <PackagesCards />
      </div>

      {/* Calculator */}
      <hr />
      <InvestmentCalculator />

      <hr />

      {/* Trust Badges */}
      <Footers />
    </div>
  );
}
