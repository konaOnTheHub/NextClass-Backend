import express from 'express';

const app = express();

const PORT = process.env.PORT || 5555;

app.listen(PORT, () => {
    console.log(`Running on Port ${PORT}`);
})