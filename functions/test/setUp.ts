import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions-test'
import * as serviceAccountKey from '../keys/service_account_key.json'

// サービスアカウントを環境変数から取得
const serviceAccount = {
    type: serviceAccountKey.type,
    projectId: serviceAccountKey.project_id,
    privateKeyId: serviceAccountKey.private_key_id,
    privateKey: serviceAccountKey.private_key.replace(/\\n/g, `\n`),
    clientEmail: serviceAccountKey.client_email,
    clientId: serviceAccountKey.client_id,
    authUri: serviceAccountKey.auth_uri,
    tokenUri: serviceAccountKey.token_uri,
    authProviderX509CertUrl: serviceAccountKey.auth_provider_x509_cert_url,
    clientC509CertUrl: serviceAccountKey.client_x509_cert_url
}

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`
})

export const testEnv = functions.default(
    {
        databaseURL: `https://${serviceAccount.projectId}.firebaseio.com`,
        projectId: serviceAccount.projectId
    }
)