import {
  apps,
  initializeTestApp,
  initializeAdminApp,
  assertFails,
  assertSucceeds,
  clearFirestoreData,
} from '@firebase/rules-unit-testing';

const PROJECT_ID = 'YOUR-PROJECT-ID-HERE';
const userAuth = { uid: 'user123', email: 'user@test.com' };

const getFirestore = (authUser) =>
  initializeTestApp({ projectId: PROJECT_ID, auth: authUser }).firestore();

const getAdminFirestore = () =>
  initializeAdminApp({ projectId: PROJECT_ID }).firestore();

describe('Firestore security rules', () => {
  beforeEach(async () => {
    await clearFirestoreData({ projectId: PROJECT_ID });
  });

  it('can not read from the messages collection', async () => {
    const db = getFirestore(userAuth);

    const testDoc = db.collection('messages').doc('testDoc');
    await assertFails(testDoc.get());
  });

  it('can read own messages from the messages collection', async () => {
    const db = getFirestore(userAuth);
    const admin = getAdminFirestore();

    const doc = admin.collection('messages').doc('abc123');
    await doc.set({ uid: userAuth.uid });

    const testDoc = db.collection('messages').doc('abc123');

    await assertSucceeds(testDoc.get());
  });

  it('can not update own messages', async () => {
    const db = getFirestore(userAuth);
    const admin = getAdminFirestore();

    const doc = admin.collection('messages').doc('abc123');
    await doc.set({ uid: userAuth.uid });

    const testDoc = db.collection('messages').doc('abc123');

    await assertFails(testDoc.set({ foo: 'bar' }));
  });

  afterAll(async () => {
    const cleanUpApps = apps().map((app) => app.delete());
    await Promise.all(cleanUpApps);
  });
});
