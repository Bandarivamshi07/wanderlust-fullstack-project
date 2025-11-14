require("dotenv").config({path: "../.env"});

const mongoose = require("mongoose");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");

const Listing = require("../models/listing");
const initData = require("./data");

// DB & Mapbox setup
const MONGO_URL = process.env.ATLASDB_URL;
const geocodingClient = mbxGeocoding({ accessToken: process.env.MAPBOX_TOKEN });

// 👉 YOUR USER ID (from REPL)
const USER_ID = "69172a81dc057e6498b0b875";

async function main() {
  await mongoose.connect(MONGO_URL);
  console.log("connected to DB");
}

main().catch((err) => console.log(err));

const initDB = async () => {
  try {
    console.log("Deleting old listings...");
    await Listing.deleteMany({});

    // Loop through each listing
    for (let listing of initData.data) {
      const geoData = await geocodingClient
        .forwardGeocode({
          query: `${listing.location}, ${listing.country}`,
          limit: 1,
        })
        .send();

      const geometry = geoData.body.features[0]?.geometry;

      if (!geometry) {
        console.log("❌ Could not find map location for:", listing.title);
        continue;
      }

      listing.owner = USER_ID;
      listing.geometry = geometry;

      await Listing.create(listing);
    }

    console.log("🌱 Seeding completed successfully!");
  } catch (err) {
    console.log("❌ Seeding error:", err);
  }
};

initDB();
