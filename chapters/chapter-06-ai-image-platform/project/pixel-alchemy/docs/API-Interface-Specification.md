# AI Image generation platform - API Interface specification

## 1. API Overview

### 1.1 Basic information
- **Base URL**: `https://api.yourapp.com/v1`
- **Authentication method**: Bearer Token (JWT)
- **Data format**: JSON
- **character encoding**: UTF-8

### 1.2 Common response format
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
    requestId: string;
  };
}
```

### 1.3 Error code specification
```typescript
enum ErrorCode {
  // Common errors (1000-1999)
  INVALID_REQUEST = '1001',
  UNAUTHORIZED = '1002',
  FORBIDDEN = '1003',
  NOT_FOUND = '1004',
  RATE_LIMITED = '1005',
  
  // User related (2000-2999)
  USER_NOT_FOUND = '2001',
  EMAIL_ALREADY_EXISTS = '2002',
  INVALID_CREDENTIALS = '2003',
  
  // Points related (3000-3999)
  INSUFFICIENT_CREDITS = '3001',
  INVALID_CREDIT_AMOUNT = '3002',
  PAYMENT_FAILED = '3003',
  
  // Image generation related (4000-4999)
  GENERATION_FAILED = '4001',
  INVALID_IMAGE_FORMAT = '4002',
  IMAGE_TOO_LARGE = '4003',
  CONTENT_VIOLATION = '4004',
  
  // System errors (5000-5999)
  INTERNAL_ERROR = '5001',
  SERVICE_UNAVAILABLE = '5002',
  EXTERNAL_API_ERROR = '5003'
}
```

## 2. Certification related API

### 2.1 User registration
```http
POST /auth/register
```

**Request body**:
```typescript
interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  referralCode?: string;
}
```

**response**:
```typescript
interface RegisterResponse {
  user: {
    id: string;
    email: string;
    name: string;
    credits: number;
    createdAt: string;
  };
  token: string;
  refreshToken: string;
}
```

### 2.2 User login
```http
POST /auth/login
```

**Request body**:
```typescript
interface LoginRequest {
  email: string;
  password: string;
}
```

**response**:
```typescript
interface LoginResponse {
  user: User;
  token: string;
  refreshToken: string;
}
```

### 2.3 refresh token
```http
POST /auth/refresh
```

**Request body**:
```typescript
interface RefreshRequest {
  refreshToken: string;
}
```

### 2.4 forget the password
```http
POST /auth/forgot-password
```

**Request body**:
```typescript
interface ForgotPasswordRequest {
  email: string;
}
```

## 3. User management API

### 3.1 Get user information
```http
GET /users/profile
```

**response**:
```typescript
interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  credits: number;
  subscriptionTier: 'free' | 'pro' | 'enterprise';
  stats: {
    totalGenerations: number;
    totalCreditsUsed: number;
    joinedAt: string;
  };
}
```

### 3.2 Update user information
```http
PUT /users/profile
```

**Request body**:
```typescript
interface UpdateProfileRequest {
  name?: string;
  avatarUrl?: string;
}
```

### 3.3 Get user statistics
```http
GET /users/stats
```

**query parameters**:
- `period`: `day` | `week` | `month` | `year`
- `startDate`: ISO 8601 date
- `endDate`: ISO 8601 date

**response**:
```typescript
interface UserStats {
  period: string;
  generations: {
    total: number;
    byType: {
      textToImage: number;
      imageToImage: number;
      styleTransfer: number;
    };
  };
  creditsUsed: number;
  dailyBreakdown?: Array<{
    date: string;
    generations: number;
    creditsUsed: number;
  }>;
}
```

### 3.4 Get user detailed statistics
```http
GET /users/statistics
```

**query parameters**:
- `timeRange`: `3months` | `6months` | `1year` (default: `6months`)

**response**:
```typescript
interface UserDetailedStats {
  overview: {
    totalGenerations: number;
    monthlyGenerations: number;
    totalCreditsUsed: number;
    timeSaved: number;
  };
  monthlyTrend: Array<{
    month: string;
    generations: number;
    creditsUsed: number;
  }>;
  creditsAnalysis: Array<{
    date: string;
    amount: number;
    type: 'usage' | 'purchase';
  }>;
  typeDistribution: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}
```

### 3.5 Get user generated history
```http
GET /users/generation-history
```

**query parameters**:
- `page`: Page number (default: 1)
- `limit`: Number of pages per page (Default: 20, Maximum: 100)
- `type`: `text2img` | `img2img` | `style_transfer`
- `status`: `completed` | `failed` | `processing`
- `dateFrom`: start date (YYYY-MM-DD)
- `dateTo`: end date (YYYY-MM-DD)
- `search`: Search keywords

**response**:
```typescript
interface GenerationHistoryResponse {
  records: Array<{
    id: string;
    createdAt: string;
    type: string;
    prompt: string;
    creditsUsed: number;
    status: string;
    imageUrl?: string;
    settings: Record<string, any>;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

## 4. Points management API

### 4.1 Get points balance
```http
GET /credits/balance
```

**response**:
```typescript
interface CreditBalance {
  current: number;
  pending: number;
  lastUpdated: string;
}
```

### 4.2 Get points transaction records
```http
GET /credits/transactions
```

**query parameters**:
- `page`: Page number (default: 1)
- `limit`: Number of pages per page (Default: 20, Maximum: 100)
- `type`: `purchase` | `usage` | `refund` | `bonus`
- `startDate`: start date
- `endDate`: end date

**response**:
```typescript
interface CreditTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund' | 'bonus';
  amount: number;
  description: string;
  relatedId?: string; // associated ordersIDor generateID
  createdAt: string;
}
```

### 4.3 Create a points purchase order
```http
POST /credits/purchase
```

**Request body**:
```typescript
interface PurchaseCreditsRequest {
  packageId: string;
  paymentMethod: 'stripe';
  successUrl?: string;
  cancelUrl?: string;
}
```

**response**:
```typescript
interface PurchaseCreditsResponse {
  orderId: string;
  paymentUrl: string;
  amount: number;
  credits: number;
  expiresAt: string;
}
```

### 4.4 Verify points purchase
```http
POST /credits/verify-purchase
```

**Request body**:
```typescript
interface VerifyPurchaseRequest {
  orderId: string;
  paymentIntentId: string;
}
```

## 5. image generation API

### 5.1 Vincentian picture
```http
POST /generate/text-to-image
```

**Request body**:
```typescript
interface TextToImageRequest {
  prompt: string;
  negativePrompt?: string;
  style?: string;
  parameters: {
    width: 512 | 768 | 1024;
    height: 512 | 768 | 1024;
    quality: 'standard' | 'high';
    numImages: 1 | 2 | 3 | 4;
    seed?: number;
    guidanceScale?: number; // 1-20, Default 7.5
    steps?: number; // 10-50, Default 20
  };
}
```

**response**:
```typescript
interface GenerationResponse {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  images?: Array<{
    id: string;
    url: string;
    thumbnailUrl: string;
    width: number;
    height: number;
  }>;
  creditsUsed: number;
  estimatedTime?: number; // Second
  createdAt: string;
}
```

### 5.2 Tu Sheng Tu
```http
POST /generate/image-to-image
```

**Request body**:
```typescript
interface ImageToImageRequest {
  imageUrl: string;
  prompt: string;
  negativePrompt?: string;
  parameters: {
    strength: number; // 0.1-1.0
    quality: 'standard' | 'high';
    numImages: 1 | 2 | 3 | 4;
    seed?: number;
    guidanceScale?: number;
    steps?: number;
  };
  mask?: {
    maskUrl: string;
    invertMask: boolean;
  };
}
```

### 5.3 style transfer
```http
POST /generate/style-transfer
```

**Request body**:
```typescript
interface StyleTransferRequest {
  contentImageUrl: string;
  styleImageUrl: string;
  parameters: {
    strength: number; // 0.1-1.0
    quality: 'standard' | 'high';
    preserveContent: boolean;
  };
}
```

### 5.4 Get build status
```http
GET /generate/{generationId}/status
```

**response**:
```typescript
interface GenerationStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  estimatedTimeRemaining?: number; // Second
  error?: string;
  images?: GeneratedImage[];
  createdAt: string;
  completedAt?: string;
}
```

### 5.5 Cancel generation
```http
DELETE /generate/{generationId}
```

## 6. Library management API

### 6.1 Get picture list
```http
GET /images
```

**query parameters**:
- `page`: Page number
- `limit`: Quantity per page
- `type`: Build type filter
- `search`: Search keywords
- `sortBy`: `createdAt` | `updatedAt` | `title`
- `sortOrder`: `asc` | `desc`
- `startDate`: start date
- `endDate`: end date

**response**:
```typescript
interface ImageListResponse {
  images: Array<{
    id: string;
    title: string;
    prompt: string;
    imageUrl: string;
    thumbnailUrl: string;
    width: number;
    height: number;
    generationType: 'text2img' | 'img2img' | 'style_transfer';
    creditsUsed: number;
    isPublic: boolean;
    createdAt: string;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### 6.2 Get details of a single image
```http
GET /images/{imageId}
```

**response**:
```typescript
interface ImageDetail {
  id: string;
  title: string;
  prompt: string;
  negativePrompt?: string;
  imageUrl: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  generationType: string;
  parameters: Record<string, any>;
  creditsUsed: number;
  isPublic: boolean;
  tags: string[];
  metadata: {
    model: string;
    seed: number;
    steps: number;
    guidanceScale: number;
  };
  createdAt: string;
  updatedAt: string;
}
```

### 6.3 Update picture information
```http
PUT /images/{imageId}
```

**Request body**:
```typescript
interface UpdateImageRequest {
  title?: string;
  isPublic?: boolean;
  tags?: string[];
}
```

### 6.4 Delete picture
```http
DELETE /images/{imageId}
```

### 6.5 Batch operations
```http
POST /images/batch
```

**Request body**:
```typescript
interface BatchImageRequest {
  action: 'delete' | 'updateVisibility' | 'addTags';
  imageIds: string[];
  data?: {
    isPublic?: boolean;
    tags?: string[];
  };
}
```

## 7. File upload API

### 7.1 Get upload signature
```http
POST /upload/presigned-url
```

**Request body**:
```typescript
interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
  purpose: 'avatar' | 'source_image' | 'style_image';
}
```

**response**:
```typescript
interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  fields: Record<string, string>;
  expiresAt: string;
}
```

### 7.2 Confirm upload is complete
```http
POST /upload/confirm
```

**Request body**:
```typescript
interface ConfirmUploadRequest {
  fileUrl: string;
  purpose: string;
}
```

## 8. system API

### 8.1 health check
```http
GET /health
```

**response**:
```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    replicate: 'up' | 'down';
    storage: 'up' | 'down';
    payment: 'up' | 'down';
  };
}
```

### 8.2 Get system configuration
```http
GET /config
```

**response**:
```typescript
interface SystemConfig {
  features: {
    textToImage: boolean;
    imageToImage: boolean;
    styleTransfer: boolean;
    batchGeneration: boolean;
  };
  limits: {
    maxImageSize: number;
    maxFileSize: number;
    maxBatchSize: number;
    dailyGenerationLimit: number;
  };
  pricing: {
    packages: Array<{
      id: string;
      name: string;
      credits: number;
      price: number;
      currency: string;
      popular?: boolean;
    }>;
  };
}
```

## 9. Data model definition

### 9.1 user model (User)
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  credits INTEGER DEFAULT 0,
  subscription_tier VARCHAR(20) DEFAULT 'free',
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

### 9.2 image model (Image)
```sql
CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200),
  prompt TEXT NOT NULL,
  negative_prompt TEXT,
  image_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  generation_type VARCHAR(20) NOT NULL,
  parameters JSONB,
  credits_used INTEGER NOT NULL,
  is_public BOOLEAN DEFAULT false,
  tags TEXT[],
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_images_user_id ON images(user_id);
CREATE INDEX idx_images_created_at ON images(created_at);
CREATE INDEX idx_images_generation_type ON images(generation_type);
CREATE INDEX idx_images_is_public ON images(is_public);
CREATE INDEX idx_images_tags ON images USING GIN(tags);
```

### 9.3 Points trading model (CreditTransaction)
```sql
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  related_id UUID,
  stripe_payment_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(transaction_type);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at);
```

### 9.4 Generate task model (GenerationTask)
```sql
CREATE TABLE generation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  prompt TEXT NOT NULL,
  parameters JSONB NOT NULL,
  credits_required INTEGER NOT NULL,
  replicate_prediction_id VARCHAR(255),
  result_images JSONB,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_generation_tasks_user_id ON generation_tasks(user_id);
CREATE INDEX idx_generation_tasks_status ON generation_tasks(status);
CREATE INDEX idx_generation_tasks_created_at ON generation_tasks(created_at);
```

### 9.5 order model (Order)
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  package_id VARCHAR(50) NOT NULL,
  credits INTEGER NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'CNY',
  status VARCHAR(20) DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  stripe_session_id VARCHAR(255),
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

## 10. Database views and functions

### 10.1 User statistics view
```sql
CREATE VIEW user_stats AS
SELECT 
  u.id,
  u.email,
  u.name,
  u.credits,
  COUNT(i.id) as total_images,
  SUM(i.credits_used) as total_credits_used,
  COUNT(CASE WHEN i.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as images_last_30_days,
  u.created_at as joined_at
FROM users u
LEFT JOIN images i ON u.id = i.user_id
GROUP BY u.id, u.email, u.name, u.credits, u.created_at;

-- User statistics view
CREATE VIEW user_statistics AS
SELECT 
  u.id as user_id,
  COUNT(i.id) as total_generations,
  COALESCE(SUM(i.credits_used), 0) as total_credits_used,
  COUNT(CASE WHEN i.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as current_month_generations,
  COALESCE(SUM(CASE WHEN i.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN i.credits_used ELSE 0 END), 0) as current_month_credits_used
FROM users u
LEFT JOIN images i ON u.id = i.user_id
GROUP BY u.id;

-- monthly statistics view
CREATE VIEW monthly_user_statistics AS
SELECT 
  u.id as user_id,
  DATE_TRUNC('month', i.created_at) as month,
  COUNT(i.id) as generations,
  COALESCE(SUM(i.credits_used), 0) as credits_used,
  COUNT(CASE WHEN i.generation_type = 'text2img' THEN 1 END) as text2img_count,
  COUNT(CASE WHEN i.generation_type = 'img2img' THEN 1 END) as img2img_count,
  COUNT(CASE WHEN i.generation_type = 'style_transfer' THEN 1 END) as style_transfer_count
FROM users u
LEFT JOIN images i ON u.id = i.user_id
WHERE i.created_at IS NOT NULL
GROUP BY u.id, DATE_TRUNC('month', i.created_at)
ORDER BY u.id, month DESC;

-- Points consumption analysis view
CREATE VIEW daily_credits_analysis AS
SELECT 
  user_id,
  DATE(created_at) as date,
  SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as usage_amount,
  SUM(CASE WHEN amount > 0 AND type = 'purchase' THEN amount ELSE 0 END) as purchase_amount,
  SUM(CASE WHEN amount > 0 AND type = 'bonus' THEN amount ELSE 0 END) as bonus_amount
FROM credit_transactions
GROUP BY user_id, DATE(created_at)
ORDER BY user_id, date DESC;

-- Generate type distribution view
CREATE VIEW generation_type_distribution AS
SELECT 
  user_id,
  generation_type as type,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY user_id), 1) as percentage
FROM images
GROUP BY user_id, generation_type;
```

### 10.2 Points balance update function
```sql
CREATE OR REPLACE FUNCTION update_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_type VARCHAR(20),
  p_description TEXT,
  p_related_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Check whether the points are sufficient (if it is a deduction operation)
  IF p_amount < 0 THEN
    IF (SELECT credits FROM users WHERE id = p_user_id) < ABS(p_amount) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Update user points
  UPDATE users 
  SET credits = credits + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- record transaction
  INSERT INTO credit_transactions (
    user_id, amount, type, description, related_id
  ) VALUES (
    p_user_id, p_amount, p_type, p_description, p_related_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

## 11. API safety regulations

### 11.1 Authentication and authorization
- use JWT Token Perform identity authentication
- Token Validity: 1 hour for access tokens, 30 days for refresh tokens
- Sensitive operations require password re-verification

### 11.2 Request limits
```typescript
// Current limiting configuration
const rateLimits = {
  // Certification related
  '/auth/login': { requests: 5, window: '15m' },
  '/auth/register': { requests: 3, window: '1h' },
  
  // image generation
  '/generate/*': { requests: 10, window: '1m' },
  
  // Universal API
  default: { requests: 100, window: '1m' }
};
```

### 11.3 Data validation
- All input parameters undergo strict validation
- Image file type and size limits
- Prompt word content review
- SQL injection protection

### 11.4 Error handling
- Does not expose sensitive system information
- Unified error response format
- Detailed logging
- Error monitoring and alerting

---

**Document version**: v1.0  
**Creation date**: 2024January  
**person in charge**: Backend team
