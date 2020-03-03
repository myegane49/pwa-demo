import * as utils from './utility';
import deferredPrompt from './app';

var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
const form = document.querySelector('form');
const titleInput = document.getElementById('title');
const locationInput = document.getElementById('location');

function openCreatePostModal() {
  createPostArea.style.display = 'block';
  setTimeout(() => {
    createPostArea.style.transform = 'translateY(0)';
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
  fetch('https://us-central1-pwagram-d1bff.cloudfunctions.net/storePostData', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({
      id: new Date().toISOString(),
      title: titleInput.value,
      location: locationInput.value,
      image: 'https://firebasestorage.googleapis.com/v0/b/pwagram-d1bff.appspot.com/o/sf-boat.jpg?alt=media&token=d93053a6-ed1d-4a2f-9ba7-72680198392d'
    })
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
        location: locationInput.value
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