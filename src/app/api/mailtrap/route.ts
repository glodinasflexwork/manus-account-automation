import { NextRequest, NextResponse } from 'next/server';
import { getMailtrapClient } from '@/lib/mailtrap';

export async function GET() {
  try {
    const client = getMailtrapClient();
    const inboxes = await client.getInboxes();
    
    return NextResponse.json({ success: true, inboxes });
  } catch (error) {
    console.error('Error fetching Mailtrap inboxes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inboxes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { inboxId } = await request.json();
    
    if (!inboxId) {
      return NextResponse.json(
        { success: false, error: 'Inbox ID is required' },
        { status: 400 }
      );
    }

    const client = getMailtrapClient();
    const email = client.generateTestEmail(inboxId);
    
    return NextResponse.json({ success: true, email });
  } catch (error) {
    console.error('Error generating email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate email' },
      { status: 500 }
    );
  }
}

