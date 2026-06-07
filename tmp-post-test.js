const fetch = globalThis.fetch;
(async () => {
  const res = await fetch('http://127.0.0.1:4174/api/openai-test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text: '你好' })
  });
  console.log('status', res.status);
  const text = await res.text();
  console.log(text);
})();
