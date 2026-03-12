# AI Image Generation Platform PRD

## 1. Product overview

### 1.1 Product positioning
Commercial AI image generation platform built on the Replicate API and the Nano Banana model, providing creatives, content creators, and marketers with professional-grade image generation and editing workflows.

### 1.2 Core value proposition
- **Character consistency**: Supports multi-round editing while preserving character identity and style consistency
- **Comprehensive functionality**: Covers text-to-image, image-to-image, style transfer, and image optimization workflows
- **Business-friendly pricing**: A usage-based credits model that flexibly supports different customer needs
- **Professional quality**: Uses advanced AI models to deliver high-quality image generation services

### 1.3 Target users
- **Creative professionals**: Designers, illustrators, and artists
- **Content creators**: Bloggers, video creators, and writers
- **Marketers**: Advertising planners, brand teams, and e-commerce operators

## 2. Core functions

### 2.1 Text-to-Image
**Function description**: The user enters a text prompt and the AI generates corresponding images.

**Core features**:
- Support Chinese and English prompt words
- Multiple art styles to choose from (realistic, cartoon, oil painting, watercolor, etc.)
- Adjustable image size and quality
- Batch generation function
- Tip word optimization suggestions

**User flow**:
1. Enter text description
2. Select style and parameters
3. Click Generate
4. Preview and download results

### 2.2 Image-to-Image
**Function description**: Edit and regenerate images based on an existing source image.

**Core features**:
- Single picture editing
- Multi-image fusion
- Partial editing function
- Keep the original composition of the picture
- Style change

**User flow**:
1. Upload original image
2. Select editing mode
3. Set editing parameters
4. Generate new pictures
5. Compare and save

### 2.3 Style Transfer
**Function description**: Apply the artistic style of one image to another.

**Core features**:
- Art style transfer
- Adjustable intensity
- Preset style templates
- Custom style upload

### 2.4 Image Enhancement
**Function description**: Automatically optimize image quality and format.

**Core features**:
- Smart compression
- format conversion (JPG, PNG, WebP)
- Resolution adjustment
- Batch processing

## 3. Technical architecture

### 3.1 technology stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **AI service**: Replicate API + Nano Banana model
- **Payments**: Stripe
- **Storage**: Supabase Storage / AWS S3
- **Deployment**: Vercel

### 3.2 System architecture
```
user interface (Next.js)
    ↓
API layer (Next.js API Routes)
    ↓
business logic layer
    ↓
external service layer (Replicate API, Stripe, Supabase)
```

### 3.3 data model

#### User table (users)
- id: UUID
- email: string
- name: string
- avatar_url: string
- credits: integer
- subscription_tier: enum
- created_at: timestamp
- updated_at: timestamp

#### image table (images)
- id: UUID
- user_id: UUID
- title: string
- prompt: text
- image_url: string
- thumbnail_url: string
- generation_type: enum (text2img, img2img, style_transfer)
- parameters: jsonb
- credits_used: integer
- created_at: timestamp

#### Points transaction table (credit_transactions)
- id: UUID
- user_id: UUID
- amount: integer
- type: enum (purchase, usage, refund)
- description: string
- stripe_payment_id: string
- created_at: timestamp

## 4. Page structure

### 4.1 landing page (Landing Page)
**Path**: `/`
**Function**:
- Product introduction and value proposition
- Function display
-User cases
- Pricing information
- Registration/login portal

### 4.2 Generate workbench (Generation Studio)
**Path**: `/studio`
**Function**:
- Vincent diagram interface
- Picture-generating interface
- Style migration interface
- Parameter adjustment panel
- Live preview
- History

### 4.3 Library management (Gallery)
**Path**: `/gallery`
**Function**:
- Personal work display
- Classification management
- Search and filter
- Batch operations
- Share function

### 4.4 User Center (Profile)
**Path**: `/profile`
**Function**:
- Personal information management
- View points balance
- usage statistics
- Order history
- Setting options

### 4.5 Pricing page (Pricing)
**Path**: `/pricing`
**Function**:
- Points package display
- Function comparison
- Payment process
- Promotions

## 5. business model

### 5.1 points system
**Basic rules**:
- 1 integral = 1 sub-base image generation
- High-quality production costs more points
- Points never expire

**Consumption standards**:
- Vincentian pictures: 1-3 points/picture
- Drawing pictures: 2-4 points/picture
- Style transfer: 1-2 points/photo
- High resolution generation: extra +1 integral

### 5.2 Pricing strategy

#### Points package pricing
- **Starter package**: 100 credits - ¥29
- **Standard package**: 300 credits - ¥79 (save ¥8)
- **Professional package**: 800 credits - ¥199 (save ¥33)
- **Enterprise package**: 2000 credits - ¥459 (save ¥121)

#### Subscription model (future expansion)
- **Monthly subscription**: 500 credits per month - ¥99/month
- **Annual subscription**: 600 credits per month - ¥999/year

### 5.3 revenue model
- **Credit sales**: Primary revenue source
- **API costs**: Paid to Replicate
- **Platform service margin**: 15-20% gross margin target

## 6. user experience design

### 6.1 design principles
- **Simple and intuitive**: Reduce the learning curve
- **Responsive design**: Support access across devices
- **Performance first**: Keep loading fast and interactions responsive
- **Accessibility**: Conform to WCAG standards

### 6.2 key user flows

#### New user registration process
1. Visit the landing page
2. Click the Register button
3. Fill in the basic information
4. Email verification
5. Earn novice points
6. Boot tutorial

#### Image generation process
1. Select the generation type
2. Enter prompt word/upload picture
3. Adjust parameters
4. Confirm points consumption
5. Start generating
6. View results
7. Save/Share

## 7. Technical implementation plan

### 7.1 Front-end architecture
```typescript
// Project structure
src/
├── app/                 # Next.js 13+ App Router
│   ├── (auth)/         # Certification related pages
│   ├── studio/         # Generate workbench
│   ├── gallery/        # Library management
│   └── api/            # API routing
├── components/         # Reusable components
├── lib/               # Tool functions and configuration
├── hooks/             # Customize Hooks
└── types/             # TypeScript type definition
```

### 7.2 Status management
- **Zustand**: Global state management
- **React Query**: Server-state management
- **React Hook Form**: Form-state management

### 7.3 API design

#### image generation API
```typescript
POST /api/generate
{
  "type": "text2img" | "img2img" | "style_transfer",
  "prompt": string,
  "image_url"?: string,
  "style_url"?: string,
  "parameters": {
    "width": number,
    "height": number,
    "quality": "standard" | "high",
    "style": string
  }
}
```

#### Points management API
```typescript
GET /api/credits
POST /api/credits/purchase
GET /api/credits/transactions
```

### 7.4 security measures
- **Authentication**: Supabase Auth
- **API rate limiting**: Prevent abuse
- **Content moderation**: Filter inappropriate content
- **Data encryption**: Encrypt sensitive information at rest and in transit

## 8. development plan

### 8.1 MVP Stage (4-6 weeks)
- [ ] Basic project construction
- [ ] User authentication system
- [ ] Vincent chart function
- [ ] points system
- [ ] Payment integration
- [ ] Base UI interface

### 8.2 Beta Phase (2-3 weeks)
- [ ] Picture-generating function
- [ ] style transfer
- [ ] Library management
- [ ] User Center
- [ ] Performance optimization

### 8.3 Official release (1-2 weeks)
- [ ] Image optimization features
- [ ] Advanced parameter adjustment
- [ ] Batch processing
- [ ] Share function
- [ ] User feedback system

## 9. Success Metrics

### 9.1 business metrics
- **User registrations**: Goal of 1,000+ users per month
- **Paid conversion rate**: Goal of 15%+
- **Monthly revenue**: Target of ¥50,000+
- **User retention rate**: 7-day retention above 30%

### 9.2 Technical indicators
- **Page load time**: Less than 2 seconds
- **API response time**: Less than 500 ms
- **System availability**: Greater than 99.5%
- **Image generation success rate**: Greater than 95%

## 10. risk assessment

### 10.1 technology risk
- **API dependency**: Stability of the Replicate API
- **Cost control**: Managing AI inference costs
- **Performance bottlenecks**: Handling high concurrency

### 10.2 business risk
- **Market competition**: Competition from similar products
- **User acquisition**: Marketing and growth costs
- **Compliance risk**: Content moderation and copyright issues

### 10.3 coping strategies
- **Support multiple APIs**: Reduce dependence on a single provider
- **Smart caching**: Reduce repeated calls and lower cost
- **Content moderation**: Establish a robust review workflow
- **User education**: Provide guidance and best practices

---

**Document version**: v1.0  
**Creation date**: January 2024  
**Update date**: January 2024  
**Owner**: Product team
