require('dotenv').config();

const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const Note = require('./models/Note');

const app = express();
const port = Number(process.env.PORT) || 5000;
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '32kb' }));

function validateNoteInput(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'The request body must be a JSON object.';
  }

  const allowedFields = ['title', 'content', 'color'];
  const unknownFields = Object.keys(body).filter((key) => !allowedFields.includes(key));
  if (unknownFields.length) return `Unknown field: ${unknownFields[0]}.`;

  if (!partial || Object.hasOwn(body, 'title')) {
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return 'A non-empty title is required.';
    }
    if (body.title.trim().length > 100) return 'Titles must be 100 characters or fewer.';
  }

  if (Object.hasOwn(body, 'content')) {
    if (typeof body.content !== 'string') return 'Note content must be text.';
    if (body.content.length > 10000) return 'Note content must be 10,000 characters or fewer.';
  }

  if (Object.hasOwn(body, 'color') && !['paper', 'sage', 'peach', 'sky', 'lilac'].includes(body.color)) {
    return 'Choose a valid note color.';
  }

  return null;
}

function validId(id) {
  return mongoose.isValidObjectId(id);
}

app.get('/api/health', (request, response) => {
  response.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

app.get('/api/notes', async (request, response, next) => {
  try {
    const search = typeof request.query.search === 'string' ? request.query.search.trim() : '';
    const filter = search
      ? { $or: [{ title: new RegExp(escapeRegex(search), 'i') }, { content: new RegExp(escapeRegex(search), 'i') }] }
      : {};
    const notes = await Note.find(filter).sort({ updatedAt: -1 });
    response.json(notes);
  } catch (error) {
    next(error);
  }
});

app.get('/api/notes/:id', async (request, response, next) => {
  try {
    if (!validId(request.params.id)) return response.status(400).json({ error: 'Invalid note ID.' });
    const note = await Note.findById(request.params.id);
    if (!note) return response.status(404).json({ error: 'Note not found.' });
    response.json(note);
  } catch (error) {
    next(error);
  }
});

app.post('/api/notes', async (request, response, next) => {
  try {
    const validationError = validateNoteInput(request.body);
    if (validationError) return response.status(400).json({ error: validationError });
    const note = await Note.create(request.body);
    response.status(201).json(note);
  } catch (error) {
    next(error);
  }
});

app.put('/api/notes/:id', async (request, response, next) => {
  try {
    if (!validId(request.params.id)) return response.status(400).json({ error: 'Invalid note ID.' });
    const validationError = validateNoteInput(request.body, true);
    if (validationError) return response.status(400).json({ error: validationError });
    if (!Object.keys(request.body).length) {
      return response.status(400).json({ error: 'Include at least one field to update.' });
    }
    const note = await Note.findByIdAndUpdate(request.params.id, request.body, {
      new: true,
      runValidators: true,
    });
    if (!note) return response.status(404).json({ error: 'Note not found.' });
    response.json(note);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/notes/:id', async (request, response, next) => {
  try {
    if (!validId(request.params.id)) return response.status(400).json({ error: 'Invalid note ID.' });
    const note = await Note.findByIdAndDelete(request.params.id);
    if (!note) return response.status(404).json({ error: 'Note not found.' });
    response.json({ message: 'Note deleted.' });
  } catch (error) {
    next(error);
  }
});

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

app.use((request, response) => {
  response.status(404).json({ error: 'Route not found.' });
});

app.use((error, request, response, next) => {
  if (response.headersSent) return next(error);
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response.status(400).json({ error: 'Request body must be valid JSON.' });
  }
  if (error.name === 'ValidationError') {
    return response.status(400).json({ error: Object.values(error.errors).map((issue) => issue.message).join(' ') });
  }
  console.error('API error:', error);
  response.status(500).json({ error: 'An unexpected server error occurred.' });
});

async function startServer() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is missing. Copy .env.example to .env and configure MongoDB.');
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
  app.listen(port, () => console.log(`Server running on port ${port}`));
}

startServer().catch((error) => {
  console.error('Unable to start the server:', error.message);
  process.exit(1);
});