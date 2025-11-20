const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenerativeAI } = require('@google/generative-ai');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// INCREASED LIMIT: Essential for handling Base64 images/PDFs
app.use(express.json({ limit: '50mb' })); 

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ 
  model: "gemini-2.5-flash",
  systemInstruction: "You are NovaMind, an advanced AI assistant. You are helpful, creative, and capable of analyzing images and documents. Respond clearly."
});

// --- ROUTES ---

// 1. Root Route (Health Check)
app.get('/', (req, res) => {
  res.send('NovaMind AI Server is Active');
});

// 2. Ping Route (Wake-up Call)
// Frontend calls this on load to wake up free-tier servers
app.get('/ping', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// 3. Chat Route
app.post('/chat', async (req, res) => {
  try {
    const { message, history, file } = req.body;

    if (!message && !file) {
      return res.status(400).json({ error: 'Message or file is required' });
    }

    // Prepare Chat History for Context
    const chatHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: { maxOutputTokens: 2000 },
    });

    // Construct Message
    const currentMessageParts = [];
    if (file) {
      currentMessageParts.push({
        inlineData: { data: file.data, mimeType: file.mimeType }
      });
    }
    if (message) {
      currentMessageParts.push({ text: message });
    }

    // Generate
    const result = await chat.sendMessage(currentMessageParts);
    const response = await result.response;
    const text = response.text();

    res.json({ reply: text });

  } catch (error) {
    console.error('Backend Error:', error);
    res.status(500).json({ error: 'Failed to process request', details: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`NovaMind Server running on http://localhost:${PORT}`);
});