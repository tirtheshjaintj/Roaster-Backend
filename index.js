// /path/to/your/server.js
const express = require("express");
const cors = require("cors");
const { body, validationResult } = require("express-validator");
require("dotenv").config();
const Groq = require("groq-sdk");
const axios = require("axios");
const apicache = require("apicache");
const app = express();
const cache = apicache.middleware;
const API_URL = process.env.LEETCODE_API_URL || "https://leetcode.com/graphql";

app.use(cors());
app.use(cache("5 minutes"));
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
        const query = `#graphql
query getUserProfile($username: String!) {
    allQuestionsCount {
        difficulty
        count
    }
    matchedUser(username: $username) {
        username
        githubUrl
        twitterUrl
        linkedinUrl
        contributions {
            points
            questionCount
            testcaseCount
        }
        profile {
            realName
            userAvatar
            birthday
            ranking
            reputation
            websites
            countryName
            company
            school
            skillTags
            aboutMe
            starRating
        }
        badges {
            id
            displayName
            icon
            creationDate
        }
        upcomingBadges {
            name
            icon
        }
        activeBadge {
            id
            displayName
            icon
            creationDate
        }
        submitStats {
            totalSubmissionNum {
                difficulty
                count
                submissions
            }
            acSubmissionNum {
                difficulty
                count
                submissions
            }
        }
        submissionCalendar
    }
    recentSubmissionList(username: $username, limit: 20) {
        title
        titleSlug
        timestamp
        statusDisplay
        lang
    }
}`;

        const variables = { username };
        const response = await axios.post(API_URL, { query, variables });
        if (response.data.errors) {
            throw new Error(response.data.errors[0].message);
        }
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
            const prompt = `Roast this GitHub user humorously and very badly. Destroy their ego and make them feel like an imposter, all while amusing them. Address them directly using their name. Do not use any bold text and keep the roast brief and crisp . Here are their stats: ${JSON.stringify(
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

            const prompt = `Roast this LeetCode user in a hilariously devastating manner. Crush their confidence and make them question their existence as a coder.  Do not use any bold text and keep the roast brief and crisp . Use their name liberally. Stats: ${JSON.stringify(
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