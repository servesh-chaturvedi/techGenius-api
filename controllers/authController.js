const User = require("../models/User")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

// @desc     Login
// @router   POST /auth
// @access   Public
const login = async (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ message: "All fields are required" })
  }

  const foundUser = await User.findOne({ username }).exec()
  if (!foundUser || !foundUser.active) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const match = await bcrypt.compare(password, foundUser.password)
  if (!match) return res.status(401).json({ message: "Unauthorized" })

  const accessToken = jwt.sign(
    {
      UserInfo: {
        username: foundUser.username,
        roles: foundUser.roles,
      },
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: "15m" }
  )

  const refreshToken = jwt.sign(
    { username: foundUser.username },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: "5d" }
  )

  res.cookie("jwt", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    maxAge: 5 * 24 * 60 * 60 * 1000,
  })

  res.json({ accessToken })
}

// @desc     Refresh
// @router   GET /auth/refresh
// @access   Public - since access token expired
const refresh = async (req, res) => {
  const cookies = req.cookies
  if (!cookies?.jwt) return res.status(401).json({ message: "Unauthorized" })

  const refreshToken = cookies.jwt

  jwt.verify(
    refreshToken,
    process.env.REFRESH_TOKEN_SECRET,
    async (err, decoded) => {
      if (err) return res.status(403).json({ message: "Forbidden" })

      const foundUser = await User.findOne({ username: decoded.username })
      if (!foundUser) return res.status(401).json({ message: "Unauthorized" })

      const accessToken = jwt.sign(
        {
          UserInfo: {
            username: foundUser.username,
            roles: foundUser.roles,
          },
        },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "15m" }
      )
      res.json({ accessToken })
    }
  )
}

// @desc     Logout
// @router   GET /auth/logout
// @access   Public - clear cookies if exists
const logout = async (req, res) => {
  const cookies = req.cookies
  if (!cookies?.jwt) return res.sendStatus(204)
  res.clearCookie("jwt", {
    httpOnly: true,
    secure: true,
    sameSite: "None",
  })
  res.json({ message: "Cookie cleared" })
}

module.exports = { login, refresh, logout }
