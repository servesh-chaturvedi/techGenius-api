const Note = require("../models/Note")
const User = require("../models/User")

// @desc     Get all Notes
// @router   GET /notes
// @access   Private
const getAllNotes = async (req, res) => {
  const notes = await Note.find().lean()
  if (!notes?.length) {
    return res.status(400).json({ message: "No notes found" })
  }

  const notesWithUsers = await Promise.all(
    notes.map(async (note) => {
      const user = await User.findById(note.user).lean().exec()
      return { ...note, username: user.username }
    })
  )

  res.json(notesWithUsers)
}

// @desc     Create a Note
// @router   POST /notes
// @access   Private
const createNewNote = async (req, res) => {
  const { user, title, desc } = req.body
  if (!user || !title || !desc) {
    return res.status(400).json({ message: "All fields are required" })
  }

  const duplicate = await Note.findOne({ title })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec()
  if (duplicate) {
    return res.status(409).json({ message: "Duplicate title" })
  }

  const note = await Note.create({ user, title, desc })
  if (note) {
    return res.status(201).json({ message: "New note created" })
  } else {
    return res.status(400).json({ message: "Invalid note data" })
  }
}

// @desc     Update a Note
// @router   PATCH /notes
// @access   Private
const updateNote = async (req, res) => {
  const { id, user, title, desc, completed } = req.body
  if (!id || !user || !title || !desc || typeof completed !== "boolean") {
    return res.status(400).json({ message: "All fields are required" })
  }

  const note = await Note.findById(id).exec()
  if (!note) {
    return res.status(400).json({ message: "Note not found" })
  }

  const duplicate = await Note.findOne({ title })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec()
  // Allow renaming of the original note
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate note title" })
  }

  note.user = user
  note.title = title
  note.desc = desc
  note.completed = completed

  const updatedNote = await note.save()

  res.json({ message: `'${updatedNote.title}' updated` })
}

// @desc Delete a note
// @route DELETE /notes
// @access Private
const deleteNote = async (req, res) => {
  const { id } = req.body

  if (!id) {
    return res.status(400).json({ message: "Note ID required" })
  }

  const note = await Note.findById(id).exec()
  if (!note) {
    return res.status(400).json({ message: "Note not found" })
  }

  const result = await note.deleteOne()

  res.json({ message: `Note '${result.title}' with ID ${result._id} deleted` })
}

module.exports = {
  getAllNotes,
  createNewNote,
  updateNote,
  deleteNote,
}
