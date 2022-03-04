const bcrypt = require("bcrypt");
const { toJWT } = require("./auth/jwt");
const authMiddleware = require("./auth/middleware");
const { SALT_ROUNDS } = require("./config/constants");
const express = require("express");
const loggerMiddleWare = require("morgan");
const cors = require("cors");
const { PORT } = require("./config/constants");
const User = require("./models/").user;
const History = require("./models").history;
const bodyParserMiddleWare = express.json();
const app = express();

app.use(loggerMiddleWare("dev"));
app.use(bodyParserMiddleWare);
app.use(cors());

if (process.env.DELAY) {
  app.use((req, res, next) => {
    setTimeout(() => next(), parseInt(process.env.DELAY));
  });
}

app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide both email and password" });
    }

    const user = await User.findOne({ where: { email } });

    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({
        message: "User with that email not found or password incorrect",
      });
    }

    delete user.dataValues["password"]; // don't send back the password hash
    const token = toJWT({ userId: user.id });
    return res.status(200).json({ token, ...user.dataValues });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      message: `Login Page: Something went wrong, sorry: ${JSON.stringify(
        req.headers
      )}, AND, ${JSON.stringify(req.body)}
      )}`,
    });
  }
});

app.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json("Please provide an email, password and a name");
  }

  try {
    const newUser = await User.create({
      email,
      password: bcrypt.hashSync(password, SALT_ROUNDS),
      name,
    });

    delete newUser.dataValues["password"]; // don't send back the password hash

    const token = toJWT({ userId: newUser.id });

    res.status(201).json({ token, ...newUser.dataValues });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ message: "There is an existing account with this email" });
    }

    return res
      .status(400)
      .json({ message: "Signup Page: Something went wrong, sorry" });
  }
});

// The /me endpoint can be used to:
// - get the users email & name using only their token
// - checking if a token is (still) valid
app.get("/me", authMiddleware, async (req, res) => {
  // don't send back the password hash
  delete req.user.dataValues["password"];
  res.status(200).json({ ...req.user.dataValues });
});

// get users expression history
app.get("/:id", authMiddleware, async (request, response) => {
  try {
    const userId = request.params.id;

    if (isNaN(parseInt(userId))) {
      return response.status(400).send({ message: "User id is not a number" });
    }
    const { expression, createdAt } = request.body;

    const history = await History.findByPk(parseInt(userId), {
      where: { userId },
    });
    console.log(history);

    if (history === null) {
      return response.status(404).send({ message: "No expression history!" });
    }

    response.status(200).send({ message: "ok", history });
  } catch (error) {
    console.log(error);
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port: ${PORT}`);
});
