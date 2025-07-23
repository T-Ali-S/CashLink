import { createContext, useContext, useState } from "react";

const AdminTabContext = createContext();

export function AdminTabProvider({ children }) {
  const [tab, setTab] = useState("main");

  return (
    <AdminTabContext.Provider value={{ tab, setTab }}>
      {children}
    </AdminTabContext.Provider>
  );
}

export const useAdminTab = () => useContext(AdminTabContext);
