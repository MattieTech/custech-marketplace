'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CustechLogoLoader } from '@/components/ui/custech-loader';
import { getVerificationStatus } from '../actions';

export default function VerificationCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference');
  
  const [status, setStatus] = useState<'processing' | 'success' | 'failed' | 'pending'>('processing');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!reference) {
      setStatus('failed');
      return;
    }

    const checkStatus = async () => {
      try {
        const vStatus = await getVerificationStatus();
        
        if (vStatus === 'under_review' || vStatus === 'verified') {
          setStatus('success');
          setTimeout(() => {
            router.push('/dashboard/verification');
          }, 3000);
        } else {
          if (attempts < 10) {
            setStatus('pending');
          } else {
            setStatus('failed');
          }
        }
      } catch (err) {
        if (attempts >= 10) {
          setStatus('failed');
        }
      }
    };

    if (status === 'processing' || status === 'pending') {
      const timer = setTimeout(() => {
        setAttempts(prev => prev + 1);
        checkStatus();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [reference, status, attempts, router]);

  return (
    <div className="max-w-md mx-auto p-6 mt-12 text-center">
      <Card className="p-8 space-y-6">
        {(status === 'processing' || status === 'pending') && (
          <div className="py-2 space-y-4">
            <CustechLogoLoader 
              mode="in-app" 
              size="md" 
              message="Confirming student verification payment..." 
            />
            <h1 className="text-2xl font-bold">Processing Payment</h1>
            <p className="text-gray-600">
              Please wait while we confirm your payment with Paystack...
            </p>
          </div>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h1 className="text-2xl font-bold">Payment Successful</h1>
            <p className="text-gray-600">
              Redirecting you back to verification...
            </p>
          </>
        )}

        {status === 'failed' && (
          <>
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold">Payment Status Unknown</h1>
            <p className="text-gray-600">
              We couldn't immediately verify your payment. If you were debited, it will reflect shortly.
            </p>
            <Button className="w-full mt-4" onClick={() => router.push('/dashboard/verification')}>
              Return to Verification
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
