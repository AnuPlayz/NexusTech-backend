import {  DocumentData } from "firebase-admin/firestore"
import { db } from ".."

export const setQuestions = async (userDoc: DocumentData) => {
    let questions, questionsSlugs;

    let easyQuestions = await db.collection("questions").where("difficulty", "==", "Easy").get().then((snapshot) => {
        return snapshot.docs.map((doc) => {
            return doc.data()
        })
    });

    let mediumQuestions = await db.collection("questions").where("difficulty", "==", "Medium").get().then((snapshot) => {
        return snapshot.docs.map((doc) => {
            return doc.data()
        })
    });

    let hardQuestions = await db.collection("questions").where("difficulty", "==", "Hard").get().then((snapshot) => {
        return snapshot.docs.map((doc) => {
            return doc.data()
        })
    });

    questions = [
        easyQuestions[Math.floor(Math.random() * easyQuestions.length)],
        mediumQuestions[Math.floor(Math.random() * mediumQuestions.length)],
        hardQuestions[Math.floor(Math.random() * hardQuestions.length)]
    ];

    questionsSlugs = questions.map((question) => {
        return question.slug
    })

    await db.collection("users").doc(userDoc.id).update({
        questions: questionsSlugs,
        questionUpdatedAt: new Date().setHours(0, 0, 0, 0)
    })

    return {
        questions,
        questionsSlugs
    }
}