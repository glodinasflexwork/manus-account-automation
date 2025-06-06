'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Mail, User } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
}

interface AccountData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export default function Home() {
  const [steps, setSteps] = useState<Step[]>([
    { id: 'email', title: 'Generate Email Address', status: 'pending' },
    { id: 'phone', title: 'Get Phone Number', status: 'pending' },
    { id: 'account', title: 'Create Manus Account', status: 'pending' },
    { id: 'verify_email', title: 'Verify Email', status: 'pending' },
    { id: 'verify_phone', title: 'Verify Phone Number', status: 'pending' },
  ]);

  const [isRunning, setIsRunning] = useState(false);
  const [useRetryMode, setUseRetryMode] = useState(true);
  const [retryConfig, setRetryConfig] = useState({
    maxRetries: 5,
    timeoutMinutes: 15
  });
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryStats, setRetryStats] = useState<Record<string, unknown> | null>(null);

  const updateStep = (stepId: string, status: Step['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, message } : step
    ));
  };

  const runAutomation = async () => {
    setIsRunning(true);
    setError(null);
    setAccountData(null);
    setRetryStats(null);

    try {
      if (useRetryMode) {
        // Use intelligent retry automation
        updateStep('email', 'running', 'Starting intelligent retry automation...');
        updateStep('phone', 'running', 'Will generate multiple combinations as needed...');
        updateStep('account', 'running', 'Will retry until successful or timeout...');
        updateStep('verify_email', 'pending', 'Will verify after account creation...');
        updateStep('verify_phone', 'pending', 'Will verify after account creation...');

        console.log('🚀 Starting retry automation mode');
        
        const retryResponse = await fetch('/api/retry-automation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            maxRetries: retryConfig.maxRetries,
            timeoutMinutes: retryConfig.timeoutMinutes,
            initialDelay: 30000, // 30 seconds
            maxDelay: 180000, // 3 minutes max
            backoffMultiplier: 1.3
          }),
        });

        const retryResult = await retryResponse.json();
        
        if (retryResult.success) {
          // Update steps with success
          updateStep('email', 'completed', `Email: ${retryResult.credentials.email}`);
          updateStep('phone', 'completed', 
            retryResult.credentials.phoneNumber 
              ? `Phone: ${retryResult.credentials.phoneNumber} (via ${retryResult.credentials.phoneService})`
              : 'Skipped (no phone available)'
          );
          updateStep('account', 'completed', 
            `Account created successfully after ${retryResult.stats.totalAttempts} attempts in ${retryResult.stats.totalTimeSeconds}s`
          );

          setAccountData(retryResult.accountData);
          setRetryStats(retryResult.stats);

          // Continue with email verification
          if (retryResult.credentials.email) {
            updateStep('verify_email', 'running', 'Verifying email...');
            
            try {
              const verifyEmailResponse = await fetch('/api/guerrilla-mail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: retryResult.credentials.email }),
              });
              
              const verifyEmailResult = await verifyEmailResponse.json();
              
              if (verifyEmailResult.success && verifyEmailResult.verificationLink) {
                updateStep('verify_email', 'completed', 'Email verified successfully');
              } else {
                updateStep('verify_email', 'error', 'Email verification failed');
              }
            } catch (emailError) {
              updateStep('verify_email', 'error', 'Email verification error');
            }
          }

          // Continue with phone verification if available
          if (retryResult.credentials.phoneNumber && retryResult.credentials.phoneService) {
            updateStep('verify_phone', 'running', 'Verifying phone...');
            
            try {
              if (retryResult.credentials.phoneService === 'sms-activate') {
                // Handle SMS-Activate verification
                updateStep('verify_phone', 'completed', 'Phone verification handled by retry system');
              } else {
                // Handle free SMS service verification
                const waitResponse = await fetch('/api/free-sms', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    phoneNumber: retryResult.credentials.phoneNumber,
                    service: retryResult.credentials.phoneService,
                    action: 'wait',
                    timeout: 2
                  }),
                });
                
                const waitData = await waitResponse.json();
                
                if (waitData.success && waitData.code) {
                  updateStep('verify_phone', 'completed', `SMS code received: ${waitData.code}`);
                } else {
                  updateStep('verify_phone', 'error', 'SMS verification timeout');
                }
              }
            } catch (phoneError) {
              updateStep('verify_phone', 'error', 'Phone verification error');
            }
          } else {
            updateStep('verify_phone', 'completed', 'Skipped (no phone number)');
          }

        } else {
          throw new Error(retryResult.error || 'Retry automation failed');
        }

      } else {
        // Use original single-attempt automation
        await runSingleAttemptAutomation();
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Automation error:', err);
      
      // Mark remaining steps as error
      setSteps(prev => prev.map(step => 
        step.status === 'running' || step.status === 'pending' 
          ? { ...step, status: 'error', message: 'Stopped due to error' }
          : step
      ));
    } finally {
      setIsRunning(false);
    }
  };

  const runSingleAttemptAutomation = async () => {
      // Step 1: Generate email address using Guerrilla Mail
      updateStep('email', 'running', 'Generating free temporary email address...');
      
      const emailResponse = await fetch('/api/guerrilla-mail');
      const emailData = await emailResponse.json();
      
      if (!emailData.success) {
        throw new Error('Failed to generate email address');
      }

      const generatedEmail = emailData.email;
      updateStep('email', 'completed', `Email: ${generatedEmail}`);

      // Step 2: Get phone number using multiple free SMS services
      updateStep('phone', 'running', 'Getting free phone number from multiple services...');
      
      let phoneNumber = null;
      let verificationId = null;
      let smsService = null;
      
      // Try free SMS services first
      try {
        const freeSMSResponse = await fetch('/api/free-sms');
        const freeSMSData = await freeSMSResponse.json();
        
        if (freeSMSData.success) {
          phoneNumber = freeSMSData.phoneNumber;
          verificationId = freeSMSData.id;
          smsService = freeSMSData.service;
          updateStep('phone', 'completed', `Free phone number: ${phoneNumber} (via ${smsService})`);
        } else {
          console.log('Free SMS services failed, trying SMS-Activate...');
          
          // Fallback to SMS-Activate if available
          const servicesResponse = await fetch('/api/sms-activate');
          const servicesData = await servicesResponse.json();
          
          if (servicesData.success) {
            const createVerificationResponse = await fetch('/api/sms-activate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ serviceId: 'manus' }),
            });
            
            const verificationData = await createVerificationResponse.json();
            
            if (verificationData.success) {
              phoneNumber = verificationData.verification.number;
              verificationId = verificationData.verification.id;
              smsService = 'sms-activate';
              updateStep('phone', 'completed', `Phone number: ${phoneNumber} (via SMS-Activate)`);
            } else {
              updateStep('phone', 'completed', 'Skipped (all services unavailable)');
            }
          } else {
            updateStep('phone', 'completed', 'Skipped (all services unavailable)');
          }
        }
      } catch (error) {
        console.error('Phone number error:', error);
        updateStep('phone', 'completed', 'Skipped (service error)');
      }

      // Step 3: Create Manus account
      updateStep('account', 'running', 'Creating Manus account...');
      
      const accountResponse = await fetch('/api/manus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: generatedEmail, phone: phoneNumber }),
      });
      
      const accountResult = await accountResponse.json();
      
      if (!accountResult.success) {
        throw new Error(accountResult.error || 'Failed to create Manus account');
      }

      setAccountData(accountResult.accountData);
      updateStep('account', 'completed', 'Account created successfully');

      // Step 4: Wait for email verification using Guerrilla Mail
      updateStep('verify_email', 'running', 'Waiting for verification email...');
      
      const verifyEmailResponse = await fetch('/api/guerrilla-mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: generatedEmail }),
      });
      
      const verifyEmailResult = await verifyEmailResponse.json();
      
      if (verifyEmailResult.success && verifyEmailResult.verificationLink) {
        updateStep('verify_email', 'completed', 'Email verified successfully');
      } else {
        updateStep('verify_email', 'error', 'No verification link found in email');
      }

      // Step 5: Verify phone number (if we have one)
      if (phoneNumber && verificationId && smsService) {
        updateStep('verify_phone', 'running', `Waiting for free SMS verification via ${smsService}...`);
        
        let smsReceived = false;
        
        if (smsService === 'sms-activate') {
          // Use SMS-Activate API for verification
          const maxAttempts = 12; // 2 minutes with 10-second intervals
          
          for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            
            const checkResponse = await fetch(`/api/sms-activate/${verificationId}`);
            const checkData = await checkResponse.json();
            
            if (checkData.success && checkData.verification.code) {
              updateStep('verify_phone', 'completed', `SMS code received: ${checkData.verification.code} (via ${smsService})`);
              smsReceived = true;
              
              // Confirm SMS received
              await fetch(`/api/sms-activate/${verificationId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: '6' }),
              });
              break;
            }
          }
        } else {
          // Use free SMS services for verification
          try {
            const waitResponse = await fetch('/api/free-sms', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                phoneNumber: phoneNumber,
                service: smsService,
                action: 'wait',
                timeout: 3 // 3 minutes timeout
              }),
            });
            
            const waitData = await waitResponse.json();
            
            if (waitData.success && waitData.code) {
              updateStep('verify_phone', 'completed', `Free SMS code received: ${waitData.code} (via ${smsService})`);
              smsReceived = true;
            } else {
              updateStep('verify_phone', 'error', `SMS timeout via ${smsService}`);
            }
          } catch (error) {
            console.error('Free SMS verification error:', error);
            updateStep('verify_phone', 'error', `SMS verification failed via ${smsService}`);
          }
        }
        
        if (!smsReceived && smsService === 'sms-activate') {
          updateStep('verify_phone', 'error', 'SMS verification timeout');
        }
      } else {
        updateStep('verify_phone', 'completed', 'Skipped (no phone number available)');
      }
  };

  const resetAutomation = () => {
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending', message: undefined })));
    setAccountData(null);
    setError(null);
    setRetryStats(null);
  };

  const getStepIcon = (status: Step['status']) => {
    switch (status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Manus Account Automation
          </h1>
          <p className="text-lg text-gray-600">
            Automated account creation with free email and SMS services
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Configuration
            </CardTitle>
            <CardDescription>
              Manus Invitation Code: <code className="bg-gray-100 px-2 py-1 rounded">QVDRZAYJMTKC</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Retry Mode Toggle */}
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <label className="flex items-center gap-2 font-medium text-blue-900">
                    <input
                      type="checkbox"
                      checked={useRetryMode}
                      onChange={(e) => setUseRetryMode(e.target.checked)}
                      disabled={isRunning}
                      className="rounded"
                    />
                    Smart Retry Mode (Recommended)
                  </label>
                  <p className="text-sm text-blue-700 mt-1">
                    Automatically retries with new email/phone combinations if Manus rejects them
                  </p>
                </div>
              </div>

              {/* Retry Configuration */}
              {useRetryMode && (
                <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Max Attempts
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={retryConfig.maxRetries}
                      onChange={(e) => setRetryConfig(prev => ({ ...prev, maxRetries: parseInt(e.target.value) || 5 }))}
                      disabled={isRunning}
                      className="w-full px-3 py-1 border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Timeout (minutes)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="60"
                      value={retryConfig.timeoutMinutes}
                      onChange={(e) => setRetryConfig(prev => ({ ...prev, timeoutMinutes: parseInt(e.target.value) || 15 }))}
                      disabled={isRunning}
                      className="w-full px-3 py-1 border rounded text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4">
                <Button 
                  onClick={runAutomation} 
                  disabled={isRunning}
                  className="flex-1"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {useRetryMode ? 'Running Smart Retry...' : 'Running Automation...'}
                    </>
                  ) : (
                    useRetryMode ? 'Start Smart Retry Automation' : 'Start Single Attempt'
                  )}
                </Button>
                <Button 
                  onClick={resetAutomation} 
                  variant="outline"
                  disabled={isRunning}
                >
                  Reset
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automation Progress</CardTitle>
            <CardDescription>
              Complete workflow using multiple free services (Guerrilla Mail + 6 Free SMS Services + SMS-Activate backup)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getStepIcon(step.status)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{index + 1}. {step.title}</span>
                      {step.status === 'completed' && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          Complete
                        </span>
                      )}
                      {step.status === 'error' && (
                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                          Error
                        </span>
                      )}
                    </div>
                    {step.message && (
                      <p className="text-sm text-gray-600 mt-1">{step.message}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {accountData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Account Created Successfully
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">{accountData.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Password</label>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">{accountData.password}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Full Name</label>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">{accountData.fullName}</p>
                </div>
                {accountData.phone && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone</label>
                    <p className="font-mono text-sm bg-gray-100 p-2 rounded">{accountData.phone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {retryStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
                Retry Automation Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{String(retryStats.totalAttempts || 0)}</div>
                  <div className="text-sm text-gray-500">Total Attempts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{String(retryStats.successfulAttempts || 0)}</div>
                  <div className="text-sm text-gray-500">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{String(retryStats.failedAttempts || 0)}</div>
                  <div className="text-sm text-gray-500">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{String(retryStats.totalTimeSeconds || 0)}s</div>
                  <div className="text-sm text-gray-500">Total Time</div>
                </div>
              </div>
              
              {retryStats.rejectionReasons && typeof retryStats.rejectionReasons === 'object' && Object.keys(retryStats.rejectionReasons).length > 0 ? (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Common Rejection Reasons:</h4>
                  <div className="space-y-1">
                    {Object.entries(retryStats.rejectionReasons as Record<string, number>).map(([reason, count]) => (
                      <div key={reason} className="flex justify-between text-sm">
                        <span className="text-gray-600 truncate">{reason}</span>
                        <span className="text-gray-800 font-medium">{count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

