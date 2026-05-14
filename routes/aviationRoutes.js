"use strict";

const express = require("express");
const router = express.Router();
const SavedFlights = require("../models/SavedFlights");

function formatFlightTime(timeValue) {
    if (!timeValue) {
        return "N/A";
    }
    return timeValue.replace("T", " ").slice(0, 16);
}

function hasValue(value) {
    return value && String(value).trim() !== "" && value !== "N/A";
}

function isValidFlight(flight) {
    return hasValue(flight.flightNumber)
        && hasValue(flight.airline)
        && hasValue(flight.departure)
        && hasValue(flight.departureTime)
        && hasValue(flight.arrival)
        && hasValue(flight.arrivalTime)
        && hasValue(flight.status);
}

function simplifyFlight(flight) {
    return {
        flightNumber: flight.flight?.iata || flight.flight?.number || "N/A",
        airline: flight.airline?.name || "N/A",
        departure: flight.departure?.iata || flight.departure?.airport || "N/A",
        departureTime: formatFlightTime(flight.departure?.scheduled || flight.departure?.estimated),
        arrival: flight.arrival?.iata || flight.arrival?.airport || "N/A",
        arrivalTime: formatFlightTime(flight.arrival?.scheduled || flight.arrival?.estimated),
        status: flight.flight_status || "N/A"
    };
}

function renderAviationDis(response, options) {
    response.render("aviationDis", {
        flights: options.flights || [],
        airportCode: options.airportCode || "",
        airportLabel: options.airportLabel || "",
        statusLabel: options.statusLabel || "",
        error: options.error || null
    });
}

router.get("/aviation", (request, response) => {
    response.render("aviation");
});

router.post("/aviationDis", async (request, response) => {
    const airportCode = request.body.airport_code.trim().toUpperCase();
    const airportType = request.body.airport_type;
    const statusFilter = request.body.flight_status;
    let limit = parseInt(request.body.limit, 10);

    const airportLabel = airportType === "dep" ? "Departure" : "Arrival";
    const statusLabel = statusFilter === "both" ? "Scheduled & Active" : statusFilter;

    if (!/^[A-Z]{3}$/.test(airportCode)) {
        renderAviationDis(response, {
            airportCode: airportCode,
            airportLabel: airportLabel,
            statusLabel: statusLabel,
            error: "Enter a valid 3-letter airport code (e.g. JFK, BOS)."
        });
        return;
    }

    if (isNaN(limit) || limit < 1) {
        limit = 10;
    }
    if (limit > 100) {
        limit = 100;
    }

    let url = `https://api.aviationstack.com/v1/flights?access_key=${process.env.AVIATION_API_KEY}&limit=${limit}`;

    if (airportType === "dep") {
        url += `&dep_iata=${airportCode}`;
    } else {
        url += `&arr_iata=${airportCode}`;
    }

    if (statusFilter !== "both") {
        url += `&flight_status=${statusFilter}`;
    }

    try {
        const apiResponse = await fetch(url);
        const data = await apiResponse.json();

        if (data.error) {
            renderAviationDis(response, {
                airportCode: airportCode,
                airportLabel: airportLabel,
                statusLabel: statusLabel,
                error: data.error.message
            });
            return;
        }

        let flights = (data.data || []).map(simplifyFlight);

        if (statusFilter === "both") {
            flights = flights.filter(flight => flight.status === "scheduled" || flight.status === "active");
        }

        flights = flights.filter(isValidFlight);

        renderAviationDis(response, {
            flights: flights,
            airportCode: airportCode,
            airportLabel: airportLabel,
            statusLabel: statusLabel
        });
    } catch (e) {
        console.error(e);
        renderAviationDis(response, {
            airportCode: airportCode,
            airportLabel: airportLabel,
            statusLabel: statusLabel,
            error: "Failed to fetch flights from API."
        });
    }
});

router.post("/saveFlights", async (request, response) => {
    const user = request.body.user.trim();
    const flights = JSON.parse(decodeURIComponent(request.body.flightsData));

    try {
        let record = await SavedFlights.findOne({ user: user });

        if (record) {
            record.flights.push(...flights);
            await record.save();
        } else {
            record = new SavedFlights({
                user: user,
                flights: flights
            });
            await record.save();
        }

        response.render("saveConfirmation", {
            user: user,
            count: flights.length,
            total: record.flights.length
        });
    } catch (e) {
        console.error(e);
        response.render("saveConfirmation", { user: user, count: 0, error: true });
    }
});

module.exports = router;
