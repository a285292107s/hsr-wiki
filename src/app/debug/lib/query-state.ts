
const QUERY_CHANGE_EVENT = 'lab:querychange';

function readParam(name: string): string | null {
  return new URLSearchParams(location.search).get(name);
}

function writeParam(name: string, value: string): void {
  const params = new URLSearchParams(location.search);
  params.set(name, value);
  history.replaceState(null, '', `${location.pathname}?${params.toString()}`);
  window.dispatchEvent(new Event(QUERY_CHANGE_EVENT));
}

export function getQueryParam(name: string): string | null {
  return readParam(name);
}

export function setQueryParam(name: string, value: string): void {
  if (readParam(name) === value) return;
  writeParam(name, value);
}

export function subscribeQueryChange(fn: () => void): () => void {
  window.addEventListener(QUERY_CHANGE_EVENT, fn);
  window.addEventListener('popstate', fn);
  return () => {
    window.removeEventListener(QUERY_CHANGE_EVENT, fn);
    window.removeEventListener('popstate', fn);
  };
}