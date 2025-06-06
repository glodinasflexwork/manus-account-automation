import { NextRequest, NextResponse } from 'next/server';
import { SMSActivateClient } from '@/lib/sms-activate';

export async function GET() {
  try {
    const client = new SMSActivateClient();
    
    // Get account balance first
    const balanceResult = await client.getBalance();
    if (!balanceResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get account balance',
        details: balanceResult.error
      });
    }

    // Get available services
    const servicesResult = await client.getServices();
    if (!servicesResult.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get services',
        details: servicesResult.error
      });
    }

    return NextResponse.json({
      success: true,
      balance: balanceResult.balance,
      services: servicesResult.services
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'SMS-Activate API error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { serviceId?: string };
    const { serviceId = 'manus' } = body;

    const client = new SMSActivateClient();
    const result = await client.getNumber(serviceId);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get phone number',
        details: result.error
      });
    }

    return NextResponse.json({
      success: true,
      verification: {
        id: result.id,
        number: result.number,
        service: serviceId
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to create verification',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

