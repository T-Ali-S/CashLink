import React, { useState } from "react";

export default function InvestmentCalculator() {
  const [amount, setAmount] = useState("");
  const [packageType, setPackageType] = useState("3000");
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    let total = 0;

    switch (packageType) {
      case "3000":
        total = 6300;
        break;
      case "5000":
        total = 10500;
        break;
      case "10000":
        total = 21000;
        break;
      case "50000":
        total = 105000;
        break;
      case "100000":
        total = 200000; // 5% daily simple example
        break;
      default:
        total = 0;
    }

    setResult(total);
  };

  return (
    <section className="min-h-screen w-full flex flex-col justify-center items-center  px-4 py-12 mb-5">
      <h2 className="text-3xl sm:text-4xl font-bold mb-12 bg-gradient-to-br from-[#FFD700] via-[#F5C842] to-[#B8860B] bg-clip-text text-transparent text-center ">
        Investment Calculator
      </h2>

      {/* 💡 Dummy Data Block */}
      <div className="w-full max-w-xl mb-10 px-4 sm:px-0">
        <p className="text-white text-lg mb-3">
          🌱 Start with as little as{" "}
          <span className="font-semibold text-white">Rs. 3,000</span> and see your
          investment grow steadily.
        </p>
        <p className="text-white text-lg mb-3">
          📈 Our packages offer up to{" "}
          <span className="font-semibold">210% returns</span> — calculated in
          real-time.
        </p>
        <p className="text-white text-lg">
          🔒 100% withdrawal flexibility. Choose a plan that works best for your
          goals.
        </p>
      </div>

      {/* 💰 Calculator Panel */}
      <div className="bg-gold200 shadow-lg rounded-xl w-full max-w-md p-6">
        <div className="space-y-6">
          <select
            value={packageType}
            onChange={(e) => setPackageType(e.target.value)}
            className="w-full text-black border px-4 py-3 rounded text-base"
          >
            <option value="3000">Rs. 3,000 Package</option>
            <option value="5000">Rs. 5,000 Package</option>
            <option value="10000">Rs. 10,000 Package</option>
            <option value="50000">Rs. 50,000 Package</option>
            <option value="100000">Rs. 100,000 Package</option>
          </select>

          <button
            onClick={handleCalculate}
            className="bg-green-700 text-white font-bold text-lg px-6 py-3 rounded hover:bg-green-600 w-full transition"
          >
            Calculate
          </button>

          {result && (
            <p className="mt-4 text-lg font-bold text-center text-white">
              Estimated Return: Rs. {result.toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
