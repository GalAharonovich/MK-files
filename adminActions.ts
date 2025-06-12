import axios from 'axios';
import type { User } from './UserType';

import { setIsLoading, setError } from '../state/userSlice.ts'; // ייבוא הפעולות מ-Redux
import apiURL from './apiConfig.ts';

export async function fetchPendingUsers(
  token: string | null,
  dispatch: React.Dispatch<any>,  // dispatch מ-Redux
  setPendingUsers: React.Dispatch<React.SetStateAction<User[]>>  // עדכון state מקומי של המשתמשים
) {
  try {
    // מתחילים טעינת נתונים
    dispatch(setIsLoading(true)); // פעולת Redux לעדכון טעינה
    dispatch(setError(null)); // מאפסים את השגיאה הקודמת

    // בקשת GET לשרת עם ה-token בתור header
    const response = await axios.get(apiURL + "/api/admin/pending", {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    // אם אין שגיאה, מעדכנים את הרשימה ב-state המקומי
    setPendingUsers(response.data);
  } catch (error) {
    // טיפול בשגיאות אם הייתה בעיה במהלך הבקשה
    console.error('Error fetching pending users:', error);
    dispatch(setError('Something went wrong'));  // עדכון שגיאה ב-Redux
  } finally {
    // סיום טעינה אחרי קריאת השרת
    dispatch(setIsLoading(false));  // פעולת Redux לעדכון מצב טעינה
  }
}
export const Approve = async (
  userId: string,
  token: string | null,
  setPendingUsers: React.Dispatch<React.SetStateAction<User[]>>,
  dispatch: React.Dispatch<any>,  // dispatch מ-Redux
) => {

  try {
    dispatch(setIsLoading(true));
    dispatch(setError(null));

    // שליחה לבקשה לאישור המשתמש
    await axios.post(apiURL + "/api/admin/approve/" + userId, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    console.log(userId)

    // עדכון הסטייט - עדכון הסטטוס ל-active ואז הסרת המשתמש
    setPendingUsers(prevUsers => {
      // עדכון הסטטוס של המשתמש המאושר ל-active
      const updatedUsers = prevUsers.map(user =>
        user.idNumber === userId ? { ...user, status: 'active' } : user
      );

      // הסרת המשתמש המאושר מתוך הרשימה
      return updatedUsers.filter(user => user.idNumber !== userId);
    });
  } catch (error) {
    dispatch(setError('שגיאה באישור המשתמש'));
    console.error('Error approving user:', error);
  } finally {
    dispatch(setIsLoading(false));
  }
};

export const Reject = async (userId: string, token: string | null, setPendingUsers: React.Dispatch<React.SetStateAction<User[]>>, dispatch: React.Dispatch<any>) => {
  try {
    dispatch(setIsLoading(true));
    dispatch(setError(null));
    await axios.delete(apiURL + "/api/admin/deny/" + userId, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    setPendingUsers(prevUsers =>
      prevUsers.filter(user => user.idNumber !== userId)
    );
  } catch (error) {
    dispatch(setError('שגיאה בדחיית המשתמש'));
    console.error('Error rejecting user:', error);
  } finally {
    dispatch(setIsLoading(false));
  }
};

export async function fetchAllUsers(
  token: string | null,
  dispatch: React.Dispatch<any>,
  setActiveUsers: React.Dispatch<React.SetStateAction<User[]>>
) {
  try {
    dispatch(setIsLoading(true));
    dispatch(setError(null));
    const response = await axios.get(apiURL + "/api/admin/getActiveusers", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    setActiveUsers(response.data);
    console.log("the response is:" + response)
  } catch (error) {
    console.error("Error fetching all users:", error);
    dispatch(setError("שגיאה בשליפת כל המשתמשים"));
  } finally {
    dispatch(setIsLoading(false));
  }
}