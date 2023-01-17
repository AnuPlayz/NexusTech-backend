import { LeetCode } from "leetcode-query"
import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { Firestore } from "firebase-admin/firestore"
import { getAuth } from "firebase-admin/auth"
import { setQuestions } from "./utils/questions"
import { getStats } from "./utils/stats"
import express from "express"

export const app = initializeApp({
    credential: applicationDefault(),
});
const server = express();
export const db = new Firestore();
export const auth = getAuth();
export const leetcode = new LeetCode();

server.get('/', (req, res) => {
    res.send('API Server is running');
});

server.get("/user", async (req, res) => {
    let uid = req.query.uid as string;
    if (!uid) {
        return res.status(400).send({
            error: 'UID is required'
        });
    }

    let user = await db.collection("users").where("uid", "==", uid).get()
    let userDoc = user.docs[0]

    if (!userDoc) {
        let AuthUser;

        try {
            AuthUser = await auth.getUser(uid)
        } catch (e) {
            return res.status(400).send({
                error: 'Invalid UID'
            });
        }

        await db.collection("users").add({
            uid: uid,
            questions: []
        });

        user = await db.collection("users").where("uid", "==", AuthUser.uid).get()
        userDoc = user.docs[0]
    }

    res.send(user)
});

server.get('/questions', async (req, res) => {
    let uid = req.query.uid as string;
    if (!uid) {
        return res.status(400).send({
            error: 'UID is required'
        });
    }

    let user = await db.collection("users").where("uid", "==", uid).get()
    let userDoc = user.docs[0]

    if (!userDoc) {
        let AuthUser;

        try {
            AuthUser = await auth.getUser(uid)
        } catch (e) {
            return res.status(400).send({
                error: 'Invalid UID'
            });
        }

        await db.collection("users").add({
            uid: uid,
            questions: []
        })
        user = await db.collection("users").where("uid", "==", AuthUser.uid).get()
        userDoc = user.docs[0]
    }

    let questionsSlugs = userDoc.data().questions
    let questions;
    let questionsData;

    if (questionsSlugs && questionsSlugs.length > 0) {
        questions = await db.collection("questions").where("slug", "in", questionsSlugs).get()
        questionsData = questions.docs.map((doc) => {
            return doc.data()
        })
    }

    if (!questionsData || questionsData.length == 0 || (questionsData.length > 0 && new Date().getTime() - userDoc.data().questionUpdatedAt.toDate().getTime() > 1000 * 60 * 60 * 24)) {
        let questionsData = await setQuestions(userDoc)
        questions = questionsData.questions
        questionsSlugs = questionsData.questionsSlugs
    }

    return res.send({
        uid: uid,
        questions: questionsData
    });
})

server.get('/stats', async (req, res) => {
    let uid = req.query.uid as string;
    if (!uid) {
        return res.status(400).send({
            error: 'UID is required'
        });
    }

    let user = await db.collection("users").where("uid", "==", uid).get()
    let userDoc = user.docs[0]

    if (!userDoc) {
        return res.status(400).send({
            error: 'Invalid UID'
        });
    };

    let stats = await getStats(userDoc)

    return res.send({
        uid: uid,
        stats: stats
    });
})

server.listen(3000)