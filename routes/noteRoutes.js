const express = require("express")
const router = express.Router()
const notesController = require("../controllers/notesController")
const verifyJWT = require("../middleware/verifyJWT")

const { getAllNotes, createNewNote, updateNote, deleteNote } = notesController

router.use(verifyJWT)

router
  .route("/")
  .get(getAllNotes)
  .post(createNewNote)
  .patch(updateNote)
  .delete(deleteNote)

module.exports = router
