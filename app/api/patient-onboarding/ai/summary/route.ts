import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { messages, sessionId } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Extract user messages from the conversation
    const userMessages = messages
      .filter((msg: any) => msg.type === 'user')
      .map((msg: any) => msg.content)
      .join(' ');

    if (!userMessages.trim()) {
      return NextResponse.json(
        { error: 'No user messages found' },
        { status: 400 }
      );
    }

    // Generate AI summary using OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `You are a medical AI assistant. Analyze the following conversation about a patient's condition and create a comprehensive, professional summary. Focus on:
            
            1. Medical conditions mentioned
            2. Care needs and requirements
            3. Mobility and daily living assistance needs
            4. Any specific concerns or symptoms
            5. Overall care complexity level
            
            Write a clear, concise summary that would help healthcare providers understand the patient's needs. Use professional medical language but keep it accessible.`
          },
          {
            role: 'user',
            content: `Please analyze this conversation and provide a patient summary:\n\n${userMessages}`
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to generate summary' },
        { status: 500 }
      );
    }

    const aiData = await openaiResponse.json();
    const summary = aiData.choices[0]?.message?.content || 'Unable to generate summary';

    return NextResponse.json({
      summary,
      sessionId,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error generating AI summary:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
