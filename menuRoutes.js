const express = require('express');
const Menu = require('../models/menuModel');

const router = express.Router();

// יצירת תפריט חדש
router.post('/', async (req, res) => {
  const { calories, type, sections } = req.body;

  if (!calories || !type || !Array.isArray(sections) || sections.length === 0) {
    return res.status(400).json({ message: 'נא למלא את כל השדות הנדרשים' });
  }

  try {
    const newMenu = new Menu({ calories, type, sections });
    await newMenu.save();
    res.status(201).json({ message: 'התפריט נשמר בהצלחה!' });
  } catch (error) {
    console.error('שגיאה בשמירת תפריט:', error);
    res.status(500).json({ message: 'שגיאה בשמירת התפריט' });
  }
});

// שליפת כל התפריטים
router.get('/', async (req, res) => {
  try {
    const menus = await Menu.find().sort({ createdAt: -1 });
    res.json(menus);
  } catch (error) {
    console.error('שגיאה בטעינת תפריטים:', error);
    res.status(500).json({ message: 'שגיאה בטעינת התפריטים' });
  }
});

// עדכון תפריט קיים
router.put('/:id', async (req, res) => {
  const { calories, type, sections } = req.body;

  try {
    await Menu.findByIdAndUpdate(req.params.id, { calories, type, sections });
    res.json({ message: 'התפריט עודכן בהצלחה' });
  } catch (err) {
    console.error('שגיאה בעדכון:', err);
    res.status(500).json({ message: 'שגיאה בעדכון התפריט' });
  }
});

// מחיקת תפריט
router.delete('/:id', async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.id);
    res.json({ message: 'התפריט נמחק בהצלחה' });
  } catch (err) {
    console.error('שגיאה במחיקה:', err);
    res.status(500).json({ message: 'שגיאה במחיקת התפריט' });
  }
});

//התאמת תפריט להעדפות תזונה
router.get('/match', async (req, res) => {
  const { dailyCalories, type } = req.query;

  if (!dailyCalories || !type) {
    return res.status(400).json({ message: 'נא לספק ערך קלורי וסוג תפריט' });
  }

  try {
    const minCalories = Number(dailyCalories) - 200;
    const maxCalories = Number(dailyCalories) + 200;

    const query = {
      calories: { $gte: minCalories, $lte: maxCalories },
      type // דוגמה: 'צמחוני'
    };

    const menus = await Menu.find(query).sort({ createdAt: -1 });

    if (menus.length === 0) {
      return res.status(404).json({ message: 'לא נמצאו תפריטים מתאימים' });
    }

    res.json(menus);
  } catch (error) {
    console.error('שגיאה באיתור תפריטים:', error);
    res.status(500).json({ message: 'שגיאה באיתור תפריטים' });
  }
});

module.exports = router;