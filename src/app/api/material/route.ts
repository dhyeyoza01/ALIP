import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey && apiKey !== 'your_api_key_here' ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
  try {
    const { topic, gradeLevel } = await req.json();

    if (!topic || !gradeLevel) {
      return NextResponse.json({ error: 'Missing topic or gradeLevel' }, { status: 400 });
    }

    if (!genAI) {
      return NextResponse.json({ 
        content: `**Lesson Plan: ${topic} (${gradeLevel})**\n\nThis is a mock generated lesson plan. Please add your Gemini API key to .env.local to see dynamic AI-generated curriculum.`
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
        const prompt = `You are an expert curriculum designer. Generate a structured lesson plan for the topic "${topic}" aimed at students in "${gradeLevel}".
        Make it unique and fresh (Random seed: ${Date.now()}-${Math.random()}).
        
Requirements:
1. Format your response in markdown.
2. You MUST use LaTeX for mathematical equations. Enclose inline math in $...$ and block math in $$...$$.
3. Use markdown tables to simulate graphs or diagrams if applicable.

Include the following sections:
## 🎯 Objectives
(3 bullet points)

## 📖 Lesson Outline
(3-4 steps of what to teach)

## 📝 Mini-Quiz
(3 multiple choice questions with answers at the bottom)`;

        const result = await model.generateContent(prompt);
        const content = result.response.text();

        return NextResponse.json({ content });
      } catch (err: any) {
        console.warn(`Model ${modelName} failed:`, err);
        lastError = err;
        continue;
      }
    }

    console.error("All models failed for material route:", lastError);
    return NextResponse.json({ 
      content: `**Lesson Plan: ${topic}**\n\nWe encountered an error generating this curriculum. Our AI models might be experiencing high demand (Rate Limit). Please try again in a minute.`
    });

  } catch (error) {
    console.error('Error generating material:', error);
    return NextResponse.json(
      { error: 'Failed to generate material' },
      { status: 500 }
    );
  }
}
