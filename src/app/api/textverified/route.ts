import { NextRequest, NextResponse } from 'next/server';
import { getTextVerifiedClient } from '@/lib/textverified';

export async function GET() {
  try {
    const client = getTextVerifiedClient();
    const services = await client.getServices();
    
    return NextResponse.json({ success: true, services });
  } catch (error) {
    console.error('Error fetching TextVerified services:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { serviceId } = await request.json();
    
    if (!serviceId) {
      return NextResponse.json(
        { success: false, error: 'Service ID is required' },
        { status: 400 }
      );
    }

    const client = getTextVerifiedClient();
    const verification = await client.createVerification(serviceId);
    
    return NextResponse.json({ success: true, verification });
  } catch (error) {
    console.error('Error creating TextVerified verification:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create verification' },
      { status: 500 }
    );
  }
}

