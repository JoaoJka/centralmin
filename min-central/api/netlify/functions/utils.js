const FIREBASE_URL = process.env.FIREBASE_URL;
const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;

async function fbGet(path) {
  const url = `${FIREBASE_URL}/${path}.json?auth=${FIREBASE_API_KEY}`;
  const res = await fetch(url);
  return res.json();
}

async function fbPut(path, data) {
  const url = `${FIREBASE_URL}/${path}.json?auth=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.json();
}

async function fbPatch(path, data) {
  const url = `${FIREBASE_URL}/${path}.json?auth=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return res.json();
}

async function fbPost(path, data) {
  const url = `${FIREBASE_URL}/${path}.json?auth=${FIREBASE_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

async function fbDelete(path) {
  const url = `${FIREBASE_URL}/${path}.json?auth=${FIREBASE_API_KEY}`;
  await fetch(url, { method: 'DELETE' });
}