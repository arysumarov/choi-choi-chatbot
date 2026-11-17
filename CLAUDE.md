# Choi Choi 菜菜 – Bilingual Cabbage Chatbot (ITS2028 group project)

## Project context
- Course: ITS2028 Global Challenges II, HKBU, tutorial 10001, Group 2. Group leader: Arystan Umarov.
- Goal: close the communication gap between local organic farmers at the **Central Farmers' Market** (run by Kadoorie Farm and Botanic Garden, KFBG; every Sunday 11:00–17:00, Star Ferry Central Pier No. 7) and young visitors.
- Choi Choi is a cute Hong Kong cabbage character and an AI chatbot. Visitors scan a QR code and chat in **Cantonese or English** (typing or voice). No app, no login, no personal data collected.
- **Showcase day: 22 November 2026.** Target: 150+ chatbot users.
- The team also runs Choi Choi accounts on Instagram and Xiaohongshu.

## Decision: build it ourselves (no Dify/Coze)
We decided to vibe-code the chatbot instead of using a no-code platform (Dify's free plan has only 200 message credits).

Planned architecture:
1. **Frontend:** `index.html` is the bilingual landing page (market, farmers' stories, why organic costs more, seasons, about the project); `chat.html` (served at `/chat` via Vercel `cleanUrls`) is the chat UI, the Choi Choi character, quick-reply buttons ("What's in season?", "Meet the farmers", "Why is organic more expensive?"), and voice input via the browser Web Speech API (`zh-HK` for Cantonese, `en-US` for English).
2. **Backend:** one serverless function (`api/chat.js` on Vercel) that adds the system prompt, sends the conversation to the model, and returns the reply. The API key lives only in the environment variable `DEEPSEEK_API_KEY` and never goes in the frontend.
3. **Model:** DeepSeek API (works from Hong Kong; OpenAI and Gemini officially block HK). Optional photo input would need a vision model such as Qwen; this is a nice-to-have, not core.
4. **Knowledge:** the knowledge base is small (~16 KB), so no RAG is needed. Load every `kb/*.md` file into the system prompt.
5. **Deploy:** GitHub repo → import on vercel.com → set `DEEPSEEK_API_KEY` → deploy → make a QR code from the URL. Vercel logs are used to find the most-asked questions for farmers/KFBG.

## Choi Choi's rules (system prompt)
- You are Choi Choi 菜菜, a cheerful Hong Kong cabbage from a local organic farm. You are a cabbage, not an expert.
- Reply in the user's language (Cantonese or English). Keep replies short and playful (2–4 sentences).
- Facts about this market, its farms and KFBG come ONLY from the knowledge base.
- General, non-controversial questions (why organic usually costs more, what's usually in season, cooking/storage tips, farming ideas) may use general knowledge, framed as "usually / in general", then invite the user to ask a farmer. (Changed 8 Nov 2026: KB-only answers were too limited.)
- Still never: health/medical claims, exact prices, saying a specific farm does/doesn't spray, putting down non-organic or other farmers' food, politics or other controversial topics.
- If unsure, say: "I'm not sure – maybe you can ask a farmer at the stall. They're better at it than I am!"
- When asked about a vegetable: tell a short story first, then the facts, then invite the user to visit the farmer's stall and say hi.
- Never ask for names, phone numbers or personal details.

## Knowledge base (`kb/`)
Made from KFBG website pages (checked 8 Nov 2026):
- `01_market_info.md` – times, venue, bad-weather rules, contact, CSA group buying (Nov 2026–Mar 2027)
- `02_farms.md` – the 8 farms (location, year, size, HKORC status). Farmers' phone numbers were left out on purpose.
- `03_organic_and_local_farming.md` – HKORC vs self-claimed organic, HK farming statistics, questions to send to farmers
- `04_about_kfbg.md` – about KFBG
- `05_kfbg_upcoming_events.md` – events from Nov 2026 (note: KFBG Countryside Eco-festival is 21–22 Nov 2026, the same weekend as our showcase)
- `06_kfbg_farming_courses_and_shop.md` – courses, fun facts (HK tea, coffee, honey), souvenirs
- `07_fieldwork_interviews.md` – team interviews of 21 Sep 2026: Andrew (Pig Kun Farm), Rose (Blue Girl), a Kam Tin farming couple, 2 anonymous customers; farmers' seasonal guide and reasons organic costs more. Customers' health claims deliberately left out.

**Still missing:** stall locations, stories from the other 6 farms, the Kam Tin couple's farm name, recipes from farmers.

## Next steps
1. Build `index.html` and `api/chat.js`, test locally with `vercel dev`.
2. Write the vegetable/story files in `kb/` from fieldwork notes.
3. Test ~30 tricky questions (pesticides, health claims, prices, certification). Every answer must come from the KB or redirect to a farmer.
4. Deploy to Vercel, make the QR code, and have farmers test before 22 Nov.
