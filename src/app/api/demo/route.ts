import { NextRequest, NextResponse } from 'next/server';

// Demo mode for testing without real API calls
export async function POST(request: NextRequest) {
  try {
    const { mode } = await request.json();
    
    if (mode === 'demo') {
      // Simulate the complete automation workflow with correct order
      return NextResponse.json({
        success: true,
        demo: true,
        steps: [
          {
            id: 'email',
            name: 'Generate Email Address',
            status: 'completed',
            message: 'Generated: demo-test@mailtrap.io',
            data: { email: 'demo-test@mailtrap.io' }
          },
          {
            id: 'phone',
            name: 'Get Phone Number',
            status: 'completed',
            message: 'Phone number: +1234567890',
            data: { phone: '+1234567890', verificationId: 'demo-123' }
          },
          {
            id: 'account',
            name: 'Create Manus Account',
            status: 'completed',
            message: 'Account created successfully',
            data: {
              fullName: 'Demo User',
              email: 'demo-test@mailtrap.io',
              password: 'DemoPass123!'
            }
          },
          {
            id: 'verify_email',
            name: 'Verify Email',
            status: 'completed',
            message: 'Email verified successfully',
            data: { verified: true }
          },
          {
            id: 'verify_phone',
            name: 'Verify Phone Number',
            status: 'completed',
            message: 'SMS code received: 123456',
            data: { smsCode: '123456' }
          }
        ]
      });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid mode specified'
    });
  } catch (error) {
    console.error('Error in demo automation:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Demo automation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

