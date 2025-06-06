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
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStep = (stepId: string, status: Step['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status, message } : step
    ));
  };

  const runAutomation = async () => {
    setIsRunning(true);
    setError(null);
    setAccountData(null);

    try {
      // Step 1: Generate email address using Guerrilla Mail
      updateStep('email', 'running', 'Generating free temporary email address...');
      
      const emailResponse = await fetch('/api/guerrilla-mail');
      const emailData = await emailResponse.json();
      
      if (!emailData.success) {
        throw new Error('Failed to generate email address');
      }

      const generatedEmail = emailData.email;
      updateStep('email', 'completed', `Email: ${generatedEmail}`);

      // Step 2: Get phone number using free SMS-Activate
      updateStep('phone', 'running', 'Getting free phone number via SMS-Activate...');
      
      const servicesResponse = await fetch('/api/sms-activate');
      const servicesData = await servicesResponse.json();
      
      let phoneNumber = null;
      let verificationId = null;
      
      if (servicesData.success) {
        // Create a verification for Manus service
        const createVerificationResponse = await fetch('/api/sms-activate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ serviceId: 'manus' }),
        });
        
        const verificationData = await createVerificationResponse.json();
        
        if (verificationData.success) {
          phoneNumber = verificationData.verification.number;
          verificationId = verificationData.verification.id;
          updateStep('phone', 'completed', `Free phone number: ${phoneNumber}`);
        } else {
          updateStep('phone', 'completed', 'Skipped (free service unavailable)');
        }
      } else {
        updateStep('phone', 'completed', 'Skipped (no free services available)');
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
      if (phoneNumber && verificationId) {
        updateStep('verify_phone', 'running', 'Waiting for free SMS verification...');
        
        // Poll for SMS verification code
        let smsReceived = false;
        const maxAttempts = 12; // 2 minutes with 10-second intervals
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
          
          const checkResponse = await fetch(`/api/sms-activate/${verificationId}`);
          const checkData = await checkResponse.json();
          
          if (checkData.success && checkData.verification.code) {
            updateStep('verify_phone', 'completed', `Free SMS code received: ${checkData.verification.code}`);
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
        
        if (!smsReceived) {
          updateStep('verify_phone', 'error', 'Free SMS verification timeout');
        }
      } else {
        updateStep('verify_phone', 'completed', 'Skipped (no phone number)');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Automation error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const resetAutomation = () => {
    setSteps(prev => prev.map(step => ({ ...step, status: 'pending', message: undefined })));
    setAccountData(null);
    setError(null);
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
            <div className="flex gap-4">
              <Button 
                onClick={runAutomation} 
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
                onClick={resetAutomation} 
                variant="outline"
                disabled={isRunning}
              >
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Automation Progress</CardTitle>
            <CardDescription>
              Complete workflow using free services (Guerrilla Mail + SMS-Activate)
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
      </div>
    </div>
  );
}

