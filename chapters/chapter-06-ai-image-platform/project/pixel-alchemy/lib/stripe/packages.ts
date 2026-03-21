export const creditPackages = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    description: 'A low-risk entry point for testing prompts and short creative sessions.',
    credits: 100,
    unitAmount: 2900,
    currency: 'cny',
    features: ['100 generation credits', 'Ideal for experimentation', 'One-time payment', 'Instant credit delivery after payment'],
    ctaLabel: 'Buy Starter Pack',
    popular: false,
  },
  standard: {
    id: 'standard',
    name: 'Standard Pack',
    description: 'Balanced capacity for regular creators building images every week.',
    credits: 300,
    unitAmount: 7900,
    currency: 'cny',
    features: ['300 generation credits', 'Best value for active users', 'One-time payment', 'Fast checkout with Stripe'],
    ctaLabel: 'Buy Standard Pack',
    popular: true,
  },
  professional: {
    id: 'professional',
    name: 'Professional Pack',
    description: 'Designed for heavier production workloads and client-facing output.',
    credits: 800,
    unitAmount: 19900,
    currency: 'cny',
    features: ['800 generation credits', 'Lower effective cost per image', 'Suitable for ongoing project work', 'Priority choice for power users'],
    ctaLabel: 'Buy Professional Pack',
    popular: false,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Pack',
    description: 'High-volume credits for teams, campaigns, and repeated batch generation.',
    credits: 2000,
    unitAmount: 45900,
    currency: 'cny',
    features: ['2,000 generation credits', 'Best fit for teams and campaigns', 'One-time payment', 'Scales for intensive image pipelines'],
    ctaLabel: 'Buy Enterprise Pack',
    popular: false,
  },
} as const;

export type CreditPackageId = keyof typeof creditPackages;
export type CreditPackage = (typeof creditPackages)[CreditPackageId];

export const creditPackageList: CreditPackage[] = [
  creditPackages.starter,
  creditPackages.standard,
  creditPackages.professional,
  creditPackages.enterprise,
];
