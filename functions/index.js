const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const webpush = require('web-push');
// const formidable = require('formidable');
const fs = require('fs');
const UUID = require('uuid-v4');
var os = require("os");
var Busboy = require("busboy");
var path = require('path');

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const serviceAccount = require("./pwagram-fb-key.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://pwagram-d1bff.firebaseio.com/'
});

const gcconfig = {
    projectId: 'pwagram-d1bff',
    keyFilename: 'pwagram-fb-key.json'
};
const gcs = require('@google-cloud/storage')(gcconfig);

exports.storePostData = functions.https.onRequest((request, response) => {
    cors(request, response, () => {
        const uuid = UUID();

        const busboy = new Busboy({ headers: request.headers });
        // These objects will store the values (file + fields) extracted from busboy
        let upload;
        const fields = {};

        // This callback will be invoked for each file uploaded
        busboy.on("file", (fieldname, file, filename, encoding, mimetype) => {
            console.log(
            `File [${fieldname}] filename: ${filename}, encoding: ${encoding}, mimetype: ${mimetype}`
            );
            const filepath = path.join(os.tmpdir(), filename);
            upload = { file: filepath, type: mimetype };
            file.pipe(fs.createWriteStream(filepath));
        });

        // This will invoked on every field detected
        busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
            fields[fieldname] = val;
        });
  
      // This callback will be invoked after all uploaded files are saved.
        busboy.on("finish", () => {
            var bucket = gcs.bucket("pwagram-d1bff.appspot.com");
            bucket.upload(upload.file, {
                uploadType: "media",
                metadata: {
                    metadata: {
                        contentType: upload.type,
                        firebaseStorageDownloadTokens: uuid
                    }
                }
            }, function(err, uploadedFile) {
                if (!err) {
                    admin.database().ref("posts").push({
                        id: fields.id,
                        title: fields.title,
                        location: fields.location,
                        rawLocation: {
                            lat: fields.rawLocationLat,
                            lng: fields.rawLocationLng
                        },
                        image: "https://firebasestorage.googleapis.com/v0/b/" + bucket.name + "/o/" + encodeURIComponent(uploadedFile.name) + "?alt=media&token=" + uuid
                    }).then(function() {
                        webpush.setVapidDetails(
                            "mailto:business@academind.com",
                            "BKapuZ3XLgt9UZhuEkodCrtnfBo9Smo-w1YXCIH8YidjHOFAU6XHpEnXefbuYslZY9vtlEnOAmU7Mc-kWh4gfmE",
                            "AyVHwGh16Kfxrh5AU69E81nVWIKcUwR6a9f1X4zXT_s");
                        return admin.database().ref("subscriptions").once("value");
                    }).then(function(subscriptions) {
                        subscriptions.forEach(function(sub) {
                            var pushConfig = {
                                endpoint: sub.val().endpoint,
                                keys: {
                                    auth: sub.val().keys.auth,
                                    p256dh: sub.val().keys.p256dh
                                }
                            };
    
                            webpush.sendNotification(pushConfig, JSON.stringify({
                                title: "New Post",
                                content: "New Post added!",
                                openUrl: "/help"
                            })).catch(function(err) {
                                console.log(err);
                            });
                        });
                        response.status(201).json({ message: "Data stored", id: fields.id });
                    }).catch(function(err) {
                        response.status(500).json({ error: err });
                    });
                } else {
                console.log(err);
                }
            });
        });
  
        // The raw bytes of the upload will be in request.rawBody.  Send it to busboy, and get
        // a callback when it's finished.
        busboy.end(request.rawBody);
        // formData.parse(request, function(err, fields, files) {
        //   fs.rename(files.file.path, "/tmp/" + files.file.name);
        //   var bucket = gcs.bucket("YOUR_PROJECT_ID.appspot.com");
        // });

        // const formData = new formidable.IncomingForm();
        // formData.parse(request, (err, fields, files) => {
        //     fs.rename(files.file.path, `/tmp/${files.file.name}`);
        //     const bucket = gcs.bucket('pwagram-d1bff.appspot.com');
        //     bucket.upload(`/tmp/${files.file.name}`, {
        //         uploadType: 'media',
        //         metadata: {
        //             metadata: {
        //                 contentType: files.file.type,
        //                 firebaseStorageDownloadTokens: uuid
        //             }
        //         }
        //     }, (err, file) => {
        //         if (!err) {
        //             admin.database().ref('posts').push({
        //                 id: fields.id,
        //                 title: fields.title,
        //                 location: fields.location,
        //                 image: `https://firebasestorage.googleapi.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media&token=${uuid}`
        //             }).then(() => {
        //                 webpush.setVapidDetails('mailto:business@email.com', 'BJR09w94qRrBZwj5JRvw_K91DLvEi2YrEyxB9npMhT9X_ZG2XgA7oFahDKbjiSXZGF_8FpoHNNBhbCkdhNLW9N8', 'rqhYC-qJGrV7UUQy7hlwQ19jvhv7wN7oe-NWezUYaA4');
        //                 return admin.database().ref('subscriptions').once('value')
        //             }).then(subscriptions => {
        //                 subscriptions.forEach(sub => {
        //                     const pushConfig = {
        //                         endpoint: sub.val().endpoint,
        //                         keys: {
        //                             auth: sub.val().keys.auth,
        //                             p256dh: sub.val().keys.p256dh
        //                         }
        //                     };
        //                     webpush.sendNotification(pushConfig, JSON.stringify({
        //                         title: 'New Post',
        //                         content: 'New post added!',
        //                         openUrl: '/help'
        //                     })).catch(err => { // with firebase this won't work as of now because you need to first have a paid plan
        //                         console.log(err);
        //                     });
        //                 });
        //                 response.status(201).json({message: 'Data stored', id: fields.id});
        //             }).catch(err => {
        //                 response.status(500).json({error: err});
        //             })
        //         } else {
        //             console.log(err);
        //         }
        //     })
        // });


        // admin.database().ref('posts').push({
        //     id: request.body.id,
        //     title: request.body.title,
        //     location: request.body.location,
        //     image: request.body.image
        // }).then(() => {
        //     webpush.setVapidDetails('mailto:business@email.com', 'BJR09w94qRrBZwj5JRvw_K91DLvEi2YrEyxB9npMhT9X_ZG2XgA7oFahDKbjiSXZGF_8FpoHNNBhbCkdhNLW9N8', 'rqhYC-qJGrV7UUQy7hlwQ19jvhv7wN7oe-NWezUYaA4');
        //     return admin.database().ref('subscriptions').once('value')
        // }).then(subscriptions => {
        //     subscriptions.forEach(sub => {
        //         const pushConfig = {
        //             endpoint: sub.val().endpoint,
        //             keys: {
        //                 auth: sub.val().keys.auth,
        //                 p256dh: sub.val().keys.p256dh
        //             }
        //         };
        //         webpush.sendNotification(pushConfig, JSON.stringify({
        //             title: 'New Post',
        //             content: 'New post added!',
        //             openUrl: '/help'
        //         })).catch(err => { // with firebase this won't work as of now because you need to first have a paid plan
        //             console.log(err);
        //         });
        //     });
        //     response.status(201).json({message: 'Data stored', id: request.body.id});
        // }).catch(err => {
        //     response.status(500).json({error: err});
        // })
    });
});
