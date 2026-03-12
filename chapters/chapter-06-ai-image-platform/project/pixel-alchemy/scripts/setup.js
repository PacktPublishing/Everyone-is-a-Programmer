#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function setup() {
  console.log('🎨 Pixel Alchemy Project setup wizard\n');
  
  // examine .env.local Does the file exist?
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('.env.local The file already exists, do you want to overwrite it? (y/N): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('Setting canceled');
      rl.close();
      return;
    }
  }

  console.log('Please provide the following configuration information:\n');

  // Supabase Configuration
  const supabaseUrl = await question('Supabase URL: ');
  const supabaseAnonKey = await question('Supabase Anon Key: ');
  const supabaseServiceKey = await question('Supabase Service Role Key: ');

  // Replicate Configuration
  const replicateToken = await question('Replicate API Token: ');
  const replicateWebhookSecret = await question('Replicate Webhook Secret (optional): ');

  // Stripe Configuration
  const stripeSecretKey = await question('Stripe Secret Key (optional): ');
  const stripeWebhookSecret = await question('Stripe Webhook Secret (optional): ');
  const stripePublishableKey = await question('Stripe Publishable Key (optional): ');

  // Application configuration
  const appUrl = await question('application URL (default: http://localhost:3000): ') || 'http://localhost:3000';

  // Generate .env.local File content
  const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
SUPABASE_SERVICE_ROLE_KEY=${supabaseServiceKey}

# Replicate API Configuration
REPLICATE_API_TOKEN=${replicateToken}
${replicateWebhookSecret ? `REPLICATE_WEBHOOK_SIGNING_SECRET=${replicateWebhookSecret}` : ''}

# Stripe Configuration
${stripeSecretKey ? `STRIPE_SECRET_KEY=${stripeSecretKey}` : ''}
${stripeWebhookSecret ? `STRIPE_WEBHOOK_SECRET=${stripeWebhookSecret}` : ''}
${stripePublishableKey ? `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=${stripePublishableKey}` : ''}

# Application configuration
NEXT_PUBLIC_APP_URL=${appUrl}
`;

  // Write .env.local document
  fs.writeFileSync(envPath, envContent);

  console.log('\n✅ Environment variable configuration is completed!');
  console.log('\nNext you need:');
  console.log('1. exist Supabase Dashboard Application database migration');
  console.log('2. Configuration Supabase Auth set up');
  console.log('3. run npm run dev Start the development server');
  console.log('\nPlease see detailed instructions README.md');

  rl.close();
}

setup().catch(console.error);
