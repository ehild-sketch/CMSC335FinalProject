"use strict";

const express = require("express");
const router = express.Router();
const SavedFlights = require("../models/SavedFlights");

function safeUsername(body) {
    return (body && body.user ? String(body.user) : "").trim();
}

router.get("/", (request, response) => {
    response.render("user");
});

router.post("/curr_user", async (request, response) => {
    const user = safeUsername(request.body);

    if (!user) {
        response.render("user", { errorMessage: "Please enter a username." });
        return;
    }

    try {
        const record = await SavedFlights.findOne({ user: user });
        const flights = record ? record.flights : [];
        response.render("userFlights", { user: user, flights: flights });
    } catch (e) {
        console.error(e);
        response.render("userFlights", { user: user, flights: [], loadError: true });
    }
});

router.post("/delete", async (request, response) => {
    const user = safeUsername(request.body);

    if (!user) {
        response.render("user", { errorMessage: "Please enter a username before deleting." });
        return;
    }

    try {
        await SavedFlights.deleteOne({ user: user });
        response.render("userFlights", { user: user, flights: [], deleted: true });
    } catch (e) {
        console.error(e);
        response.render("userFlights", { user: user, flights: [], deleteError: true });
    }
});

module.exports = router;
