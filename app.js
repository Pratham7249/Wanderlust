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

// 1. Use Environment Variables for the Database URL and Port
// This allows the app to work both locally and on Render
const dbUrl = "mongodb+srv://prathameshrao05:L9XV5GrOwLyXkdOc@cluster0.vunox.mongodb.net/?appName=Cluster0";
const port = process.env.PORT || 8080; 

// 2. Simplified Database Connection using Mongoose
async function main() {
    await mongoose.connect(dbUrl);
}

main()
    .then(() => console.log("Connected to MongoDB Atlas successfully!"))
    .catch(err => console.error("Database connection error:", err));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine('ejs', ejsMate);

app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// 3. Updated Session Store to use the Atlas URL
const store = MongoStore.create({
    mongoUrl: dbUrl,
    crypto: {
        secret: "mysupersecretcode",
    },
    touchAfter: 24 * 3600,
});
  
store.on("error", (err) => {
    console.error("ERROR in MONGO SESSION STORE", err);
});

const sessionOptions = {
    store,
    secret: "mysuperscretcode",
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

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy({
    usernameField: 'Username',
    passwordField: 'Password'
}, User.authenticate()));

passport.deserializeUser(User.deserializeUser());
passport.serializeUser(User.serializeUser());

app.use((req, res, next) => {
    res.locals.user = req.user || {}; 
    res.locals.success = req.flash('success');
    next();
});

// --- ROUTES ---

app.get("/listings/new", isLoggedIn, (req, res) => {
    res.render("listings/new.ejs");
});

app.get("/listings", async (req, res) => {
    try {
        const allListings = await Listing.find({});
        res.render("listings/index.ejs", { allListings });
    } catch (err) {
        console.error("Error fetching listings:", err);
        res.status(500).send("Error fetching listings");
    }
});

app.post("/listings", isLoggedIn, async (req, res) => {
    try {
        const newListing = new Listing({
            ...req.body,
            owner: req.user._id,
            image: req.body.image || "https://cf.bstatic.com/xdata/images/hotel/max1024x768/134475469.jpg?k=986e0385365fa9e17ef6497e2fb7d5e16552358ad343c4ad8fc35b29802eacac&o=&hp=1"
        });
        await newListing.save();
        req.flash("success", "New Listing Created!");
        res.redirect("/listings");
    } catch (err) {
        res.status(400).send("Error creating listing: " + err);
    }
});

app.delete("/listings/:id", isLoggedIn, async (req, res) => {
    try {
        const listingId = req.params.id;
        if (!ObjectId.isValid(listingId)) return res.status(400).send("Invalid listing ID");
        await Listing.findByIdAndDelete(listingId);
        req.flash("success", "Listing Deleted!");
        res.redirect("/listings");
    } catch (err) {
        res.status(500).send("Error deleting listing");
    }
});

app.get("/listings/:id", async (req, res) => {
    try {
        const listingId = req.params.id;
        if (!ObjectId.isValid(listingId)) return res.status(400).send("Invalid listing ID");
        const listing = await Listing.findById(new ObjectId(listingId)).populate('reviews').populate('owner').exec();
        if (!listing) return res.status(404).send("Listing not found");
        res.render("listings/show.ejs", { listing });
    } catch (err) {
        res.status(500).send("Error fetching listing");
    }
});

app.get("/listings/:id/edit", isLoggedIn, async (req, res) => {
    try {
        const listingId = req.params.id;
        if (!ObjectId.isValid(listingId)) return res.status(400).send("Invalid listing ID");
        const listing = await Listing.findById(new ObjectId(listingId));
        if (!listing) return res.status(404).send("Listing not found");
        res.render("listings/edit.ejs", { listing });
    } catch (error) {
        res.status(500).send("Internal server error");
    }
});

app.put("/listings/:id", isLoggedIn, async (req, res) => {
    const listingId = req.params.id;
    try {
        if (!ObjectId.isValid(listingId)) return res.status(400).send("Invalid listing ID");
        await Listing.findByIdAndUpdate(new ObjectId(listingId), req.body);
        res.redirect("/listings");
    } catch (err) {
        res.status(500).send("Error updating listing");
    }
});

app.post("/listings/:id/reviews", isLoggedIn, async (req, res) => {
    try {
        const listing = await Listing.findById(new ObjectId(req.params.id));
        if (!listing) return res.redirect(`/listings/${req.params.id}`);
        const newReview = new Review(req.body.review);
        listing.reviews.push(newReview);
        await newReview.save();
        await listing.save();
        req.flash("success", "Review Added!");
        res.redirect(`/listings/${listing._id}`);
    } catch (error) {
        res.status(500).send("Error adding review");
    }
});

app.get("/signup", (req, res) => {
    res.render("users/signup");
});

app.post("/signup", async (req, res, next) => {
    const { Username: username, Email: email, Password: password } = req.body;
    try {
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Airbnb!');
            res.redirect('/listings'); // Redirect to listings after signup
        });
    } catch (e) {
        req.flash('error', e.message);
        res.redirect('/signup');
    }
});

app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);
        req.flash("success", "Logged out successfully!");
        res.redirect("/listings");
    });
});

app.get("/login", (req, res) => {
    res.render("users/login");
});

app.post("/login", passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), async (req, res) => {
    req.flash("success", "Welcome to the website!!");
    res.redirect('/listings');
});

app.use((req, res) => {
    res.status(404).render("listings/error.ejs");
});

// 4. Use the dynamic port variable
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
