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
app.post(
  "/username",
  async (req, res) => {
    const { userName } = req.body;
    await client.query(
      "INSERT INTO users (name) VALUES ($1) returning *",
      [userName]
    );
    res.status(200).json({
      status: "success",
      message: `${userName} added to database`,
      data: {
        userName
      },
    });
  }
);
// update the studied status of a specific resource in a specific user's study list
// app.put(
//   "/you-died",
//   async (req, res) => {
//     //when do we use req.body and when to use req.params
//     const { user_id } = req.params;
//     const { resource_id, studied } = req.body;
//     const dbres = await client.query(
//       "UPDATE study_list SET studied = $1 WHERE user_id = $2 and resource_id = $3 RETURNING *",
//       [studied, user_id, resource_id]
//     );
//     res.status(200).json({
//       status: "success",
//       message:
//         "Updated the to_study status of a specific resource in a specific user's study list",
//       data: dbres.rows,
//     });
//   }
// );

//Start the server on the given port
const port = process.env.PORT;
if (!port) {
  throw "Missing PORT environment variable.  Set it in .env file.";
}
app.listen(port, () => {
  console.log(`Server is up and running on port ${port}`);
});
