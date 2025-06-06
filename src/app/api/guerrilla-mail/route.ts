import { NextRequest, NextResponse } from 'next/server';
import { getGuerrillaMailClient } from '@/lib/guerrilla-mail';

export async function GET() {
  try {
    const client = getGuerrillaMailClient();
    const emailData = await client.getEmailAddress();
    
    return NextResponse.json({ 
      success: true, 
      email: emailData.email,
      token: emailData.token,
      service: 'guerrilla-mail'
    });
  } catch (error) {
    console.error('Error generating Guerrilla Mail email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate temporary email' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, token, emailId } = await request.json();
    const client = getGuerrillaMailClient();
    
    if (action === 'check_emails') {
      // Set the token for this client instance
      (client as any).token = token;
      const emails = await client.getEmails();
      
      return NextResponse.json({ 
        success: true, 
        emails,
        count: emails.length 
      });
    }
    
    if (action === 'get_email_content' && emailId) {
      (client as any).token = token;
      const emailContent = await client.getEmailContent(emailId);
      
      return NextResponse.json({ 
        success: true, 
        email: emailContent 
      });
    }
    
    if (action === 'wait_for_verification') {
      (client as any).token = token;
      const verificationEmail = await client.waitForVerificationEmail('', 120000);
      const verificationLink = client.extractVerificationLink(
        verificationEmail.mail_body || verificationEmail.mail_excerpt || ''
      );
      
      return NextResponse.json({ 
        success: true, 
        email: verificationEmail,
        verificationLink 
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action specified' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in Guerrilla Mail operation:', error);
    return NextResponse.json(
      { success: false, error: 'Guerrilla Mail operation failed' },
      { status: 500 }
    );
  }
}

