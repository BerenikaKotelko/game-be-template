import { Client } from "pg";
import { config } from "dotenv";
import express from "express";
import cors from "cors";

config(); //Read .env file lines as though they were env vars.

//Call this script with the environment variable LOCAL set if you want to connect to a local db (i.e. without SSL)
//Do not set the environment variable LOCAL if you want to connect to a heroku DB.

//For the ssl property of the DB connection config, use a value of...
// false - when connecting to a local DB
// { rejectUnauthorized: false } - when connecting to a heroku DB
const herokuSSLSetting = { rejectUnauthorized: false };
const sslSetting = process.env.LOCAL === "false" ? false : herokuSSLSetting;
// if (!process.env.DATABASE_URL) {
// throw "No DATABASE_URL env var!  Have you made a .env file?  And set up dotenv?";
// }
const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: sslSetting,
};

const app = express();

app.use(express.json()); //add body parser to each following route handler
app.use(cors()); //add CORS support to each following route handler

const client = new Client(dbConfig);
client.connect();

app.get("/victims", async (req, res) => {
  try {
    const dbres = await client.query(
      "SELECT * FROM users WHERE dead_or_alive = false"
    );
    res.json(dbres.rows);
  } catch (err) {
    console.error(err.message);
  }
});

app.get("/sherlocks", async (req, res) => {
  try {
    const dbres = await client.query(
      "SELECT * FROM users WHERE dead_or_alive = true"
    );
    res.json(dbres.rows);
  } catch (err) {
    console.error(err.message);
  }
});

// add an entry into likes table to like or dislike
app.post("/username", async (req, res) => {
  const { userName } = req.body;
  await client.query("INSERT INTO users (name) VALUES ($1) returning *", [
    userName,
  ]);
  res.status(200).json({
    status: "success",
    message: `${userName} added to database`,
    data: {
      userName,
    },
  });
});

app.put("/you-died", async (req, res) => {
  try {
    const { userName } = req.body;
    const dbres = await client.query(
      "UPDATE users SET dead_or_alive = false WHERE name = $1 RETURNING *",
      [userName]
    );
    res.status(200).json({
      status: "success",
      message: "Updated the user's status to victim",
      data: {
        userName,
      },
    });
  } catch (err) {
    console.error(err.message);
  }
});
app.put("/you-survived", async (req, res) => {
  try {
    const { userName } = req.body;
    const dbres = await client.query(
      "UPDATE users SET dead_or_alive = true WHERE name = $1 RETURNING *",
      [userName]
    );
    res.status(200).json({
      status: "success",
      message: "Updated the user's status to sherlock",
      data: {
        userName,
      },
    });
  } catch (err) {
    console.error(err.message);
  }
});

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw "Missing PORT environment variable.  Set it in .env file.";
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
