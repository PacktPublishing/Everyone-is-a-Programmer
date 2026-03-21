import Stripe from 'stripe';
import { creditPackages, type CreditPackageId } from '@/lib/stripe/packages';

export function getCreditPackage(packageId: string) {
  return creditPackages[packageId as CreditPackageId] ?? null;
}

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  return new Stripe(secretKey);
}

export function getAppUrl() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;

  if (!appUrl) {
    throw new Error('NEXT_PUBLIC_APP_URL or APP_URL must be configured');
  }

  return appUrl.replace(/\/$/, '');
}
