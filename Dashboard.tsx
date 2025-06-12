import { logout, setIsLoading, setError } from '../state/userSlice';
import { LogOut } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState } from '../state/store';
import '../styles/userDashbord.css';
import { useNavigate } from 'react-router-dom';
import type { User } from '../data/UserType';
import axios from 'axios';
import { useEffect, useState } from 'react';
import apiURL from '../data/apiConfig';

interface Exercise {
  name: string;
  sets?: string;
  repetitions: string;
  weight?: string;
  tips: string;
  videoUrl?: string;
}
interface dashbordProps {
  setNavigateUrl: (str: string) => void;
  setSelectedUser(user: User | null): void;
}

export default function Dashboard({ setSelectedUser, setNavigateUrl }: dashbordProps) {
  const dispatch = useDispatch();
  const { user, isLoading, error } = useSelector((state: RootState) => state.userState);
  const nav = useNavigate();
  const [trainingPlan, setTrainingPlan] = useState<any>(null);
  console.log(trainingPlan)
  const [showPlan, setShowPlan] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [showPersonalPlan, setShowPersonalPlan] = useState(false)
  const [showCalories, setShowCalories] = useState(false);
  const [showFoods, setShowFoods] = useState(false);
  const [customTrainingPlan, setCustomTrainingPlan] = useState<any>(null)
  const [menus, setMenus] = useState<any>(null)
  const [filteredMenu, setFilteredMenu] = useState<any>(null)
  // const [diet, setDiet] = useState<any>(null)
  // console.log(user)

  useEffect(() => {
    const fetchTrainingPlan = async () => {
      if (user && "idNumber" in user) {
        try {
          const response = await axios.post(apiURL + "/api/training-programs/createTrainingPlanByUser",
            { idNumber: user.idNumber });

          // הדפס את ה-trainingPlan כדי לבדוק את התוכן שלו
          console.log('trainingPlan:', response.data.selectedTrainingPlan);

          setTrainingPlan(response.data.selectedTrainingPlan);

          // קריאה נוספת לתוכנית מותאמת אישית למתאמן
          try {
            const customPlanResponse = await axios.post(apiURL + "/api/training-programs/createCustomTrainingPlan",
              { idNumber: user.idNumber });

            console.log('customTrainingPlan:', customPlanResponse.data);

            // בדיקה אם יש תוכנית מותאמת אישית
            if (customPlanResponse.data && customPlanResponse.data.customPlan) {
              setCustomTrainingPlan(customPlanResponse.data.customPlan);
              console.log('Custom training plan found and set');
            } else {
              console.log('No custom training plan available, using default plan');
            }
          } catch (customPlanError: any) {
            // אם השרת מחזיר שגיאה 404 או אין תוכנית מותאמת
            console.log('No custom training plan available:', customPlanError.message);
          }

          try {
            const res = await axios.get(`${apiURL}/api/menus`);
            console.log(res.data)
            setMenus(res.data);
            const matched = getMatchedMenu(res.data, user);
            setFilteredMenu(matched);

          } catch (err) {
            setError("שגיאה בטעינת התפריטים");
            console.error(err);
          }

          dispatch(setIsLoading(false));
        } catch (err) {
          dispatch(setError('Error fetching training plan' + err));
          dispatch(setIsLoading(false));
        }
      }
    };


    fetchTrainingPlan();
  }, [user]);


  const getMatchedMenu = (menus: any[], user: User) => {
    if (!menus || !user) return null;

    // סינון תפריטים לפי הסוג המתאים
    const compatibleMenus = menus.filter((menu: any) => {
      // אם המשתמש טבעוני - רק תפריטים טבעוניים
      if (user.diet === 'vegan') {
        return menu.type === 'טבעוני';
      }

      // אם המשתמש צמחוני - תפריטים צמחוניים או טבעוניים
      if (user.diet === 'vegetarian') {
        return menu.type === 'צמחוני' || menu.type === 'טבעוני';
      }

      // אם המשתמש אוכל בשר אבל לא חלב
      if (user.diet === 'meat' && user.eatsDairy === false) {
        return menu.type === 'ללא חלב' || menu.type === 'טבעוני';
      }

      // אם המשתמש אוכל הכל - כל התפריטים מתאימים
      return true;
    });

    if (compatibleMenus.length === 0) return null;

    // מציאת התפריט עם הקלוריות הכי קרובות
    return compatibleMenus.reduce((closest: any, current: any) => {
      const closestDiff = Math.abs(closest.calories - user.dailyCalories);
      const currentDiff = Math.abs(current.calories - user.dailyCalories);

      return currentDiff < closestDiff ? current : closest;
    });
  };

  function Logout() {
    dispatch(logout());
    nav("/");
  }

  const updateTrainingPlan = async (difficultyString: string, totalCalories: number, difficultyLevel: number, idNumber: string) => {
    try {
      const response = await axios.post(apiURL + "/api/training-programs/update-training-plan", {
        idNumber: idNumber,
        difficultyLevel: difficultyLevel,
        totalCalories: totalCalories,
        difficultyString: difficultyString
      });
      setTrainingPlan(response.data.selectedTrainingPlan);
      console.log("תוכנית האימון עודכנה בהצלחה");
    } catch (error) {
      console.error("שגיאה בעדכון תוכנית האימון:", error);
    }
  };
  const goToUpdateProfile = () => {
    nav("/Edit-profile"); // ניווט לדף של שינוי פרטי ההרשמה
  };

  // פונקציה לשלוח את הבקשה למנהל להוריד קלוריות
  const requestLowerCalories = async () => {
    console.log("הבקשה הוגשה");
    if (user && "idNumber" in user) {
      try {

        const response = await axios.post(apiURL + "/api/diet-request/request-change",
          { idNumber: user.idNumber }
        );

        console.log(response.data); // הודעת הצלחה
        alert("בקשה לשינוי תפריט נשלחה בהצלחה!");
      } catch (error: any) {
        console.error("שגיאה בשליחת הבקשה", error.response?.data || error.message);
        alert(error.response?.data?.error || "שגיאה בשליחת הבקשה");
      }
    }
  };

  const handleEasyPlan = () => {
    if (user && "idNumber" in user) {
      updateTrainingPlan('קל', trainingPlan.totalCalories, trainingPlan.difficultyLevel, user.idNumber);
    }
  };

  const handleHardPlan = () => {
    if (user && "idNumber" in user) {
      updateTrainingPlan('קשה', trainingPlan.totalCalories, trainingPlan.difficultyLevel, user.idNumber);
    }
  };

  const parseContent = (text: any) => {
    if (!text) return null;

    const boldAndLinkReplaced = text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // בולד
      .replace(/\[(.+?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank">$1</a>'); // קישור

    return <span dangerouslySetInnerHTML={{ __html: boldAndLinkReplaced.replace(/\n/g, '<br />') }} />;
  };
  console.log("new menu: ", filteredMenu)

  return (
    <div className="dashboard-container">
      <h1>ברוך הבא לדשבורד</h1>
      <div className={`user-info ${user ? '' : 'hidden'}`}>
        <h2>שלום, {user?.fullName}!</h2>
        <p>אימייל: {user?.email}</p>



        {/* כפתור לשליחת בקשה למנהל להוריד קלוריות */}
        <button className="request-lower-calories-btn" onClick={requestLowerCalories}>
          בקשה למנהל להוריד קלוריות
        </button>

        {/* כפתור לגישה לדף הצהרת הבריאות */}
        <button
          className="health-declaration-btn"
          onClick={() => {
            if (user && "idNumber" in user) {
              setSelectedUser(user);
            }
            setNavigateUrl("/dashboard");
            nav("/health-declaration");
          }}
        >
          הצהרת בריאות
        </button>
        <button className="update-profile-btn" onClick={goToUpdateProfile}>
          שינוי פרטי ההרשמה
        </button>
        {/* כפתור למדידות */}
        <button className="measurements-btn" onClick={() => {
          if (user && "idNumber" in user) {
            setSelectedUser(user);
          }
          setNavigateUrl("/dashboard");
          nav("/measurements")
        }}>
          מעבר למדידות
        </button>
        <button className="measurements-btn" onClick={() => {
          if (user && "idNumber" in user) {
            setSelectedUser(user);
          }
          setNavigateUrl("/dashboard");
          nav("/measurements-list")
        }}>
          היסטורית מדידות
        </button>
        {/* הצגת תוכנית האימון */}
        {isLoading ? (
          <p>טוען תוכנית אימון...</p>
        ) : error ? (
          <p>{error}</p>
        ) : trainingPlan ? (
          <div className="training-plan-info">
            <button style={{ backgroundColor: showPlan ? '#005BBB' : '#008CFF' }} className="measurements-btn" onClick={() => { setShowPlan(true); setShowMenu(false); setShowPersonalPlan(false) }}>
              תוכנית האימון שלך
            </button>
            <button style={{ backgroundColor: showMenu ? '#005BBB' : '#008CFF' }} className="measurements-btn" onClick={() => { setShowPlan(false); setShowMenu(true); setShowPersonalPlan(false) }}>
              התפריט שלך
            </button>
            <button style={{ backgroundColor: showPersonalPlan ? '#005BBB' : '#008CFF' }} className="measurements-btn" onClick={() => { setShowPlan(false); setShowMenu(false); setShowPersonalPlan(true) }}>
              תוכנית אימון מותאמת אישית
            </button>
            {showPlan &&
              <div>
                <br />
                <p><strong>תרגילים:</strong></p>
                <table>
                  <thead>
                    <tr>
                      <th>תרגיל</th>
                      <th>סטים</th>
                      <th>חזרות</th>
                      <th>משקל</th>
                      <th>דגשים</th>
                      <th>סרטון</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainingPlan.exercises.map((exercise: Exercise, index: number) => (
                      <tr key={index}>
                        <td>{exercise.name}</td>
                        <td>{exercise.sets || '—'}</td>
                        <td>{exercise.repetitions}</td>
                        <td>{exercise.weight ? `${exercise.weight} ק"ג` : '-'}</td>
                        <td>{exercise.tips}</td>
                        <td>
                          {exercise.videoUrl ? (
                            <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer">צפייה</a>
                          ) : (
                            'אין קישור'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <p><strong>רמת קושי:</strong>
                  {trainingPlan.difficultyLevel === 1 ? 'מתחיל' :
                    trainingPlan.difficultyLevel === 2 ? 'בינוני' :
                      trainingPlan.difficultyLevel === 3 ? 'קשה' : 'לא צוינה רמת קושי'}
                </p>

                {/* שני הכפתורים */}
                <div className="plan-difficulty-buttons">
                  <button className="easy-plan-btn" onClick={handleEasyPlan}>
                    תוכנית קלה לי
                  </button>
                  <button className="hard-plan-btn" onClick={handleHardPlan}>
                    תוכנית קשה לי
                  </button>
                </div>
              </div>
            }
            {showMenu &&
              <div>
                <br />
                <br />
                <div className="nutrition-panel">
                  <div className="section">
                    <button onClick={() => setShowCalories(!showCalories)} className="section-button">
                      סה"כ קלוריות {showCalories ? '▲' : '▼'}
                    </button>
                    {showCalories && (
                      <div className="section-content">
                        <strong>{trainingPlan.totalCalories} קלוריות</strong>
                      </div>
                    )}
                  </div>
                  <br />
                  <div className="section">
                    <button onClick={() => setShowFoods(!showFoods)} className="section-button">
                      מזון {showFoods ? '▲' : '▼'}
                    </button>
                    {showFoods && (
                      <div className="section-content">
                        {menus && filteredMenu ?

                          <div className="menu-list">
                              <div key={filteredMenu._id} className="menu-box">
                                <h2 className="menu-header">
                                  סוג תפריט: {filteredMenu.type} | {filteredMenu.calories} קק"ל
                                </h2>
                                <div className="sections">
                                  {filteredMenu.sections.map((section: any) => (
                                    <div key={section._id} className="section">
                                      {section.title && <h3 className="section-title">{section.title}</h3>}
                                      {section.content && <p className="section-content">{parseContent(section.content)}</p>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                          </div>
                          : 'אין מידע כרגע'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            }
            {
              showPersonalPlan &&
              <div>
                <br />
                <p><strong>תרגילים:</strong></p>
                <table>
                  <thead>
                    <tr>
                      <th>תרגיל</th>
                      <th>סטים</th>
                      <th>חזרות</th>
                      <th>משקל</th>
                      <th>דגשים</th>
                      <th>סרטון</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customTrainingPlan && customTrainingPlan.exercises ? (
                      customTrainingPlan.exercises.map((exercise: Exercise, index: number) => (
                        <tr key={index}>
                          <td>{exercise.name}</td>
                          <td>{exercise.sets || '—'}</td>
                          <td>{exercise.repetitions}</td>
                          <td>{exercise.weight ? `${exercise.weight} ק"ג` : '-'}</td>
                          <td>{exercise.tips}</td>
                          <td>
                            {exercise.videoUrl ? (
                              <a href={exercise.videoUrl} target="_blank" rel="noopener noreferrer">צפייה</a>
                            ) : (
                              'אין קישור'
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                          אין תוכנית אימון מותאמת אישית זמינה כרגע
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                <p><strong>רמת קושי:</strong>
                  {trainingPlan.difficultyLevel === 1 ? 'מתחיל' :
                    trainingPlan.difficultyLevel === 2 ? 'בינוני' :
                      trainingPlan.difficultyLevel === 3 ? 'קשה' : 'לא צוינה רמת קושי'}
                </p>
              </div>
            }
          </div>
        ) : (
          <p>לא נמצאה תוכנית אימון.</p>
        )}
        {/* כפתור התנתקות */}
        <button className="logout-btn" onClick={Logout}>
          <LogOut /> התנתקות
        </button>
      </div>
    </div>
  );
}