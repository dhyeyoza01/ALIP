import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey && apiKey !== 'your_api_key_here' ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
  try {
    const { topic, subject } = await req.json();

    if (!topic || !subject) {
      return NextResponse.json({ error: 'Missing topic or subject' }, { status: 400 });
    }

    if (!genAI) {
      return NextResponse.json({ 
        content: `**${topic}**\n\nThis is a mock lesson about ${topic} in ${subject}. Please add your Gemini API key to .env.local to see dynamic AI-generated lessons.`
      });
    }

    const modelNames = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError: unknown = null;

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { temperature: 0.8 }
        });
        const prompt = `You are an expert AI tutor teaching ${subject}. Write a concise, engaging markdown lesson about the concept of "${topic}". 
        Make it unique and fresh (Random seed: ${Date.now()}-${Math.random()}).
        
Requirements:
1. Start directly with the lesson content. Do not say "Here is the lesson" or similar.
2. Keep it between 300-500 words for depth.
3. You MUST use LaTeX for mathematical equations. Enclose inline math in $...$ and block math in $$...$$.
4. Include at least ONE visual element: a markdown table showing data/comparisons, an ASCII diagram showing relationships, or a step-by-step flowchart using text arrows (→, ↓, ⇒).
5. Use **bold** for key terms and include a "💡 Key Insight" callout box.
6. End with a "🧠 Quick Check" — one thought-provoking question for the student.
7. Explain it simply enough for a beginner to understand while being academically accurate.`;

        const result = await model.generateContent(prompt);
        const content = result.response.text();

        return NextResponse.json({ content });
      } catch (err: any) {
        console.warn(`Model ${modelName} failed:`, err);
        lastError = err;
        continue;
      }
    }

    console.error("All models failed for lesson route:", lastError);
    return NextResponse.json({ 
      content: `**${topic}**\n\nWe encountered an error generating this lesson. Our AI models might be experiencing high demand (Rate Limit). Please try again in a minute.`
    });

  } catch (error) {
    console.error('Error generating lesson:', error);
    return NextResponse.json(
      { error: 'Failed to generate lesson' },
      { status: 500 }
    );
  }
}
