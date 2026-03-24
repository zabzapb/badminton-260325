import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "./config";
import { AppNotification } from "../types";

export const createNotification = async (notification: AppNotification) => {
    await addDoc(collection(db, "notifications"), {
        ...notification,
        isRead: false,
        createdAt: new Date().toISOString()
    });
};

export const getUserNotifications = async (userId: string) => {
    const q = query(collection(db, "notifications"), where("userId", "==", userId), where("isRead", "==", false));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) as any as AppNotification[];
};

export const markNotificationAsRead = async (id: string) => {
    await updateDoc(doc(db, "notifications", id), { isRead: true });
};
