import { NextRequest, NextResponse } from 'next/server';
import FreeSMSService from '@/lib/free-sms';

const freeSMSService = new FreeSMSService();

export async function GET() {
  try {
    console.log('🔍 API: Getting free phone number...');
    
    const phoneNumber = await freeSMSService.getPhoneNumber();
    
    if (!phoneNumber) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No free phone numbers available from any service',
          services_tried: [
            'receive-sms-online.info',
            'sms-online.co', 
            'freesmsverification.com',
            'receive-sms.cc',
            'sms24.me',
            'receivesmsonline.net'
          ]
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      phoneNumber: phoneNumber.number,
      id: phoneNumber.id,
      service: phoneNumber.service,
      country: phoneNumber.country,
      cost: 'FREE',
      message: `Free phone number obtained from ${phoneNumber.service}`
    });

  } catch (error) {
    console.error('❌ Free SMS API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get free phone number',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, service, action } = body;

    if (!phoneNumber || !service) {
      return NextResponse.json(
        { success: false, error: 'Phone number and service are required' },
        { status: 400 }
      );
    }

    if (action === 'check') {
      console.log(`📨 API: Checking SMS for ${phoneNumber} on ${service}...`);
      
      const smsMessage = await freeSMSService.checkForSMS(phoneNumber, service);
      
      if (smsMessage) {
        return NextResponse.json({
          success: true,
          code: smsMessage.code,
          message: smsMessage.message,
          timestamp: smsMessage.timestamp,
          status: 'SMS_RECEIVED'
        });
      } else {
        return NextResponse.json({
          success: true,
          code: null,
          message: 'No SMS received yet',
          status: 'WAITING'
        });
      }
    }

    if (action === 'wait') {
      console.log(`⏳ API: Waiting for SMS on ${phoneNumber}...`);
      
      const timeoutMinutes = body.timeout || 3;
      const code = await freeSMSService.waitForSMS(phoneNumber, service, timeoutMinutes);
      
      if (code) {
        return NextResponse.json({
          success: true,
          code: code,
          message: `SMS verification code received: ${code}`,
          status: 'SMS_RECEIVED'
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'SMS timeout - no verification code received',
          status: 'TIMEOUT'
        });
      }
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "check" or "wait"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Free SMS POST API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process SMS request',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

