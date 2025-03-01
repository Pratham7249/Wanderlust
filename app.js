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

const app = express();

app.use(methodOverride('_method'));
app.use(express.urlencoded({ extended: true }));

const ejsMate = require("ejs-mate");

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://prathameshrao05:0FIkQaNeVF1tLorG@cluster0.vunox.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}
run().catch(console.dir);

main().then(() => console.log("connected to DB")).catch(err => console.error(err));

async function main() {
    await mongoose.connect(uri);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.engine('ejs', ejsMate);
app.use(express.static(path.join(__dirname, "public")));

const store = MongoStore.create({
    mongoUrl: uri,
    crypto: {
      secret: "mysupersecretcode",
    },
    touchAfter: 24 * 3600, // Update session only once in 24 hours (in seconds)
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
        httpOnly: true, // Prevent client-side JavaScript access
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days (in milliseconds)
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
    res.locals.user = req.user || {}; // Pass user information to EJS templates, default to an empty object
    res.locals.success = req.flash('success');
    next();
});

app.get("/listings/new", isLoggedIn, (req, res) => {
    res.render("listings/new.ejs");
});

app.get("/listings", async (req, res) => {
    try {
        const allListings = await Listing.find({});
        console.log("All Listings:", allListings); // Log the fetched listings for debugging
        res.render("listings/index.ejs", { allListings });
    } catch (err) {
        console.error("Error fetching listings:", err);
        res.status(500).send("Error fetching listings");
    }
});

app.post("/listings", isLoggedIn, async (req, res) => {
    console.log("Request body before validation:", req.body); // Log the request body for debugging
    console.log("Current User:", req.user); // Log the current user for debugging

    try {
        const newListing = new Listing({
            ...req.body,
            owner: req.user._id, // Set the owner to the current user's ID
            image: req.body.image || "https://cf.bstatic.com/xdata/images/hotel/max1024x768/134475469.jpg?k=986e0385365fa9e17ef6497e2fb7d5e16552358ad343c4ad8fc35b29802eacac&o=&hp=1" // Default image if none provided
        });

        await newListing.save();
        req.flash("success", "New Listing Created!");
        res.redirect("/listings");
    } catch (err) {
        console.error("Error creating listing:", err);
        res.status(400).send("Error creating listing: " + err);
    }
});

app.delete("/listings/:id", isLoggedIn, async (req, res) => {
    try {
        const listingId = req.params.id;
        if (!ObjectId.isValid(listingId)) {
            return res.status(400).send("Invalid listing ID");
        }
        await Listing.findByIdAndDelete(listingId);
        req.flash("success", "Listing Deleted!");
        res.redirect("/listings");
    } catch (err) {
        console.error("Error deleting listing:", err);
        res.status(500).send("Error deleting listing");
    }
});

app.get("/listings/:id", async (req, res) => {
    try {
        const listingId = req.params.id;
        console.log("Listing ID:", listingId);
        if (!ObjectId.isValid(listingId)) {
            return res.status(400).send("Invalid listing ID");
        }

        const listing = await Listing.findById(new ObjectId(listingId)).populate('reviews').populate('owner').exec();
        console.log("Found Listing:", listing);

        if (!listing) {
            return res.status(404).send("Listing not found");
        }
        res.render("listings/show.ejs", { listing });
    } catch (err) {
        console.error("Error fetching listing:", err);
        res.status(500).send("Error fetching listing");
    }
});

app.get("/listings/:id/edit", isLoggedIn, async (req, res) => {
    try {
        const listingId = req.params.id;
        if (!ObjectId.isValid(listingId)) {
            return res.status(400).send("Invalid listing ID");
        }
        const listing = await Listing.findById(new ObjectId(listingId));
        if (!listing) {
            return res.status(404).send("Listing not found");
        }
        res.render("listings/edit.ejs", { listing });
    } catch (error) {
        console.error("Error in edit route", error);
        res.status(500).send("Internal server error");
    }
});

app.put("/listings/:id", isLoggedIn, async (req, res) => {
    const listingId = req.params.id;
    const listing = await Listing.findById(listingId);
    if (!listing) {
        return res.status(404).send("Listing not found");
    }

    try {
        if (!ObjectId.isValid(listingId)) {
            return res.status(400).send("Invalid listing ID");
        }
        await Listing.findByIdAndUpdate(new ObjectId(listingId), req.body);
        res.redirect("/listings");
    } catch (err) {
        console.error("Error updating listing:", err);
        res.status(500).send("Error updating listing");
    }
});

app.post("/listings/:id/reviews", isLoggedIn, async (req, res) => {
    try {
        const listing = await Listing.findById(new ObjectId(req.params.id));
        if (!listing) {
            return res.redirect(`/listings/${req.params.id}`);
        }
        const newReview = new Review(req.body.review);
        listing.reviews.push(newReview);
        await newReview.save();
        await listing.save();
        req.flash("success", "Review Added!");
        res.redirect(`/listings/${listing._id}`);
    } catch (error) {
        console.error("Error adding review", error);
        res.status(500).send("Error adding review");
    }
});

app.get("/signup", (req, res) => {
    res.render("users/signup");
});

app.post("/signup", async (req, res, next) => {
    const { Username: username, Email: email, Password: password } = req.body;
    console.log("Signup attempt with data:", { username, email, password }); // Log incoming data

    try {
        const user = new User({ email, username });
        const registeredUser = await User.register(user, password);
        console.log("User registered successfully:", registeredUser); // Log successful registration

        req.login(registeredUser, err => {
            if (err) return next(err);
            req.flash('success', 'Welcome to Airbnb!');
            res.redirect('/login');
        });
    } catch (e) {
        req.flash('error', e.message);
        console.error("Error during signup:", e.message); // Log the error message

        res.redirect('/signup');
    }
});

app.get("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "Logged out successfully!");
        res.redirect("/login");
    });
});

app.get("/login", (req, res) => {
    res.render("users/login");
});

app.post("/login", passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }), async (req, res) => {
    console.log("Login attempt for user:", req.body.Username);
    console.log("User authenticated:", req.isAuthenticated());
    console.log("Session data after login:", req.session); // Log session data for debugging

    req.flash("success", "Welcome to the website!!");
    res.redirect('/listings');
});

app.use((req, res) => {
    res.status(404).render("listings/error.ejs");
});

app.listen(8080, () => {
    console.log("the server has been started");
});
