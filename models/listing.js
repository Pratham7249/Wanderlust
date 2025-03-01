const mongoose = require('mongoose');
const review = require('./review');

const listingSchema = new mongoose.Schema({
    title: { type: String, required: true },
    image: {
        type: String,
        required: true,
        default: "https://cf.bstatic.com/xdata/images/hotel/max1024x768/134475469.jpg?k=986e0385365fa9e17ef6497e2fb7d5e16552358ad343c4ad8fc35b29802eacac&o=&hp=1",
        set: (v) =>
            v === "https://cf.bstatic.com/xdata/images/hotel/max1024x768/134475469.jpg?k=986e0385365fa9e17ef6497e2fb7d5e16552358ad343c4ad8fc35b29802eacac&o=&hp=1"
                ? ""
                : v,
    },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    location: { type: String, required: true },
    country: { type: String, required: true },
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
    }],
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
});

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;
