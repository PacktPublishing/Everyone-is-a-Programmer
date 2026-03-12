import Replicate from 'replicate';

export interface GenerationParams {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  steps?: number;
  guidanceScale?: number;
  seed?: number;
  modelVersion?: string;
  inputImage?: string;
  maskImage?: string;
  denoisingStrength?: number;
}

export interface GenerationResult {
  id: string;
  status: string;
  urls?: string[];
  output?: any;
  error?: string;
}

export interface GenerationStatus {
  id: string;
  status: string;
  progress: number;
  output?: any;
  error?: string;
  logs?: string;
}

export class ReplicateClient {
  private client: Replicate;
  
  constructor() {
    this.client = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });
  }

  async generateImage(params: GenerationParams): Promise<GenerationResult> {
    try {
      const prediction = await this.client.predictions.create({
        version: params.modelVersion || "19deaef633fd44776c82edf39fd60e95a7250b8ececf11a725229dc75a81f9ca", // Nano Banana
        input: {
          prompt: params.prompt,
          negative_prompt: params.negativePrompt,
          width: params.width || 1024,
          height: params.height || 1024,
          num_inference_steps: params.steps || 20,
          guidance_scale: params.guidanceScale || 7.5,
          seed: params.seed,
          ...(params.inputImage && { image: params.inputImage }),
          ...(params.maskImage && { mask: params.maskImage }),
          ...(params.denoisingStrength && { denoising_strength: params.denoisingStrength })
        }
      });
      
      return {
        id: prediction.id,
        status: prediction.status,
        urls: prediction.urls,
        output: prediction.output
      };
    } catch (error) {
      console.error('Replicate API error:', error);
      throw new Error('Failed to generate image');
    }
  }

  async getGenerationStatus(predictionId: string): Promise<GenerationStatus> {
    try {
      const prediction = await this.client.predictions.get(predictionId);
      
      return {
        id: prediction.id,
        status: prediction.status,
        progress: this.calculateProgress(prediction),
        output: prediction.output,
        error: prediction.error,
        logs: prediction.logs?.join('\n')
      };
    } catch (error) {
      console.error('Failed to get prediction status:', error);
      throw new Error('Failed to get generation status');
    }
  }

  async cancelGeneration(predictionId: string): Promise<void> {
    try {
      await this.client.predictions.cancel(predictionId);
    } catch (error) {
      console.error('Failed to cancel prediction:', error);
      throw new Error('Failed to cancel generation');
    }
  }

  private calculateProgress(prediction: any): number {
    if (prediction.status === 'succeeded') return 100;
    if (prediction.status === 'failed') return 0;
    if (prediction.status === 'canceled') return 0;
    
    // Based on log parsing progress
    const logs = prediction.logs || [];
    const logText = logs.join('\n');
    const progressMatch = logText.match(/(\d+)%/);
    return progressMatch ? parseInt(progressMatch[1]) : 0;
  }
}

// Singleton instance
export const replicateClient = new ReplicateClient();
