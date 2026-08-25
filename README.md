# Shreshtha × Muskan — Firebase "Us" Website

This is the static GitHub Pages front-end plus Firebase Authentication, Cloud Firestore and Cloud Storage.

## What is live/backend-powered

- Email/password sign-in for the two approved accounts
- Live notes wall
- Shared bucket list
- Photo uploads to Firebase Storage
- Memory metadata in Firestore
- Private letters in Firestore
- Real-time Firestore listeners, so changes appear without refreshing
- Note reactions, milestone letter tabs, On This Day memories and browser push notifications

## Firebase setup

1. In Firebase Console, open project `shreshthakimuskan`.
2. Authentication → Sign-in method → enable **Email/Password**.
3. Create exactly two user accounts (one for you and one for Muskan).
4. Make sure both email addresses are verified.
5. Firestore Database → create the database.
6. Storage → create/enable the Storage bucket.
7. Open `firestore.rules` and replace:
   - `YOUR_EMAIL@example.com`
   - `MUSKAN_EMAIL@example.com`
   with the exact two verified email addresses.
8. Make the exact same replacement in `storage.rules`.
9. Publish both rule sets.

## Push notifications

Push notifications require a Firebase Console setup in addition to the static site:

1. Cloud Messaging → Web configuration → create a Web Push certificate key.
2. Copy the VAPID key into `FCM_VAPID_KEY` in `app.js`.
3. Serve `firebase-messaging-sw.js` from the site root. GitHub Pages must deploy it alongside `index.html`.
4. Install the dependencies in `functions/` with `npm install` and deploy the notification trigger with `firebase deploy --only functions:notifyPartnerOnNote`.
5. Deploy the updated Firestore rules. The rules include the private `notificationTokens/{userId}` documents used by the client.

The notification trigger sends a new-note notification to registered tokens belonging to the other approved account. Browser permission and the **enable notifications** button are required on each device. FCM delivery also depends on the browser supporting notifications and the device allowing them.

## GitHub Pages

Upload:
- `index.html`
- `style.css`
- `app.js`
- `firebase-messaging-sw.js`
- `DSC_6602.jpeg` (if you want the existing hero/gallery photo)
- optionally `firebase.json`, `firestore.rules`, `storage.rules`

The `functions/` directory is deployed to Firebase, not GitHub Pages.

The Firebase SDK is loaded from the official Firebase CDN as browser ESM modules, so this version does not require npm or a build step.

## Security

Do NOT use open rules such as `allow read, write: if true`.

The app uses Firebase Authentication + Firestore/Storage Security Rules. The browser Firebase config is not a server secret; the security boundary is the Authentication and Rules configuration.

For production, consider enabling Firebase App Check as an additional layer.

## Important

A client-side passphrase is deliberately NOT used as the security mechanism. Anyone can inspect JavaScript shipped to a browser. The rules above enforce access server-side.
# ShashandTabu
