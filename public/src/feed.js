import * as utils from './utility';
import deferredPrompt from './app';

var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
const form = document.querySelector('form');
const titleInput = document.getElementById('title');
const locationInput = document.getElementById('location');
const videoPlayer = document.getElementById('player');
const canvasElement = document.getElementById('canvas');
const captureButton = document.getElementById('capture-btn');
const imagePicker = document.getElementById('image-picker');
const imagePickerArea = document.getElementById('pick-image');
let picture;
const locationBtn = document.getElementById('location-btn');
const locationLoader = document.getElementById('location-loader');
let fetchedLocation = {lat: 0, lng: 0};

locationBtn.addEventListener('click', (event) => {
  if (!('geolocation' in navigator)) {
    return;
  }
  let sawAlert = false;

  locationBtn.style.display = 'none';
  locationLoader.style.display = 'block';

  navigator.geolocation.getCurrentPosition(position => {
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';
    fetchedLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    };
    locationInput.value = `From here: latitude: ${position.coords.latitude}, longitude: ${position.coords.longitude}`;
    document.getElementById('manual-location').classList.add('is-focused');
  }, err => {
    console.log(err);
    locationBtn.style.display = 'inline';
    locationLoader.style.display = 'none';
    if (!sawAlert) {
      alert('Couldn\'t fetch location please enter it manually');
      sawAlert = true;
    }
    fetchedLocation = {lat: 0, lng: 0};
  }, {timeout: 7000});
});

const initializeLocation = () => {
  if (!('geolocation' in navigator)) {
    locationBtn.style.display = 'none';
  }
}

const initializeMedia = () => {
  if (!('mediaDevices' in navigator)) {
    navigator.mediaDevices = {}
  }

  if (!('getUserMedia' in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = (constraints ) => {
      const getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      if (!getUserMedia) {
        return Promise.reject(new Error('getUserMedia is not implemented!'));
      }

      return new Promise((resolve, reject) => {
        getUserMedia.call(navigator, constraints, resolve, reject)
      })
    };
  }

  navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
    videoPlayer.srcObject = stream;
    videoPlayer.style.display = 'block';
  }).catch(err => {
    imagePickerArea.style.display = 'block';
  });
};

captureButton.addEventListener('click', (event) => {
  canvasElement.style.display = 'block';
  videoPlayer.style.display = 'none';
  captureButton.style.display = 'none';
  const context = canvasElement.getContext('2d');
  context.drawImage(videoPlayer, 0, 0, canvasElement.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvasElement.width));
  videoPlayer.srcObject.getVideoTracks().forEach(track => {
    track.stop();
  });
  picture = utils.dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener('change', event => {
  picture = event.target.files[0];
});

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  setTimeout(() => {
    createPostArea.style.transform = 'translateY(0)';
    initializeMedia();
    initializeLocation();
  }, 1);
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((choiceResult) => {
      console.log(choiceResult.outcome);
      if (choiceResult.outcome === 'dismissed') {
        console.log('User cancelled installation');
      } else {
        console.log('User added to home screen');
      }
    });

    deferredPrompt = null;
  }

  // if ('serviceWorker' in navigator) {
  //   navigator.serviceWorker.getRegistrations().then(registrations => {
  //     for (let i = 0; i < registrations.length; i++) {
  //       registrations[i].unregister();
  //     }
  //   })
  // }
}

function closeCreatePostModal() {
  createPostArea.style.transform = 'translateY(100vh)';
  setTimeout(() => {
    createPostArea.style.display = 'none';
  }, 300);

  imagePickerArea.style.display = 'none';
  videoPlayer.style.display = 'none';
  canvasElement.style.display = 'none';
  captureButton.style.display = 'inline';
  locationBtn.style.display = 'inline';
  locationLoader.style.display = 'none';

  if (videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach(track => {
      track.stop();
    });
  }
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

const onSaveButtonClicked = (event) => {
  console.log('clicked');
  if ('caches' in window) {
    caches.open('user-requested').then(cache => {
      cache.add('https://httpbin.org/get');
      cache.add('/assets/images/sf-boat.jpg');
    })
  }
};

const clearCards = () => {
  while(sharedMomentsArea.hasChildNodes()) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard(data) {
  var cardWrapper = document.createElement('div');
  cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
  var cardTitle = document.createElement('div');
  cardTitle.className = 'mdl-card__title';
  cardTitle.style.backgroundImage = `url('${data.image}')`;
  cardTitle.style.backgroundSize = 'cover';
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement('h2');
  cardTitleTextElement.style.color = '#fff';
  cardTitleTextElement.className = 'mdl-card__title-text';
  cardTitleTextElement.textContent = data.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement('div');
  cardSupportingText.className = 'mdl-card__supporting-text';
  cardSupportingText.textContent = data.location;
  cardSupportingText.style.textAlign = 'center';
  // const cardSaveButton = document.createElement('button');
  // cardSaveButton.textContent = 'Save';
  // cardSaveButton.addEventListener('click', onSaveButtonClicked);
  // cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

const updateUI = (data) => {
  clearCards();
  for (let i = 0; i < data.length; i++) {
    createCard(data[i]);
  }
};

// const url = 'https://httpbin.org/get';
const url = 'https://pwagram-d1bff.firebaseio.com/posts.json';
let networkDataRecieved = false;
// fetch(url).then(function(res) {
//   return res.json();
// }).then(function(data) {
//   networkDataRecieved = true;
//   console.log('From web', data);
//   clearCards();
//   createCard();
// });
fetch(url).then(function(res) {
  return res.json();
}).then(function(data) {
  networkDataRecieved = true;
  console.log('From web', data);
  let dataArray = [];
  for (let key in data) {
    dataArray.push(data[key])
  }
  updateUI(dataArray);
});

// if ('caches' in window) {
//   caches.match(url).then(response => {
//     if (response) {
//       return response.json();
//     }
//   }).then(data => {
//     console.log('From cache', data);
//     if (!networkDataRecieved) {
//       let dataArray = [];
//       for (let key in data) {
//         dataArray.push(data[key])
//       }
//       updateUI(dataArray)
//     }
//   })
// }
if ('indexedDB' in window) {
  utils.readAllData('posts').then(data => {
    if (!networkDataRecieved) {
      console.log('From indexedDB', data);
      updateUI(data);
    }
  });
}

const sendData = () => {
  const postData = new FormData();
  const id = new Date().toISOString();
  postData.append('id', id);
  postData.append('title', titleInput.value);
  postData.append('location', locationInput.value);
  postData.append('rawLocationLat', fetchedLocation.lat);
  postData.append('rawLocationLng', fetchedLocation.lng);
  postData.append('file', picture, `${id}.png`);

  fetch('https://us-central1-pwagram-d1bff.cloudfunctions.net/storePostData', {
    method: 'POST',
    // headers: {
    //   'Content-Type': 'application/json',
    //   'Accept': 'application/json'
    // },
    // body: JSON.stringify({
    //   id: new Date().toISOString(),
    //   title: titleInput.value,
    //   location: locationInput.value,
    //   image: 'https://firebasestorage.googleapis.com/v0/b/pwagram-d1bff.appspot.com/o/sf-boat.jpg?alt=media&token=d93053a6-ed1d-4a2f-9ba7-72680198392d'
    // })
    body: postData
  }).then(res => {
    console.log('Sent data', res);
    updateUI();
  });
};

form.addEventListener('submit', (event) => {
  event.preventDefault();

  if (titleInput.value.trim() === '' || locationInput.value.trim() === '') {
    alert('Please enter valid data!');
    return;
  }

  closeCreatePostModal();

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(sw => {
      const post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        picture: picture,
        rawLocation: fetchedLocation
      };
      utils.writeData('sync-posts', post).then(() => {
        return sw.sync.register('sync-new-posts');
      }).then(() => {
        const snackbarContainer = document.getElementById('confirmation-toast');
        const data = {message: 'Your post was saved for syncing'};
        snackbarContainer.MaterialSnackbar.showSnackbar(data);
      }).catch(err => {
        console.log(err);
      });
    });
  } else {
    sendData();
  }
});