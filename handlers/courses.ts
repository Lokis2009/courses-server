const {DynamoDBClient} = require("@aws-sdk/client-dynamodb");

const {
    DynamoDBDocumentClient,
    GetCommand,
    PutCommand,
    ScanCommand,
} = require("@aws-sdk/lib-dynamodb");

const {v4: uuidv4} = require("uuid");

const express = require("express");
const serverless = require("serverless-http");

const app = express();

const COURSES_TABLE = process.env.COURSES_TABLE;
const client = new DynamoDBClient();
const docClient = DynamoDBDocumentClient.from(client);

app.use(express.json());

app.get("/courses", async (req, res) => {
    //courses?start=0&count=3
    try {
        const {start, count} = req.query;
        console.log(start, count);
        const params = {
            TableName: COURSES_TABLE,
            Limit: count ? parseInt(count, 10) : 10,
            ExclusiveStartKey: start
        }
        const data = await docClient.send(new ScanCommand(params));

        res.status(200).json({
            items: data.Items
        });
    } catch (error) {
        console.error("Error fetching courses:", error);
        res.status(500).json({error: "Could not fetch courses"});
    }
});

app.post("/course", async (req, res) => {
    const course = req.body;
    console.log(course);
    const params = {
        TableName: COURSES_TABLE,
        Item: {
            courseId: uuidv4(),
            creationDate: new Date().toISOString(),
            ...course,
        },
    };
    try {
        await docClient.send(new PutCommand(params));
        res.status(201).json(params.Item);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Could not create course"});
    }
});

app.get("/course/:id", async (req, res) => {
    const {id} = req.params;
    console.log(id);
    const params = {
        TableName: COURSES_TABLE,
        Key: {
            courseId: id,
        },
    };
    try {
        const data = await docClient.send(new GetCommand(params));
        res.status(200).json(data.Item);
    } catch (error) {
        console.error(error);
        res.status(500).json({error: "Could not get course"});
    }
});

exports.handler = serverless(app);
