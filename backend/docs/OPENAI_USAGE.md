# OpenAI usage: why "0 requests" / "0 input tokens" can show

If you see **0 requests** and **0 input tokens** on [platform.openai.com/usage](https://platform.openai.com/usage), it usually means no API calls from your app are being counted for that project/organization. Common causes:

## 1. **API key and dashboard don’t match**

Usage is **per project** (and per organization). The key in your backend (`OPENAI_API_KEY`) must belong to the **same project** as the usage page you’re viewing.

- In the dashboard, use the project/organization selector and confirm you’re on the project that owns the key you set in the app.
- If the key was created in a different project or org, its usage will show under that project, not the one you’re looking at.

## 2. **Key not used by the backend**

- Confirm `OPENAI_API_KEY` is set in the **environment that actually runs the backend** (e.g. Railway env vars, not only local `.env`).
- Restart or redeploy the backend after changing the key so the new value is loaded.

## 3. **Requests never reach OpenAI**

- **Auth**: If the frontend gets 401/403, the request may never reach the chat endpoint that calls OpenAI.
- **Errors**: If the backend hits an error before calling the LLM (e.g. missing config, exception), no request is sent.
- **Wrong backend**: Ensure the frontend is calling the correct backend URL (`VITE_API_URL` or your deployed API).

## 4. **Verify connection and usage**

Call the backend’s status endpoint (while logged in):

```bash
curl -H "Authorization: Bearer YOUR_JWT" https://your-backend-url/chat/openai-status
```

Response:

- `"configured": false` → `OPENAI_API_KEY` is not set in the running backend.
- `"configured": true`, `"test_ok": true`, `"usage": { "prompt_tokens": ..., "completion_tokens": ... }` → API key works and a test request was sent; usage should appear on the dashboard for that key’s project shortly.
- `"test_ok": false`, `"message": "..."` → Key is set but the test call failed (e.g. invalid key, 429); check the message.

After a successful test or a normal chat message, refresh [platform.openai.com/usage](https://platform.openai.com/usage) for the **correct project**; you should see non-zero requests and input tokens.
