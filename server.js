require('dotenv').config();
const express = require('express');
const { twiml: { VoiceResponse } } = require('twilio');
const OpenAI = require('openai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ✅ Load ElevenLabs API key
const ELEVEN_KEY = process.env.ELEVENLABS_API_KEY;

// Optional: simple log to confirm it's being read correctly
console.log("ElevenLabs Key:", ELEVEN_KEY ? "✅ Loaded" : "❌ Missing");

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

  // Use a more natural Twilio voice
  gather.say(
    { voice: 'Polly.Joanna' },
    "Hey there! Welcome to Cam’s AI voice assistant. What would you like to order today?"
  );

  res.type('text/xml');
  res.send(twiml.toString());
});

// Process what the caller said
app.post('/process', async (req, res) => {
  const userSpeech = req.body.SpeechResult || "nothing heard";
  console.log("User said:", userSpeech);

  try {
    // Get AI reply from OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a friendly restaurant AI who takes food orders clearly and confirm details naturally." },
        { role: "user", content: userSpeech }
      ],
    });

    const aiResponse = completion.choices[0].message.content;
    console.log("AI says:", aiResponse);

    // Convert AI text to ElevenLabs voice
    const audioResponse = await axios.post(
      "https://api.elevenlabs.io/v1/text-to-speech/"kdmDKE6EkgrWrrykO9Qt,
      { text: aiResponse, voice_settings: { stability: 0.4, similarity_boost: 0.8 } },
      {
        headers: {
          "xi-api-key": ELEVEN_KEY,
          "Content-Type": "application/json",
        },
        responseType: "arraybuffer",
      }
    );

    // Save audio temporarily
    const filePath = path.join(__dirname, 'speech.mp3');
    fs.writeFileSync(filePath, audioResponse.data);

    // Respond to Twilio: play the generated audio file, then keep listening
const twiml = new VoiceResponse();

// Play the AI’s reply
twiml.play(`${req.protocol}://${req.get('host')}/audio`);

// After it finishes, prompt and listen again
const gather = twiml.gather({
  input: 'speech',
  action: '/process',
  method: 'POST'
});
gather.say(
  { voice: 'Polly.Joanna' },
  "Go ahead, tell me what else you'd like to add."
);

// Send back to Twilio
res.type('text/xml');
res.send(twiml.toString());

  } catch (err) {
    console.error('Error generating ElevenLabs audio:', err.message);
    const twiml = new VoiceResponse();
    twiml.say('Sorry, something went wrong. Please try again later.');
    res.type('text/xml');
    res.send(twiml.toString());
  }
});

// Serve the generated audio file
app.get('/audio', (req, res) => {
  const filePath = path.join(__dirname, 'speech.mp3');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Audio not found');
  }
});

// Health check route
app.get('/', (req, res) => {
  res.send('🚀 AI Voice Bot is live and connected to Twilio, OpenAI, and ElevenLabs!');
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});
