import express from 'express';
import dotenv from 'dotenv';
//Inject secret URI as an environment variable from .env file
dotenv.config();

import { MongoClient, ServerApiVersion } from 'mongodb';
//Use environment variable for URI
const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

let lessonsCollection;

async function connectDB() {
    try {
        await client.connect();
        await client.db("admin").command({ping: 1});
        console.log("Connected to MongoDB successfully");

        const database = client.db("NextClassDB");
        lessonsCollection = database.collection("lessons");
    } catch (err) {
        console.error("MongoDB connection error:", err);
    }
}

const app = express();
const PORT = process.env.PORT || 5555;

//Logger middleware
const logger = (req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
};

app.use(logger);

app.get("/lessons", async (req, res) =>{
    try {
        if(!lessonsCollection) {
            return res.status(500).json({errorMsg: "Internal database error"})
        }
        const lessons = await lessonsCollection.find({}).toArray();
        res.status(200).json(lessons);
    } catch (err) {
        console.error("Error fetching lessons:", err);
        res.status(500).json({errorMsg: "Internal server error"});
    };
})


app.listen(PORT, async () => {
    await connectDB();
    console.log(`Running on Port ${PORT}`);
})