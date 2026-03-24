import { 
  collection, 
  getDocs, 
  query, 
  orderBy,
  limit,
  where
} from "firebase/firestore";
import { db } from "./config";
import { addData, getData, removeData } from "./firestore";

import { Tournament } from "../types";
export type { Tournament };

const COLLECTION_TOURNAMENTS = "tournaments";

export const saveTournament = async (tournament: Tournament) => {
  return await addData(COLLECTION_TOURNAMENTS, tournament.id, {
    ...tournament,
    updatedAt: new Date().toISOString(),
  });
};

export const getTournament = async (id: string) => {
  return await getData(COLLECTION_TOURNAMENTS, id);
};

export const getAllTournaments = async (max: number = 20) => {
  try {
    const q = query(
      collection(db, COLLECTION_TOURNAMENTS),
      orderBy("createdAt", "desc"),
      limit(max)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return [];
  }
};

export const deleteTournament = async (id: string) => {
  return await removeData(COLLECTION_TOURNAMENTS, id);
};

export const getTournamentsByIds = async (ids: string[]) => {
  if (!ids || ids.length === 0) return [];
  try {
    const list: any[] = [];
    for (let i = 0; i < ids.length; i += 30) {
      const chunk = ids.slice(i, i + 30);
      const q = query(collection(db, COLLECTION_TOURNAMENTS), where("__name__", "in", chunk));
      const snapshot = await getDocs(q);
      snapshot.docs.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    }
    return list;
  } catch (error) {
    console.error("Error fetching tournaments by ids:", error);
    return [];
  }
};
