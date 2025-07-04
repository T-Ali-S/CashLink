import React, { useEffect, useState } from "react";
import { auth, db } from "../../firebase";
import { ref, get, update } from "firebase/database";
import { formatDistanceToNow } from "date-fns";
import { onValue } from "firebase/database";

export default function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const notifRef = ref(db, `notifications/${user.uid}`);
    const unsubscribe = onValue(notifRef, (snap) => {
      if (snap.exists()) {
        const data = Object.entries(snap.val()).map(([id, msg]) => ({
          id,
          ...msg,
        }));
        setNotifications(data.reverse());
      } else {
        setNotifications([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const markAllAsRead = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const updates = {};
    notifications.forEach((n) => {
      if (!n.read) updates[`notifications/${user.uid}/${n.id}/read`] = true;
    });

    await update(ref(db), updates);
    setNotifications((prev) =>
      prev.map((n) => ({
        ...n,
        read: true,
      }))
    );
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[500px] bg-gray-900 rounded-lg p-4">
  {/* List Panel */}
  <div
    className={`md:w-1/3 overflow-y-auto border-r border-gray-700 pr-2 ${
      selected ? "hidden md:block" : "block"
    }`}
  >
    <div className="flex justify-between items-center mb-2">
      <h4 className="text-yellow-400 font-semibold text-lg">Notifications</h4>
      <button
        onClick={markAllAsRead}
        className="text-sm text-blue-400 hover:underline"
      >
        Mark all as read
      </button>
    </div>
    {notifications.map((note) => (
      <div
        key={note.id}
        onClick={() => setSelected(note)}
        className={`p-3 mb-2 rounded cursor-pointer hover:bg-gray-700 transition ${
          selected?.id === note.id ? "bg-gray-700" : "bg-gray-800"
        }`}
      >
        <div className="flex justify-between items-center">
          <span className="text-sm text-white font-semibold">{note.subject}</span>
          {!note.read && (
            <span className="text-xs bg-red-600 px-2 rounded text-white">●</span>
          )}
        </div>
        <p className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(note.timestamp), { addSuffix: true })}
        </p>
      </div>
    ))}
  </div>

  {/* Detail Panel */}
  <div
    className={`md:w-2/3 p-4 bg-gray-800 rounded-md h-full ${
      selected ? "block" : "hidden md:block"
    }`}
  >
    {selected ? (
      <>
        {/* Only show "Back" on mobile */}
        <button
          onClick={() => setSelected(null)}
          className="md:hidden text-sm text-blue-400 hover:underline mb-4"
        >
          ← Back to list
        </button>

        <h3 className="text-xl font-bold text-white mb-2">
          {selected.subject}
        </h3>
        <p className="text-sm text-gray-300 whitespace-pre-wrap">{selected.message}</p>
        <p className="text-xs text-gray-500 mt-4">
          Received {formatDistanceToNow(new Date(selected.timestamp), { addSuffix: true })}
        </p>
      </>
    ) : (
      <p className="text-gray-400 text-sm">Click a notification to read</p>
    )}
  </div>
</div>
  );
}
