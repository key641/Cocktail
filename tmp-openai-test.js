const fetch = globalThis.fetch;
(async () => {
  try {
    const res = await fetch('https://api.ofox.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer sk-of-eiZuORWWccTdVqfwqtrFQnmAhqdGmzwBNQyNDKWPPwHcPkagtPtWkTPEDQGrTfHL'
      },
      body: JSON.stringify({
        model: 'openai/gpt-5.4-mini',
        messages: [{ role: 'user', content: '生命的意义是什么？' }]
      })
    });
    const text = await res.text();
    console.log(res.status);
    console.log(text);
  } catch (err) {
    console.error(err);
  }
})();
