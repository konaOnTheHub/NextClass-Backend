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

//Logger middleware
const logger = (req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
        //Calculate how long the request took to process
        const duration = Date.now - start;
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
};

app.use(logger);

const PORT = process.env.PORT || 5555;

app.listen(PORT, async () => {
    await connectDB();
    console.log(`Running on Port ${PORT}`);
})