import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AuthProvider } from "./component/common/AuthProvider.jsx";
import "./index.css";
import { AlertProvider } from "./component/context/AlertContext.jsx";
import AlertRenderer from "./component/AlertRenderer.jsx";
import { UserProvider } from "./component/Others/UserContext.jsx";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <UserProvider>
        <AlertProvider>
          <App />
          <AlertRenderer />
      </AlertProvider>
      </UserProvider>
    </AuthProvider>
  </React.StrictMode>
);