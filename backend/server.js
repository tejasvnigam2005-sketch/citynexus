const express = require("express")
const cors = require("cors")
const checkingRouter = require('./routes/checking.routes')
const connectDb = require("./middleware/dbConnection")

const app = express()

app.use(cors())
app.use(express.json())
connectDb();

// test route
app.use('/checking' , checkingRouter )

app.listen(5000, ()=>{
    console.log("http://localhost:5000")
})
