export let deferredPrompt; 
const enableNotificationsButtons = document.querySelectorAll('.enable-notifications');
import { urlBase64ToUint8Array } from './utility';

if (!window.Promise) {
    window.Promise = Promise;
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').then(() => {
        console.log('Service worker registered!');
    }).catch(err => {
        console.log(err);
    });
}

window.addEventListener('beforeinstallprompt', (event) => {
    console.log('beforeinstallprompt fired')
    event.preventDefault();
    deferredPrompt = event;
    return false;
});

const displayConfirmNotification = () => {
    if ('serviceWorker' in navigator) {
        const options = {
            body: 'You successfully subscribed to our notification service!',
            icon: '/assets/images/icons/app-icon-96x96.png',
            image: '/assets/images/sf-boat.jpg',
            dir: 'ltr',
            lang: 'en-US',
            vibrate: [100, 50, 200],
            badge: '/assets/images/icons/app-icon-96x96.png',
            tag: 'confirm-notification',
            renotify: true,
            actions: [
                {action: 'confirm', title: 'Okay', icon: '/assets/images/icons/app-icon-96x96.png'},
                {action: 'cancel', title: 'Cancel', icon: '/assets/images/icons/app-icon-96x96.png'}
            ]
        }
        navigator.serviceWorker.ready.then(swreg => {
            swreg.showNotification('Successfully subscribed', options)
        })
    }
    
    // const options = {
    //     body: 'You successfully subscribed to our notification service!'
    // }
    // new Notification('Successfully subscribed', options);
};

const configurePushSub = () => {
    if (!('serviceWorker' in navigator)) {
        return;
    }
    let reg;
    navigator.serviceWorker.ready.then(swreg => {
        reg = swreg;
        return swreg.pushManager.getSubscription();
    }).then(sub => {
        if (sub === null) {
            const vapidPublicKey = 'BJR09w94qRrBZwj5JRvw_K91DLvEi2YrEyxB9npMhT9X_ZG2XgA7oFahDKbjiSXZGF_8FpoHNNBhbCkdhNLW9N8';
            const convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
            return reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedVapidPublicKey
            });
        } else {

        }
    }).then(newSub => {
        return fetch('https://pwagram-d1bff.firebaseio.com/subscriptions.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(newSub)
        });
    }).then(res => {
        if (res.ok) {
            displayConfirmNotification();
        }
    }).catch(err => {
        console.log(err);
    });
};

const askForNotificationPermission = () => {
    Notification.requestPermission(result => {
        console.log('User choice', result);
        if (result !== 'granted') {
            console.log('No notificaion permission!');
        } else {
            // displayConfirmNotification();
            configurePushSub();
        }
    });
};

if ('Notification' in window && 'serviceWorker' in navigator) {
    for (let i = 0; i < enableNotificationsButtons.length; i++) {
        enableNotificationsButtons[i].style.display = 'inline-block';
        enableNotificationsButtons[i].addEventListener('click', askForNotificationPermission)
    }
}



// FETCH AND PROMISES SECTION:

// const promise = new Promise((resolve, reject) => {
//     setTimeout(() => {
//         // resolve('this is executed once the timer is done');
//         // console.log('this is executed once the timer is done');
//         reject({code: 500, message: 'An error occured!'});
//     }, 3000);
// });

// const xhr = new XMLHttpRequest();
// xhr.open('GET', 'http://httpbin.org/ip');
// xhr.responseType = 'json';
// xhr.onload = () => {
//     console.log(xhr.response);
// };
// xhr.onerror = () => {
//     console.log('Error!');
// };
// xhr.send();

// fetch('http://httpbin.org/ip').then(response => {
//     console.log(response);
//     return response.json();
// }).then(data => {
//     console.log(data);
// }).catch(err => {
//     console.log(err);
// });

// fetch('http://httpbin.org/post', {
//     method: 'POST',
//     headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json'
//     },
//     mode: 'cors',
//     body: JSON.stringify({message: 'Does this work?'})
// }).then(response => {
//     console.log(response);
//     return response.json();
// }).then(data => {
//     console.log(data);
// }).catch(err => {
//     console.log(err);
// });

// // promise.then(text => {
// //     console.log(text);
// //     return text + ' attached text';
// // }, (err) => {
// //     console.log(err.code, err.message);
// // }).then(newText => {
// //     console.log(newText);
// // });

// promise.then(text => {
//     console.log(text);
//     return text + ' attached text';
// }).then(newText => {
//     console.log(newText);
// }).catch(err => {
//     console.log(err.code, err.message);
// });

// console.log('this is executed after the setTimeout()');