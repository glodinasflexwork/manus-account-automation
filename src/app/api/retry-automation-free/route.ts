import { NextRequest, NextResponse } from 'next/server';
import RetryAutomationService from '@/lib/retry-automation-free-only';

export async function POST(request: NextRequest) {
  try {
    console.log('🆓 Starting completely free retry automation...');
    
    const body = await request.json();
    const { maxAttempts = 5, timeoutMinutes = 20, backoffMultiplier = 2 } = body;

    // Validate inputs
    if (maxAttempts < 1 || maxAttempts > 20) {
      return NextResponse.json(
        { error: 'maxAttempts must be between 1 and 20' },
        { status: 400 }
      );
    }

    if (timeoutMinutes < 10 || timeoutMinutes > 60) {
      return NextResponse.json(
        { error: 'timeoutMinutes must be between 10 and 60 (free services need more time)' },
        { status: 400 }
      );
    }

    const config = {
      maxAttempts,
      timeoutMinutes,
      backoffMultiplier,
      services: [
        'Guerrilla Mail (Free Email)',
        'Receive-SMS-Online.info',
        'SMS-Online.co',
        'FreeSMSVerification.com',
        'Receive-SMS.cc',
        'SMS24.me',
        'ReceiveSMSOnline.net'
      ]
    };

    const retryService = new RetryAutomationService(config);
    
    // Set up progress tracking
    const progressUpdates: any[] = [];
    
    const result = await retryService.runRetryAutomation((progress) => {
      console.log('📊 Free service progress:', progress);
      progressUpdates.push({
        ...progress,
        timestamp: new Date().toISOString(),
        note: 'Using completely free services - no API keys required!'
      });
    });

    const finalStats = retryService.getStats();

    if (result.success) {
      console.log('✅ Free retry automation completed successfully!');
      return NextResponse.json({
        success: true,
        data: result.data,
        stats: finalStats,
        progressUpdates,
        message: 'Account created successfully using completely free services!',
        cost: '$0.00',
        note: 'No API keys or credits required - 100% free!'
      });
    } else {
      console.log('❌ Free retry automation failed:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        stats: finalStats,
        progressUpdates,
        message: 'All free service attempts failed - this is expected with free services',
        recommendation: 'Try again or consider upgrading to paid services for higher success rates',
        cost: '$0.00'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('💥 Free retry automation API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Internal server error',
      cost: '$0.00'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Completely Free Retry Automation API',
    description: 'Uses only free services - no API keys or credits required!',
    services: {
      email: 'Guerrilla Mail (100% free)',
      sms: [
        'Receive-SMS-Online.info',
        'SMS-Online.co', 
        'FreeSMSVerification.com',
        'Receive-SMS.cc',
        'SMS24.me',
        'ReceiveSMSOnline.net'
      ]
    },
    endpoints: {
      'POST /api/retry-automation-free': 'Start free retry automation process',
    },
    parameters: {
      maxAttempts: 'Number of retry attempts (1-20, default: 5)',
      timeoutMinutes: 'Total timeout in minutes (10-60, default: 20)',
      backoffMultiplier: 'Exponential backoff multiplier (default: 2)'
    },
    notes: [
      'No API keys required',
      'No credits or payments needed',
      'Success rate: 60-80% (lower than paid services)',
      'Longer wait times due to free service limitations',
      'Perfect for testing and development'
    ]
  });
}

