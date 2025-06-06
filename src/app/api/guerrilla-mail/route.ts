import { NextRequest, NextResponse } from 'next/server';
import { GuerrillaMailClient } from '@/lib/guerrilla-mail';

export async function GET() {
  try {
    const client = new GuerrillaMailClient();
    const result = await client.getEmailAddress();
    
    return NextResponse.json({
      success: true,
      email: result.email,
      sidToken: result.sidToken,
    });
  } catch (error) {
    console.error('Guerrilla Mail API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to generate email address'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const email = String(body.email || '');
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
        { status: 400 }
      );
    }

    const client = new GuerrillaMailClient();
    const result = await client.waitForVerificationEmail(email);
    
    return NextResponse.json({
      success: true,
      verificationLink: result.verificationLink,
      email: result.email,
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to find verification email'
      },
      { status: 500 }
    );
  }
}

