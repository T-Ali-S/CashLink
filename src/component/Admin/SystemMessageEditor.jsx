import { useEffect, useState, useContext } from "react";
import { db } from "../../firebase";
import { ref, get, update } from "firebase/database";
import { AlertContext } from "../context/AlertContext";

export default function SystemMessageEditor() {
  const [messages, setMessages] = useState({});
  const { setAlert } = useContext(AlertContext);
  const methods = ["Easypaisa", "JazzCash", "BankTransfer"];

  useEffect(() => {
    const loadMessages = async () => {
      const snap = await get(ref(db, "settings/chatWelcomeMessage"));
      setMessages(snap.exists() ? snap.val() : {});
    };
    loadMessages();
  }, []);

  const updateMessage = async (method) => {
    try {
      await update(ref(db, "settings/chatWelcomeMessage"), {
        [method]: messages[method],
      });
      setAlert({
        visible: true,
        type: "success",
        message: "Updated successfully!",
      });
    } catch (err) {
      console.error("Failed to update welcome message:", err);
      setAlert({
        visible: true,
        type: "success",
        message: "Update failed.",
      });
    }
  };

  return (
    <div className="p-6 bg-white text-black rounded shadow max-w-xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">✏️ Edit Welcome Messages</h2>
      {methods.map((method) => (
        <div key={method} className="mb-4">
          <label className="yefont-semibold">{method}</label>
          <textarea
            className="w-full p-2 border rounded"
            rows={2}
            value={messages[method] || ""}
            onChange={(e) =>
              setMessages((prev) => ({ ...prev, [method]: e.target.value }))
            }
          />
          <button
            onClick={() => updateMessage(method)}
            className="mt-2 bg-gold200 text-white px-3 py-1 rounded"
          >
            Save
          </button>
        </div>
      ))}
    </div>
  );
}
