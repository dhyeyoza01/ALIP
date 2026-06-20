import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey && apiKey !== 'your_api_key_here' ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, language } = body as { code: string; language: string };

    if (!code || !code.trim()) {
      return NextResponse.json({ output: 'No code to run.', hasError: true, errorMessage: 'Empty code' });
    }

    if (!genAI) {
      return NextResponse.json({
        output: '# AI Code Runner is not configured.\n# Add GEMINI_API_KEY to .env.local to enable.',
        hasError: false,
        errorMessage: ''
      });
    }

    const modelNames = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `You are a code execution engine. Analyze the following ${language || 'python'} code and predict its exact output.

RULES:
- If the code would run successfully, return the exact console output the code would produce
- If the code has syntax errors or runtime errors, return the error message that would appear
- Return ONLY a JSON object with NO markdown formatting, NO backticks
- The JSON must have this exact structure: {"output":"the exact output","hasError":false,"errorMessage":""}
- If there is an error: {"output":"","hasError":true,"errorMessage":"Error: description of the error"}
- For print statements, show each print on a new line
- Be precise with the output — match exactly what a real interpreter would show

CODE:
\`\`\`${language || 'python'}
${code}
\`\`\``;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        
        // Clean markdown wrapping
        if (text.startsWith('```json')) text = text.slice(7);
        if (text.startsWith('```')) text = text.slice(3);
        if (text.endsWith('```')) text = text.slice(0, -3);
        text = text.trim();

        const parsed = JSON.parse(text);
        return NextResponse.json(parsed);
      } catch (err) {
        console.warn(`Sandbox model ${modelName} failed:`, err);
        continue;
      }
    }

    throw new Error('All models failed');
  } catch (error) {
    console.error('Sandbox API error:', error);
    return NextResponse.json({
      output: '# AI execution engine temporarily unavailable.\n# Please try again.',
      hasError: false,
      errorMessage: ''
    });
  }
}
