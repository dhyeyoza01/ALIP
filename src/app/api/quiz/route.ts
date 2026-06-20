import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { QUESTION_BANKS } from '@/lib/data';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey && apiKey !== 'your_api_key_here' ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request: Request) {
  let subject = "Python Programming";

  try {
    const body = await request.json();
    subject = body.subject || "Python Programming";

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    // If no API key, use the question banks directly
    if (!genAI) {
      console.warn("No Gemini API key. Using question banks.");
      const questions = QUESTION_BANKS[subject] || QUESTION_BANKS["Python Programming"];
      return NextResponse.json({ questions });
    }

    // Try gemini-2.5-flash first, then gemini-2.0-flash, then gemini-1.5-flash
    const modelNames = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let lastError: unknown = null;

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: { temperature: 0.9 }
        });

        const prompt = `You are an expert educational AI tutor. Generate exactly 5 high-quality multiple-choice diagnostic questions for the subject: "${subject}".
Ensure these questions are completely unique and different from previous ones (Random seed: ${Date.now()}-${Math.random()}).
Cover different fundamental concepts within this subject, including obscure or advanced ones.

Return ONLY a valid JSON array of 5 objects with NO markdown formatting, NO backticks, NO extra text. Just the raw JSON array.
Each object must have exactly this structure:
{"concept":"SubTopic","question":"Question text?","options":["A","B","C","D"],"correct":0,"explanation":"Why this is correct."}

The "correct" field must be an integer 0-3 matching the index of the right answer in the options array.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        // Clean markdown wrapping
        let cleaned = responseText.trim();
        if (cleaned.startsWith('```json')) cleaned = cleaned.slice(7);
        if (cleaned.startsWith('```')) cleaned = cleaned.slice(3);
        if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3);
        cleaned = cleaned.trim();

        const questions = JSON.parse(cleaned);

        if (Array.isArray(questions) && questions.length === 5) {
          console.log(`Generated questions using ${modelName} for ${subject}`);
          return NextResponse.json({ questions });
        }
        throw new Error("Invalid format from Gemini");
      } catch (err) {
        console.warn(`Model ${modelName} failed:`, err);
        lastError = err;
        continue; // Try next model
      }
    }

    // All models failed — use question bank fallback
    throw lastError || new Error("All models failed");

  } catch (error) {
    console.error('All AI attempts failed, using question bank fallback:', error);
    const fallback = QUESTION_BANKS[subject] || QUESTION_BANKS["Python Programming"];
    return NextResponse.json({ questions: fallback });
  }
}
