if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const port = 3000;
const passport = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user");
const helmet = require("helmet");

const mongoSanitize = require("express-mongo-sanitize");

const userRoutes = require("./routes/users");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");

const MongoStore = require("connect-mongo");
const { log } = require("console");

const dbUrl = "mongodb://localhost:27017/yelp-camp";

mongoose
  .connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("MongoDB接続OK!!!");
  })
  .catch((err) => {
    console.log("MongoDB接続エラー!!!");
    console.log(err);
  });

const app = express();

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname, "public")));
app.use(mongoSanitize({ replaceWith: "_" }));

const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: { secret: "mysecret" },
  touchAfter: 24 * 3600, // time period in seconds
});

store.on("error", (e) => {
  console.log("セッションストアエラー", e);
});

const sessionConfig = {
  store,
  name: "session",
  secret: "mysecret",
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure: true,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};

app.use(session(sessionConfig));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(flash());
app.use(helmet());

const scriptSrcUrls = ["https://api.mapbox.com", "https://cdn.jsdelivr.net"];
const styleSrcUrls = ["https://api.mapbox.com", "https://cdn.jsdelivr.net"];
const connectSrcUrls = [
  "https://api.mapbox.com",
  "https://*.tiles.mapbox.com",
  "https://events.mapbox.com",
];
const fontSrcUrls = [];
const imgSrcUrls = [
  `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/`,
  "https://images.unsplash.com",
];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: [],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", "blob:"],
      childSrc: ["blob:"],
      objectSrc: [],
      imgSrc: ["'self'", "blob:", "data:", ...imgSrcUrls],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);

app.use((req, res, next) => {
  console.log(req.query);
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/fakeUser", async (req, res) => {
  const user = new User({
    email: "mogemoge@example.com",
    username: "mogemoge",
  });
  const newUser = await User.register(user, "hogehoge");
  res.send(newUser);
});

app.use("/", userRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.all("*", (req, res, next) => {
  next(new ExpressError("ページが見つかりませんでした", 404));
});

app.use((err, req, res, next) => {
  const { statusCode = 500 } = err;
  if (!err.message) {
    err.message = "問題が発生しました";
  }
  res.status(statusCode).render("error", { err });
});

app.listen(port, () => {
  console.log(`ポート${port}で待ち受け中`);
});
