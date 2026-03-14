const express = require("express")
const cors = require("cors")
const mongoose = require("mongoose")

const app = express()

app.use(cors())
app.use(express.json())

// test route
app.get("/", (req,res)=>{
    res.send("Smart City Backend Running")
})

app.listen(5000, ()=>{
    console.log("Server running on port 5000")
})
