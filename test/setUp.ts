/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { config } from "dotenv"
import * as admin from "firebase-admin"

config({ path: `.env` })
// サービスアカウントを環境変数から取得
const devServiceAccount = {
    type: process.env.TYPE!,
    projectId: process.env.PROJECT_ID!,
    privateKeyId: process.env.PRIVATE_KEY_ID!,
    privateKey: process.env.PRIVATE_KEY!.replace(/\\n/g, `\n`),
    clientEmail: process.env.CLIENT_EMAIL!,
    clientId: process.env.CLIENT_ID!,
    authUri: process.env.AUTH_URI!,
    tokenUri: process.env.TOKEN_URI!,
    authProviderX509CertUrl: process.env.AUTH_PROVIDER_X509_CERT_URL!,
    clientC509CertUrl: process.env.CLIENT_X509_CERT_URL!
}

admin.initializeApp({
    credential: admin.credential.cert(devServiceAccount),
    databaseURL: `https://${devServiceAccount.projectId}.firebaseio.com`
})
