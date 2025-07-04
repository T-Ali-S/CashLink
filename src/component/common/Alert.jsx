import React, { useEffect } from "react";

export default function Alert({ type = "success", message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000); // auto-dismiss after 3 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColors = {
    success: "bg-green-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  };

  return (
    <div
      className={`fixed top-5 right-5 z-50 px-6 py-4 rounded-md text-white shadow-lg animate-slide-in 
      ${bgColors[type]}`}
    >
      {message}
    </div>
  );
}