import * as idb from 'idb';

export const dbPromise = idb.openDB('posts-store', 1, {
    upgrade(db) {
        if (!db.objectStoreNames.contains('posts')) {
            db.createObjectStore('posts', {keyPath: 'id'});
        }
        if (!db.objectStoreNames.contains('sync-posts')) {
            db.createObjectStore('sync-posts', {keyPath: 'id'});
        }
    }
});

export const writeData = (st, data) => {
    return dbPromise.then(db => {
        const tx = db.transaction(st, 'readwrite');
        const store = tx.objectStore(st);
        store.put(data);
        // return tx.complete;
        return tx.done;
    })
};

export const readAllData = (st) => {
    return dbPromise.then(db => {
        const tx = db.transaction(st, 'readonly');
        const store = tx.objectStore(st);
        return store.getAll();
    });
};

export const clearAllData = (st) => {
    return dbPromise.then(db => {
        const tx = db.transaction(st, 'readwrite');
        const store = tx.objectStore(st);
        store.clear();
        return tx.done;
    });
};

export const deleteItemFromData = (st, id) => {
    dbPromise.then(db => {
        const tx = db.transaction(st, 'readwrite');
        const store = tx.objectStore(st);
        store.delete(id);
        return tx.done;
    }).then(() => {
        console.log('Item deleted!');
    });
};

export const urlBase64ToUint8Array = (base64String) => {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);
  
    for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

export const dataURItoBlob = (dataURI) => {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ab], {type: mimeString});
    return blob;
};