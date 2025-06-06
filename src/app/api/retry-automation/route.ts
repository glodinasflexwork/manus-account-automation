import { NextRequest, NextResponse } from 'next/server';
import RetryAutomationService from '@/lib/retry-automation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      maxRetries = 10, 
      initialDelay = 30000, 
      maxDelay = 300000, 
      backoffMultiplier = 1.5, 
      timeoutMinutes = 30 
    } = body;

    console.log('🚀 Starting retry automation with config:', {
      maxRetries,
      initialDelay,
      maxDelay,
      backoffMultiplier,
      timeoutMinutes
    });

    const retryService = new RetryAutomationService({
      maxRetries,
      initialDelay,
      maxDelay,
      backoffMultiplier,
      timeoutMinutes
    });

    const result = await retryService.runWithRetry();
    const stats = retryService.getStats();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Account created successfully with retry automation',
        accountData: result.finalData?.accountData,
        credentials: {
          email: result.finalData?.email,
          phoneNumber: result.finalData?.phoneNumber,
          phoneService: result.finalData?.phoneService
        },
        attempts: result.attempts,
        stats: {
          totalAttempts: stats.totalAttempts,
          successfulAttempts: stats.successfulAttempts,
          failedAttempts: stats.failedAttempts,
          totalTimeSeconds: Math.round(result.totalTime / 1000),
          averageDelaySeconds: Math.round(stats.averageDelayMs / 1000),
          rejectionReasons: stats.rejectionReasons
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'All retry attempts failed',
        attempts: result.attempts,
        stats: {
          totalAttempts: stats.totalAttempts,
          successfulAttempts: stats.successfulAttempts,
          failedAttempts: stats.failedAttempts,
          totalTimeSeconds: Math.round(result.totalTime / 1000),
          averageDelaySeconds: Math.round(stats.averageDelayMs / 1000),
          rejectionReasons: stats.rejectionReasons
        },
        recommendations: [
          'Consider using paid SMS services (TextVerified, SMS-Activate with credits)',
          'Try different email services (ProtonMail, Gmail with aliases)',
          'Check if Manus has updated their anti-automation measures',
          'Verify the invitation code is still valid',
          'Consider manual account creation for testing'
        ]
      }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ Retry automation API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Retry automation service failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'Retry Automation API',
    description: 'Automated Manus account creation with intelligent retry logic',
    features: [
      'Automatic email/phone regeneration on rejection',
      'Exponential backoff with jitter',
      'Configurable retry limits and timeouts', 
      'Detailed attempt logging and statistics',
      'Smart rejection pattern detection',
      'Multiple free service integration'
    ],
    defaultConfig: {
      maxRetries: 10,
      initialDelay: 30000,
      maxDelay: 300000,
      backoffMultiplier: 1.5,
      timeoutMinutes: 30
    },
    usage: {
      endpoint: 'POST /api/retry-automation',
      parameters: {
        maxRetries: 'Maximum number of attempts (default: 10)',
        initialDelay: 'Initial delay in ms (default: 30000)',
        maxDelay: 'Maximum delay in ms (default: 300000)',
        backoffMultiplier: 'Delay multiplier (default: 1.5)',
        timeoutMinutes: 'Total timeout in minutes (default: 30)'
      }
    }
  });
}

