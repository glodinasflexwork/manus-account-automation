import { NextRequest, NextResponse } from 'next/server';
import { SMSActivateClient } from '@/lib/sms-activate';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const client = new SMSActivateClient();
    const result = await client.getSMS(id);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to check SMS',
        details: result.error
      });
    }

    return NextResponse.json({
      success: true,
      verification: {
        id: id,
        code: result.code,
        status: result.status
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check verification',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json() as { status?: string };
    const { status = '6' } = body;

    const client = new SMSActivateClient();
    const result = await client.setStatus(id, status);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: 'Failed to set status',
        details: result.error
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to update status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

