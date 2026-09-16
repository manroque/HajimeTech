const base =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const ACADEMIA_ID =
  '00000000-0000-0000-0000-000000000001';

async function api(path, options = {}) {
  const response = await fetch(base + path, {
    headers: {
      'Content-Type': 'application/json',
      'x-academia-id': ACADEMIA_ID,
      ...options.headers
    },
    ...options
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || 'Erro na API');
  }

  return data;
}

export const get = (path) => {
  return api(path);
};

export const post = (path, body) => {
  return api(path, {
    method: 'POST',
    body: JSON.stringify(body)
  });
};

export const put = (path, body) => {
  return api(path, {
    method: 'PUT',
    body: JSON.stringify(body)
  });
};

export const patch = (path, body) => {
  return api(path, {
    method: 'PATCH',
    body: JSON.stringify(body)
  });
};

export const del = (path) => {
  return api(path, {
    method: 'DELETE'
  });
};