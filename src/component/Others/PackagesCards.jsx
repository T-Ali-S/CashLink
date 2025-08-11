import React, { useContext} from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";
import { AlertContext } from "../context/AlertContext";

export default function PackagesCards() {
  const navigate = useNavigate();
  const { setAlert } = useContext(AlertContext);

  function PackageCard({
    amount,
    nextDay,
    refer,
    total,
    daily,
    icon,
    tier,
    onClick,
  }) {
    let gradientWrapper = "";
    switch (tier.toLowerCase()) {
      case "bronze":
        gradientWrapper =
          "bg-gradient-to-br from-[#8b5e3c] via-[#704828] to-[#4e2f1a]";
        break;
      case "silver":
        gradientWrapper =
          "bg-gradient-to-br from-[#b0b0b0] via-[#999999] to-[#6e6e6e]";
        break;
      case "gold":
        gradientWrapper =
          "bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B]";
        break;
      case "platinum":
        gradientWrapper =
          "bg-gradient-to-br from-[#d1f2ff] via-[#a2d2ff] to-[#5d9eff]";
        // "bg-[linear-gradient(145deg,_#F0F0F0,_#C0C0C0)]";
        break;
      case "elite":
        gradientWrapper =
          "bg-gradient-to-r from-[#00eaff] via-[#556bff] to-[#3500d3] shadow-[0_0_12px_rgba(0,238,255,0.4)]";
        break;
      default:
        gradientWrapper = "bg-gradient-to-br from-gray-500 to-gray-700";
    }

    return (
      <div
        className={`p-[6px] sm:p-[8px] rounded-2xl ${gradientWrapper} hover:scale-[1.02] transition-transform cursor-pointer ${
          tier.toLowerCase() !== "elite" ? "mb-10" : ""
        }`}
        onClick={onClick}
      >
        <div className="bg-transparent text-white rounded-[1rem] shadow-md px-3 py-4 sm:p-6 min-h-[280px] sm:min-h-[360px]">
          <div className="relative pt-28 sm:pt-36">
            <div className="absolute -top-16 sm:-top-24 left-1/2 -translate-x-1/2">
              <img
                src={icon}
                alt={`${tier} tier icon`}
                className={`${
                  tier.toLowerCase() === "elite"
                    ? "w-40 sm:w-48 md:w-60"
                    : "w-24 sm:w-40 md:w-36"
                } max-w-none h-auto object-contain drop-shadow-xl transition-transform duration-300 hover:-translate-y-1`}
              />
            </div>
            <h3
              className={`text-center font-bold -mt-20 ${
                tier.toLowerCase() === "elite"
                  ? "text-xl sm:text-2xl md:text-3xl"
                  : "text-base sm:text-lg md:text-xl"
              }`}
            >
              {tier} Tier
            </h3>
          </div>

          <h4
            className={`text-center font-semibold -mt-10 ${
              tier.toLowerCase() === "elite"
                ? "text-xl mb-2 sm:text-xl md:text-2xl"
                : "text-base sm:text-lg md:text-xl"
            }`}
          >
            Rs. {amount} Package
          </h4>

          {daily ? (
            <>
              <p className="text-center text-xl  sm:text-base">
                Earn {daily}% – 3% daily, withdraw anytime
              </p>
              <p className="text-2xl  bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B] bg-clip-text text-transparent sm:text-base md:text-4xl mt-2 text-center font-bold">
                Most Popular {<br />}Package!
              </p>
            </>
          ) : (
            <div className="mt-2 overflow-y-auto max-h-28 sm:max-h-full pr-1 scrollbar-thin scrollbar-thumb-gray-500">
              <p className="text-center text-sm sm:text-base">
                1) Next day earns {nextDay}% return
              </p>
              <br />
              <p className="text-center text-sm sm:text-base">
                2) {refer} Referrals required for second withdrawal
              </p>
              <br />
              <p className="text-center text-sm sm:text-base">
                3) Total earning up to Rs. {total}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const handlePackageClick = () => {
    const user = auth.currentUser;
    if (user) {
      navigate("/contact?mode=package");
    } else {
      setAlert({
        visible: true,
        type: "error",
        message: "Please sign in to view package details",
      });
    }
  };

  return (
    <section className="min-h-screen w-full px-4 sm:px-6 py-12 flex flex-col items-center mt-14 mb-14">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-20 text-center text-gold100">
        Our Investment Packages
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl mb-10">

        <PackageCard
          tier="Bronze"
          icon="/Medals/Bronze.png"
          amount={3000}
          nextDay={10}
          refer={5}
          total={6300}
          // onClick={() => navigate("/contact?mode=package")}
          onClick={handlePackageClick}
        />
        <PackageCard
          tier="Silver"
          icon="/Medals/Silver.png"
          amount={5000}
          nextDay={10}
          refer={3}
          total={"10500"}
          // onClick={() => navigate("/contact?mode=package")}
          onClick={handlePackageClick}
        />
        <PackageCard
          tier="Gold"
          icon="/Medals/Gold.png"
          amount={10000}
          nextDay={10}
          refer={2}
          total={"21000"}
          // onClick={() => navigate("/contact?mode=package")}
          onClick={handlePackageClick}
        />
        <PackageCard
          tier="Platinum"
          icon="/Medals/Platinum.png"
          amount={50000}
          nextDay={10}
          refer={2}
          total={"105000"}
          // onClick={() => navigate("/contact?mode=package")}
          onClick={handlePackageClick}
        />
      </div>

      <div className="w-full max-w-6xl">
        <PackageCard
          tier="Elite"
          icon="/Medals/Elite.png"
          amount={100000}
          daily={1}
          // onClick={() => navigate("/contact?mode=package")}
          onClick={handlePackageClick}
        />
      </div>

      <div className="mt-12 w-full max-w-md text-center">
        <button
          onClick={() => {
            const user = auth.currentUser;
            if (!user) {
              navigate("/Signup");
            } else {
              navigate("/start-with-nothing");
            }
          }}
          className="w-full max-w-[320px] px-6 py-4 bg-gradient-to-b from-[#FFD700] via-[#FFB800] to-[#C68600] 
      rounded-2xl shadow-[inset_0_4px_8px_#fff,0_6px_12px_rgba(0,0,0,0.3)] 
      text-yellow-100 font-extrabold text-2xl leading-tight tracking-wide 
      border border-[#f6c400] hover:scale-105 active:scale-95 transition-all duration-300"
        >
          <div className="drop-shadow-[2px_2px_1px_rgba(0,0,0,0.6)]">
            START WITH <br /> NOTHING
          </div>
        </button>
      </div>
    </section>
  );
}
