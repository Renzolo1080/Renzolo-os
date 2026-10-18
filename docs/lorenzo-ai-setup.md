# Lorenzo · AI: setup (Tavus)

Lorenzo · AI is a labelled AI video coach built on Tavus's Conversational
Video Interface. RENZOLO OS creates each session on the server and embeds it
on the AI coach page for Growth, Elevate and Launch founders. It stays hidden
until the three settings below are added on Vercel.

## 1. Record the training video (about 60 seconds)

- One continuous shot: about 30 seconds talking naturally, then about 30
  seconds sitting still and looking at the camera.
- Chest-up, camera at eye level, good even light, quiet room.
- At least 1080p and 25 frames a second, MP4 or WebM, under 750 MB.
- Record in a desktop app (the camera app or QuickTime), not in a browser.

## 2. Create your face and PAL in Tavus

1. Create a Tavus account at tavus.io and open the developer portal.
2. Upload the video to create your face (Tavus may call it a replica). It is
   usable within minutes and keeps improving for a few hours.
3. Create a PAL (Tavus may call it a persona) that uses your face and voice.
   Paste the system prompt from the section below into its instructions.
4. Copy the PAL ID and the face ID.
5. Create an API key.

## 3. Add these settings on Vercel (Production and Preview)

| Name | Value |
| --- | --- |
| `TAVUS_API_KEY` | your Tavus API key (secret: never paste it into chat or email) |
| `TAVUS_PAL_ID` | your PAL ID |
| `TAVUS_FACE_ID` | your face ID (optional if the PAL already has your face) |

Then redeploy. The "Lorenzo · AI" panel appears on /ai-coach.

## How it behaves

- Always labelled "Lorenzo · AI" with an AI badge; it says it is an AI if asked.
- Founders agree to four consent points before their first session.
- 10 minutes per session; 3 sessions a month (12 on Elevate); text coaching
  stays available below.
- Captions on; video starts only when the founder taps "Start".
- "Talk to the real Lorenzo" links to booking at every step.
- No financial, legal, tax or investment advice, prices, guarantees or
  promised introductions.

## System prompt for the PAL

The current text lives in `lib/ai-clone.ts` (`PAL_SYSTEM_PROMPT`) so it is
versioned with the code. Copy it from there into the PAL. If you change it in
Tavus, copy the change back into the file.

## Costs and review

Tavus bills by conversation minute, so watch usage in its dashboard in the
first week. Review a sample of conversations weekly (brand book rule), and
pause the PAL in Tavus at any time to switch Lorenzo · AI off.
