'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  phone: string;
  password: string;
  fullName: string;
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

  const updateStep = (id: string, status: Step['status'], message?: string) => {
    setSteps(prev => prev.map(step => 
      step.id === id ? { ...step, status, message } : step
    ));
  };

  const startAutomation = async () => {
    setIsRunning(true);
    setError(null);
    setAccountData(null);

    try {
      // Step 1: Generate email address using Guerrilla Mail
      updateStep('email', 'running', 'Generating temporary email address...');
      
      const emailResponse = await fetch('/api/guerrilla-mail');
      const emailData = await emailResponse.json();
      
      if (!emailData.success) {
        throw new Error('Failed to generate email address');
      }

      const generatedEmail = emailData.email;
      updateStep('email', 'completed', `Email: ${generatedEmail}`);

      // Step 2: Get phone number for Manus service
      updateStep('phone', 'running', 'Searching for Manus service...');
      
      const servicesResponse = await fetch('/api/textverified');
      const servicesData = await servicesResponse.json();
      
      let phoneNumber = null;
      let verificationId = null;
      
      if (servicesData.success && servicesData.services.length > 0) {
        // Look for Manus service specifically
        const manusService = servicesData.services.find((service: Record<string, unknown>) => 
          String(service.name).toLowerCase().includes('manus')
        );
        
        if (manusService) {
          updateStep('phone', 'running', `Found Manus service ($0.50). Requesting phone number...`);
          
          const createVerificationResponse = await fetch('/api/textverified', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ serviceId: manusService.id }),
          });
          
          const verificationData = await createVerificationResponse.json();
          
          if (verificationData.success) {
            phoneNumber = verificationData.verification.number;
            verificationId = verificationData.verification.id;
            updateStep('phone', 'completed', `Phone number for Manus: ${phoneNumber}`);
          } else {
            updateStep('phone', 'completed', 'Manus service unavailable, skipping phone verification');
          }
        } else {
          updateStep('phone', 'completed', 'Manus service not found, skipping phone verification');
        }
      } else {
        updateStep('phone', 'completed', 'No services available, skipping phone verification');
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

      // Step 5: Verify phone number with Manus (if we have one)
      if (phoneNumber && verificationId) {
        updateStep('verify_phone', 'running', 'Waiting for Manus SMS verification...');
        
        // Poll for SMS verification code
        let smsReceived = false;
        const maxAttempts = 12; // 2 minutes with 10-second intervals
        
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
          
          updateStep('verify_phone', 'running', `Waiting for Manus SMS... (${attempt + 1}/${maxAttempts})`);
          
          const checkResponse = await fetch(`/api/textverified/${verificationId}`);
          const checkData = await checkResponse.json();
          
          if (checkData.success && checkData.verification.code) {
            updateStep('verify_phone', 'completed', `Manus SMS code received: ${checkData.verification.code}`);
            smsReceived = true;
            break;
          }
        }
        
        if (!smsReceived) {
          updateStep('verify_phone', 'error', 'Manus SMS verification timeout');
        }
      } else {
        updateStep('verify_phone', 'completed', 'Skipped (no phone number available)');
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

  const getStepIcon = (step: Step) => {
    switch (step.status) {
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
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Manus Account Automation
          </h1>
          <p className="text-lg text-gray-600">
            Automated account creation using TextVerified and Guerrilla Mail
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Configuration Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Configuration
              </CardTitle>
              <CardDescription>
                Automation settings and invitation details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Manus Invitation Code</p>
                <p className="text-lg font-mono text-blue-700">QVDRZAYJMTKC</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-900">Email Service</p>
                <p className="text-sm text-green-700">Guerrilla Mail (Free)</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-purple-900">SMS Service</p>
                <p className="text-sm text-purple-700">TextVerified - Manus ($0.50)</p>
              </div>
            </CardContent>
          </Card>

          {/* Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Automation Control
              </CardTitle>
              <CardDescription>
                Start or reset the account creation process
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={startAutomation} 
                disabled={isRunning}
                className="w-full"
                size="lg"
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
                className="w-full"
                disabled={isRunning}
              >
                Reset
              </Button>

              {error && (
                <Alert variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Progress Steps */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Automation Progress</CardTitle>
            <CardDescription>
              Follow the step-by-step account creation process
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center gap-4 p-4 rounded-lg border">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100">
                    {getStepIcon(step)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{step.title}</h3>
                    {step.message && (
                      <p className="text-sm text-gray-600 mt-1">{step.message}</p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    Step {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {accountData && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-green-600">Account Created Successfully!</CardTitle>
              <CardDescription>
                Your Manus account has been created with the following details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-700 font-mono">{accountData.email}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  <p className="text-sm text-gray-700 font-mono">{accountData.phone || 'Not provided'}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Full Name</p>
                  <p className="text-sm text-gray-700">{accountData.fullName}</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-900">Password</p>
                  <p className="text-sm text-gray-700 font-mono">{accountData.password}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

