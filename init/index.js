const mongoose = require('mongoose');
const initdata = require("./data");
const Listing = require("../models/listing.js"); // Updated import statement with correct relative path

main().then((res) => { console.log("connected to DB") }).catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

const initDB = async () => {
    await Listing.deleteMany({});
    initdata.data = initdata.data.map((obj) => ({ ...obj, owner: "67b8e3e6b21a985ee1112526" }));

    await Listing.insertMany(initdata.data);
    console.log("data was initialized");
};

initDB();
