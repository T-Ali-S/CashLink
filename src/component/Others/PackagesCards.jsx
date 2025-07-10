import React from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../../firebase";

export default function PackagesCards() {
  const navigate = useNavigate();

  function PackageCard({
    amount,
    nextDay,
    refer,
    total,
    daily,
    special,
    icon,
    tier,
    big,
    onClick,
  }) {
    let borderStyles = "border-4 hover:animate-pulse";

    switch (tier.toLowerCase()) {
      case "bronze":
        borderStyles += " border-[#8B4513]"; // SaddleBrown
        break;
      case "silver":
        borderStyles += " border-gray-400";
        break;
      case "gold":
        borderStyles += " border-yellow-400";
        break;
      case "platinum":
        borderStyles += " border-teal-400";
        break;
      case "elite":
        borderStyles =
          "border-4 border-transparent bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 bg-clip-border";
        break;
      default:
        borderStyles += " border-gray-300";
    }
    return (
      <div
        onClick={onClick}
        className={`bg-white text-black rounded-lg shadow-md p-4 sm:p-6 transition-transform hover:scale-105 cursor-pointer ${borderStyles} $
           ${""}
        `}
      >

        <div className="relative pt-16 sm:pt-20">
          <div className="absolute -top-16 sm:-top-20 left-1/2 -translate-x-1/2">
            <img
              src={icon}
              alt={`${tier} tier icon`}
              className="w-24 h-24 sm:w-44 sm:h-28 object-contain drop-shadow-xl transition-transform duration-300 hover:-translate-y-1"
            />
          </div>
          <h3 className="text-center text-lg font-semibold">{tier} Tier</h3>
        </div>

        <h4 className="text-center text-2xl font-bold mb-2">
          Rs. {amount} Package
        </h4>

        {daily ? (
          <>
            <p className="text-center">
              Earn {daily}% - 3% daily, withdraw anytime
            </p>
            <p className="text-green-600 text-xl mt-2 text-center font-bold">
              Most Popular Package!
            </p>
          </>
        ) : (
          <>
            <p className="text-center">Next day earns {nextDay}% return</p>
            <p className="text-center">
              {refer} Referrals required for second withdrawal
            </p>
            <p className="text-center">Total earning up to Rs. {total}</p>
          </>
        )}
      </div>
    );
  }

  return (
    <section className="min-h-screen w-full px-4 sm:px-6 py-12 flex flex-col items-center">
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-36 text-center text-gold100">
        Our Investment Packages
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-6xl mb-6 space-y-8">
        <PackageCard
        
          tier="Bronze"
          icon="/Medals/Bronze.png"
          amount={3000}
          nextDay={10}
          refer={3}
          total={6300}
          onClick={() => navigate("/Contact")}
          
        />
        <PackageCard
        
          tier="Silver"
          icon="/Medals/Silver.png"
          // icon="🥈"
          amount={5000}
          nextDay={10}
          refer={3}
          total={"10500"}
          onClick={() => navigate("/Contact")}
        />
        <PackageCard
        
          tier="Gold"
          icon="/Medals/Gold.png"
          // icon="🥇"
          amount={10000}
          nextDay={10}
          refer={2}
          total={"21000"}
          onClick={() => navigate("/Contact")}
        />
      </div>

      <div className=" grid grid-cols-1 md:grid-cols-5 gap-6 w-full max-w-6xl mt-10">
        <div className=" md:col-span-2 mb-5">
          <PackageCard
          
            tier="Platinum"
            icon="/Medals/Platinum.png"
            // icon="💎"
            amount={50000}
            nextDay={10}
            refer={1}
            total={"105000"}
            onClick={() => navigate("/Contact")}
          />
        </div>
        <div className="md:col-span-3">
          <PackageCard
          
            tier="Elite"
            icon="/Medals/Elite.png"
            // icon="👑"
            amount={100000}
            daily={5}
            special
            onClick={() => navigate("/Contact")}
          />
        </div>
      </div>

      <div className="mt-12 w-full max-w-md">
        <div
          onClick={() => {
            const user = auth.currentUser;
            if (!user) {
              navigate("/Signup");
            } else {
              navigate("/start-with-nothing");
            }
          }}
          className="bg-white text-black p-6 rounded-lg shadow-md text-center cursor-pointer hover:bg-gray-300 transition"
        >
          <h3 className="text-2xl font-bold mb-2">Start With Nothing</h3>
          <p className="text-sm">
            Don’t want to invest yet? Earn by inviting others. Progress toward
            free bonuses!
          </p>
        </div>
      </div>
    </section>
  );
}
