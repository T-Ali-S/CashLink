import { ref, push } from "firebase/database";
import { db } from "../../firebase";

export const sendNotification = (uid, subject, message) => {
  const notifRef = ref(db, `notifications/${uid}`);
  const newNotif = {
    subject,
    message,
    timestamp: Date.now(),
    read: false,
  };
  return push(notifRef, newNotif);
};