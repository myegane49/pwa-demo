export let deferredPrompt; 

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