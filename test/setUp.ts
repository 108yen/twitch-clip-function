import { config } from "dotenv"
import * as admin from "firebase-admin"

config({ path: `.env` })

// サービスアカウントを環境変数から取得
const devServiceAccount = {
  authProviderX509CertUrl: process.env.AUTH_PROVIDER_X509_CERT_URL!,
  authUri: process.env.AUTH_URI!,
  clientC509CertUrl: process.env.CLIENT_X509_CERT_URL!,
  clientEmail: process.env.CLIENT_EMAIL!,
  clientId: process.env.CLIENT_ID!,
  privateKey: process.env.PRIVATE_KEY!.replace(/\\n/g, `\n`),
  privateKeyId: process.env.PRIVATE_KEY_ID!,
  projectId: process.env.PROJECT_ID!,
  tokenUri: process.env.TOKEN_URI!,
  type: process.env.TYPE!,
}

admin.initializeApp({
  credential: admin.credential.cert(devServiceAccount),
  databaseURL: `https://${devServiceAccount.projectId}.firebaseio.com`,
})
