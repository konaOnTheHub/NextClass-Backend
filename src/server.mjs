import express from 'express';
import cors from 'cors'
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
let ordersCollection;

async function connectDB() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Connected to MongoDB successfully");

    const database = client.db("NextClassDB");
    lessonsCollection = database.collection("lessons");
    ordersCollection = database.collection("orders");
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

const app = express();
//Use .json middleware so that we can parse request body as json
app.use(express.json());

//Set up cors policy
const allowedOrigins = [
  'http://localhost:5173', //Once its deployed to github pages change url
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin like mobile apps or curl
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));
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

//Routes

app.get("/lessons", async (req, res) => {
  try {
    if (!lessonsCollection) {
      return res.status(500).json({ errorMsg: "Internal database error" })
    }
    const lessons = await lessonsCollection.find({}).toArray();
    return res.status(200).json(lessons);
  } catch (err) {
    console.error("Error fetching lessons:", err);
    return res.status(500).json({ errorMsg: "Internal server error" });
  };
});

app.post("/order", async (req, res) => {
  const { name, phone, lessonIDs, quantity } = req.body;
  //Validate request 
  //Make sure all the required fields are in request body
  if (!name || !phone || !lessonIDs || !quantity) {
    return res.status(400).json({ errorMsg: "Missing required fields: name, phone , lessonIDs or quantity" })
  }
  //Make sure lessonIDs is a number
  if (!Array.isArray(lessonIDs)) {
    return res.status(400).json({
      errorMsg: "lessonIDs must be an array of ids"
    })
  }
  //Make sure quantity is a number
  if (typeof quantity !== "number") {
    return res.status(400).json({ errorMsg: 'quantity must be a number' })
  }

  try {
    if (!ordersCollection) {
      return res.status(500).json({ errorMsg: "Internal database error" })
    }
    const orders = await ordersCollection.insertOne({
      "name": name,
      "phone": phone,
      "lessonIDs": lessonIDs,
      "quantity": quantity

    })
    return res.status(200).json({ message: "Order placed successfully" });

  } catch (err) {
    console.error("Error posting order:", err);
    return res.status(500).json({ errorMsg: "Internal server error" })
  }
})

app.put("/lesson/:id/:attribute", async (req, res) => {
  const { id, attribute } = req.params;
  //Expecting {value: "someValue"}
  const {value} = req.body;
  try {
    const lesson = await lessonsCollection.findOne({ id: Number(id) })

    //If lesson isn't found
    if (!lesson) {
      //return 404 not found
      return res.status(404).json({ errorMsg: "Lesson not found" });
    };

    //We have make sure only updates fields that already exist and not create new ones
    if (!Object.hasOwn(lesson, attribute)) {
      return res.status(400).json({ errorMsg: `Lesson does not have attribute: ${attribute}` });
    };
    const result = await lessonsCollection.updateOne(
      {id: Number(id)},
      {$set: {[attribute]: value}}
    );
    res.status(200).json({message : "Lesson updated successfully", result});
    
  } catch (err) {
    return res.status(500).json({ errorMsg: "Internal server error", err });
  }
})


app.listen(PORT, async () => {
  await connectDB();
  console.log(`Running on Port ${PORT}`);
})