import { NextRequest, NextResponse } from 'next/server';
import FreeSMSService from '@/lib/free-sms';

const freeSMSService = new FreeSMSService();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    console.log(`📨 API: Checking SMS status for ID: ${id}`);

    // Extract phone number and service from ID
    const [service, phoneNumber] = id.split('_');
    
    if (!service || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Invalid SMS ID format' },
        { status: 400 }
      );
    }

    // Map service prefixes to full service names
    const serviceMap: Record<string, string> = {
      'rsmo': 'receive-sms-online.info',
      'smo': 'sms-online.co',
      'fsv': 'freesmsverification.com',
      'rscc': 'receive-sms.cc',
      'sms24': 'sms24.me',
      'rsmon': 'receivesmsonline.net'
    };

    const fullServiceName = serviceMap[service];
    if (!fullServiceName) {
      return NextResponse.json(
        { success: false, error: 'Unknown SMS service' },
        { status: 400 }
      );
    }

    // Reconstruct phone number (assuming US format)
    const formattedPhone = `+1${phoneNumber}`;
    
    const smsMessage = await freeSMSService.checkForSMS(formattedPhone, fullServiceName);
    
    if (smsMessage) {
      return NextResponse.json({
        success: true,
        id: id,
        phoneNumber: formattedPhone,
        service: fullServiceName,
        code: smsMessage.code,
        message: smsMessage.message,
        timestamp: smsMessage.timestamp,
        status: 'SMS_RECEIVED',
        cost: 'FREE'
      });
    } else {
      return NextResponse.json({
        success: true,
        id: id,
        phoneNumber: formattedPhone,
        service: fullServiceName,
        code: null,
        message: 'No SMS received yet',
        status: 'WAITING',
        cost: 'FREE'
      });
    }

  } catch (error) {
    console.error('❌ Free SMS ID API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check SMS status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { action } = body;

    console.log(`🔄 API: Processing action "${action}" for SMS ID: ${id}`);

    // Extract phone number and service from ID
    const [service, phoneNumber] = id.split('_');
    
    if (!service || !phoneNumber) {
      return NextResponse.json(
        { success: false, error: 'Invalid SMS ID format' },
        { status: 400 }
      );
    }

    // Map service prefixes to full service names
    const serviceMap: Record<string, string> = {
      'rsmo': 'receive-sms-online.info',
      'smo': 'sms-online.co',
      'fsv': 'freesmsverification.com',
      'rscc': 'receive-sms.cc',
      'sms24': 'sms24.me',
      'rsmon': 'receivesmsonline.net'
    };

    const fullServiceName = serviceMap[service];
    if (!fullServiceName) {
      return NextResponse.json(
        { success: false, error: 'Unknown SMS service' },
        { status: 400 }
      );
    }

    const formattedPhone = `+1${phoneNumber}`;

    if (action === 'wait') {
      console.log(`⏳ API: Starting SMS wait for ${formattedPhone}...`);
      
      const timeoutMinutes = body.timeout || 3;
      const code = await freeSMSService.waitForSMS(formattedPhone, fullServiceName, timeoutMinutes);
      
      if (code) {
        return NextResponse.json({
          success: true,
          id: id,
          phoneNumber: formattedPhone,
          service: fullServiceName,
          code: code,
          message: `SMS verification code received: ${code}`,
          status: 'SMS_RECEIVED',
          cost: 'FREE'
        });
      } else {
        return NextResponse.json({
          success: false,
          id: id,
          phoneNumber: formattedPhone,
          service: fullServiceName,
          error: 'SMS timeout - no verification code received',
          status: 'TIMEOUT',
          cost: 'FREE'
        });
      }
    }

    if (action === 'cancel') {
      console.log(`❌ API: Cancelling SMS wait for ${formattedPhone}...`);
      
      return NextResponse.json({
        success: true,
        id: id,
        phoneNumber: formattedPhone,
        service: fullServiceName,
        message: 'SMS request cancelled',
        status: 'CANCELLED',
        cost: 'FREE'
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "wait" or "cancel"' },
      { status: 400 }
    );

  } catch (error) {
    console.error('❌ Free SMS ID POST API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process SMS action',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

