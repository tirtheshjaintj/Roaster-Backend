// /path/to/your/server.js
const express = require("express");
const cors = require("cors");
const { body, validationResult } = require("express-validator");
require("dotenv").config();
const Groq = require("groq-sdk");
const axios = require("axios");
const app = express();
const API_URL = process.env.LEETCODE_API_URL;
const query=require("./leetcode_query");
app.use(cors());
app.use(express.json());

const groqApiKey = process.env.GROQ_API_KEY;
if (!groqApiKey) {
    console.error("Error: Missing GROQ_API_KEY in .env file");
    process.exit(1);
}

// Initialize Groq AI client
const groq = new Groq({ apiKey: groqApiKey });

async function getGroqData(prompt) {
    try {
        const result = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "llama3-8b-8192",
        });
        return result.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Error calling Groq AI API:", error);
        throw error;
    }
}

async function fetchGitHubStats(username) {
    try {
        const response = await axios.get(
            `https://api.github.com/users/${username}`
        );
        return response.data;
    } catch (error) {
        console.error("Error fetching GitHub stats:", error);
        throw error;
    }
}

async function fetchLeetCodeStats(username) {
    try {
        const variables = { username };
        const response = await axios.post(API_URL, { query, variables });
        if (response.data.errors) {
            throw new Error(response.data.errors[0].message);
        }
        console.log(JSON.stringify(response.data));
        return response.data;
    } catch (error) {
        if (error.response) {
            throw new Error(`Error from LeetCode API: ${error.response.data}`);
        } else if (error.request) {
            throw new Error("No response received from LeetCode API");
        } else {
            throw new Error(`Error in setting up the request: ${error.message}`);
        }
    }
}

app.get("/", (req, res) => res.status(200).send("<h1>Working Nicely</h1>"));

app.post(
    "/github",
    [body("username", "No GitHub Username Given").isLength({ min: 1 })],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { username } = req.body;
        try {
            const stats = await fetchGitHubStats(username);
            const prompt = `make sure keep it as shortest as possible under 200 characters, Roast this GitHub  user be very very very harsh humorously and start with his stats numbers and very badly. 
            Destroy their ego and make them feel like an imposter, all while amusing them. Address them directly using their name. Do not use any bold text and keep the roast brief and crisp and make sure keep it shortest as possible. Here are their stats: ${JSON.stringify(
                stats
            )}`;
            const roast = await getGroqData(prompt);
            return res.status(200).send(roast);
        } catch (error) {
            return res
                .status(500)
                .json({ message: "An internal server error occurred." });
        }
    }
);

app.post(
    "/leetcode",
    [body("username", "No LeetCode Username Given").isLength({ min: 1 })],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const { username } = req.body;
        try {
            const stats = await fetchLeetCodeStats(username);
            const prompt = `make sure keep it as shortest as possible under 200 characters, Roast this LeetCode user be very very very harsh humorously in a devastating manner  
            and start with his stats numbers tell how many easy,medium,hard questions and how they are like a child play from the total given with the key [allQuestionsCount] are the total questions out of which he has solved
            and also donot mix "submissions" with questions solved both are different in acSubmissionNum "count" is the number of questions solved and submissions is how many time he submitted the correct solution 
             and Crush their confidence and make them question their existence as a coder.  Do not use any bold text and keep the roast brief and crisp . Use their name repeatedly. Stats: ${JSON.stringify(
                stats
            )}`;

            const roast = await getGroqData(prompt);

            return res.status(200).send(roast);
        } catch (error) {
            return res
                .status(500)
                .json({ message: "An internal server error occurred." });
        }
    }
);

app.listen(process.env.PORT || 3000, () => {
    console.log("Server Started");
});
