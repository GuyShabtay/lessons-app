import express from 'express';
import asyncHandler from '../middleware/asyncHandler.js';
import Day from '../models/dayModel.js';
import User from '../models/UserModel.js';


const router = express.Router();

// GET route to fetch all days (you can modify to fetch by date if necessary)
router.get('/', asyncHandler(async (req, res) => {
  console.log('first1')

  const days = await Day.find({});
  res.json(days);
}));

// GET route to fetch a specific day by date
router.get('/findDay', asyncHandler(async (req, res) => {
  const { date } = req.query; // Use req.query to get the date from query parameters
  console.log(date)
  try {
    const day = await Day.findOne({ date }); // Find a day by date
    if (day) {
      return res.status(200).json(day);
    }
    return res.status(404).json(null); // Not found
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving day', error });
  }
}));


// POST route to add a new day
router.post('/add', asyncHandler(async (req, res) => {
  const { date,dayName, availableHours } = req.body;

  try {
    const newDay = new Day({
      date,
      dayName,
      availableHours,
      takenHours: [], // Initialize with an empty array
    });

    // Save the new day document in the database
    await newDay.save();

    return res.status(201).json({ message: 'New day added successfully', newDay });
  } catch (error) {
    return res.status(500).json({ message: 'Error adding new day', error });
  }
}));

// PUT route to update existing day by date
router.put('/', asyncHandler(async (req, res) => {
  const { date, availableHours } = req.body; // Get date and availableHours from the request body

  try {
    // Find the document by date and update the availableHours
    const updatedDay = await Day.findOneAndUpdate(
      { date }, // Find the document by date
      { availableHours }, // Update the availableHours field
      { new: true } // Return the updated document
    );

    if (!updatedDay) {
      return res.status(404).json({ message: 'Day not found' });
    }

    res.status(200).json({ message: 'Hours updated successfully', updatedDay });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update hours' });
  }
}));


router.put('/update', asyncHandler(async (req, res) => {
  const { date, hour, name, school } = req.body;
  console.log(date, hour, name, school)

  // Validate that name and school are present in the request body
  if (!name || !school) {
    return res.status(400).json({ message: 'Name and school are required' });
  }

  try {
    // Find the day by date
    const day = await Day.findOne({ date });

    if (!day) {
      return res.status(404).json({ message: 'Day not found' });
    }

    // Check if the hour is already taken
    const hourTaken = day.takenHours.some(lesson => lesson.hour === hour);

    if (hourTaken) {
      return res.status(400).json({ message: 'Hour already taken' });
    }

    // Add the selected hour to takenHours with the provided name and school
    day.takenHours.push({ hour, name, school });

    // Remove the hour from availableHours
    day.availableHours = day.availableHours.filter(h => h !== hour);

    // Save the updated day
    await day.save();

    return res.status(200).json({ message: 'Hour updated successfully', day });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update takenHours' });
  }
}));





router.get('/taken-hours', async (req, res) => {
  try {
    // Find all days with non-empty takenHours array
    const days = await Day.find({ 'takenHours.0': { $exists: true } });

    // Extract relevant data (name, school, date, hour) from takenHours for each day
    const takenHoursData = days.flatMap(day =>
      day.takenHours.map(lesson => ({
        id: `${day._id}-${lesson._id}`, // Generate a unique ID for each row
        date: day.date,
        dayName: day.dayName,
        hour: lesson.hour,
        name: lesson.name,
        school: lesson.school,
      }))
    );

    res.json(takenHoursData);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching taken hours', error });
  }
});


// PUT route to remove hour from takenHours and add it back to availableHours
router.put('/remove-taken-hour', asyncHandler(async (req, res) => {
  const { date, hour, name, school } = req.body; // Get the hour details from the request body

  try {
    // Find the day by date
    const day = await Day.findOne({ date });

    if (!day) {
      return res.status(404).json({ message: 'Day not found' });
    }

    // Remove the hour from takenHours
    day.takenHours = day.takenHours.filter(takenHour => !(takenHour.hour === hour && takenHour.name === name && takenHour.school === school));

    // Add the hour back to availableHours
    if (!day.availableHours.includes(hour)) {
      day.availableHours.push(hour);
    }

    // Save the updated day document
    await day.save();

    res.status(200).json({ message: 'Hour removed successfully', day });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove hour' });
  }
}));

// POST route to login or register a new user
router.post('/login', asyncHandler(async (req, res) => {
  const { name, school } = req.body;
  console.log('name:', name, 'school:', school);

  try {
    // Check if the user already exists (for login)
    let user = await User.findOne({ name, school });
    
    if (user) {
      // If user exists, send a 'login' message
      console.log('User found, login');
      return res.status(200).json({ message: 'login', user });
    } else {
      // If user doesn't exist, register a new user
      const newUser = new User({ name, school });
      await newUser.save();
      console.log('User registered');
      
      // Send a 'register' message
      return res.status(201).json({ message: 'register', user: newUser });
    }
  } catch (error) {
    // Handle any errors during the process
    console.error('Error processing request:', error);
    return res.status(500).json({ message: 'Error processing request', error });
  }
}));

router.put('/remove-available-hour', asyncHandler(async (req, res) => {
  const { date, hour } = req.body;
  console.log('remove',date,hour)

  try {
    const day = await Day.findOne({ date });
    console.log('fffffffffffffffffffff')

    if (!day) {
      return res.status(404).json({ message: 'Day not found' });
    }

    // Remove the hour from availableHours
    day.availableHours = day.availableHours.filter(h => h !== hour);

    await day.save();

    res.status(200).json({ message: 'Hour removed successfully', day });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove hour' });
  }
}));


// PUT route to remove expired hours based on the current time in Israel
router.put('/remove-expired-hours', asyncHandler(async (req, res) => {
  try {
    const currentDate = new Date();
    const israelOffset = 3 * 60 * 60 * 1000; // Israel Standard Time offset (UTC+3)
    const israelTime = new Date(currentDate.getTime() + israelOffset);

    // Current date in YYYY-MM-DD format
    const currentDateString = israelTime.toISOString().split('T')[0];
    // Current time (hours and minutes)
    const currentTimeString = israelTime.toTimeString().slice(0, 5); // Format: "HH:MM"

    // Find all days including and before the current date
    const days = await Day.find({ date: { $lte: currentDateString } });

    for (const day of days) {
      // If the date is today, only remove hours that are less than the current time
      if (day.date === currentDateString) {
        // Remove hours that have already passed
        day.availableHours = day.availableHours.filter(hour => hour > currentTimeString);
        day.takenHours = day.takenHours.filter(lesson => lesson.hour > currentTimeString);
      } else {
        // If the date is before today, remove all hours (as they are all expired)
        day.availableHours = [];
        day.takenHours = [];
      }

      // If both availableHours and takenHours are empty, delete the entire day
      if (day.availableHours.length === 0 && day.takenHours.length === 0) {
        await Day.deleteOne({ _id: day._id });
      } else {
        await day.save(); // Save the day if there are still hours left
      }
    }

    res.status(200).json({ message: 'Expired hours removed successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to remove expired hours', error });
  }
}));



export default router;
