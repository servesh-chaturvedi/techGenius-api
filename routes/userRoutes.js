const express = require("express")
const router = express.Router()
const usersController = require("../controllers/usersController")
const verifyJWT = require("../middleware/verifyJWT")

const { getAllUsers, createNewUser, updateUser, deleteUser } = usersController

router.use(verifyJWT)

router
  .route("/")
  .get(getAllUsers)
  .post(createNewUser)
  .patch(updateUser)
  .delete(deleteUser)

module.exports = router
