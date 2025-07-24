import { createContext, useContext, useState } from "react";

const AdminTabContext = createContext();

export function AdminTabProvider({ children }) {
  const [tab, setTab] = useState("main");
  const [transactionFilter, setTransactionFilter] = useState(""); // <-- Add this line

  return (
    <AdminTabContext.Provider value={{ tab, setTab, transactionFilter, setTransactionFilter }}>
      {children}
    </AdminTabContext.Provider>
  );
}

export const useAdminTab = () => useContext(AdminTabContext);
