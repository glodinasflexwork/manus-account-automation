import { NextRequest, NextResponse } from 'next/server';
import RetryAutomationService from '@/lib/retry-automation-fixed';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting retry automation...');
    
    const body = await request.json();
    const { maxAttempts = 5, timeoutMinutes = 15, backoffMultiplier = 2 } = body;

    // Validate inputs
    if (maxAttempts < 1 || maxAttempts > 20) {
      return NextResponse.json(
        { error: 'maxAttempts must be between 1 and 20' },
        { status: 400 }
      );
    }

    if (timeoutMinutes < 5 || timeoutMinutes > 60) {
      return NextResponse.json(
        { error: 'timeoutMinutes must be between 5 and 60' },
        { status: 400 }
      );
    }

    const config = {
      maxAttempts,
      timeoutMinutes,
      backoffMultiplier,
      services: [
        'SMS-Activate',
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
      console.log('📊 Progress update:', progress);
      progressUpdates.push({
        ...progress,
        timestamp: new Date().toISOString()
      });
    });

    const finalStats = retryService.getStats();

    if (result.success) {
      console.log('✅ Retry automation completed successfully!');
      return NextResponse.json({
        success: true,
        data: result.data,
        stats: finalStats,
        progressUpdates,
        message: 'Account created successfully!'
      });
    } else {
      console.log('❌ Retry automation failed:', result.error);
      return NextResponse.json({
        success: false,
        error: result.error,
        stats: finalStats,
        progressUpdates,
        message: 'All retry attempts failed'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('💥 Retry automation API error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Retry Automation API',
    endpoints: {
      'POST /api/retry-automation': 'Start retry automation process',
    },
    parameters: {
      maxAttempts: 'Number of retry attempts (1-20, default: 5)',
      timeoutMinutes: 'Total timeout in minutes (5-60, default: 15)',
      backoffMultiplier: 'Exponential backoff multiplier (default: 2)'
    }
  });
}

