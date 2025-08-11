// ChatContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../../firebase";

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = onValue(ref(db, "chats"), (snap) => {
      if (!snap.exists()) {
        setUnreadCount(0);
        return;
      }

      const data = snap.val();

      let count = 0;

      Object.entries(data).forEach(([userId, chatList]) => {
        if (typeof chatList !== "object") return;



        Object.values(chatList).forEach((msg) => {
          if (msg.from === "user") {
          }
          if (msg.from === "user" && msg.read === false) {
            count++;
          }
        });
      });
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ChatContext.Provider value={{ unreadCount, setUnreadCount }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
