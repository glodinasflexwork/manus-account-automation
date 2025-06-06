import { NextRequest, NextResponse } from 'next/server';
import { ManusAutomation } from '@/lib/manus-automation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { email: string; phone?: string };
    const { email, phone } = body;
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const automation = new ManusAutomation();
    await automation.initialize();
    const result = await automation.createManusAccount(email, phone);
    
    // Cleanup browser resources
    await automation.close();
    
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

