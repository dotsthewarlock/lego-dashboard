import {pathToFileURL} from 'node:url';
import {useHttpsProxy} from './brickset-diagnostic.mjs';

const expected = 'CodexPostProbe2026';
const control = 'probe+form=a&b';
const exactField = (values, value) => Array.isArray(values) && values.length === 1 && values[0] === value;

export async function verifyForm(env, transport) {
  const placeholder = env.CLOUD_POST_PROBE;
  if (!placeholder || placeholder === expected ||
      placeholder === env.BRICKSET_API_KEY || placeholder === env.BRICKSET_USER_HASH) {
    return 'binding_missing_or_unsafe';
  }

  try {
    const response = await transport('https://httpbingo.org/post', {
      method: 'POST',
      body: new URLSearchParams({apiKey: placeholder, userHash: placeholder, control}),
      redirect: 'error',
      signal: AbortSignal.timeout(12_000),
      cache: 'no-store',
    });
    if (!response.ok) return 'echo_http_error';
    const {form} = await response.json();
    return exactField(form?.apiKey, expected) &&
      exactField(form?.userHash, expected) &&
      exactField(form?.control, control) ? 'pass' : 'form_mismatch';
  } catch {
    return 'echo_failed';
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  let result;
  let restoreProxy;
  try {
    restoreProxy = useHttpsProxy(process.env);
    result = await verifyForm(process.env, fetch);
  } catch {
    result = 'secure_proxy_unavailable';
  } finally {
    restoreProxy?.();
    console.log(result);
    process.exitCode = result === 'pass' ? 0 : 1;
  }
}
