/**
 * Forgot Password Page
 * Allows an account to request a password reset email.
 */
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/services/supabase';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import Header from '@/components/layout/Header';
import { Mail, ArrowLeft } from 'lucide-react';

/**
 * Form schema for validating the email input.
 */
const schema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type FormValues = z.infer<typeof schema>;

const ForgotPasswordPage: React.FC = () => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  /**
   * Handle form submission to request the password reset link.
   */
  const onSubmit = async (data: FormValues) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        // This should be the URL of the page where users can set their new password.
        redirectTo: `${window.location.origin}/#/reset-password`,
      });

      if (error) throw error;

      setIsSubmitted(true); // Show the success message UI
      toast.success('Password reset link sent! Please check your email.');
    } catch (e: unknown) {
      console.error('Password reset error:', e);
      toast.error((e as Error).message || 'Failed to send reset link. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Header />
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          {isSubmitted ? (
            // Success State
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <Mail className="h-6 w-6 text-green-600" />
              </div>
              <h1 className="text-xl font-bold">Check Your Email</h1>
              <p className="mt-2 text-sm text-slate-600">
                We've sent a password reset link to{' '}
                <span className="font-semibold">{getValues('email')}</span>. Please follow the
                instructions in the email to reset your password.
              </p>
              <Link to="/login" className="mt-6 inline-block">
                <Button variant="outline" className="bg-transparent">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Login
                </Button>
              </Link>
            </div>
          ) : (
            // Initial State
            <>
              <div className="mb-6 text-center">
                <h1 className="text-2xl font-bold">Forgot Your Password?</h1>
                <p className="mt-2 text-sm text-slate-600">
                  No problem. Enter your email address below and we'll send you a link to reset it.
                </p>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="pharmacy@example.com"
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <Link to="/login" className="text-sm text-blue-700 hover:underline">
                  <ArrowLeft className="mr-1 inline h-4 w-4" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default ForgotPasswordPage;
