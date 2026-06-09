import { LoginForm } from '@/components/auth/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Memoria',
  description: 'Sign in to your Memoria account to manage events and media.',
};

export default function LoginPage() {
  return <LoginForm />;
}
