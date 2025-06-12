// controllers/TrainingProgramController.js
const TrainingProgram = require('../models/TrainingProgramModel');
const User = require('../models/userModel'); // המודל של המשתמש

// יצירת תוכנית אימון חדשה
exports.createTrainingProgram = async (req, res) => {
  const { exercises, totalCalories, foods, difficultyLevel, goal, location } = req.body;

  try {
    // השתמש ב-create במקום save
    const newTrainingProgram = await TrainingProgram.create({
      exercises,
      totalCalories,
      foods,
      difficultyLevel,
      goal,
      location
    });

    res.status(201).json({ message: 'התוכנית נשמרה בהצלחה' });  // מחזיר הודעה
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'שגיאה ביצירת תוכנית אימון' });
  }
};

exports.createTrainingPlanByUser = async (req, res) => {
  const { idNumber } = req.body;  // עדכון - `idNumber` מגיע בגוף הבקשה
  // הדפס את ה-idNumber

  try {
    // שליפת פרטי המשתמש
    const user = await User.findOne({ idNumber });

    console.log('--- משתמש שנמצא ---');
    console.log('שם:', user.fullName);
    console.log('מטרה:', user.goal);
    console.log('קלוריות יומיות:', user.dailyCalories);
    console.log('כבר יש selectedTrainingPlan?', !!user.selectedTrainingPlan);


    if (!user) {
      console.log('לא נמצא משתמש עם idNumber:', idNumber);  // הדפס אם לא נמצא משתמש
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    // אם כבר יש למשתמש תוכנית אימון שנבחרה
    if (user.selectedTrainingPlan) {

      return res.status(200).json({
        message: 'למשתמש יש כבר תוכנית אימון נבחרת',
        selectedTrainingPlan: user.selectedTrainingPlan  // שליחה ישירה של התוכנית למשתמש
      });
    }

    const plans = await TrainingProgram.find();  // שליפת כל תוכניות האימון

    console.log('--- תוכניות אימון שנמצאו ---');
    plans.forEach((p, i) => {
      console.log(`#${i + 1}: קלוריות ${p.totalCalories}, קושי ${p.difficultyLevel}, תרגילים: ${p.exercises.length}`);
    });

    if (plans.length === 0) {
      console.log('לא נמצאו תוכניות אימון במאגר');  // הדפס אם אין תוכניות אימון
      return res.status(404).json({ message: 'לא נמצאו תוכניות אימון' });
    }

    let closestPlan;

    // פילטור לפי מטרה וקלוריות
    if (user.goal === 'muscleGain') {
      // הדפס את הערך של dailyCalories של המשתמש
      const filteredPlans = plans.filter(plan => plan.totalCalories > user.dailyCalories);


      if (filteredPlans.length === 0) {
        console.log('⚠️ לא נמצאה אף תוכנית מתאימה!');
        console.log('קלוריות נדרשות:', user.dailyCalories);
        console.log('ניסיון לפי כיוון:', user.goal === 'muscleGain' ? 'מעל' : 'מתחת');
        console.log('לא נמצאו תוכניות לעלייה במסה עם קלוריות גבוהות');  // הדפס אם אין תוכניות מתאימות
        return res.status(404).json({ message: 'לא נמצאו תוכניות לאימון לעלייה במסה עם קלוריות גבוהות' });
      }
      filteredPlans.sort((a, b) => a.totalCalories - b.totalCalories);
      closestPlan = filteredPlans[0];
    } else if (user.goal === 'weightLoss') {

      const filteredPlans = plans.filter(plan => plan.totalCalories < user.dailyCalories);


      if (filteredPlans.length === 0) {
        console.log('לא נמצאו תוכניות לירידה במשקל עם קלוריות נמוכות');  // הדפס אם אין תוכניות מתאימות
        return res.status(404).json({ message: 'לא נמצאו תוכניות לירידה במשקל עם קלוריות נמוכות' });
      }
      filteredPlans.sort((a, b) => b.totalCalories - a.totalCalories);
      closestPlan = filteredPlans[0];
      console.log('✅ התוכנית שנבחרה:');
      console.log('קלוריות:', closestPlan.totalCalories);
      console.log('קושי:', closestPlan.difficultyLevel);
      console.log('מספר תרגילים:', closestPlan.exercises.length);
    } else {
      console.log('המטרה לא נתמכת:', user.goal);  // הדפס אם המטרה לא נתמכת
      return res.status(400).json({ message: 'מטרה לא נתמכת' });
    }

    // עדכון שדה תוכנית האימון עם כל האובייקט
    user.selectedTrainingPlan = closestPlan;  // כאן אתה שומר את כל תוכנית האימון
    await user.save();
    console.log('התוכנית הנבחרת שונתה בהצלחה:', closestPlan);  // הדפס את התוכנית הנבחרת

    return res.status(200).json({
      message: 'תוכנית אימון נבחרה בהצלחה',
      selectedTrainingPlan: closestPlan  // שליחה ישירה של התוכנית שנבחרה
    });
  } catch (error) {
    console.error('שגיאה בתהליך יצירת תוכנית האימון:', error);  // הדפס את השגיאה
    return res.status(500).json({ message: 'שגיאה ביצירת תוכנית האימון' });
  }
};

// הצגת כל תוכניות האימון
exports.getAllTrainingPrograms = async (req, res) => {
  try {
    const programs = await TrainingProgram.find(); // אפשר גם לסנן לפי קריטריונים אם רוצים
    res.status(200).json(programs);
  } catch (error) {
    console.error("שגיאה בקבלת תוכניות האימון:", error);
    res.status(500).json({ error: 'שגיאה בקבלת תוכניות האימון' });
  }
};

// מחיקת תוכנית אימון
exports.deleteTrainingProgram = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedProgram = await TrainingProgram.findByIdAndDelete(id);

    if (!deletedProgram) {
      return res.status(404).json({ message: 'תוכנית אימון לא נמצאה' });  // תיקון ל-404 אם לא נמצאה תוכנית
    }

    res.status(200).json({ message: 'תוכנית אימון נמחקה בהצלחה' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'שגיאה במחיקת תוכנית האימון' });
  }
};



// עדכון תוכנית אימון
exports.updateTrainingPlan = async (req, res) => {
  const { idNumber, difficultyLevel, totalCalories, difficultyString } = req.body;

  try {
    // חיפוש תוכנית האימון המתאימה לפי הקריטריונים
    let query = { totalCalories: totalCalories };

    if (difficultyString === "קל") {
      query.difficultyLevel = { $gt: difficultyLevel }; // חפש תוכניות עם difficultyLevel גבוה יותר
    } else if (difficultyString === "קשה") {
      query.difficultyLevel = { $lt: difficultyLevel }; // חפש תוכניות עם difficultyLevel נמוך יותר
    }

    // חיפוש התוכנית המתאימה
    const programs = await TrainingProgram.find(query);

    // אם נמצאה תוכנית מתאימה
    if (programs.length > 0) {
      const selectedProgram = programs[0]; // בחר את התוכנית הראשונה

      // חיפוש המשתמש לפי idNumber
      const user = await User.findOne({ idNumber: idNumber });

      if (!user) {
        return res.status(404).json({ message: "לא נמצא משתמש עם מזהה זה" });
      }

      // עדכון שדה selectedTrainingPlan במשתמש כך שישמור את התוכנית כולה, ולא רק את ה-ID
      user.selectedTrainingPlan = selectedProgram; // עדכון תוכנית האימון כולה
      await user.save(); // שמירת המשתמש עם התוכנית המעודכנת

      res.json({
        message: "תוכנית האימון עודכנה בהצלחה",
        selectedTrainingPlan: selectedProgram
      });
    } else {
      res.status(404).json({ message: "לא נמצאה תוכנית המתאימה לקריטריונים שלך" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "שגיאה בשרת" });
  }
}

exports.updateTrainingProgram = async (req, res) => {
  const { id } = req.params;
  const { exercises, totalCalories, difficultyLevel } = req.body;

  try {
    const updated = await TrainingProgram.findByIdAndUpdate(
      id,
      { exercises, totalCalories, difficultyLevel },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'תוכנית לא נמצאה' });
    }

    res.status(200).json({ message: 'התוכנית עודכנה בהצלחה', program: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'שגיאה בעדכון התוכנית' });
  }
};

exports.createCustomTrainingPlan = async (req, res) => {
  const { idNumber } = req.body;

  if (!idNumber) {
    return res.status(400).json({ message: 'יש לספק תעודת זהות' });
  }

  try {
    const user = await User.findOne({ idNumber });

    if (!user) {
      return res.status(404).json({ message: 'משתמש לא נמצא' });
    }

    // בדיקה אם קיימת תוכנית מותאמת
    if (!user.selectedTrainingPlan) {
      return res.status(404).json({ message: 'אין תוכנית מותאמת אישית עבור משתמש זה' });
    }

    return res.status(200).json({
      message: 'תוכנית מותאמת אישית נשלפה בהצלחה',
      customPlan: user.selectedTrainingPlan
    });
  } catch (error) {
    console.error('שגיאה בשליפת תוכנית מותאמת אישית:', error);
    return res.status(500).json({ message: 'שגיאה בשליפת תוכנית מותאמת אישית' });
  }
};