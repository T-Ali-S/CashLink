import { useRef, useEffect, useState } from "react";
import { db } from "../../firebase";
import { ref, onValue, push, get, update } from "firebase/database";
import { IoMdSend } from "react-icons/io";

export default function AdminChatManager() {
  const [chats, setChats] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [usernames, setUsernames] = useState({});
  const [view, setView] = useState("list");
  const bottomRef = useRef(null);


  // Load chats
  useEffect(() => {
    return onValue(ref(db, "chats"), (snap) => {
      if (snap.exists()) setChats(snap.val());
    });
  }, []);

  // Load usernames + avatars
  useEffect(() => {
    (async () => {
      const snap = await get(ref(db, "users"));
      if (!snap.exists()) return;
      const users = snap.val();
      const nameMap = {};
      for (const uid in users) {
        nameMap[uid] = {
          name: users[uid].name || uid,
          avatar: users[uid].avatarUrl || "/avatars/default.png",
        };
      }
      setUsernames(nameMap);
    })();
  }, []);

  const sendReply = async () => {
    if (!selectedUser || !message.trim()) return;
    await push(ref(db, `chats/${selectedUser}`), {
      from: "admin",
      content: message,
      timestamp: Date.now(),
      read: false,
    });
    setMessage("");
  };

  const markUserMessagesRead = async (uid) => {
    const chatSnap = await get(ref(db, `chats/${uid}`));
    if (!chatSnap.exists()) return;

    const updates = {};
    chatSnap.forEach((msg) => {
      const val = msg.val();
      if (val.from === "user" && !val.read) {
        updates[msg.key + "/read"] = true;
      }
    });

    if (Object.keys(updates).length > 0) {
      await update(ref(db, `chats/${uid}`), updates);
    }
  };

  const openChat = async (uid) => {
    setSelectedUser(uid);
    setView(window.innerWidth < 1024 ? "chat" : "list");
    await markUserMessagesRead(uid);
  };

  // Sort chats: Unread first, then latest timestamp
  const sortedUserIds = Object.keys(chats).sort((a, b) => {
    const aChat = Object.values(chats[a] || []);
    const bChat = Object.values(chats[b] || []);

    const aUnread = aChat.some((msg) => msg.from === "user" && !msg.read);
    const bUnread = bChat.some((msg) => msg.from === "user" && !msg.read);
    if (aUnread && !bUnread) return -1;
    if (!aUnread && bUnread) return 1;

    const aLast = aChat[aChat.length - 1]?.timestamp || 0;
    const bLast = bChat[bChat.length - 1]?.timestamp || 0;
    return bLast - aLast;
  });

  useEffect(() => {
  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
}, [chats[selectedUser]]);


  return (
    <div className="p-6 bg-gray-900 text-white h-screen overflow-hidden">
      <h2 className="text-3xl mb-6 text-yellow-400">📨 Live Chat Manager</h2>
      <div className="flex flex-col lg:flex-row gap-4 h-[calc(100%-80px)]">
        {/* Active Users panel */}
        {(view === "list" || window.innerWidth >= 1024) && (
          <div className="w-full lg:w-1/3 border-r lg:pr-4 overflow-y-auto max-h-full">
            <h4 className="text-xl mb-3">Active Users</h4>
            <ul className="space-y-2">
              {sortedUserIds.map((uid) => {
                const chat = Object.values(chats[uid] || []);
                const unread = chat.some((msg) => msg.from === "user" && !msg.read);

                return (
                  <li
                    key={uid}
                    onClick={() => openChat(uid)}
                    className={`cursor-pointer flex items-center gap-2 p-2 rounded hover:bg-gray-700 ${
                      selectedUser === uid ? "bg-gray-700" : ""
                    }`}
                  >
                    <img
                      src={usernames[uid]?.avatar}
                      alt="avatar"
                      className="w-8 h-8 rounded-full border object-cover"
                    />
                    <div className="flex-1 truncate">
                      <span className={`truncate max-w-[120px] ${unread ? "font-bold" : ""}`}>
                        {usernames[uid]?.name || uid}
                      </span>
                    </div>
                    {unread && <span className="h-2 w-2 bg-red-500 rounded-full" />}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Chat Window */}
        {selectedUser && (view === "chat" || window.innerWidth >= 1024) && (
          <div className="w-full lg:w-2/3 flex flex-col h-full">
            <div className="flex items-center justify-between mb-2">
              {window.innerWidth < 1024 && (
                <button
                  onClick={() => {
                    setView("list");
                    setSelectedUser(null);
                  }}
                  className="text-yellow-400 underline"
                >
                  ← Back
                </button>
              )}
              <h4 className="text-lg font-semibold text-yellow-400 truncate">
                Chat with {usernames[selectedUser]?.name}
              </h4>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-800 p-3 rounded-xl mb-3">
              {Object.values(chats[selectedUser] || {})
                .sort((a, b) => a.timestamp - b.timestamp)
                .map((msg, i) => (
                  <div
                    key={i}
                    className={`flex mb-3 ${
                      msg.from === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div ref={bottomRef} />
                    <div
                      className={`rounded-lg px-4 py-2 max-w-sm whitespace-pre-line text-sm shadow-md ${
                        msg.from === "user"
                          ? "bg-green-500 text-white"
                          : msg.from === "admin"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-black"
                      }`}
                    >
                      {msg.content}
                      <div className="flex justify-between items-center text-xs mt-1 text-gray-300">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {msg.from === "admin" && msg.read && <span className="ml-1">✓</span>}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            <div className="flex gap-2 mt-auto">
              <input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 p-2 text-black rounded-xl"
                placeholder="Reply..."
              />
              <button
                onClick={sendReply}
                className="bg-gold200 px-4 py-2 text-white rounded-xl"
              >
                <IoMdSend />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
