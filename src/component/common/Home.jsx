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
import { processROIandUnlock } from "../utils/milestoneManager";
import useMilestoneStatus from "../Others/hooks/useMilestoneStatus";
import { getLiveTrackerTotal } from "../utils/liveTrackerUtils";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, EffectFade } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

export default function Home() {
  const [userData, setUserData] = useState(null);
  const totalWithdrawable = userData?.withdrawable || 0;
  const milestone = useMilestoneStatus(userData?.uid, userData?.package);
  //  console.log("🧾 milestone lockedBonus:", milestone?.lockedBonus);
  // console.log("🧾 milestone object:", milestone);
  // console.log("🧾 userData.package:", userData?.package);
  const [liveTotal, setLiveTotal] = useState(150000000);
  const navigate = useNavigate();
  const location = useLocation();
  const packageRef = useRef(null);
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
    async function triggerCombinedLogic() {
      const currentUser = auth.currentUser;
      if (!currentUser?.uid) return;
      await processROIandUnlock(currentUser.uid);

      // Optional: delay before refetch to ensure Firebase transaction completes
      await new Promise((res) => setTimeout(res, 200));

      const milestoneSnap = await get(
        ref(db, `users/${currentUser.uid}/milestones/${userData?.package}`)
      );
      if (milestoneSnap.exists()) {
        console.log("📦 Refreshed Milestone Snapshot:", milestoneSnap.val());
      }

      const snap = await get(ref(db, `users/${currentUser.uid}`));
      if (snap.exists()) {
        const fresh = snap.val();
        console.log("🧾 Latest user snapshot from Firebase:", fresh);
        setUserData({ ...fresh, uid: currentUser.uid });
      }
    }

    if (userData?.uid) {
      triggerCombinedLogic();
    }
  }, [userData?.uid]);

  /////fetching current pacakge
  useEffect(() => {
    if (location.hash === "#packages" && packageRef.current) {
      packageRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  useEffect(() => {
    const fetchLiveTotal = async () => {
      const total = await getLiveTrackerTotal();
      setLiveTotal(total);
    };
    fetchLiveTotal();
  }, []);

  //  useEffect(() => {
  //     const interval = setInterval(() => {
  //       // recompute timeLeft
  //     }, 6000); // every minute

  //     return () => clearInterval(interval);
  //   }, [milestone.deadline]);
  // console.log(milestone.deadline);

  const now = Date.now();
  const deadline = milestone?.deadline;
  const timeLeft = deadline - now;
  const daysLeft = Math.max(Math.floor(timeLeft / (1000 * 60 * 60 * 24)), 0);
  return (
    <>
      {/* Slider section - full width, no side padding */}
      {/* Desktop & Tablet Slider */}
      <section className="w-full relative hidden md:block mt-20">
        <div className="w-full px-4 lg:px-8">
          <div className="h-[320px] lg:h-[650px] xl:h-[780px] overflow-hidden bg-black border border-gold-500 rounded-2xl shadow-md">
            <Swiper
              modules={[Autoplay, Pagination, EffectFade]}
              autoplay={{ delay: 4000 }}
              loop={false}
              effect="fade"
              className="w-full h-full"
            >
              <SwiperSlide>
                <img
                  src="/assets/image1.png"
                  alt="Slide 1"
                  className="w-full h-full object-cover object-top"
                />
              </SwiperSlide>
              <SwiperSlide>
                <img
                  src="/assets/image2.png"
                  alt="Slide 2"
                  className="w-full h-full object-cover object-top"
                />
              </SwiperSlide>
              <SwiperSlide>
                <img
                  src="/assets/image3.png"
                  alt="Slide 3"
                  className="w-full h-full object-cover object-top"
                />
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
      </section>

      {/* Mobile Version (only visible on small screens) */}
      <section className="w-full relative block md:hidden mt-20">
        <div className="w-full px-4">
          {" "}
          {/* Adds horizontal padding */}
          <div className="w-full bg-black border border-gray-300 rounded-2xl overflow-hidden">
            <Swiper
              modules={[Autoplay, Pagination, EffectFade]}
              autoplay={{ delay: 4000 }}
              loop={false}
              effect="fade"
              className="w-full"
            >
              <SwiperSlide className="flex items-center justify-center">
                <img
                  src="/assets/image1.png"
                  alt="Slide 1"
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </SwiperSlide>
              <SwiperSlide className="flex items-center justify-center">
                <img
                  src="/assets/image2.png"
                  alt="Slide 2"
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </SwiperSlide>
              <SwiperSlide className="flex items-center justify-center">
                <img
                  src="/assets/image3.png"
                  alt="Slide 3"
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </SwiperSlide>
            </Swiper>
          </div>
        </div>
      </section>

      {/* Balance Card Section */}
      <div className="w-full px-4 sm:px-6 md:px-10 lg:px-16">
        <div className="w-full mt-10 mb-10 flex justify-center items-center">
          <div className="w-full max-w-2xl">
            {userData?.balance > 0 ||
            userData?.withdrawable > 0 ||
            userData?.package ? (
              <div className="relative bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B] p-[4px] rounded-2xl shadow-lg h-full">
                <div className="bg-[#192846] text-white p-4 sm:p-6 md:p-8 rounded-[16px] text-center h-full flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-bold bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B] bg-clip-text text-transparent">
                      Your Balance
                    </h3>
                    <p className="text-3xl font-bold mt-2">
                      Rs. {userData?.balance || 0}  
                      <button
                        onClick={async () => {
                          const user = auth.currentUser;
                          if (user) {
                            const snap = await get(
                              ref(db, `users/${user.uid}`)
                            );
                            if (snap.exists()) {
                              const fresh = snap.val();
                              setUserData({ ...fresh, uid: user.uid });
                            }
                          }
                        }}
                        className="ms-2 text-xl text-gray-200 underline hover:text-gold200"
                      >
                        <MdLoop />
                      </button>
                    </p>

                    {/* show lockedBonus separately below balance */}
                    {milestone?.lockedBonus > 0 && (
                      <p className="text-sm text-yellow-300 mt-1">
                        + ₹{milestone.lockedBonus} referral bonus (locked until
                        milestone completion)
                      </p>
                    )}

                    {!userData.package && (
                      <p className="text-xs mt-1 text-red-500 italic">
                        No package currently active
                      </p>
                    )}
                    {userData.package && (
                      <p className="text-sm text-white mt-1">
                        Currently Active Package: <br />
                        <span className="text-2xl font-bold bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B] bg-clip-text text-transparent">
                          {userData.package.toUpperCase()}
                        </span>
                      </p>
                    )}

                    <div className="text-sm mt-2">
                      <span title="Referral bonuses are excluded until milestone is completed">
                        Withdrawable:
                      </span>{" "}
                      <span className="text-lg font-bold">
                        Rs. {userData?.withdrawable || 0}
                      </span>
                      <div className="text-xs mt-1">
                        {!milestone.loading && (
                          <div className="mt-2 text-sm">
                            <span title={milestone.tooltip}>
                              {milestone.statusText}
                            </span>
                            <br />
                            {!milestone.rewarded && !milestone.expired && (
                              <div className="mb-2">
                                Referrals needed:{" "}
                                <b className="mb-2">
                                  {milestone.referralsNeeded}
                                </b>
                                {milestone.referralsNeeded !== 1 && " "}
                                <br />
                                {/* {milestone.timeLeft !== null &&
                                  ` (Expires in: ${milestone.timeLeft} days)`} */}
                                <p>
                                  {" "}
                                  Expires in:{" "}
                                  {daysLeft > 0
                                    ? `${daysLeft} ${
                                        daysLeft === 1 ? "" : ""
                                      } days`
                                    : "Deadline passed"}{" "}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                        {/* Rs.{" "} */}
                        {/* {milestone.lockedBonus ||
                          userData?.bonusWithdrawable ||
                          0}{" "}
                        is pending until your milestone is completed. */}
                        {/* {milestone?.lockedBonus > 0 && (
                        <p className="text-sm text-yellow-300 mt-1">
                          + ₹{milestone.lockedBonus} referral bonus (locked
                          until milestone completion)
                        </p>
                      )} */}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate("/withdraw")}
                    className="mt-4 bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B] hover:brightness-105 text-black font-semibold px-5 py-2 rounded w-full sm:w-auto mx-auto"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B] p-[4px] rounded-2xl shadow-lg">
                <div className="bg-[#192846] text-white p-6 sm:p-8 md:p-10 rounded-[16px] text-center">
                  <h1 className="text-3xl md:text-5xl font-bold mb-4 bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B] bg-clip-text text-transparent">
                    Grow Your Wealth with Us
                  </h1>
                  <p className="mb-6 text-base sm:text-lg text-gray-300">
                    Invest in secure packages, earn daily, withdraw anytime.
                  </p>
                  <button
                    onClick={() => {
                      const user = auth.currentUser;
                      if (!user) {
                        navigate("/Signin");
                      } else {
                        packageRef.current?.scrollIntoView({
                          behavior: "smooth",
                        });
                      }
                    }}
                    className="bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B] hover:brightness-105 text-black font-semibold px-6 py-2 rounded"
                  >
                    Get Started
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="w-full flex flex-col md:flex-row items-start justify-between text-white pt-10 md:pt-24 pb-10 md:pb-20 mt-20 mb-10">
          {/* Left Side: Text */}
          <div className="w-full md:w-1/2 p-6 md:p-12 text-center md:text-left flex items-center justify-center md:justify-start">
            <div className="text-4xl font-bold bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B] bg-clip-text text-transparent">
              Get Bonuses at every {<br className="md:hidden" />} Milestone!
            </div>
          </div>

          {/* Right Side: Investment Tracker */}
          <div className="w-full md:w-1/2 p-6 md:p-12 text-white flex items-center justify-center">
            <div className="w-full max-w-md space-y-6">
              <h2 className="text-2xl font-semibold mb-4 text-yellow-400">
                Live Investment Tracker
              </h2>

              {/* Glowing Progress Bar */}
              <div
                className="relative h-6 rounded-full overflow-hidden border-2"
                style={{
                  borderColor: "gold",
                  background: "rgba(255, 215, 0, 0.1)",
                  boxShadow: "0 0 8px gold",
                }}
              >
                <div
                  className="absolute h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min((liveTotal / 200000000) * 100, 100)}%`,
                    background:
                      "linear-gradient(to right, #ffd700, #ffcc00, #b8860b)",
                  }}
                ></div>

                <div
                  className="absolute top-0 h-full w-20"
                  style={{
                    background:
                      "radial-gradient(circle, #fff200 0%, transparent 70%)",
                    animation: "glowMove 2s infinite linear",
                  }}
                ></div>

                <style>
                  {`
            @keyframes glowMove {
              0% { left: -80px; opacity: 0; }
              50% { opacity: 1; }
              100% { left: 100%; opacity: 0; }
            }
          `}
                </style>
              </div>

              {/* Progress Description */}
              <p className="text-gray-300 text-sm sm:text-base">
                Rs. {liveTotal.toLocaleString()} raised — goal: Rs. 20 Crore
              </p>
            </div>
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
    </>
  );
}
