import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import twilio from "twilio";
import OpenAI from "openai";

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

const { TWILIO_SID, TWILIO_AUTH, OPENAI_KEY } = process.env;
const client = twilio(TWILIO_SID, TWILIO_AUTH);
const openai = new OpenAI({ apiKey: OPENAI_KEY });
app.get("/voice", async (req, res)  => {
  res.end ("hello world")
})
app.post("/voice", async (req, res) => {
  const userSpeech = req.body.SpeechResult || "";
  let responseText;
let hello = responseText
  const systemPrompt = `
    You are Mia, a friendly and natural-sounding restaurant assistant.
    Restaurant: Golden Spoon Grill.
    Menu: Burger $10, Fries $4, Salad $8, Chicken Sandwich $9.
    Hours: 11am–9pm daily.
    Address: 101 Main St, Tallahassee.
    Be conversational and concise.
  `;

  if (!userSpeech) {
    responseText = "Hey there! Welcome to Golden Spoon Grill. What can I get started for you today?";
  } else {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userSpeech },
      ],
    });
    responseText = completion.choices[0].message.content;
  }

  const twiml = new twilio.twiml.VoiceResponse();
  const gather = twiml.gather({
    input: "speech",
    action: "/voice",
    method: "POST",
    speechTimeout: "auto",
  });
  gather.say({ voice: "Polly.Joanna-Neural" }, responseText);

  res.type("text/xml").send(twiml.toString());
});

app.listen(3000, () => console.log("✅ AI Voice Bot running on port 3000"));
