// AdminDashbord.tsx
import { useState, useEffect } from "react";
import { LogOut } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { setIsLoading, setError, logout } from "../state/userSlice";
import { fetchPendingUsers } from "../data/adminActions";
import type { RootState } from "../state/store";
import { useNavigate } from "react-router-dom";
import type { User } from "../data/UserType";
import UserPending from "./UserPending";
import TrainingProgram from "./TrainingProgram";
import NutritionMenuForm from "./NutritionMenuForm.tsx";
import TrainingList from "./TrainingList.tsx";
import NutritionList from "./NutritionList.tsx";
import UserList from "./UserList.tsx";
import "../styles/adminDashbord.css";
import PlanChangeRequest from "./PlanChangeReques";

interface AdminDashbordProps {
  setSelectedUser: (user: User | null) => void;
  setNavigateUrl: (str: string) => void;
}

export default function AdminDashbord({ setSelectedUser, setNavigateUrl }: AdminDashbordProps) {
  const dispatch = useDispatch();
  const { user, token, isLoading, error } = useSelector(
    (state: RootState) => state.userState
  );
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [currentView, setCurrentView] = useState<string>("pendingUsers");
  const nav = useNavigate();

  useEffect(() => {
    if (token) {
      fetchPendingUsers(token, dispatch, setPendingUsers);
      dispatch(setIsLoading(false));
    } else {
      dispatch(setError("Invalid user"));
      dispatch(setIsLoading(false));
    }
  }, [token]);

  function Logout() {
    dispatch(logout());
    nav("/");
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-welcome">
        <h1>לוח הבקרה של המנהל</h1>
        <h2>ברוך הבא {user?.fullName}!</h2>
        <button className="logout-button" onClick={Logout}>
          <LogOut size={16} />
          התנתקות
        </button>
      </div>

<div className="admin-navigation">
  <div className="admin-card-button blue" onClick={() => setCurrentView("pendingUsers")}>🕒 משתמשים ממתינים</div>
  <div className="admin-card-button gray" onClick={() => setCurrentView("userList")}>👤 כלל המשתמשים</div>
  <div className="admin-card-button green" onClick={() => setCurrentView("trainingList")}>📋 תוכניות אימון</div>
  <div className="admin-card-button orange" onClick={() => setCurrentView("nutritionList")}>🍽️ תפריטי תזונה</div>
  <div className="admin-card-button green" onClick={() => setCurrentView("trainingProgram")}>➕ הוספת תוכנית</div>
  <div className="admin-card-button orange" onClick={() => setCurrentView("nutritionMenu")}>➕ הוספת תפריט</div>
  <div className="admin-card-button red" onClick={() => setCurrentView("planChangeRequest")}>⚠️ בקשות שינוי</div>
</div>


      <div className="admin-container">
        {error && <div className="error-message">{error}</div>}

        {currentView === "pendingUsers" && (
          <UserPending
            pendingUsers={pendingUsers}
            setPendingUsers={setPendingUsers}
            token={token}
            isLoading={isLoading}
            error={error}
            setSelectedUser={setSelectedUser}
            setNavigateUrl={setNavigateUrl}
          />
        )}

        {currentView === "trainingProgram" && <TrainingProgram />}
        {currentView === "nutritionMenu" && <NutritionMenuForm />}
        {currentView === "trainingList" && <TrainingList />}
        {currentView === "nutritionList" && <NutritionList />}
        {currentView === "planChangeRequest" && <PlanChangeRequest />}
        {currentView === "userList" && <UserList />}
      </div>
    </div>
  );
}