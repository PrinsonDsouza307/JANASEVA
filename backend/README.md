# Backend

Firebase Cloud Functions source is in `firebase/functions/`. To install packages, use `cd backend/firebase/functions && npm install` (Node 20 configured in package.json). Start the Firebase emulator or deploy from the **project root** using `firebase emulators:start` or `firebase deploy --only functions --project YOUR_PROJECT_ID` after authentication, configuring the live Firebase project and secrets. The functions are not a standalone HTTP service without Firebase.

`netlify/functions/api-gateway.js` is retained only as source. It had an unauthenticated request-forwarding risk and is **not routed/deployed by the root netlify.toml**. Any features depending on it need a secured replacement before deployment. Cloud execution and permissions were not tested.
