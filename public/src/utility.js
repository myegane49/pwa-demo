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