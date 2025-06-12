import { useEffect, useState } from 'react'; // שימוש ב-Effect ו-State
import { useFormik } from 'formik'; // שימוש ב-Formik // סוג הנתונים של הטופס
import DietaryPreferences from './DietaryPreferences';
import ProcessTypeAndTrainingLocation from './ProcessTypeAndTrainingLocation';
import { useSelector } from 'react-redux';
import type { RootState } from '../state/store';
import type { User } from '../data/UserType';
import { validationSchema } from "../data/validationSchemaEditProfil"
import HealthInfo from './HealthInfo';
import PersonalInfo from './PersonalInfo';
import { updateUserAction } from '../data/editProfileExit';
import HealthDeclaration from './HealthDeclaration';
import { useNavigate } from "react-router-dom";



export default function EditProfile({ navigateUrl }: { navigateUrl: string | null }) {

  const nav = useNavigate();
  console.log("navigate to: " + navigateUrl)

  const [submitStatus, setSubmitStatus] = useState({
    isSubmitting: false,
    success: '',
    error: '',
  });
  const [userProfile, setUserProfile] = useState<User | null>(null);

  const [step, setStep] = useState(1);
  const { user } = useSelector((state: RootState) => state.userState); // מקבלים את פרטי המשתמש מ-Redux
  useEffect(() => {
    if (user && "idNumber" in user) {
      setUserProfile(user); // אם המשתמש הוא 'user', מכניס את המידע
    }
  }, [user]);
  // אם לא נמצא משתמש ב-Redux, מחזירים הודעה
  if (!user) {
    return <div>לא נמצאו פרטי משתמש...</div>;
  }

  const formik = useFormik<User>({
    initialValues: userProfile || {
      fullName: '',
      email: '',
      idNumber: '',
      password: '',
      phone: '',
      age: 0,
      height: 0,
      weight: 0,
      gender: '',
      activityLevel: '',
      dangerousFoods: [],
      diet: null,
      eatsEggs: false,
      eatsDairy: false,
      eatsFish: false,
      favoriteFoods: [],
      dislikeFoods: [],
      goal: '',
      trainingLocation: '',
      acceptTerms: false,
      healthQuestions: [
        { question: "האם חווית אובדן הכרה מכל סיבה שהיא?", answer: "" },
        { question: "האם חווית אירועי עילפון?", answer: "" },
        { question: "האם חווית פעולות חוזרות בלתי מוסברות?", answer: "" },
        { question: "האם יש לך מגבלות פיזיות כלשהן?", answer: "" },
        { question: "האם עברת ניתוחים בעבר?", answer: "" },
        { question: "האם אתה נוטל תרופות באופן קבוע?", answer: "" },
        { question: "האם אובחנת עם מחלת לב?", answer: "" },
        { question: "האם במשפחתך מדרגת קרבה ראשונה יש היסטוריה של מחלות לב?", answer: "" },
        { question: "האם אתה סובל מלחץ דם גבוה?", answer: "" },
        { question: "האם אתה גבר מעל גיל 55 או אישה מעל גיל 65?", answer: "" },
        { question: "האם עברת בדיקות רפואיות בשלושת החודשים האחרונים בהן נאמר לך להימנע מפעילות גופנית?", answer: "" },
      ],
      status: 'active',
      dailyCalories: 0,
      registrationDate: '',
      signature: '',
    }, // ערכים ברירת מחדל אם userProfile הוא null
    validationSchema,
    validateOnChange: true,
    validateOnBlur: true,
    onSubmit: async (values, { setSubmitting }) => {
      console.log('📢 התחלת שליחת טופס'); // הוסף בדיקה כאן
      console.log(values);

      setSubmitStatus({
        isSubmitting: true,
        success: '',
        error: '',
      });

      try {
        await updateUserAction(values, setSubmitStatus);
        setSubmitStatus({
          isSubmitting: false,
          success: 'הפרופיל עודכן בהצלחה!',
          error: '',
        });
      } catch (error) {
        setSubmitStatus({
          isSubmitting: false,
          success: '',
          error: 'אירעה שגיאה בעדכון הפרופיל.',
        });
      }

      setSubmitting(false);
    }

  });

  const handleNext = async () => {
    await formik.validateForm(); // מאמת את כל השדות בטופס

    console.log("שגיאות בטופס:", formik.errors); // 🔴 הדפס שגיאות כדי לבדוק מה חוסם מעבר

    formik.setTouched(
      Object.keys(formik.values).reduce((acc, key) => ({ ...acc, [key]: true }), {}),
      true
    );

    const currentStepFields = getFieldsForStep(step);
    const errorsInCurrentStep = Object.keys(formik.errors).filter((key) => currentStepFields.includes(key));

    console.log("שדות עם שגיאות בשלב הנוכחי:", errorsInCurrentStep); // 🔴 בדוק אילו שדות בעייתיים

    if (errorsInCurrentStep.length === 0) {
      console.log("מעבר לשלב הבא"); // 🔴 וידוא שהמעבר מתבצע
      setStep((prev) => prev + 1);
    }
  };

  const getFieldsForStep = (step: number) => {
    switch (step) {
      case 1:
        return ['fullName', 'email', 'idNumber', 'phone'];
      case 2:
        return ['age', 'height', 'weight', 'gender', 'activityLevel'];
      case 3:
        return Object.keys(formik.values.healthQuestions); // כל השאלות הבריאותיות
      case 4:
        return ['dangerousFoods', 'favoriteFoods', 'dislikeFoods'];
      case 5:
        return ["goal", 'trainingLocation', 'acceptTerms'];
      default:
        return [];
    }
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  return (
    <div className="register-page">
      <div className="registration-card">
        <div className="register-page-card-header">
          <h1 className="register-page-title">עריכת הפרופיל שלך</h1>
        </div>
        <div>
          <button
            onClick={() => nav("/dashboard")}
            className="btn btn-secondary"
          >
            חזרה
          </button>
        </div>

        {submitStatus.error && <div className="register-page-error-message">{submitStatus.error}</div>}
        {submitStatus.success && <div className="success-alert">{submitStatus.success}</div>}

        <div className="card-content">
          <form onSubmit={formik.handleSubmit} className="registration-form">
            {step === 1 && <PersonalInfo formik={formik} goNext={handleNext} initialValues={formik.values} isEditMode={true} />}
            {step === 2 && <HealthInfo formik={formik} goNext={handleNext} goBack={handleBack} initialValues={formik.values} />}
            {step === 3 && <HealthDeclaration formik={formik} goNext={handleNext} goBack={handleBack} initialValues={formik.values} />}
            {step === 4 && <DietaryPreferences formik={formik} goNext={handleNext} goBack={handleBack} initialValues={formik.values} />}
            {step === 5 && (
              <div>
                <ProcessTypeAndTrainingLocation formik={formik} goBack={handleBack} initialValues={formik.values} />
                <div className="form-section">
                  <div className="checkbox-container">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      className="form-checkbox"
                      {...formik.getFieldProps('acceptTerms')}
                    />
                    <label htmlFor="acceptTerms">אני מסכים/ה לתנאים והגבלות</label>
                  </div>
                  {formik.touched.acceptTerms && formik.errors.acceptTerms && (
                    <div className="error-message">{formik.errors.acceptTerms}</div>
                  )}
                </div>
                {/* ✅ כפתור חזרה לדף הקודם */}
                <button
                  type="submit"
                  className="submit-button"
                //   disabled={submitStatus.isSubmitting || Object.keys(formik.errors).length > 0}
                >
                  {submitStatus.isSubmitting ? 'שולח...' : 'עדכון פרופיל'}
                </button>
              </div>
            )}
          </form>

        </div>
      </div>
    </div>
  );
}