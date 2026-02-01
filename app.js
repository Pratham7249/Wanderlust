const express = require("express");
const mongoose = require('mongoose');
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require('method-override');
const Review = require("./models/review.js");
const { ObjectId } = require('mongoose').Types;
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const User = require("./models/user.js");
const { isLoggedIn } = require("./middleware.js");
const ejsMate = require("ejs-mate");

const app = express();

// 1. DATABASE CONNECTION
// Use process.env for security. On Render, create an environment variable named DATABASE_URL
const dbUrl = process.env.DATABASE_URL || "mongodb://127.0.0.1:27017/wanderlust";

async function main() {
    await mongoose.connect(dbUrl);
}

main()
    .then(() => console.log("Connected to DB"))
    .catch(err => console.error("Database connection error:", err));

// 2. MIDDLEWARE & SETTINGS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine('ejs', ejsMate);

app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// 3. SESSION & MONGO STORE
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: process.env.SECRET || "mysupersecretcode",
    },
    touchAfter: 24 * 3600,
});

store.on("error", (err) => {
    console.error("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: process.env.SECRET || "mysupersecretcode",
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
};

app.use(session(sessionOptions));
app.use(flash());

// 4. PASSPORT CONFIG
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({
    usernameField: 'Username',
    passwordField: 'Password'
}, User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.user = req.user || null; 
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();
});

// 5. ROUTES
app.get("/listings/new", isLoggedIn, (req, res) => {
    res.render("listings/new.ejs");
});

app.get("/listings", async (req, res) => {
    try {
        const allListings = await Listing.find({});
        res.render("listings/index.ejs", { allListings });
    } catch (err) {
        res.status(500).send("Error fetching listings");
    }
});

app.post("/listings", isLoggedIn, async (req, res) => {
    try {
        const newListing = new Listing(req.body);
        newListing.owner = req.user._id;
        if (!newListing.image) {
            newListing.image = "https://cf.bstatic.com/xdata/images/hotel/max1024x768/134475469.jpg?k=986e0385365fa9e17ef6497e2fb7d5e16552358ad343c4ad8fc35b29802eacac&o=&hp=1";
        }
        await newListing.save();
        req.flash("success", "New Listing Created!");
        res.redirect("/listings");
    } catch (err) {
        res.status(400).send("Error creating listing");
    }
});

app.get("/listings/:id", async (req, res) => {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).send("Invalid ID");
        const listing = await Listing.findById(id).populate('reviews').populate('owner');
        if (!listing) return res.status(404).send("Listing not found");
        res.render("listings/show.ejs", { listing });
    } catch (err) {
        res.status(500).send("Server Error");
    }
});

// Auth Routes
app.get("/signup", (req, res) => res.render("users/signup"));

app.post("/signup", async (req, res, next) => {
    try {
        const { Username, Email, Password } = req.body;
        const user = new User({ email: Email, username: Username });
        const registeredUser = await User.register(user, Password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Wanderlust!');
            res.redirect('/listings');
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/signup');
    }
});

app.get("/login", (req, res) => res.render("users/login"));

app.post("/login", passport.authenticate('local', { 
    failureRedirect: '/login', 
    failureFlash: true 
}), (req, res) => {
    req.flash("success", "Welcome back!");
    res.redirect('/listings');
});

app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "Logged out!");
        res.redirect("/listings");
    });
});

// 404 & Listen
app.use((req, res) => {
    res.status(404).render("listings/error.ejs");
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
