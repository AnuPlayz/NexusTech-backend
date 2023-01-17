import { DocumentData } from "firebase-admin/firestore";
import { leetcode } from "..";

export const getStats = async (userDoc: DocumentData) => {
    const data = userDoc.data();
    const submissions = await leetcode.recent_submissions(data.username);

    let stats = submissions.filter((submission) => {
        return data.questions.includes(submission.titleSlug)
    });

    return [
        stats.find(x => x.titleSlug === data.questions[0]),
        stats.find(x => x.titleSlug === data.questions[1]),
        stats.find(x => x.titleSlug === data.questions[2])
    ]
}