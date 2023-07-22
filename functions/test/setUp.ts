
import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions-test'
import * as devServiceAccountKey from '../keys/dev_service_account_key.json'
import * as devTwitchApiKey from '../keys/dev_twitch_api_key.json'

process.env.TWITCH_CLIENT_ID = devTwitchApiKey.TWITCH_CLIENT_ID;
process.env.TWITCH_CLIENT_SECRET = devTwitchApiKey.TWITCH_CLIENT_SECRET;

// サービスアカウントを環境変数から取得
const devServiceAccount = {
    type: devServiceAccountKey.type,
    projectId: devServiceAccountKey.project_id,
    privateKeyId: devServiceAccountKey.private_key_id,
    privateKey: devServiceAccountKey.private_key.replace(/\\n/g, `\n`),
    clientEmail: devServiceAccountKey.client_email,
    clientId: devServiceAccountKey.client_id,
    authUri: devServiceAccountKey.auth_uri,
    tokenUri: devServiceAccountKey.token_uri,
    authProviderX509CertUrl: devServiceAccountKey.auth_provider_x509_cert_url,
    clientC509CertUrl: devServiceAccountKey.client_x509_cert_url
}

admin.initializeApp({
    credential: admin.credential.cert(devServiceAccount),
    databaseURL: `https://${devServiceAccount.projectId}.firebaseio.com`
})

export const testEnv = functions.default(
    {
        databaseURL: `https://${devServiceAccount.projectId}.firebaseio.com`,
        projectId: devServiceAccount.projectId
    }
)