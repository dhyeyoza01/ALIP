import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey && apiKey !== 'your_api_key_here' ? new GoogleGenerativeAI(apiKey) : null;

interface RoadmapStep {
  title: string;
  description: string;
  status: 'completed' | 'current' | 'locked';
  estimatedTime: string;
}

function getFallbackRoadmap(subject: string, score: number): RoadmapStep[] {
  const steps: RoadmapStep[] = [
    { title: `${subject} Fundamentals`, description: `Master the core concepts and foundations of ${subject}.`, status: 'locked', estimatedTime: '3 hours' },
    { title: 'Core Principles', description: 'Dive deeper into the key principles and methodologies.', status: 'locked', estimatedTime: '4 hours' },
    { title: 'Applied Practice', description: 'Solve problems and apply concepts to real-world scenarios.', status: 'locked', estimatedTime: '5 hours' },
    { title: 'Advanced Topics', description: 'Explore advanced concepts and edge cases.', status: 'locked', estimatedTime: '4 hours' },
    { title: 'Mastery & Review', description: 'Comprehensive review and mastery assessment.', status: 'locked', estimatedTime: '3 hours' },
  ];

  if (score >= 4) {
    steps[0].status = 'completed';
    steps[1].status = 'completed';
    steps[2].status = 'current';
  } else if (score >= 2) {
    steps[0].status = 'completed';
    steps[1].status = 'current';
  } else {
    steps[0].status = 'current';
  }

  return steps;
}

export async function POST(request: Request) {
  let subject = 'General';
  let score = 0;

  try {
    const body = await request.json();
    subject = body.subject || 'General';
    score = body.score || 0;
    const weakTopics: string[] = body.weakTopics || [];

    if (!genAI) {
      return NextResponse.json({ roadmap: getFallbackRoadmap(subject, score) });
    }

    const modelNames = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `Generate a personalized 5-step learning roadmap for a student studying "${subject}".
Their diagnostic quiz score was ${score}/5.
${weakTopics.length > 0 ? `They struggled with these concepts: ${weakTopics.join(', ')}` : ''}

Based on their score:
- If score is 4-5: Steps 1-2 should be "completed", step 3 should be "current", steps 4-5 should be "locked"
- If score is 2-3: Step 1 should be "completed", step 2 should be "current", steps 3-5 should be "locked"  
- If score is 0-1: Step 1 should be "current", steps 2-5 should be "locked"

Return ONLY a JSON array of exactly 5 objects. No markdown, no backticks, just raw JSON.
Each object must have:
{"title":"Step name","description":"What the student will learn (1-2 sentences)","status":"completed|current|locked","estimatedTime":"X hours"}

Make the steps specific to ${subject}, not generic. Reference actual topics within the subject.`;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();

        if (text.startsWith('```json')) text = text.slice(7);
        if (text.startsWith('```')) text = text.slice(3);
        if (text.endsWith('```')) text = text.slice(0, -3);
        text = text.trim();

        const roadmap = JSON.parse(text);

        if (Array.isArray(roadmap) && roadmap.length === 5) {
          return NextResponse.json({ roadmap });
        }
        throw new Error('Invalid roadmap format');
      } catch (err) {
        console.warn(`Roadmap model ${modelName} failed:`, err);
        continue;
      }
    }

    throw new Error('All models failed');
  } catch (error) {
    console.error('Roadmap API error:', error);
    return NextResponse.json({ roadmap: getFallbackRoadmap(subject, score) });
  }
}
