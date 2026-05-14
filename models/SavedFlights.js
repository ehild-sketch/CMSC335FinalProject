"use strict";

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const flightSchema = new Schema({
    flightNumber: { type: String },
    airline: { type: String },
    departure: { type: String },
    departureTime: { type: String },
    arrival: { type: String },
    arrivalTime: { type: String },
    status: { type: String }
});

const savedFlightsSchema = new Schema({
    user: { type: String, required: true },
    flights: [flightSchema]
});

module.exports = mongoose.model("SavedFlights", savedFlightsSchema);
