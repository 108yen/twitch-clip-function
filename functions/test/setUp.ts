import * as admin from 'firebase-admin'
import * as functions from 'firebase-functions-test'

//initialize firebase app
admin.initializeApp({ credential: admin.credential.applicationDefault() });