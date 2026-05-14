"use strict";

const express = require("express");
const router = express.Router();
const SavedFlights = require("../models/SavedFlights");

router.get("/", (request, response) => {
    response.render("user");
});

router.post("/curr_user", async (request, response) => {
    const user = request.body.user.trim();

    try {
        const record = await SavedFlights.findOne({ user: user });
        const flights = record ? record.flights : [];
        response.render("userFlights", { user: user, flights: flights });
    } catch (e) {
        console.error(e);
        response.render("userFlights", { user: user, flights: [] });
    }
});

router.post("/delete", async (request, response) => {
    const user = request.body.user.trim();

    try {
        await SavedFlights.deleteOne({ user: user });
        response.render("userFlights", { user: user, flights: [], deleted: true });
    } catch (e) {
        console.error(e);
        response.render("userFlights", { user: user, flights: [] });
    }
});

module.exports = router;
