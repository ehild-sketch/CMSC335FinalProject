const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const app = express();
const portNumber = 7003;
const bodyParser = require("body-parser");
app.use(express.urlencoded({ extended: true }))
require("dotenv").config({
   path: path.resolve(__dirname, ".env"),
   quiet:true
});

app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "Pages"));



app.get("/", (req, res) => { res.render("index")})



async function main() {

    try{
        await mongoose.connect(process.env.MONGO_STRING);
        console.log("Mongo DB connection successful")
    }catch(e){
        console.log(e)
    }

    app.listen(portNumber);

    console.log(`Server Listening on Port:${portNumber}`)

}


main()
