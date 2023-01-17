import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { Firestore } from "firebase-admin/firestore"
import { setQuestions } from './utils/questions'
import { getStats } from "./utils/stats"

const app = initializeApp({
    credential: applicationDefault(),
});
const db = new Firestore();

const updateRanking = async (date: Date) => {
    let users = await db.collection("users").get()
    let usersData = users.docs.map((doc) => {
        return doc.data()
    });
    
    let todayParticipations = usersData.filter(x => new Date(x.date).getDay() === date.getDay() && new Date(x.date).getMonth() === date.getMonth() && new Date(x.date).getFullYear() === date.getFullYear())
    let stats = await Promise.all(todayParticipations.map(async (user) => {
        let stats = await getStats(user)
        return stats
    }));

    let ranking = stats.map((stat, index) => {
        return {
            user: todayParticipations[index],
            stats: stat
        }
    });

    ranking.sort((a, b) => {
        let aScore = a.stats.filter(x => x && x.statusDisplay === "Accepted").length
        let bScore = b.stats.filter(x => x && x.statusDisplay === "Accepted").length

        if (aScore > bScore) {
            return -1
        } else if (aScore < bScore) {
            return 1
        } else {
            return 0
        }
    })

    let rating = 1000;
    let ratingChange = 0;
    let prevRating = 0;
    let prevRatingChange = 0;

    for (let i = 0; i < ranking.length; i++) {
        let user = ranking[i].user
        let userRating = user.rating
        let userRatingChange = user.ratingChange

        if (i > 0) {
            let prevUser = ranking[i - 1].user
            let prevUserRating = prevUser.rating
            let prevUserRatingChange = prevUser.ratingChange

            if (prevUserRating !== userRating) {
                rating = userRating
                ratingChange = userRatingChange
            }
        }

        if (rating === 1000) {
            ratingChange = 0
        } else {
            ratingChange = rating - prevRating
        }

        await db.collection("users").doc(user.id).update({
            rating: rating,
            ratingChange: ratingChange,
            prevRating: prevRating,
            prevRatingChange: prevRatingChange
        })

        prevRating = rating
        prevRatingChange = ratingChange
    }

    await db.collection("leaderboard").add({
        date: date,
        ranking: ranking
    })
};

(async () => {
    let date = new Date();
    
    console.log("Starting daily run...")
    await updateRanking(date)
    console.log("Daily run completed!")

    console.log("Starting to set questions to users...")
    let users = await db.collection("users").get()

    for(let user of users.docs){
        await setQuestions(user.data())
        console.log(`Questions set to user ${user.data().uid}`)
    }

    console.log("Questions set to users completed!")

    process.exit(0)
})();