import { useContext, useEffect } from "react";
import { AlertContext } from "./context/AlertContext";
import Alert from "./common/Alert";

export default function AlertRenderer() {
  const { alert, setAlert } = useContext(AlertContext);

  useEffect(() => {
    if (alert.visible) {
      const timer = setTimeout(() => {
        setAlert({ ...alert, visible: false });
      }, 3000); // ⏱ auto-close after 3 seconds

      return () => clearTimeout(timer); // ✅ cleanup
    }
  }, [alert.visible]);

  if (!alert.visible) return null;

  return (
    <Alert
      type={alert.type}
      message={alert.message}
      onClose={() => setAlert({ ...alert, visible: false })}
    />
  );
}

