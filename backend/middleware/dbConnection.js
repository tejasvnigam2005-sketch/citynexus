const { configDotenv } = require("dotenv");
const mongoose = require('mongoose')


const connectDb = async  () => {
    try{
        configDotenv({quiet:true})
        const url = process.env.MONGO_DB_URL;
        if(!url){
            console.error("uri of mongo db is not found");
        }
        await mongoose.connect(url);
        console.log("mongo db is connected")
    }catch(error){
        console.log("Mongo db not connected" , error);
    }
}

module.exports = connectDb;