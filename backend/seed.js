require('dotenv').config();

const mongoose = require('mongoose');
const Note = require('./models/Note');

const sampleNotes = [
  {
    title: 'A slower kind of morning',
    content: 'Coffee before the inbox.\n\nTake the long way to the studio, and leave a little room for the day to surprise me.',
    color: 'peach',
  },
  {
    title: 'Ideas for the weekend',
    content: '- Visit the flower market\n- Bring a book to the park\n- Try the little pasta place on Mercer',
    color: 'sage',
  },
  {
    title: 'Things worth remembering',
    content: 'Good work needs breathing room.\n\nWrite the first version quickly, then give it the care it deserves.',
    color: 'sky',
  },
];

async function seedNotes() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing. Configure backend/.env first.');
  await mongoose.connect(process.env.MONGO_URI);
  const count = await Note.countDocuments();
  if (count) {
    console.log(`Database already contains ${count} note(s); no sample notes were added.`);
  } else {
    await Note.insertMany(sampleNotes);
    console.log(`Added ${sampleNotes.length} sample notes to MongoDB.`);
  }
}

seedNotes()
  .catch((error) => {
    console.error('Unable to seed notes:', error.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());