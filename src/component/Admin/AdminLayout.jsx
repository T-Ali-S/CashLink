import React from "react";

export default function AdminLayout({ children }) {
  return (
    <div className="pt-24 px-6 min-h-screen  text-black">
      {children}
    </div>
  );
}