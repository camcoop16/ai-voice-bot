require('dotenv').config();
const express = require('express');
const { twiml: { VoiceResponse } } = require('twilio');
const OpenAI = require('openai');

const app = express();
app.use(express.urlencoded({ extended: false }));

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// When Twilio calls this route
app.post('/voice', async (req, res) => {
  const twiml = new VoiceResponse();
  const gather = twiml.gather({
    input: 'speech',
    action: '/process',
    method: 'POST',
  });
  gather.say('Hey there! Welcome to Cam’s AI voice assistant. What would you like to order today?');
  res.type('text/xml');
  res.send(twiml.toString());
});

// Process what the caller said
app.post('/process', async (req, res) => {
  const userSpeech = req.body.SpeechResult || "nothing heard";
  console.log("User said:", userSpeech);

  // Send caller’s speech to OpenAI for a response
  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "You are a friendly restaurant AI who takes food orders clearly." },
      { role: "user", content: userSpeech }
    ],
  });

  const aiResponse = completion.choices[0].message.content;
  console.log("AI says:", aiResponse);

  // Send AI’s response back to Twilio
  const twiml = new VoiceResponse();
  twiml.say(aiResponse);
  res.type('text/xml');
  res.send(twiml.toString());
});

app.get('/', (req, res) => {
  res.send('🚀 AI Voice Bot is live and connected to Twilio & OpenAI!');
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});
