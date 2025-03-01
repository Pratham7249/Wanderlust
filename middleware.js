function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'You must be logged in to do that');
    return res.redirect('/login');
}

function isOwner(req, res, next) {
    const listingId = req.params.id;
    const userId = '67bcab75b7fb57a7ebd279c6'; // Set the authorized user ID

    // Assuming Listing is the model for listings
    Listing.findById(listingId).then(listing => {
        if (!listing) {
            return res.status(404).send("Listing not found");
        }
        if (!listing.owner.equals(userId)) {
            req.flash('error', 'You do not have permission to edit or delete this listing.');
            return res.redirect(`/listings/${listingId}`);
        }
        next();
    }).catch(err => {
        console.error("Error checking listing ownership:", err);
        res.status(500).send("Internal server error");
    });
}


function isOwner(req, res, next) {
    const listingId = req.params.id;
    const userId = req.user._id;

    // Assuming Listing is the model for listings
    Listing.findById(listingId).then(listing => {
        if (!listing) {
            return res.status(404).send("Listing not found");
        }
        if (!listing.owner.equals(userId)) {
            req.flash('error', 'You do not have permission to edit or delete this listing.');
            return res.redirect(`/listings/${listingId}`);
        }
        next();
    }).catch(err => {
        console.error("Error checking listing ownership:", err);
        res.status(500).send("Internal server error");
    });
}

module.exports = { isLoggedIn, isOwner };
