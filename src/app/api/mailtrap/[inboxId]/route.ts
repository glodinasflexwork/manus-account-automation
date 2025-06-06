import { NextRequest, NextResponse } from 'next/server';
import { getMailtrapClient } from '@/lib/mailtrap';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ inboxId: string }> }
) {
  try {
    const { inboxId } = await context.params;
    
    if (!inboxId) {
      return NextResponse.json(
        { success: false, error: 'Inbox ID is required' },
        { status: 400 }
      );
    }

    const client = getMailtrapClient();
    const messages = await client.getMessages(parseInt(inboxId));
    
    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching Mailtrap messages:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ inboxId: string }> }
) {
  try {
    const { inboxId } = await context.params;
    const { email, timeout } = await request.json();
    
    if (!inboxId || !email) {
      return NextResponse.json(
        { success: false, error: 'Inbox ID and email are required' },
        { status: 400 }
      );
    }

    const client = getMailtrapClient();
    const verificationEmail = await client.waitForVerificationEmail(
      parseInt(inboxId),
      email,
      timeout || 60000
    );
    
    // Extract verification link
    const verificationLink = client.extractVerificationLink(
      String(verificationEmail.html_body || verificationEmail.text_body || '')
    );
    
    return NextResponse.json({ 
      success: true, 
      verificationEmail,
      verificationLink 
    });
  } catch (error) {
    console.error('Error waiting for verification email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get verification email' },
      { status: 500 }
    );
  }
}

