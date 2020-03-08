const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const webpush = require('web-push');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const serviceAccount = require("./pwagram-fb-key.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://pwagram-d1bff.firebaseio.com/'
});

exports.storePostData = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        admin.database().ref('posts').push({
            id: request.body.id,
            title: request.body.title,
            location: request.body.location,
            image: request.body.image
        }).then(() => {
            webpush.setVapidDetails('mailto:business@email.com', 'BJR09w94qRrBZwj5JRvw_K91DLvEi2YrEyxB9npMhT9X_ZG2XgA7oFahDKbjiSXZGF_8FpoHNNBhbCkdhNLW9N8', 'rqhYC-qJGrV7UUQy7hlwQ19jvhv7wN7oe-NWezUYaA4');
            return admin.database().ref('subscriptions').once('value')
        }).then(subscriptions => {
            subscriptions.forEach(sub => {
                const pushConfig = {
                    endpoint: sub.val().endpoint,
                    keys: {
                        auth: sub.val().keys.auth,
                        p256dh: sub.val().keys.p256dh
                    }
                };
                webpush.sendNotification(pushConfig, JSON.stringify({
                    title: 'New Post',
                    content: 'New post added!',
                    openUrl: '/help'
                })).catch(err => { // with firebase this won't work as of now because you need to first have a paid plan
                    console.log(err);
                });
            });
            response.status(201).json({message: 'Data stored', id: request.body.id});
        }).catch(err => {
            response.status(500).json({error: err});
        })
    });
});
