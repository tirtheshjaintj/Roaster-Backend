const query = `#graphql
query getUserProfile($username: String!) {
    matchedUser(username: $username) {
        username
        contributions {
            points
            questionCount
            testcaseCount
        }
        profile {
            realName
            birthday
            ranking
            reputation
            countryName
            skillTags
            aboutMe
            starRating
        }
        badges {
            id
            displayName
            creationDate
        }
        upcomingBadges {
            name
        }
        activeBadge {
            id
            displayName
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
    }
     allQuestionsCount {
       difficulty
       count
       }
}`;

module.exports = query;
