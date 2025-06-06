'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Mail, User } from 'lucide-react';

interface AutomationStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  message?: string;
}

interface AccountData {
  fullName: string;
  email: string;
  password: string;
}

export default function Home() {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<AutomationStep[]>([
    { id: 'email', name: 'Generate Email Address', status: 'pending' },
    { id: 'phone', name: 'Get Phone Number', status: 'pending' },
    { id: 'account', name: 'Create Manus Account', status: 'pending' },
    { id: 'verify_email', name: 'Verify Email', status: 'pending' },
    { id: 'verify_phone', name: 'Verify Phone Number', status: 'pending' },
  ]);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStep = (id: string, status: AutomationStep['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, status, message } : step
    ));
  };

  const startAutomation = async () => {
    setIsRunning(true);
    setError(null);
    setAccountData(null);

    try {
      // Step 1: Generate email address
      updateStep('email', 'running', 'Fetching Mailtrap inboxes...');
      
      const inboxesResponse = await fetch('/api/mailtrap');
      const inboxesData = await inboxesResponse.json();
      
      if (!inboxesData.success) {
        throw new Error('Failed to fetch Mailtrap inboxes');
      }

      const firstInbox = inboxesData.inboxes[0];
      if (!firstInbox) {
        throw new Error('No Mailtrap inboxes available');
      }

      const emailResponse = await fetch('/api/mailtrap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inboxId: firstInbox.id }),
      });
      
      const emailData = await emailResponse.json();
      if (!emailData.success) {
        throw new Error('Failed to generate email address');
      }

      updateStep('email', 'completed', `Generated: ${emailData.email}`);

      // Step 2: Get phone number
      updateStep('phone', 'running', 'Fetching TextVerified services...');
      
      const servicesResponse = await fetch('/api/textverified');
      const servicesData = await servicesResponse.json();
      
      let phoneNumber = null;
      let verificationId = null;
      
      if (servicesData.success && servicesData.services.length > 0) {
        // Create a verification for the first available service
        const createVerificationResponse = await fetch('/api/textverified', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceId: servicesData.services[0].id }),
        });
        
        const verificationData = await createVerificationResponse.json();
        
        if (verificationData.success) {
          phoneNumber = verificationData.verification.number;
          verificationId = verificationData.verification.id;
          updateStep('phone', 'completed', `Phone number: ${phoneNumber}`);
        } else {
          updateStep('phone', 'completed', 'Skipped (service unavailable)');
        }
      } else {
        updateStep('phone', 'completed', 'Skipped (no services available)');
      }

      // Step 3: Create Manus account
      updateStep('account', 'running', 'Creating Manus account...');
      
      const accountResponse = await fetch('/api/manus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailData.email }),
      });
      
      const accountResult = await accountResponse.json();
      
      if (!accountResult.success) {
        throw new Error(accountResult.error || 'Failed to create account');
      }

      setAccountData(accountResult.accountData);
      updateStep('account', 'completed', 'Account created successfully');

      // Step 5: Wait for email verification
      updateStep('verify_email', 'running', 'Waiting for verification email...');
      
      const verificationResponse = await fetch(`/api/mailtrap/${firstInbox.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: emailData.email,
          timeout: 120000 // 2 minutes
        }),
      });
      
      const verificationData = await verificationResponse.json();
      
      if (!verificationData.success) {
        throw new Error('Failed to receive verification email');
      }

      if (verificationData.verificationLink) {
        // Complete email verification
        const completeResponse = await fetch('/api/manus', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ verificationLink: verificationData.verificationLink }),
        });
        
        const completeResult = await completeResponse.json();
        
        if (completeResult.success) {
          updateStep('verify_email', 'completed', 'Email verified successfully');
        } else {
          updateStep('verify_email', 'error', 'Failed to complete verification');
        }
      } else {
        updateStep('verify_email', 'error', 'No verification link found in email');
      }

      // Step 5: Verify phone number (if we have one)
      if (phoneNumber && verificationId) {
        updateStep('verify_phone', 'running', 'Waiting for SMS verification...');
        
        // Poll for SMS verification code
        let smsReceived = false;
        const maxAttempts = 12; // 2 minutes with 10-second intervals
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
          
          const checkResponse = await fetch(`/api/textverified/${verificationId}`);
          const checkData = await checkResponse.json();
          
          if (checkData.success && checkData.verification.code) {
            updateStep('verify_phone', 'completed', `SMS code received: ${checkData.verification.code}`);
            smsReceived = true;
            break;
          }
        }
        
        if (!smsReceived) {
          updateStep('verify_phone', 'error', 'SMS verification timeout');
        }
      } else {
        updateStep('verify_phone', 'completed', 'Skipped (no phone number)');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      // Mark current running step as error
      const runningStep = steps.find(step => step.status === 'running');
      if (runningStep) {
        updateStep(runningStep.id, 'error', errorMessage);
      }
    } finally {
      setIsRunning(false);
    }
  };

  const resetAutomation = () => {
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending', message: undefined })));
    setAccountData(null);
    setError(null);
  };

  const getStepIcon = (status: AutomationStep['status']) => {
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
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-gray-900">Manus Account Automation</h1>
          <p className="text-lg text-gray-600">
            Automated account creation using TextVerified and Mailtrap APIs
          </p>
        </div>

        {/* Main Card */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Creation Workflow
            </CardTitle>
            <CardDescription>
              This tool will automatically create a Manus account using the invitation code and verify it via email.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Control Buttons */}
            <div className="flex gap-4">
              <Button 
                onClick={startAutomation} 
                disabled={isRunning}
                className="flex-1"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Automation...
                  </>
                ) : (
                  'Start Account Creation'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={resetAutomation}
                disabled={isRunning}
              >
                Reset
              </Button>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Progress Steps */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Progress</h3>
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  {getStepIcon(step.status)}
                  <div className="flex-1">
                    <div className="font-medium">{step.name}</div>
                    {step.message && (
                      <div className="text-sm text-gray-600">{step.message}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Account Data Display */}
            {accountData && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Created Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Full Name</Label>
                      <Input value={accountData.fullName} readOnly />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <Input value={accountData.email} readOnly />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium">Password</Label>
                      <Input type="password" value={accountData.password} readOnly />
                    </div>
                  </div>
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Account created successfully! Save these credentials in a secure location.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Configuration Card */}
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>
              Current settings for the automation process
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Invitation Code</Label>
                <Input value="QVDRZAYJMTKC" readOnly />
              </div>
              <div>
                <Label className="text-sm font-medium">Manus URL</Label>
                <Input value="https://manus.im" readOnly />
              </div>
            </div>
            <Alert>
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Make sure your TextVerified and Mailtrap API credentials are configured in the environment variables.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

