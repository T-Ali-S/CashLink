import React, { createContext, useState } from "react";

export const AlertContext = createContext();

export function AlertProvider({ children }) {
  const [alert, setAlert] = useState({
    visible: false,
    message: "",
    type: "success",
  });

  return (
    <AlertContext.Provider value={{ alert, setAlert }}>
      {children}
    </AlertContext.Provider>
  );
}