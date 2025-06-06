import { NextRequest, NextResponse } from 'next/server';
import { getTextVerifiedClient } from '@/lib/textverified';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Verification ID is required' },
        { status: 400 }
      );
    }

    const client = getTextVerifiedClient();
    const verification = await client.checkVerification(id);
    
    return NextResponse.json({ success: true, verification });
  } catch (error) {
    console.error('Error checking TextVerified verification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check verification' },
      { status: 500 }
    );
  }
}

