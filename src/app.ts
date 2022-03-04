import express, {Express, Request, Response } from "express";
import {connection} from './db/dbconfig'

// ROUTE IMPORTS
import {SampleRouter} from './routes/sampleRoute'

// INIT CONFIG - port numbers and etc...
const app: Express = express();
const PORT = 4000 // Type assert to string 

const db = connection;
db.on('error', console.error.bind(console, 'MONGODB CONNECTION ERROR'))

app.use(express.json());

// USING DEFINED ROUTES
app.use('/api/v1/sample', SampleRouter)



app.listen(PORT, () => {
  console.log("CONNECTED ON PORT: ", PORT);
});

