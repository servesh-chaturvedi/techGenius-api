const User = require("../models/User")
const Note = require("../models/Note")
const bcrypt = require("bcrypt")

// @desc     Get all users
// @router   GET /users
// @access   Private
const getAllUsers = async (req, res) => {
  const users = await User.find().select("-password").lean()

  if (!users?.length) {
    return res.status(400).json({ message: "No users found" })
  }
  res.json(users)
}

// @desc     Create new user
// @router   POST /users
// @access   Private
const createNewUser = async (req, res) => {
  const { username, password, roles } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" })
  }

  //   check duplicates
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec()
  if (duplicate) {
    return res.status(409).json({ message: "Duplicate username" })
  }

  const hashedPwd = await bcrypt.hash(password, 10) //hash password

  const userObject =
    !Array.isArray(roles) || !roles.length
      ? { username, password: hashedPwd }
      : { username, password: hashedPwd, roles }

  const user = await User.create(userObject)

  if (user) {
    res
      .status(201)
      .json({ message: `New user ${username} created successfully` })
  } else {
    res.status(400).json({ message: "Invalid user data received." })
  }
}

// @desc     Update user
// @router   PATCH /users
// @access   Private
const updateUser = async (req, res) => {
  const { id, username, roles, active, password } = req.body

  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    return res.status(400).json({ message: "All fields are required" })
  }

  const user = await User.findById(id).exec()
  if (!user) {
    return res.status(400).json({ message: "User not found" })
  }

  //   check duplicates
  const duplicate = await User.findOne({ username })
    .collation({ locale: "en", strength: 2 })
    .lean()
    .exec()
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate username" })
  }

  user.username = username
  user.roles = roles
  user.active = active

  if (password) {
    user.password = await bcrypt.hash(password, 10)
  }

  const updatedUser = await user.save()

  res.json({ message: `${updatedUser.username} updated.` })
}

// @desc     Delete user
// @router   DELETE /users
// @access   Private
const deleteUser = async (req, res) => {
  const { id } = req.body
  if (!id) {
    return res.status(400).json({ message: "User ID required" })
  }

  const note = await Note.findOne({ user: id }).lean().exec()
  if (note) {
    return res.status(400).json({ message: "User has notes assigned." })
  }

  const user = await User.findById(id).exec()
  if (!user) {
    return res.status(400).json({ message: "User not found" })
  }

  const result = await user.deleteOne()

  res.json({ message: `Username ${result.username} deleted` })
}

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
}
