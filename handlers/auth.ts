import * as AWS from 'aws-sdk';
import express, { Request, Response } from 'express';
import cors from 'cors';

const serverless = require("serverless-http");

const cognito = new AWS.CognitoIdentityServiceProvider({
    region: "eu-central-1",
});

const USER_POOL_ID = "eu-central-1_0ENNZW79t"; // Replace with your Cognito User Pool ID
const CLIENT_ID = "2pv5peimj3hqb83nljvlt56rpf"; // Replace with your App Client ID

interface LoginRequest {
    username: string;
    password: string;
}

interface LoginResponse {
    message: string;
    token?: string;
    accessToken?: string;
    refreshToken?: string;
    error?: string;
}

const app = express();

app.use(express.json());
app.use(cors({
    origin: 'http://localhost:4200',
    credentials: true
}));

app.post("/auth/login", async (req: Request, res: Response): Promise<void> => {

    const { username, password } = req.body;

    // Check if username and password are provided
    if (!username || !password) {
        res.status(400).json({ error: "Username and password are required." });
        return;
    }

    try {
        // Cognito authentication parameters
        const params = {
            AuthFlow: "USER_PASSWORD_AUTH",
            ClientId: CLIENT_ID,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password,
            },
        };

        // Call Cognito to authenticate the user
        const result = await cognito.initiateAuth(params).promise();

        // Return tokens from the result
        const response: LoginResponse = {
            message: "Login successful!",
            token: result.AuthenticationResult?.IdToken || "",
            accessToken: result.AuthenticationResult?.AccessToken || "",
            refreshToken: result.AuthenticationResult?.RefreshToken || "",
        };

        res.status(200).json(response);
    } catch (error) {
        console.error("Error during login:", error);

        // Return error response
        res.status(401).json({
            message: "Login failed.",
            error: (error as Error).message,
        });
    }
});

app.post("/auth/userinfo", async (_req: Request, res: Response): Promise<void> => {
    const { accessToken } = _req.body;

    if (!accessToken) {
        res.status(400).json({ error: "Access token is required to retrieve user info." });
        return;
    }

    try {
        // Use Cognito's `getUser` API to fetch user details
        const params = {
            AccessToken: accessToken,
        };

        const userData = await cognito.getUser(params).promise();

        // Return user attributes in the response
        res.status(200).json({
            message: "User info retrieved successfully.",
            userAttributes: userData.UserAttributes, // Cognito user attributes
        });
    } catch (error) {
        console.error("Error retrieving user info:", error);
        res.status(400).json({
            error: "Unable to get user info. " + (error as Error).message,
        });
    }
});

exports.handler = serverless(app);
