import React from "react";
import {useNavigate} from "react-router-dom";
import {auth} from "../../firebase";

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
  }) {
    return (
      <div
        className={`bg-white text-black rounded-lg shadow-md p-4 sm:p-6 transition-transform hover:scale-105
            ${special ? "border-yellow-500 border-2" : "border"}
            ${big ? "w-full h-full" : ""}
          `}
      >
        <div className="text-center mb-4">
          {icon &&
            (typeof icon === "string" && icon.startsWith("/") ? (
              <img
                src={icon}
                alt={`${tier} tier icon`}
                className="w-12 h-12 mx-auto"
              />
            ) : (
              <div className="text-4xl">{icon}</div>
            ))}

          <h3 className="text-lg font-semibold mt-1 ">{tier} Tier</h3>
        </div>

        <h4 className=" text-center text-2xl font-bold mb-2">
          Rs. {amount} Package
        </h4>

        {daily ? (
          <>
            <p className="text-center">
              Earn {daily}% - 3% daily, withdraw anytime
            </p>
            <p
              className="text-green-600
              text-xl 
              mt-2
              text-center
              font-bold"
            >
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
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-36 text-center text-green-800">
        Our Investment Packages
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 w-full max-w-6xl mb-6">
        <PackageCard
          tier="Bronze"
          // icon="🥉"
          icon="/assets/bronze.png"
          amount={3000}
          nextDay={10}
          refer={3}
          total={6300}
        />
        <PackageCard
          tier="Silver"
          icon="🥈"
          amount={5000}
          nextDay={10}
          refer={3}
          total={"10500"}
        />
        <PackageCard
          tier="Gold"
          icon="🥇"
          amount={10000}
          nextDay={10}
          refer={2}
          total={"21000"}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 w-full max-w-6xl">
        <div className="md:col-span-2">
          <PackageCard
            tier="Diamond"
            icon="💎"
            amount={50000}
            nextDay={10}
            refer={1}
            total={"105000"}
          />
        </div>
        <div className="md:col-span-3">
          <PackageCard
            tier="Elite"
            icon="👑"
            amount={100000}
            daily={5}
            special
            big
          />
        </div>
      </div>
      <div 
      className="mt-12 w-full max-w-md"
      >
        <div
          onClick={() => {
            const user = auth.currentUser;
            if (!user) {
              navigate("/Signup");
            } else {
              navigate("/start-with-nothing");
            }
          }}
          className="bg-white  text-black p-6 rounded-lg shadow-md text-center cursor-pointer hover:bg-gray-300 transition"
        >
          <h3 className="text-2xl font-bold mb-2">Start With Nothing</h3>
          <p className="text-sm ">
            Don’t want to invest yet? Earn by inviting others. Progress toward
            free bonuses!
          </p>
        </div>
      </div>
    </section>
  );
}
