import { NextRequest, NextResponse } from 'next/server';
import { ManusAutomation } from '@/lib/manus-automation';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const automation = new ManusAutomation();
    const result = await automation.createAccount(email);
    
    // Cleanup browser resources
    await automation.cleanup();
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating Manus account:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create account',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { verificationLink } = await request.json();
    
    if (!verificationLink) {
      return NextResponse.json(
        { success: false, error: 'Verification link is required' },
        { status: 400 }
      );
    }

    const automation = new ManusAutomation();
    await automation.initialize();
    await automation.completeEmailVerification(verificationLink);
    await automation.cleanup();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Email verification completed' 
    });
  } catch (error) {
    console.error('Error completing email verification:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to complete email verification',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

