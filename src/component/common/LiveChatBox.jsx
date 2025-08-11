import { useRef, useEffect, useState } from "react";
import { db, auth } from "../../firebase";
import { ref, onValue, push, get, update } from "firebase/database"; // ✅ Added get, update
import { IoMdAdd } from "react-icons/io";

import {
  getStorage,
  ref as sRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export default function LiveChatBox() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  // const storage = getStorage();
  const bottomRef = useRef(null);


  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const user = auth.currentUser;
    if (!user) return;

    const formData = new FormData();
    formData.append("file", file);
    // formData.append("token", process.env.REACT_APP_UPLOAD_TOKEN);
    // formData.append("token","my-super-secret-token" );
    formData.append("token", import.meta.env.VITE_UPLOAD_TOKEN);

    try {
      const response = await fetch("https://www.coinlink25.com/upload.php", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (result.success) {
        await push(ref(db, `chats/${user.uid}`), {
          from: "user",
          content: result.url,
          type: "image",
          timestamp: Date.now(),
        });
      } else {
        console.error("Image upload failed:", result.error);
      }
    } catch (err) {
      console.error("Upload error:", err);
    }
  };

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const chatRef = ref(db, `chats/${user.uid}`);
    const unsub = onValue(chatRef, async (snap) => {
      if (!snap.exists()) {
        await push(ref(db, `chats/${user.uid}`), {
          from: "system",
          content: "Welcome! Please describe your issue below.",
          timestamp: Date.now(),
        });
      } else {
        const all = Object.values(snap.val());
        setMessages(all.sort((a, b) => a.timestamp - b.timestamp));
      }
    });

    return () => unsub();
  }, []);

  const sendMessage = async () => {
    const user = auth.currentUser;
    if (!user || !input) return;

    await push(ref(db, `chats/${user.uid}`), {
      from: "user",
      content: input,
      timestamp: Date.now(),
      read: false,
    });
    setInput("");
  };

  useEffect(() => {
    const markRead = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const chatSnap = await get(ref(db, `chats/${user.uid}`));
      const updates = {};
      chatSnap.forEach((msg) => {
        if (msg.val().from === "admin" && msg.val().read === false) {
          updates[msg.key + "/read"] = true;
        }
      });

      if (Object.keys(updates).length) {
        await update(ref(db, `chats/${user.uid}`), updates);
      }
    };

    markRead();
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className=" h-screen w-full flex flex-col bg-gray-800 text-white p-4">
      <h2 className="text-3xl font-bold text-gold200 text-center mb-4">
        Live Chat Support
      </h2>

      <div className="flex-1 overflow-y-auto border p-2 rounded-xl mb-4">
        {messages
          .filter((msg) => !msg.adminOnly)
          .map((msg, idx) => (
            <div
              key={idx}
              className={`flex mb-3 ${
                msg.from === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`rounded-lg px-4 py-2 max-w-xs whitespace-pre-line text-sm shadow-md ${
                  msg.from === "user"
                    ? "bg-green-500 text-white"
                    : msg.from === "admin"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-300 text-black"
                }`}
              >
                {msg.type === "image" ? (
                  <a
                    href={msg.content}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={msg.content}
                      alt="uploaded"
                      className="max-w-full rounded-lg cursor-pointer hover:opacity-80 transition"
                    />
                  </a>
                ) : (
                  msg.content
                )}
                <small className="block text-xs text-gray-700 mt-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </div>
            </div>
          ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <div className="relative">
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="bg-gray-600 hover:bg-gray-700 text-white p-2 rounded-full text-xl">
              <IoMdAdd />
            </div>
          </label>
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
        <input
          className="flex-1 border p-2 text-black rounded-xl"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
        />
        <button
          onClick={sendMessage}
          className="bg-gold200 px-4 py-2 text-white rounded-xl"
        >
          Send
        </button>
      </div>
    </div>
  );
}
