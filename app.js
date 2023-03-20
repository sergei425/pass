const express = require("express");
const path = require('path')
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

mongoose
  .connect("mongodb://127.0.0.1:27017/users")
  .then(() => console.log("Database connected!"))
  .catch((err) => console.log(err));

const User = mongoose.model(
  "User",
  new Schema({
    login: { type: String, required: true },
    password: { type: String, required: true },
  })
);

passport.use(
  new LocalStrategy((login, password, done) => {
    User.findOne({ login }, (err, user) => {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, { msg: "Incorrect login" });
      }
      if (user.password !== password) {
        return done(null, false, { msg: "Incorrect password" });
      }
      return done(null, user);
    });
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser((id, cb) => {
  db.users.findById(id, (err, user) => {
    if (err) {
      return cb(err);
    }
    cb(null, user);
  });
});

const app = express();
app.set("views", path.join(__dirname, 'views'));
app.set("view engine", "ejs");

app.use(express.urlencoded());
app.use(session({ secret: "SECRET" }));

app.use(passport.initialize());
app.use(passport.session());

app.get("/api/user/login", (req, res) => {
  res.render("login");
});

app.post(
  "/api/user/login",
  passport.authenticate("local", { failureRedirect: "/login" }),
  (req, res) => {
    const user = new User({
      login: req.body.login,
      password: req.body.password,
    }).save((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
  }
);

app.post("/api/user/signup", (req, res) => {
  req.logout();
  res.redirect("/api/user/login");
});

app.get(
  "/api/user/me",
  (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.redirect("/login");
    }
    next();
  },
  async (req, res) => {
    const id = req.params.me;
    try {
      const user = await User.findById(id).select('-__v');
      res.render("profile", { user: req.user });
    } catch (error) {
      res.sendStatus(404).json(error)
    }
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
