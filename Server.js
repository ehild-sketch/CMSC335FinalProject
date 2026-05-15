"use strict";

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const aviationRoutes = require("./routes/aviationRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();
const portNumber = process.env.PORT || 7003;

require("dotenv").config({
    path: path.resolve(__dirname, ".env"),
    quiet: true
});

app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.resolve(__dirname, "style")));

app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "Pages"));

app.get("/", (request, response) => {
    response.render("index");
});

app.use("/", aviationRoutes);
app.use("/user", userRoutes);

async function main() {
    if (!process.env.MONGO_STRING) {
        console.log("Warning: MONGO_STRING is not set. Database features will fail until it is configured.");
    } else {
        try {
            await mongoose.connect(process.env.MONGO_STRING);
            console.log("Mongo DB connection successful");
        } catch (e) {
            console.log(e);
        }
    }

    process.stdin.setEncoding("utf8");

    app.listen(portNumber);
    console.log(`Web server started and running at http://localhost:${portNumber}`);

    const prompt = "Stop to shutdown the server: ";
    process.stdout.write(prompt);
    process.stdin.on("readable", function () {
        const dataInput = process.stdin.read();
        if (dataInput !== null) {
            const command = dataInput.trim();
            if (command === "stop") {
                console.log("Shutting down the server");
                process.exit(0);
            } else {
                console.log(`Invalid command: ${command}`);
            }
            process.stdout.write(prompt);
            process.stdin.resume();
        }
    });
}

main();
