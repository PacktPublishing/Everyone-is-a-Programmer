# AI Image Generation Platform - Technical Design Documentation

## 1. Overall system architecture design

### 1.1 Architecture overview

```mermaid
graph TB
    subgraph "Front-end layer Frontend Layer"
        A[React Web App]
        B[Mobile terminal H5]
        C[Management background]
    end
    
    subgraph "gateway layer Gateway Layer"
        D[Nginx load balancing]
        E[API Gateway]
        F[CDN Static resources]
    end
    
    subgraph "Application layer Application Layer"
        G[User service User Service]
        H[Authentication services Auth Service]
        I[image generation service Generation Service]
        J[Points service Credit Service]
        K[payment services Payment Service]
        L[file service File Service]
        M[notification service Notification Service]
    end
    
    subgraph "data layer Data Layer"
        N[PostgreSQL main library]
        O[Redis cache]
        P[MongoDB log]
        Q[S3 object storage]
    end
    
    subgraph "external services External Services"
        R[Replicate API]
        S[Stripe pay]
        T[SendGrid mail]
        U[Sentry monitor]
    end
    
    A --> D
    B --> D
    C --> D
    D --> E
    E --> G
    E --> H
    E --> I
    E --> J
    E --> K
    E --> L
    E --> M
    
    G --> N
    G --> O
    H --> N
    H --> O
    I --> N
    I --> O
    I --> R
    J --> N
    J --> O
    K --> S
    L --> Q
    M --> T
    
    G --> P
    H --> P
    I --> P
    J --> P
    K --> P
```

### 1.2 Technology stack selection

#### Front-end technology stack
- **frame**: Next.js 14 (React 18)
- **Status management**: Zustand + React Query
- **UIcomponents**: Tailwind CSS + Shadcn/ui
- **chart**: Recharts
- **form**: React Hook Form + Zod
- **Build tools**: Turbopack
- **deploy**: Vercel

#### Backend technology stack
- **runtime**: Node.js 20 LTS
- **frame**: Next.js API Routes + tRPC
- **database**: PostgreSQL 15 + Prisma ORM
- **cache**: Redis 7
- **File storage**: AWS S3 / Cloudflare R2
- **queue**: Bull Queue (Redis)
- **monitor**: Sentry + DataDog

### 1.3 Module diagram

```mermaid
graph LR
    subgraph "core module"
        A[user module]
        B[Authentication module]
        C[Image generation module]
        D[Integral module]
        E[Payment module]
        F[file module]
    end
    
    subgraph "Support module"
        G[Notification module]
        H[Log module]
        I[Configuration module]
        J[Monitoring module]
    end
    
    A --> B
    B --> C
    C --> D
    D --> E
    C --> F
    
    A --> G
    B --> H
    C --> H
    D --> H
    E --> H
    
    A --> J
    C --> J
    E --> J
```

## 2. Replicate API Integrated design

### 2.1 Interface encapsulation architecture

```typescript
// lib/replicate/client.ts
import Replicate from 'replicate';

export class ReplicateClient {
  private client: Replicate;
  private rateLimiter: RateLimiter;
  private retryHandler: RetryHandler;
  
  constructor() {
    this.client = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
    this.rateLimiter = new RateLimiter({
      tokensPerInterval: 100,
      interval: 'minute'
    });
    this.retryHandler = new RetryHandler({
      maxRetries: 3,
      backoffStrategy: 'exponential'
    });
  }

  async generateImage(params: GenerationParams): Promise<GenerationResult> {
    await this.rateLimiter.removeTokens(1);
    
    return this.retryHandler.execute(async () => {
      const prediction = await this.client.predictions.create({
        version: params.modelVersion,
        input: {
          prompt: params.prompt,
          negative_prompt: params.negativePrompt,
          width: params.width,
          height: params.height,
          num_inference_steps: params.steps,
          guidance_scale: params.guidanceScale,
          scheduler: params.scheduler,
          seed: params.seed
        }
      });
      
      return {
        id: prediction.id,
        status: prediction.status,
        urls: prediction.urls,
        output: prediction.output
      };
    });
  }

  async getGenerationStatus(predictionId: string): Promise<GenerationStatus> {
    const prediction = await this.client.predictions.get(predictionId);
    
    return {
      id: prediction.id,
      status: prediction.status,
      progress: this.calculateProgress(prediction),
      output: prediction.output,
      error: prediction.error,
      logs: prediction.logs
    };
  }

  async cancelGeneration(predictionId: string): Promise<void> {
    await this.client.predictions.cancel(predictionId);
  }

  private calculateProgress(prediction: any): number {
    if (prediction.status === 'succeeded') return 100;
    if (prediction.status === 'failed') return 0;
    if (prediction.status === 'canceled') return 0;
    
    // Based on log parsing progress
    const logs = prediction.logs || '';
    const progressMatch = logs.match(/(\d+)%/);
    return progressMatch ? parseInt(progressMatch[1]) : 0;
  }
}
```

### 2.2 Data flow design

```mermaid
sequenceDiagram
    participant U as user
    participant F as front end
    participant A as APIServe
    participant Q as queue
    participant R as Replicate
    participant S as storage
    participant D as database
    
    U->>F: Submit a build request
    F->>A: POST /api/generate
    A->>D: Create build record
    A->>Q: add to queue
    A->>F: Return to taskID
    F->>U: Show processing status
    
    Q->>A: Process queue tasks
    A->>R: callReplicate API
    R->>A: Return predictionID
    A->>D: Update forecastID
    
    loop Polling status
        A->>R: Query generation status
        R->>A: Return status and progress
        A->>D: update status
        A->>F: WebSocketPush progress
        F->>U: Update progress bar
    end
    
    R->>A: Generation completed
    A->>S: Download and store images
    A->>D: Update final result
    A->>F: WebSocketPush completed
    F->>U: Show generated results
```

### 2.3 Model configuration management

```typescript
// lib/replicate/models.ts
export interface ModelConfig {
  id: string;
  name: string;
  version: string;
  type: 'text2img' | 'img2img' | 'style_transfer';
  category: string;
  description: string;
  parameters: ModelParameters;
  pricing: ModelPricing;
  limits: ModelLimits;
}

export interface ModelParameters {
  prompt: ParameterConfig;
  negative_prompt?: ParameterConfig;
  width: ParameterConfig;
  height: ParameterConfig;
  num_inference_steps: ParameterConfig;
  guidance_scale: ParameterConfig;
  scheduler: ParameterConfig;
  seed?: ParameterConfig;
}

export const MODELS: Record<string, ModelConfig> = {
  'sdxl-1.0': {
    id: 'sdxl-1.0',
    name: 'Stable Diffusion XL 1.0',
    version: 'be04660a5b93ef2aff61e3668dedb4cbeb14941e62a3fd5998364a32d613e35e',
    type: 'text2img',
    category: 'general',
    description: 'High quality general image generation model',
    parameters: {
      prompt: {
        type: 'string',
        required: true,
        maxLength: 1000,
        description: 'Image description prompt words'
      },
      negative_prompt: {
        type: 'string',
        required: false,
        maxLength: 500,
        description: 'negative cue words'
      },
      width: {
        type: 'number',
        required: true,
        min: 512,
        max: 1024,
        step: 64,
        default: 1024
      },
      height: {
        type: 'number',
        required: true,
        min: 512,
        max: 1024,
        step: 64,
        default: 1024
      },
      num_inference_steps: {
        type: 'number',
        required: true,
        min: 1,
        max: 50,
        default: 20
      },
      guidance_scale: {
        type: 'number',
        required: true,
        min: 1,
        max: 20,
        default: 7.5
      },
      scheduler: {
        type: 'enum',
        required: true,
        options: ['DDIM', 'K_EULER', 'DPMSolverMultistep', 'K_EULER_ANCESTRAL'],
        default: 'K_EULER'
      }
    },
    pricing: {
      baseCredits: 10,
      stepMultiplier: 0.1,
      resolutionMultiplier: {
        '512x512': 1.0,
        '768x768': 1.5,
        '1024x1024': 2.0
      }
    },
    limits: {
      maxConcurrent: 3,
      cooldown: 5000
    }
  }
};
```

## 3. User authentication and permission control

### 3.1 Certification architecture design

```typescript
// lib/auth/jwt.ts
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export class JWTService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET!;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET!;
    this.accessTokenExpiry = '15m';
    this.refreshTokenExpiry = '7d';
  }

  generateTokens(user: User): TokenPair {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: this.getUserPermissions(user.role)
    };

    const accessToken = jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry
    });

    const refreshToken = jwt.sign(
      { userId: user.id },
      this.refreshTokenSecret,
      { expiresIn: this.refreshTokenExpiry }
    );

    return { accessToken, refreshToken };
  }

  verifyAccessToken(token: string): JWTPayload {
    return jwt.verify(token, this.accessTokenSecret) as JWTPayload;
  }

  verifyRefreshToken(token: string): { userId: string } {
    return jwt.verify(token, this.refreshTokenSecret) as { userId: string };
  }

  private getUserPermissions(role: string): string[] {
    const rolePermissions = {
      'user': ['generate:create', 'gallery:read', 'profile:read', 'profile:update'],
      'premium': ['generate:create', 'generate:priority', 'gallery:read', 'gallery:batch', 'profile:read', 'profile:update'],
      'admin': ['*']
    };
    
    return rolePermissions[role as keyof typeof rolePermissions] || [];
  }
}
```

### 3.2 Permission control middleware

```typescript
// lib/auth/middleware.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { JWTService } from './jwt';
import { prisma } from '@/lib/prisma';

export interface AuthenticatedRequest extends NextApiRequest {
  user: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
  };
}

export function withAuth(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      const token = extractToken(req);
      if (!token) {
        return res.status(401).json({ error: 'Missing authentication token' });
      }

      const jwtService = new JWTService();
      const payload = jwtService.verifyAccessToken(token);
      
      // Verify that the user still exists and is active
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, email: true, role: true, status: true }
      });

      if (!user || user.status !== 'active') {
        return res.status(401).json({ error: 'Invalid or inactive user' });
      }

      (req as AuthenticatedRequest).user = {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: payload.permissions
      };

      return handler(req as AuthenticatedRequest, res);
    } catch (error) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
  };
}

export function withPermission(permission: string) {
  return function(handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>) {
    return withAuth(async (req: AuthenticatedRequest, res: NextApiResponse) => {
      if (!hasPermission(req.user.permissions, permission)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return handler(req, res);
    });
  };
}

function extractToken(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  if (userPermissions.includes('*')) return true;
  if (userPermissions.includes(requiredPermission)) return true;
  
  // Supports wildcard permission checking
  const [resource, action] = requiredPermission.split(':');
  return userPermissions.some(perm => {
    const [permResource, permAction] = perm.split(':');
    return permResource === resource && (permAction === '*' || permAction === action);
  });
}
```

### 3.3 Session management

```typescript
// lib/auth/session.ts
import { Redis } from 'ioredis';

export class SessionManager {
  private redis: Redis;
  private readonly sessionPrefix = 'session:';
  private readonly userSessionsPrefix = 'user_sessions:';
  private readonly sessionTTL = 7 * 24 * 60 * 60; // 7sky

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async createSession(userId: string, refreshToken: string, metadata: SessionMetadata): Promise<string> {
    const sessionId = this.generateSessionId();
    const sessionKey = this.sessionPrefix + sessionId;
    const userSessionsKey = this.userSessionsPrefix + userId;

    const sessionData = {
      userId,
      refreshToken,
      createdAt: Date.now(),
      lastAccessAt: Date.now(),
      ...metadata
    };

    // Store session data
    await this.redis.setex(sessionKey, this.sessionTTL, JSON.stringify(sessionData));
    
    // Add to user session list
    await this.redis.sadd(userSessionsKey, sessionId);
    await this.redis.expire(userSessionsKey, this.sessionTTL);

    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    const sessionKey = this.sessionPrefix + sessionId;
    const data = await this.redis.get(sessionKey);
    
    if (!data) return null;
    
    const sessionData = JSON.parse(data) as SessionData;
    
    // Update last visit time
    sessionData.lastAccessAt = Date.now();
    await this.redis.setex(sessionKey, this.sessionTTL, JSON.stringify(sessionData));
    
    return sessionData;
  }

  async revokeSession(sessionId: string): Promise<void> {
    const sessionData = await this.getSession(sessionId);
    if (!sessionData) return;

    const sessionKey = this.sessionPrefix + sessionId;
    const userSessionsKey = this.userSessionsPrefix + sessionData.userId;

    await this.redis.del(sessionKey);
    await this.redis.srem(userSessionsKey, sessionId);
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const userSessionsKey = this.userSessionsPrefix + userId;
    const sessionIds = await this.redis.smembers(userSessionsKey);

    if (sessionIds.length > 0) {
      const sessionKeys = sessionIds.map(id => this.sessionPrefix + id);
      await this.redis.del(...sessionKeys, userSessionsKey);
    }
  }

  private generateSessionId(): string {
    return require('crypto').randomBytes(32).toString('hex');
  }
}

interface SessionMetadata {
  userAgent?: string;
  ipAddress?: string;
  deviceType?: string;
}

interface SessionData extends SessionMetadata {
  userId: string;
  refreshToken: string;
  createdAt: number;
  lastAccessAt: number;
}
```

## 4. Points system and payment process architecture

### 4.1 Points system design

```typescript
// lib/credits/service.ts
export class CreditService {
  private prisma: PrismaClient;
  private redis: Redis;
  private eventEmitter: EventEmitter;

  constructor() {
    this.prisma = new PrismaClient();
    this.redis = new Redis(process.env.REDIS_URL!);
    this.eventEmitter = new EventEmitter();
  }

  async getUserBalance(userId: string): Promise<number> {
    // Get from cache first
    const cached = await this.redis.get(`balance:${userId}`);
    if (cached) return parseInt(cached);

    // Calculate balance from database
    const result = await this.prisma.creditTransaction.aggregate({
      where: { userId },
      _sum: { amount: true }
    });

    const balance = result._sum.amount || 0;
    
    // Cache balance (5 minutes)
    await this.redis.setex(`balance:${userId}`, 300, balance.toString());
    
    return balance;
  }

  async deductCredits(userId: string, amount: number, reason: string, metadata?: any): Promise<CreditTransaction> {
    return this.prisma.$transaction(async (tx) => {
      // Check balance
      const currentBalance = await this.getUserBalance(userId);
      if (currentBalance < amount) {
        throw new InsufficientCreditsError('Insufficient points balance');
      }

      // Create deduction record
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'deduction',
          reason,
          metadata,
          balanceAfter: currentBalance - amount
        }
      });

      // Update cache
      await this.redis.setex(`balance:${userId}`, 300, (currentBalance - amount).toString());
      
      // Send event
      this.eventEmitter.emit('credits.deducted', {
        userId,
        amount,
        reason,
        newBalance: currentBalance - amount
      });

      return transaction;
    });
  }

  async addCredits(userId: string, amount: number, type: CreditType, reason: string, metadata?: any): Promise<CreditTransaction> {
    return this.prisma.$transaction(async (tx) => {
      const currentBalance = await this.getUserBalance(userId);
      
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          amount,
          type,
          reason,
          metadata,
          balanceAfter: currentBalance + amount
        }
      });

      // Update cache
      await this.redis.setex(`balance:${userId}`, 300, (currentBalance + amount).toString());
      
      // Send event
      this.eventEmitter.emit('credits.added', {
        userId,
        amount,
        type,
        reason,
        newBalance: currentBalance + amount
      });

      return transaction;
    });
  }

  async getTransactionHistory(userId: string, options: PaginationOptions): Promise<PaginatedResult<CreditTransaction>> {
    const { page = 1, limit = 20, type, dateFrom, dateTo } = options;
    const offset = (page - 1) * limit;

    const where: any = { userId };
    if (type) where.type = type;
    if (dateFrom) where.createdAt = { gte: new Date(dateFrom) };
    if (dateTo) where.createdAt = { ...where.createdAt, lte: new Date(dateTo) };

    const [transactions, total] = await Promise.all([
      this.prisma.creditTransaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit
      }),
      this.prisma.creditTransaction.count({ where })
    ]);

    return {
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

export enum CreditType {
  PURCHASE = 'purchase',
  BONUS = 'bonus',
  REFUND = 'refund',
  DEDUCTION = 'deduction'
}

export class InsufficientCreditsError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InsufficientCreditsError';
  }
}
```

### 4.2 Payment process design

```typescript
// lib/payment/stripe.ts
import Stripe from 'stripe';
import { CreditService } from '../credits/service';

export class StripePaymentService {
  private stripe: Stripe;
  private creditService: CreditService;
  private webhookSecret: string;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16'
    });
    this.creditService = new CreditService();
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
  }

  async createPaymentIntent(userId: string, packageId: string): Promise<PaymentIntentResult> {
    const creditPackage = await this.getCreditPackage(packageId);
    if (!creditPackage) {
      throw new Error('Points package does not exist');
    }

    // Create order record
    const order = await prisma.order.create({
      data: {
        userId,
        packageId,
        amount: creditPackage.price,
        credits: creditPackage.credits,
        status: 'pending',
        currency: 'usd'
      }
    });

    // create Stripe PaymentIntent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: creditPackage.price * 100, // Convert to minutes
      currency: 'usd',
      metadata: {
        orderId: order.id,
        userId,
        packageId,
        credits: creditPackage.credits.toString()
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    // Update order PaymentIntent ID
    await prisma.order.update({
      where: { id: order.id },
      data: { stripePaymentIntentId: paymentIntent.id }
    });

    return {
      orderId: order.id,
      clientSecret: paymentIntent.client_secret!,
      amount: creditPackage.price,
      credits: creditPackage.credits
    };
  }

  async handleWebhook(body: string, signature: string): Promise<void> {
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(body, signature, this.webhookSecret);
    } catch (err) {
      throw new Error(`Webhook signature verification failed: ${err}`);
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const { orderId, userId, credits } = paymentIntent.metadata;

    await prisma.$transaction(async (tx) => {
      // Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });

      // Add points
      await this.creditService.addCredits(
        userId,
        parseInt(credits),
        CreditType.PURCHASE,
        `Purchase Points Package - Order ${orderId}`,
        { orderId, paymentIntentId: paymentIntent.id }
      );
    });

    // Send confirmation email
    await this.sendPurchaseConfirmation(userId, orderId);
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const { orderId } = paymentIntent.metadata;

    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'failed',
        failureReason: paymentIntent.last_payment_error?.message
      }
    });
  }

  private async getCreditPackage(packageId: string): Promise<CreditPackage | null> {
    const packages: Record<string, CreditPackage> = {
      'starter': { id: 'starter', credits: 100, price: 9.99, name: 'starter pack' },
      'standard': { id: 'standard', credits: 300, price: 24.99, name: 'Standard package', bonus: 50 },
      'premium': { id: 'premium', credits: 600, price: 49.99, name: 'Premium package', bonus: 150 },
      'enterprise': { id: 'enterprise', credits: 1500, price: 99.99, name: 'Enterprise package', bonus: 500 }
    };

    return packages[packageId] || null;
  }

  private async sendPurchaseConfirmation(userId: string, orderId: string): Promise<void> {
    // Implement email sending logic
  }
}

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  name: string;
  bonus?: number;
}

interface PaymentIntentResult {
  orderId: string;
  clientSecret: string;
  amount: number;
  credits: number;
}
```

## 5. Image generation and storage of detailed designs

### 5.1 image generation service

```typescript
// lib/generation/service.ts
import { Queue, Job } from 'bull';
import { ReplicateClient } from '../replicate/client';
import { CreditService } from '../credits/service';
import { FileService } from '../storage/service';

export class ImageGenerationService {
  private generationQueue: Queue;
  private replicateClient: ReplicateClient;
  private creditService: CreditService;
  private fileService: FileService;
  private websocketService: WebSocketService;

  constructor() {
    this.generationQueue = new Queue('image generation', {
      redis: { host: process.env.REDIS_HOST, port: 6379 }
    });
    this.replicateClient = new ReplicateClient();
    this.creditService = new CreditService();
    this.fileService = new FileService();
    this.websocketService = new WebSocketService();
    
    this.setupQueueProcessors();
  }

  async createGeneration(userId: string, params: GenerationRequest): Promise<GenerationResponse> {
    // Validation parameters
    const validationResult = await this.validateGenerationParams(params);
    if (!validationResult.valid) {
      throw new ValidationError(validationResult.errors);
    }

    // Calculate required points
    const requiredCredits = this.calculateCredits(params);
    
    // Check user points balance
    const userBalance = await this.creditService.getUserBalance(userId);
    if (userBalance < requiredCredits) {
      throw new InsufficientCreditsError('Insufficient points balance');
    }

    // Create build record
    const generation = await prisma.image.create({
      data: {
        userId,
        prompt: params.prompt,
        negativePrompt: params.negativePrompt,
        width: params.width,
        height: params.height,
        steps: params.steps,
        guidanceScale: params.guidanceScale,
        scheduler: params.scheduler,
        seed: params.seed,
        modelId: params.modelId,
        generationType: params.type,
        creditsUsed: requiredCredits,
        status: 'queued',
        settings: params
      }
    });

    // Points deducted
    await this.creditService.deductCredits(
      userId,
      requiredCredits,
      `Image generation - ${generation.id}`,
      { generationId: generation.id, modelId: params.modelId }
    );

    // add to queue
    await this.generationQueue.add('generate', {
      generationId: generation.id,
      userId,
      params
    }, {
      priority: this.getUserPriority(userId),
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000
      }
    });

    return {
      id: generation.id,
      status: 'queued',
      estimatedTime: await this.getEstimatedTime(userId)
    };
  }

  async getGenerationStatus(generationId: string, userId: string): Promise<GenerationStatus> {
    const generation = await prisma.image.findFirst({
      where: { id: generationId, userId }
    });

    if (!generation) {
      throw new NotFoundError('Generate record does not exist');
    }

    return {
      id: generation.id,
      status: generation.status,
      progress: generation.progress || 0,
      imageUrl: generation.imageUrl,
      thumbnailUrl: generation.thumbnailUrl,
      error: generation.error,
      createdAt: generation.createdAt,
      completedAt: generation.completedAt
    };
  }

  async cancelGeneration(generationId: string, userId: string): Promise<void> {
    const generation = await prisma.image.findFirst({
      where: { id: generationId, userId, status: { in: ['queued', 'processing'] } }
    });

    if (!generation) {
      throw new NotFoundError('The build task cannot be canceled');
    }

    // if already in Replicate Processing, try to cancel
    if (generation.replicatePredictionId) {
      try {
        await this.replicateClient.cancelGeneration(generation.replicatePredictionId);
      } catch (error) {
        console.error('Failed to cancel Replicate prediction:', error);
      }
    }

    // update status
    await prisma.image.update({
      where: { id: generationId },
      data: {
        status: 'cancelled',
        completedAt: new Date()
      }
    });

    // Return points
    await this.creditService.addCredits(
      userId,
      generation.creditsUsed,
      CreditType.REFUND,
      `Cancellation generates refund - ${generationId}`,
      { generationId }
    );

    // Notification frontend
    this.websocketService.sendToUser(userId, {
      type: 'generation.cancelled',
      data: { generationId }
    });
  }

  private setupQueueProcessors(): void {
    this.generationQueue.process('generate', 5, async (job: Job) => {
      const { generationId, userId, params } = job.data;
      
      try {
        await this.processGeneration(generationId, userId, params, job);
      } catch (error) {
        console.error(`Generation failed for ${generationId}:`, error);
        await this.handleGenerationError(generationId, error);
        throw error;
      }
    });
  }

  private async processGeneration(generationId: string, userId: string, params: GenerationRequest, job: Job): Promise<void> {
    // Update status is processing
    await prisma.image.update({
      where: { id: generationId },
      data: { status: 'processing' }
    });

    this.websocketService.sendToUser(userId, {
      type: 'generation.started',
      data: { generationId }
    });

    // call Replicate API
    const replicateResult = await this.replicateClient.generateImage(params);
    
    // save Replicate predict ID
    await prisma.image.update({
      where: { id: generationId },
      data: { replicatePredictionId: replicateResult.id }
    });

    // Poll build status
    let completed = false;
    while (!completed) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // wait 2 seconds
      
      const status = await this.replicateClient.getGenerationStatus(replicateResult.id);
      
      // update progress
      await prisma.image.update({
        where: { id: generationId },
        data: { progress: status.progress }
      });

      this.websocketService.sendToUser(userId, {
        type: 'generation.progress',
        data: { generationId, progress: status.progress }
      });

      if (status.status === 'succeeded') {
        await this.handleGenerationSuccess(generationId, userId, status.output);
        completed = true;
      } else if (status.status === 'failed') {
        throw new Error(status.error || 'Build failed');
      } else if (status.status === 'canceled') {
        throw new Error('Build canceled');
      }
    }
  }

  private async handleGenerationSuccess(generationId: string, userId: string, output: string[]): Promise<void> {
    const imageUrl = output[0]; // Assume the first one is the main image
    
    // Download and store images
    const storedImage = await this.fileService.downloadAndStore(imageUrl, {
      userId,
      generationId,
      type: 'generation'
    });

    // Generate thumbnails
    const thumbnail = await this.fileService.generateThumbnail(storedImage.url, {
      width: 256,
      height: 256
    });

    // Update database
    await prisma.image.update({
      where: { id: generationId },
      data: {
        status: 'completed',
        imageUrl: storedImage.url,
        thumbnailUrl: thumbnail.url,
        fileSize: storedImage.size,
        completedAt: new Date(),
        progress: 100
      }
    });

    // Notification frontend
    this.websocketService.sendToUser(userId, {
      type: 'generation.completed',
      data: {
        generationId,
        imageUrl: storedImage.url,
        thumbnailUrl: thumbnail.url
      }
    });
  }

  private async handleGenerationError(generationId: string, error: Error): Promise<void> {
    await prisma.image.update({
      where: { id: generationId },
      data: {
        status: 'failed',
        error: error.message,
        completedAt: new Date()
      }
    });

    // Get userIDfor notification
    const generation = await prisma.image.findUnique({
      where: { id: generationId },
      select: { userId: true, creditsUsed: true }
    });

    if (generation) {
      // Return points
      await this.creditService.addCredits(
        generation.userId,
        generation.creditsUsed,
        CreditType.REFUND,
        `Generate failed refund - ${generationId}`,
        { generationId, error: error.message }
      );

      // Notification frontend
      this.websocketService.sendToUser(generation.userId, {
        type: 'generation.failed',
        data: { generationId, error: error.message }
      });
    }
  }

  private calculateCredits(params: GenerationRequest): number {
    const model = MODELS[params.modelId];
    if (!model) throw new Error('unknown model');

    let credits = model.pricing.baseCredits;
    
    // Effect of steps
    credits += (params.steps - 20) * model.pricing.stepMultiplier;
    
    // Resolution impact
    const resolution = `${params.width}x${params.height}`;
    const resolutionMultiplier = model.pricing.resolutionMultiplier[resolution] || 1.0;
    credits *= resolutionMultiplier;
    
    return Math.ceil(credits);
  }

  private getUserPriority(userId: string): number {
    // Return priority based on user level
    // Premium User priority is higher
    return 0; // Default priority
  }

  private async getEstimatedTime(userId: string): Promise<number> {
    // Estimating waiting time based on queue length and user priority
    const queueLength = await this.generationQueue.count();
    return Math.max(30, queueLength * 10); // at least 30 seconds
  }

  private async validateGenerationParams(params: GenerationRequest): Promise<ValidationResult> {
    const errors: string[] = [];
    
    if (!params.prompt || params.prompt.length < 3) {
      errors.push('Prompt word must be at least 3 characters');
    }
    
    if (params.prompt && params.prompt.length > 1000) {
      errors.push('Prompt word cannot exceed 1000 characters');
    }
    
    if (params.width < 512 || params.width > 1024 || params.width % 64 !== 0) {
      errors.push('Width must be between 512-1024 and a multiple of 64');
    }
    
    if (params.height < 512 || params.height > 1024 || params.height % 64 !== 0) {
      errors.push('Height must be between 512-1024 and a multiple of 64');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

### 5.2 File storage service

```typescript
// lib/storage/service.ts
import AWS from 'aws-sdk';
import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';

export class FileService {
  private s3: AWS.S3;
  private bucketName: string;
  private cdnDomain: string;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    });
    this.bucketName = process.env.S3_BUCKET_NAME!;
    this.cdnDomain = process.env.CDN_DOMAIN!;
  }

  async downloadAndStore(sourceUrl: string, metadata: FileMetadata): Promise<StoredFile> {
    // Download original file
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    
    // Generate file path
    const fileId = uuidv4();
    const extension = this.getFileExtension(response.headers.get('content-type') || 'image/png');
    const key = this.generateFileKey(metadata, fileId, extension);

    // upload to S3
    const uploadResult = await this.s3.upload({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: response.headers.get('content-type') || 'image/png',
      Metadata: {
        userId: metadata.userId,
        generationId: metadata.generationId || '',
        type: metadata.type
      }
    }).promise();

    const publicUrl = `${this.cdnDomain}/${key}`;

    return {
      id: fileId,
      url: publicUrl,
      key,
      size: buffer.length,
      contentType: response.headers.get('content-type') || 'image/png'
    };
  }

  async generateThumbnail(imageUrl: string, options: ThumbnailOptions): Promise<StoredFile> {
    // Download original image
    const response = await fetch(imageUrl);
    const buffer = Buffer.from(await response.arrayBuffer());

    // Generate thumbnails
    const thumbnailBuffer = await sharp(buffer)
      .resize(options.width, options.height, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Generate thumbnail path
    const fileId = uuidv4();
    const key = `thumbnails/${fileId}.jpg`;

    // Upload thumbnail
    await this.s3.upload({
      Bucket: this.bucketName,
      Key: key,
      Body: thumbnailBuffer,
      ContentType: 'image/jpeg'
    }).promise();

    const publicUrl = `${this.cdnDomain}/${key}`;

    return {
      id: fileId,
      url: publicUrl,
      key,
      size: thumbnailBuffer.length,
      contentType: 'image/jpeg'
    };
  }

  async deleteFile(key: string): Promise<void> {
    await this.s3.deleteObject({
      Bucket: this.bucketName,
      Key: key
    }).promise();
  }

  async getSignedUploadUrl(userId: string, fileName: string, contentType: string): Promise<SignedUploadResult> {
    const fileId = uuidv4();
    const extension = this.getFileExtension(contentType);
    const key = `uploads/${userId}/${fileId}${extension}`;

    const signedUrl = await this.s3.getSignedUrlPromise('putObject', {
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      Expires: 300, // 5minutes expire
      Metadata: {
        userId,
        originalName: fileName
      }
    });

    return {
      uploadUrl: signedUrl,
      fileKey: key,
      fileId
    };
  }

  private generateFileKey(metadata: FileMetadata, fileId: string, extension: string): string {
    const { userId, type, generationId } = metadata;
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (type === 'generation' && generationId) {
      return `generations/${userId}/${date}/${generationId}${extension}`;
    } else if (type === 'upload') {
      return `uploads/${userId}/${date}/${fileId}${extension}`;
    } else {
      return `files/${userId}/${date}/${fileId}${extension}`;
    }
  }

  private getFileExtension(contentType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif'
    };
    return extensions[contentType] || '.png';
  }
}

interface FileMetadata {
  userId: string;
  generationId?: string;
  type: 'generation' | 'upload' | 'avatar';
}

interface StoredFile {
  id: string;
  url: string;
  key: string;
  size: number;
  contentType: string;
}

interface ThumbnailOptions {
  width: number;
  height: number;
}

interface SignedUploadResult {
  uploadUrl: string;
  fileKey: string;
  fileId: string;
}
```

## 6. Database table structure design

### 6.1 Prisma Schema definition

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User table
model User {
  id                String   @id @default(cuid())
  email             String   @unique
  username          String?  @unique
  passwordHash      String
  firstName         String?
  lastName          String?
  avatar            String?
  role              Role     @default(USER)
  status            UserStatus @default(ACTIVE)
  emailVerified     Boolean  @default(false)
  emailVerifiedAt   DateTime?
  lastLoginAt       DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  // Association relationship
  images            Image[]
  creditTransactions CreditTransaction[]
  orders            Order[]
  sessions          Session[]
  
  @@map("users")
}

enum Role {
  USER
  PREMIUM
  ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

// session table
model Session {
  id           String   @id @default(cuid())
  userId       String
  refreshToken String   @unique
  userAgent    String?
  ipAddress    String?
  deviceType   String?
  createdAt    DateTime @default(now())
  expiresAt    DateTime
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("sessions")
}

// image table
model Image {
  id                    String      @id @default(cuid())
  userId                String
  prompt                String
  negativePrompt        String?
  width                 Int
  height                Int
  steps                 Int         @default(20)
  guidanceScale         Float       @default(7.5)
  scheduler             String      @default("K_EULER")
  seed                  Int?
  modelId               String
  generationType        GenerationType
  status                GenerationStatus @default(QUEUED)
  progress              Int         @default(0)
  creditsUsed           Int
  imageUrl              String?
  thumbnailUrl          String?
  fileSize              Int?
  replicatePredictionId String?
  error                 String?
  settings              Json?
  createdAt             DateTime    @default(now())
  completedAt           DateTime?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, createdAt])
  @@index([userId, status])
  @@index([status, createdAt])
  @@map("images")
}

enum GenerationType {
  TEXT2IMG
  IMG2IMG
  STYLE_TRANSFER
}

enum GenerationStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
  CANCELLED
}

// Points transaction table
model CreditTransaction {
  id           String            @id @default(cuid())
  userId       String
  amount       Int
  type         CreditTransactionType
  reason       String
  balanceAfter Int
  metadata     Json?
  createdAt    DateTime          @default(now())
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, createdAt])
  @@index([userId, type])
  @@map("credit_transactions")
}

enum CreditTransactionType {
  PURCHASE
  BONUS
  REFUND
  DEDUCTION
}

// order form
model Order {
  id                    String      @id @default(cuid())
  userId                String
  packageId             String
  amount                Float
  credits               Int
  currency              String      @default("usd")
  status                OrderStatus @default(PENDING)
  stripePaymentIntentId String?
  failureReason         String?
  createdAt             DateTime    @default(now())
  completedAt           DateTime?
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@index([userId, status])
  @@index([status, createdAt])
  @@map("orders")
}

enum OrderStatus {
  PENDING
  COMPLETED
  FAILED
  CANCELLED
}

// System configuration table
model SystemConfig {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("system_configs")
}

// Audit log table
model AuditLog {
  id        String   @id @default(cuid())
  userId    String?
  action    String
  resource  String
  details   Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([action, createdAt])
  @@map("audit_logs")
}
```

### 6.2 Database index optimization

```sql
-- User related index
CREATE INDEX CONCURRENTLY idx_users_email_status ON users(email, status);
CREATE INDEX CONCURRENTLY idx_users_role_status ON users(role, status);

-- Image generation related index
CREATE INDEX CONCURRENTLY idx_images_user_created ON images(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_images_user_status ON images(user_id, status);
CREATE INDEX CONCURRENTLY idx_images_status_created ON images(status, created_at);
CREATE INDEX CONCURRENTLY idx_images_model_status ON images(model_id, status);
CREATE INDEX CONCURRENTLY idx_images_replicate_prediction ON images(replicate_prediction_id) WHERE replicate_prediction_id IS NOT NULL;

-- Points transaction related index
CREATE INDEX CONCURRENTLY idx_credit_transactions_user_created ON credit_transactions(user_id, created_at DESC);
CREATE INDEX CONCURRENTLY idx_credit_transactions_user_type ON credit_transactions(user_id, type);
CREATE INDEX CONCURRENTLY idx_credit_transactions_type_created ON credit_transactions(type, created_at);

-- Order related index
CREATE INDEX CONCURRENTLY idx_orders_user_status ON orders(user_id, status);
CREATE INDEX CONCURRENTLY idx_orders_status_created ON orders(status, created_at);
CREATE INDEX CONCURRENTLY idx_orders_stripe_payment_intent ON orders(stripe_payment_intent_id) WHERE stripe_payment_intent_id IS NOT NULL;

-- session related index
CREATE INDEX CONCURRENTLY idx_sessions_user_expires ON sessions(user_id, expires_at);
CREATE INDEX CONCURRENTLY idx_sessions_expires ON sessions(expires_at);

-- Audit log index
CREATE INDEX CONCURRENTLY idx_audit_logs_user_created ON audit_logs(user_id, created_at DESC) WHERE user_id IS NOT NULL;
CREATE INDEX CONCURRENTLY idx_audit_logs_action_created ON audit_logs(action, created_at DESC);

-- Full text search index
CREATE INDEX CONCURRENTLY idx_images_prompt_gin ON images USING gin(to_tsvector('english', prompt));
```

### 6.3 Database views and functions

```sql
-- User statistics view
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.id,
    u.email,
    u.role,
    COUNT(i.id) as total_generations,
    COUNT(CASE WHEN i.status = 'completed' THEN 1 END) as successful_generations,
    COUNT(CASE WHEN i.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as monthly_generations,
    COALESCE(SUM(ct.amount) FILTER (WHERE ct.amount > 0), 0) as total_credits_purchased,
    COALESCE(SUM(ct.amount) FILTER (WHERE ct.amount < 0), 0) as total_credits_used,
    COALESCE(SUM(ct.amount), 0) as current_balance
FROM users u
LEFT JOIN images i ON u.id = i.user_id
LEFT JOIN credit_transactions ct ON u.id = ct.user_id
GROUP BY u.id, u.email, u.role;

-- Generate statistics view monthly
CREATE OR REPLACE VIEW monthly_generation_stats AS
SELECT 
    user_id,
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as total_generations,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_generations,
    SUM(credits_used) as credits_consumed,
    AVG(credits_used) as avg_credits_per_generation
FROM images
WHERE created_at >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY user_id, DATE_TRUNC('month', created_at)
ORDER BY user_id, month DESC;

-- Points balance calculation function
CREATE OR REPLACE FUNCTION get_user_credit_balance(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    balance INTEGER;
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO balance
    FROM credit_transactions
    WHERE user_id = p_user_id;
    
    RETURN balance;
END;
$$ LANGUAGE plpgsql;

-- Clean up expired session function
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Scheduled task: clean up expired sessions every hour
-- SELECT cron.schedule('cleanup-sessions', '0 * * * *', 'SELECT cleanup_expired_sessions();');
```

## 7. Front and back ends API Interface definition

### 7.1 RESTful API design

```typescript
// types/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  pagination?: PaginationInfo;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
```

### 7.2 User authentication API

```typescript
// pages/api/auth/register.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password, firstName, lastName } = req.body;
    
    // Validate input
    const validation = registerSchema.safeParse({ email, password, firstName, lastName });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: validation.error.errors.map(e => e.message).join(', ')
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ success: false, error: 'User already exists' });
    }

    // Create user
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        role: 'USER'
      }
    });

    // Generate token
    const jwtService = new JWTService();
    const tokens = jwtService.generateTokens(user);

    // Create session
    const sessionManager = new SessionManager();
    const sessionId = await sessionManager.createSession(user.id, tokens.refreshToken, {
      userAgent: req.headers['user-agent'],
      ipAddress: getClientIP(req)
    });

    // Send welcome points
    const creditService = new CreditService();
    await creditService.addCredits(user.id, 50, CreditType.BONUS, 'Sign up for welcome bonus');

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        tokens,
        sessionId
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: 'Registration failed' });
  }
}

// pages/api/auth/login.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;
    
    // Find users
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.status !== 'ACTIVE') {
      return res.status(401).json({ success: false, error: 'Wrong username or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Wrong username or password' });
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // Generate token
    const jwtService = new JWTService();
    const tokens = jwtService.generateTokens(user);

    // Create session
    const sessionManager = new SessionManager();
    const sessionId = await sessionManager.createSession(user.id, tokens.refreshToken, {
      userAgent: req.headers['user-agent'],
      ipAddress: getClientIP(req)
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        tokens,
        sessionId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, error: 'Login failed' });
  }
}
```

### 7.3 image generation API

```typescript
// pages/api/generate/create.ts
export default withAuth(async function handler(req: AuthenticatedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const generationService = new ImageGenerationService();
    const result = await generationService.createGeneration(req.user.id, req.body);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return res.status(402).json({ success: false, error: error.message });
    }
    if (error instanceof ValidationError) {
      return res.status(400).json({ success: false, error: error.message });
    }
    
    console.error('Generation creation error:', error);
    res.status(500).json({ success: false, error: 'Failed to create build task' });
  }
});

// pages/api/generate/[id]/status.ts
export default withAuth(async function handler(req: AuthenticatedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const generationService = new ImageGenerationService();
    const status = await generationService.getGenerationStatus(id as string, req.user.id);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(404).json({ success: false, error: error.message });
    }
    
    console.error('Get generation status error:', error);
     res.status(500).json({ success: false, error: 'Failed to get build status' });
   }
 });
 ```

### 7.4 Points and payments API

```typescript
// pages/api/credits/balance.ts
export default withAuth(async function handler(req: AuthenticatedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const creditService = new CreditService();
    const balance = await creditService.getUserBalance(req.user.id);
    
    res.json({
      success: true,
      data: { balance }
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({ success: false, error: 'Failed to obtain points balance' });
  }
});

// pages/api/payment/create-intent.ts
export default withAuth(async function handler(req: AuthenticatedRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { packageId } = req.body;
    const paymentService = new StripePaymentService();
    const result = await paymentService.createPaymentIntent(req.user.id, packageId);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ success: false, error: 'Failed to create payment intent' });
  }
});

// pages/api/payment/webhook.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const signature = req.headers['stripe-signature'] as string;
  const body = JSON.stringify(req.body);

  try {
    const paymentService = new StripePaymentService();
    await paymentService.handleWebhook(body, signature);
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'WebhookProcessing failed' });
  }
}
```

### 7.5 WebSocket real time communication

```typescript
// lib/websocket/service.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { JWTService } from '../auth/jwt';

export class WebSocketService {
  private io: SocketIOServer;
  private jwtService: JWTService;
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST']
      }
    });
    this.jwtService = new JWTService();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new Error('No token provided');
        }

        const payload = this.jwtService.verifyAccessToken(token);
        socket.data.userId = payload.userId;
        socket.data.userRole = payload.role;
        
        next();
      } catch (error) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      const userId = socket.data.userId;
      
      // Add usersocketmapping
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      console.log(`User ${userId} connected with socket ${socket.id}`);

      // Join user room
      socket.join(`user:${userId}`);

      // Handle disconnection
      socket.on('disconnect', () => {
        const userSockets = this.userSockets.get(userId);
        if (userSockets) {
          userSockets.delete(socket.id);
          if (userSockets.size === 0) {
            this.userSockets.delete(userId);
          }
        }
        console.log(`User ${userId} disconnected socket ${socket.id}`);
      });

      // Handle subscription build status
      socket.on('subscribe:generation', (generationId: string) => {
        socket.join(`generation:${generationId}`);
      });

      // Handle unsubscription
      socket.on('unsubscribe:generation', (generationId: string) => {
        socket.leave(`generation:${generationId}`);
      });
    });
  }

  sendToUser(userId: string, data: any): void {
    this.io.to(`user:${userId}`).emit('message', data);
  }

  sendToGeneration(generationId: string, data: any): void {
    this.io.to(`generation:${generationId}`).emit('generation:update', data);
  }

  broadcastToAll(data: any): void {
    this.io.emit('broadcast', data);
  }

  getUserConnectionCount(userId: string): number {
    return this.userSockets.get(userId)?.size || 0;
  }

  isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId) && this.userSockets.get(userId)!.size > 0;
  }
}
```

## 8. Deployment architecture and performance optimization strategies

### 8.1 Deployment architecture design

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Front-end application
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://api:3001
      - NEXT_PUBLIC_WS_URL=ws://api:3001
    depends_on:
      - api
    networks:
      - app-network

  # API Serve
  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/aiimggen
      - REDIS_URL=redis://redis:6379
      - JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - REPLICATE_API_TOKEN=${REPLICATE_API_TOKEN}
      - STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    depends_on:
      - postgres
      - redis
    networks:
      - app-network

  # PostgreSQL database
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=aiimggen
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    networks:
      - app-network

  # Redis cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - app-network

  # Nginx load balancing
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - api
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### 8.2 Kubernetes Deployment configuration

```yaml
# k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: aiimggen

---
# k8s/configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: aiimggen
data:
  DATABASE_URL: "postgresql://postgres:password@postgres-service:5432/aiimggen"
  REDIS_URL: "redis://redis-service:6379"
  NEXT_PUBLIC_API_URL: "https://api.aiimggen.com"

---
# k8s/secret.yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: aiimggen
type: Opaque
data:
  JWT_ACCESS_SECRET: <base64-encoded-secret>
  JWT_REFRESH_SECRET: <base64-encoded-secret>
  REPLICATE_API_TOKEN: <base64-encoded-token>
  STRIPE_SECRET_KEY: <base64-encoded-key>
  AWS_ACCESS_KEY_ID: <base64-encoded-key>
  AWS_SECRET_ACCESS_KEY: <base64-encoded-secret>

---
# k8s/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-deployment
  namespace: aiimggen
spec:
  replicas: 3
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      containers:
      - name: api
        image: aiimggen/api:latest
        ports:
        - containerPort: 3001
        envFrom:
        - configMapRef:
            name: app-config
        - secretRef:
            name: app-secrets
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5

---
# k8s/api-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: api-service
  namespace: aiimggen
spec:
  selector:
    app: api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: ClusterIP

---
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deployment
  namespace: aiimggen
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: aiimggen/frontend:latest
        ports:
        - containerPort: 3000
        envFrom:
        - configMapRef:
            name: app-config
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "200m"

---
# k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: app-ingress
  namespace: aiimggen
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  tls:
  - hosts:
    - aiimggen.com
    - api.aiimggen.com
    secretName: aiimggen-tls
  rules:
  - host: aiimggen.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
  - host: api.aiimggen.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: api-service
            port:
               number: 80
```

### 8.3 Performance optimization strategies

#### 8.3.1 Front-end performance optimization

```typescript
// next.config.js
const nextConfig = {
  // Enable experimental features
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  // Image optimization
  images: {
    domains: ['replicate.delivery', 's3.amazonaws.com'],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  
  // Compression and optimization
  compress: true,
  poweredByHeader: false,
  
  // Webpack optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Code splitting optimization
    config.optimization.splitChunks = {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true,
        },
      },
    };
    
    // Bundle analyze
    if (process.env.ANALYZE === 'true') {
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          openAnalyzer: true,
        })
      );
    }
    
    return config;
  },
  
  // Head optimization
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
```

#### 8.3.2 Backend performance optimization

```typescript
// lib/performance/cache.ts
import Redis from 'ioredis';

export class CacheService {
  private redis: Redis;
  private defaultTTL = 3600; // 1Hour

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = this.defaultTTL): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache invalidate pattern error:', error);
    }
  }

  // cache decorator
  cache(ttl: number = this.defaultTTL) {
    return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
      const method = descriptor.value;
      
      descriptor.value = async function (...args: any[]) {
        const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;
        const cacheService = new CacheService();
        
        // Try to get from cache
        const cached = await cacheService.get(cacheKey);
        if (cached !== null) {
          return cached;
        }
        
        // Execute original method
        const result = await method.apply(this, args);
        
        // cache
        await cacheService.set(cacheKey, result, ttl);
        
        return result;
      };
    };
  }
}

// lib/performance/ratelimit.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { Redis } from 'ioredis';

interface RateLimitOptions {
  windowMs: number; // Time window (milliseconds)
  maxRequests: number; // Maximum number of requests
  keyGenerator?: (req: NextApiRequest) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export class RateLimitService {
  private redis: Redis;

  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!);
  }

  async isAllowed(key: string, options: RateLimitOptions): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    const now = Date.now();
    const window = Math.floor(now / options.windowMs);
    const redisKey = `ratelimit:${key}:${window}`;

    try {
      const current = await this.redis.incr(redisKey);
      
      if (current === 1) {
        await this.redis.expire(redisKey, Math.ceil(options.windowMs / 1000));
      }

      const remaining = Math.max(0, options.maxRequests - current);
      const resetTime = (window + 1) * options.windowMs;

      return {
        allowed: current <= options.maxRequests,
        remaining,
        resetTime,
      };
    } catch (error) {
      console.error('Rate limit check error:', error);
      // Allow requests to pass on error
      return {
        allowed: true,
        remaining: options.maxRequests,
        resetTime: now + options.windowMs,
      };
    }
  }

  middleware(options: RateLimitOptions) {
    return async (req: NextApiRequest, res: NextApiResponse, next: () => void) => {
      const key = options.keyGenerator ? options.keyGenerator(req) : req.ip || 'anonymous';
      const result = await this.isAllowed(key, options);

      // Set response headers
      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

      if (!result.allowed) {
        return res.status(429).json({
          success: false,
          error: 'Too many requests',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        });
      }

      next();
    };
  }
}
```

#### 8.3.3 Database performance optimization

```sql
-- Database index optimization
--User table index
CREATE INDEX CONCURRENTLY idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY idx_users_created_at ON users(created_at);
CREATE INDEX CONCURRENTLY idx_users_role ON users(role);

-- Image generation record index
CREATE INDEX CONCURRENTLY idx_generations_user_id ON generations(user_id);
CREATE INDEX CONCURRENTLY idx_generations_status ON generations(status);
CREATE INDEX CONCURRENTLY idx_generations_created_at ON generations(created_at);
CREATE INDEX CONCURRENTLY idx_generations_user_created ON generations(user_id, created_at DESC);

-- Points transaction record index
CREATE INDEX CONCURRENTLY idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX CONCURRENTLY idx_credit_transactions_type ON credit_transactions(type);
CREATE INDEX CONCURRENTLY idx_credit_transactions_created_at ON credit_transactions(created_at);
CREATE INDEX CONCURRENTLY idx_credit_transactions_user_created ON credit_transactions(user_id, created_at DESC);

-- Payment record index
CREATE INDEX CONCURRENTLY idx_payments_user_id ON payments(user_id);
CREATE INDEX CONCURRENTLY idx_payments_status ON payments(status);
CREATE INDEX CONCURRENTLY idx_payments_stripe_id ON payments(stripe_payment_intent_id);

-- Partition table design (partitioned by month)
CREATE TABLE generations_partitioned (
    LIKE generations INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE generations_2024_01 PARTITION OF generations_partitioned
    FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE generations_2024_02 PARTITION OF generations_partitioned
    FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Automatic partition management function
CREATE OR REPLACE FUNCTION create_monthly_partition(table_name text, start_date date)
RETURNS void AS $$
DECLARE
    partition_name text;
    end_date date;
BEGIN
    partition_name := table_name || '_' || to_char(start_date, 'YYYY_MM');
    end_date := start_date + interval '1 month';
    
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I PARTITION OF %I FOR VALUES FROM (%L) TO (%L)',
                   partition_name, table_name, start_date, end_date);
END;
$$ LANGUAGE plpgsql;

-- Query optimization view
CREATE MATERIALIZED VIEW user_generation_stats AS
SELECT 
    u.id as user_id,
    u.email,
    COUNT(g.id) as total_generations,
    COUNT(CASE WHEN g.status = 'completed' THEN 1 END) as completed_generations,
    COUNT(CASE WHEN g.created_at >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as recent_generations,
    MAX(g.created_at) as last_generation_at
FROM users u
LEFT JOIN generations g ON u.id = g.user_id
GROUP BY u.id, u.email;

-- Periodically refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY user_generation_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY monthly_generation_stats;
END;
$$ LANGUAGE plpgsql;
```

### 8.4 Monitoring and logging system

#### 8.4.1 Application monitoring

```typescript
// lib/monitoring/metrics.ts
import { createPrometheusMetrics } from 'prom-client';

export class MetricsService {
  private static instance: MetricsService;
  private metrics: any;

  private constructor() {
    this.initializeMetrics();
  }

  static getInstance(): MetricsService {
    if (!MetricsService.instance) {
      MetricsService.instance = new MetricsService();
    }
    return MetricsService.instance;
  }

  private initializeMetrics() {
    const client = require('prom-client');
    
    // Default indicator
    client.collectDefaultMetrics({ timeout: 5000 });

    this.metrics = {
      // HTTP request metrics
      httpRequestDuration: new client.Histogram({
        name: 'http_request_duration_seconds',
        help: 'Duration of HTTP requests in seconds',
        labelNames: ['method', 'route', 'status_code'],
        buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10],
      }),

      httpRequestTotal: new client.Counter({
        name: 'http_requests_total',
        help: 'Total number of HTTP requests',
        labelNames: ['method', 'route', 'status_code'],
      }),

      // business metrics
      generationTotal: new client.Counter({
        name: 'image_generations_total',
        help: 'Total number of image generations',
        labelNames: ['model', 'status'],
      }),

      generationDuration: new client.Histogram({
        name: 'image_generation_duration_seconds',
        help: 'Duration of image generation in seconds',
        labelNames: ['model'],
        buckets: [1, 5, 10, 30, 60, 120, 300],
      }),

      activeUsers: new client.Gauge({
        name: 'active_users_total',
        help: 'Number of active users',
      }),

      creditBalance: new client.Histogram({
        name: 'user_credit_balance',
        help: 'User credit balance distribution',
        buckets: [0, 10, 50, 100, 500, 1000, 5000],
      }),

      // System indicators
      databaseConnections: new client.Gauge({
        name: 'database_connections_active',
        help: 'Number of active database connections',
      }),

      redisConnections: new client.Gauge({
        name: 'redis_connections_active',
        help: 'Number of active Redis connections',
      }),
    };
  }

  // Record HTTP ask
  recordHttpRequest(method: string, route: string, statusCode: number, duration: number) {
    this.metrics.httpRequestTotal.inc({ method, route, status_code: statusCode });
    this.metrics.httpRequestDuration.observe({ method, route, status_code: statusCode }, duration);
  }

  // Record image generation
  recordGeneration(model: string, status: string, duration?: number) {
    this.metrics.generationTotal.inc({ model, status });
    if (duration && status === 'completed') {
      this.metrics.generationDuration.observe({ model }, duration);
    }
  }

  // Update the number of active users
  updateActiveUsers(count: number) {
    this.metrics.activeUsers.set(count);
  }

  // Record user points balance
  recordCreditBalance(balance: number) {
    this.metrics.creditBalance.observe(balance);
  }

  // Get indicators
  async getMetrics(): Promise<string> {
    const client = require('prom-client');
    return await client.register.metrics();
  }
}

// middleware
export function metricsMiddleware() {
  const metricsService = MetricsService.getInstance();
  
  return (req: any, res: any, next: any) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      const route = req.route?.path || req.url;
      
      metricsService.recordHttpRequest(
        req.method,
        route,
        res.statusCode,
        duration
      );
    });
    
    next();
  };
}
```

#### 8.4.2 Logging system

```typescript
// lib/logging/logger.ts
import winston from 'winston';
import 'winston-daily-rotate-file';

class Logger {
  private logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            ...meta,
          });
        })
      ),
      defaultMeta: {
        service: 'aiimggen-api',
        version: process.env.APP_VERSION || '1.0.0',
      },
      transports: [
        // console output
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
        }),
        
        // error log file
        new winston.transports.DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
        }),
        
        // All log files
        new winston.transports.DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
        }),
      ],
    });

    // Add external log service to production environment
    if (process.env.NODE_ENV === 'production') {
      // Add to ELK Stack or other log aggregation service
      this.addExternalTransports();
    }
  }

  private addExternalTransports() {
    // Example: add Elasticsearch transmission
    if (process.env.ELASTICSEARCH_URL) {
      const { ElasticsearchTransport } = require('winston-elasticsearch');
      
      this.logger.add(new ElasticsearchTransport({
        level: 'info',
        clientOpts: {
          node: process.env.ELASTICSEARCH_URL,
        },
        index: 'aiimggen-logs',
      }));
    }
  }

  info(message: string, meta?: any) {
    this.logger.info(message, meta);
  }

  error(message: string, error?: Error, meta?: any) {
    this.logger.error(message, { error: error?.stack, ...meta });
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, meta);
  }

  // Structured logging approach
  logUserAction(userId: string, action: string, details?: any) {
    this.info('User action', {
      userId,
      action,
      details,
      category: 'user_action',
    });
  }

  logApiRequest(req: any, res: any, duration: number) {
    this.info('API request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
      category: 'api_request',
    });
  }

  logGeneration(generationId: string, model: string, status: string, duration?: number) {
    this.info('Image generation', {
      generationId,
      model,
      status,
      duration,
      category: 'generation',
    });
  }

  logPayment(userId: string, amount: number, status: string, paymentId?: string) {
    this.info('Payment event', {
      userId,
      amount,
      status,
      paymentId,
      category: 'payment',
    });
  }
}

export const logger = new Logger();
```

### 8.5 security policy

#### 8.5.1 API Safety

```typescript
// lib/security/validation.ts
import Joi from 'joi';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

// Enter validation mode
export const validationSchemas = {
  // User registration
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
    name: Joi.string().min(2).max(50).required(),
  }),

  // image generation
  generateImage: Joi.object({
    prompt: Joi.string().min(1).max(1000).required(),
    model: Joi.string().valid('stable-diffusion', 'midjourney', 'dall-e').required(),
    width: Joi.number().integer().min(256).max(2048).default(512),
    height: Joi.number().integer().min(256).max(2048).default(512),
    steps: Joi.number().integer().min(1).max(100).default(20),
    guidance_scale: Joi.number().min(1).max(20).default(7.5),
  }),

  // Points purchase
  purchaseCredits: Joi.object({
    packageId: Joi.string().uuid().required(),
  }),
};

// Input validation middleware
export function validateInput(schema: Joi.ObjectSchema) {
  return (req: any, res: any, next: any) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.details.map(d => d.message),
      });
    }
    
    req.body = value;
    next();
  };
}

// Rate limit configuration
export const rateLimitConfigs = {
  // Universal API limit
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15minute
    max: 100, // Maximum 100 requests
    message: {
      success: false,
      error: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Certification related restrictions
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15minute
    max: 5, // Maximum of 5 login attempts
    message: {
      success: false,
      error: 'Too many authentication attempts, please try again later.',
    },
  }),

  // Image generation limitations
  generation: rateLimit({
    windowMs: 60 * 1000, // 1minute
    max: 10, // Generate up to 10 times
    message: {
      success: false,
      error: 'Generation rate limit exceeded, please wait before trying again.',
    },
  }),
};

// Security header configuration
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https://replicate.delivery', 'https://*.amazonaws.com'],
      scriptSrc: ["'self'", "'unsafe-eval'", 'https://js.stripe.com'],
      connectSrc: ["'self'", 'https://api.stripe.com', 'wss://'],
      frameSrc: ['https://js.stripe.com'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});
```

#### 8.5.2 Data encryption and privacy protection

```typescript
// lib/security/encryption.ts
import crypto from 'crypto';
import bcrypt from 'bcrypt';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private secretKey: Buffer;

  constructor() {
    this.secretKey = crypto.scryptSync(process.env.ENCRYPTION_KEY!, 'salt', 32);
  }

  // Encrypt sensitive data
  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.secretKey);
    cipher.setAAD(Buffer.from('aiimggen', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  // Decrypt sensitive data
  decrypt(encryptedData: { encrypted: string; iv: string; tag: string }): string {
    const decipher = crypto.createDecipher(this.algorithm, this.secretKey);
    decipher.setAAD(Buffer.from('aiimggen', 'utf8'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // Password hash
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Verify password
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  // Generate security token
  generateSecureToken(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  // HMAC sign
  createHMAC(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  // verify HMAC sign
  verifyHMAC(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.createHMAC(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  }
}

// Data desensitization tool
export class DataMaskingService {
  // Email desensitization
  maskEmail(email: string): string {
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2 
      ? username[0] + '*'.repeat(username.length - 2) + username[username.length - 1]
      : '*'.repeat(username.length);
    return `${maskedUsername}@${domain}`;
  }

  // Mobile phone number desensitization
  maskPhone(phone: string): string {
    if (phone.length < 4) return '*'.repeat(phone.length);
    return phone.slice(0, 3) + '*'.repeat(phone.length - 6) + phone.slice(-3);
  }

  // IP Address desensitization
  maskIP(ip: string): string {
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.*.* `;
    }
    return ip;
  }

  // user ID Desensitization (for logging)
  maskUserId(userId: string): string {
    if (userId.length < 8) return '*'.repeat(userId.length);
    return userId.slice(0, 4) + '*'.repeat(userId.length - 8) + userId.slice(-4);
  }
}
```

## 9. Summary

This technical design document details the AI The complete technical architecture and implementation plan of the image generation platform covers:

### 9.1 Core features
- **Microservice architecture**: Modular design that is easier to scale and maintain
- **High performance**: Multi-layer caching, database optimization, and CDN acceleration
- **High availability**: Load balancing, failover, monitoring, and alerting
- **Security**: Multi-factor authentication, data encryption, and access control
- **Scalability**: Containerized deployment, auto-scaling, and cloud-native architecture

### 9.2 Technical Highlights
- **Real-time communication**: WebSocket support enables live updates for generation status
- **Smart caching**: Redis-based multi-layer caching improves response speed
- **Flexible architecture**: Kubernetes deployment supports automatic scaling
- **Comprehensive monitoring**: Prometheus and Grafana provide system-wide observability
- **Security protection**: Multi-layer security strategies protect user data

### 9.3 Deployment recommendations
1. **Development environment**: Use Docker Compose for fast local setup
2. **Test environment**: Use a Kubernetes cluster to simulate production
3. **Production environment**: Host the platform on a managed Kubernetes service
4. **Monitoring and operations**: Integrate APM tools and centralized log aggregation

This architectural design ensures the high performance, high availability and good user experience of the platform, providing AI The rapid development of the image generation business provides a solid technical foundation.
