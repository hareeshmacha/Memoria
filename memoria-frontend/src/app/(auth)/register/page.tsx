import { RegisterForm } from '@/components/auth/RegisterForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Account | Memoria',
  description: 'Join Memoria to upload and manage your event photos.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
