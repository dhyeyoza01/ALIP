import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey && apiKey !== 'your_api_key_here' ? new GoogleGenerativeAI(apiKey) : null;

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, subject } = body as { messages: ChatMessage[]; subject: string };
    const userMessage = messages?.[messages.length - 1]?.content || '';

    if (!userMessage) {
      return NextResponse.json({ reply: 'Please ask me a question!' });
    }

    if (!genAI) {
      return NextResponse.json({
        reply: `Great question about ${subject || 'this topic'}! While I'm connecting to the AI backend, here's a tip: break complex problems into smaller parts and tackle them one at a time. Try rephrasing your question once the AI is fully connected!`
      });
    }

    const modelNames = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });

        const systemPrompt = `You are a friendly, encouraging AI tutor helping a student learn "${subject || 'various subjects'}". 
Rules:
- Explain concepts clearly with simple language and real-world analogies
- Give short, focused answers (2-4 paragraphs max)
- Use examples and step-by-step explanations when helpful
- Encourage the student and celebrate their curiosity
- If asked something outside your teaching scope, gently redirect to the subject
- Use markdown formatting for code blocks, bold text, and lists when appropriate
- Never say you are an AI language model — you are their personal tutor`;

        const chatHistory = messages.slice(0, -1).map((m) => ({
          role: m.role === 'user' ? 'user' as const : 'model' as const,
          parts: [{ text: m.content }],
        }));

        const chat = model.startChat({
          history: [
            { role: 'user', parts: [{ text: 'What kind of tutor are you?' }] },
            { role: 'model', parts: [{ text: systemPrompt }] },
            ...chatHistory,
          ],
        });

        const result = await chat.sendMessage(userMessage);
        const reply = result.response.text();

        return NextResponse.json({ reply });
      } catch (err) {
        console.warn(`Chat model ${modelName} failed:`, err);
        continue;
      }
    }

    throw new Error('All models failed');
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({
      reply: 'I apologize, I\'m experiencing a brief hiccup. Please try sending your question again in a moment! 🙏'
    });
  }
}
