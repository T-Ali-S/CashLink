import React, { useState, useEffect, useRef } from "react";
import InvestmentCalculator from "../Others/InvestmentCalculator";
import PackagesCards from "../Others/PackagesCards";
import Footers from "./Footers";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../../firebase";
import { get, ref, update } from "firebase/database";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { RewardManager } from "../utils/RewardManager";
import { MdLoop } from "react-icons/md";
import { applyDailyROI } from "../utils/roiManager";

export default function Home() {
  const [userData, setUserData] = useState(null);
  const [liveTotal, setLiveTotal] = useState(150000000);
  const navigate = useNavigate();
  const location = useLocation();
  const packageRef = useRef(null);
  const [roiAdded, setRoiAdded] = useState(null);
  const trueBalance =
    (userData?.balance || 0) +
    (userData?.bonusLocked || 0) +
    (userData?.bonusWithdrawable || 0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const snapshot = await get(ref(db, `users/${user.uid}`));
        if (snapshot.exists()) {
          const data = snapshot.val();
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
    async function triggerROI() {
      const amount = await applyDailyROI(userData.uid);
      if (amount) setRoiAdded(amount);
    }
    if (userData?.uid) triggerROI();
  }, [userData?.uid]);

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

  const totalWithdrawable = userData?.withdrawable || 0;

  const milestoneUnlocked =
    userData?.package === "elite" ||
    userData?.milestones?.[userData.package]?.rewarded ||
    userData?.withdrawUnlocked;

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
                Rs. {trueBalance || 0}
                <button
                  onClick={async () => {
                    const user = auth.currentUser;
                    if (user) {
                      const snap = await get(ref(db, `users/${user.uid}`));
                      if (snap.exists()) {
                        const fresh = snap.val();
                        setUserData({ ...fresh, uid: user.uid });
                      }
                    }
                  }}
                  className="ms-2 text-xl text-gray-700 underline hover:text-gold200"
                >
                  <MdLoop />
                </button>
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

              <div className="text-sm text-gray-500 mt-2">
                <span title="Referral bonuses are excluded until milestone is completed">
                  Withdrawable:{" "}
                </span>
                <span className="text-green-700 font-bold">
                  Rs. {userData?.withdrawable || 0}
                </span>
                <div className="text-xs text-gray-400 mt-1">
                  You’ve earned Rs. {userData?.bonusWithdrawable || 0} in goal
                  bonuses.
                  <br />
                  Rs. {userData?.bonusLocked || 0} is pending until your
                  milestone is completed.
                  {roiAdded && (
                    <p className="text-xs text-green-600 mt-1">
                      💸 Rs. {roiAdded} added to your balance today.
                    </p>
                  )}
                </div>
              </div>

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

      <section className="h-screen w-full flex flex-col md:flex-row items-center justify-center  text-white md:-mb-36">
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
              {milestoneUnlocked && (
                <div className="mt-2">
                  <span className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full animate-pulse">
                    🎉 Package Milestone Unlocked!
                  </span>
                </div>
              )}
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
