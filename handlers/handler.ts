const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} = require("@aws-sdk/lib-dynamodb");

const {v4: uuidv4} = require("uuid");

const express = require("express");
const serverless = require("serverless-http");

const app = express();

const USERS_TABLE = process.env.USERS_TABLE;
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

app.get("/users/:userId", async (req, res) => {
  const params = {
    TableName: USERS_TABLE,
    Key: {
      userId: req.params.userId,
    },
  };

  try {
    const command = new GetCommand(params);
    const { Item } = await docClient.send(command);
    if (Item) {
      const { userId, name } = Item;
      res.json({ userId, name });
    } else {
      res
        .status(404)
        .json({ error: 'Could not find user with provided "userId"' });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retrieve user" });
  }
});

// app.post("/users", async (req, res) => {
//   const { userId, name } = req.body;
//   if (typeof userId !== "string") {
//     res.status(400).json({ error: '"userId" must be a string' });
//   } else if (typeof name !== "string") {
//     res.status(400).json({ error: '"name" must be a string' });
//   }
//
//   const params = {
//     TableName: USERS_TABLE,
//     Item: { userId, name },
//   };
//
//   try {
//     const command = new PutCommand(params);
//     await docClient.send(command);
//     res.json({ userId, name });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ error: "Could not create user" });
//   }
// });

// Endpoint to create a new user
app.post("/users/create", async (req, res) => {
  const { name } = req.body;

  // Validation: Ensure name is a string
  if (typeof name !== "string") {
    return res.status(400).json({ error: '"name" must be a string' });
  }

  // Generate a new unique userId
  const userId = uuidv4();

  const params = {
    TableName: USERS_TABLE,
    Item: { userId, name }, // Insert the generated userId and name
  };

  try {
    const command = new PutCommand(params); // Construct DynamoDB Put operation
    await docClient.send(command); // Execute the DynamoDB operation
    res.status(201).json({ message: "User created successfully", user: { userId, name } });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Could not create user" });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

exports.handler = serverless(app);
