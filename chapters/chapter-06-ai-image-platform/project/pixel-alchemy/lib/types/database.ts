export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          username: string | null;
          avatar_url: string | null;
          credits: number;
          subscription_tier: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username?: string | null;
          avatar_url?: string | null;
          credits?: number;
          subscription_tier?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string | null;
          avatar_url?: string | null;
          credits?: number;
          subscription_tier?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      generation_tasks: {
        Row: {
          id: string;
          user_id: string;
          task_type: string;
          prompt: string;
          negative_prompt: string | null;
          model_config: any;
          status: string;
          replicate_prediction_id: string | null;
          input_images: any | null;
          output_images: any | null;
          cost_credits: number;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_type: string;
          prompt: string;
          negative_prompt?: string | null;
          model_config: any;
          status?: string;
          replicate_prediction_id?: string | null;
          input_images?: any | null;
          output_images?: any | null;
          cost_credits?: number;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_type?: string;
          prompt?: string;
          negative_prompt?: string | null;
          model_config?: any;
          status?: string;
          replicate_prediction_id?: string | null;
          input_images?: any | null;
          output_images?: any | null;
          cost_credits?: number;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_images: {
        Row: {
          id: string;
          user_id: string;
          task_id: string | null;
          title: string | null;
          image_url: string;
          thumbnail_url: string | null;
          prompt: string | null;
          negative_prompt: string | null;
          width: number | null;
          height: number | null;
          generation_type: string | null;
          parameters: any | null;
          credits_used: number;
          is_public: boolean;
          tags: string[] | null;
          metadata: any | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          task_id?: string | null;
          title?: string | null;
          image_url: string;
          thumbnail_url?: string | null;
          prompt?: string | null;
          negative_prompt?: string | null;
          width?: number | null;
          height?: number | null;
          generation_type?: string | null;
          parameters?: any | null;
          credits_used?: number;
          is_public?: boolean;
          tags?: string[] | null;
          metadata?: any | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          task_id?: string | null;
          title?: string | null;
          image_url?: string;
          thumbnail_url?: string | null;
          prompt?: string | null;
          negative_prompt?: string | null;
          width?: number | null;
          height?: number | null;
          generation_type?: string | null;
          parameters?: any | null;
          credits_used?: number;
          is_public?: boolean;
          tags?: string[] | null;
          metadata?: any | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          transaction_type: string;
          amount: number;
          stripe_payment_intent_id: string | null;
          description: string | null;
          related_id: string | null;
          metadata: any | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transaction_type: string;
          amount: number;
          stripe_payment_intent_id?: string | null;
          description?: string | null;
          related_id?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          transaction_type?: string;
          amount?: number;
          stripe_payment_intent_id?: string | null;
          description?: string | null;
          related_id?: string | null;
          metadata?: any | null;
          created_at?: string;
        };
      };
      stripe_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id: string | null;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_subscription_id: string;
          stripe_customer_id?: string | null;
          status: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_subscription_id?: string;
          stripe_customer_id?: string | null;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          package_id: string;
          credits: number;
          amount: number;
          currency: string;
          status: string;
          stripe_payment_intent_id: string | null;
          stripe_session_id: string | null;
          paid_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          package_id: string;
          credits: number;
          amount: number;
          currency?: string;
          status?: string;
          stripe_payment_intent_id?: string | null;
          stripe_session_id?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          package_id?: string;
          credits?: number;
          amount?: number;
          currency?: string;
          status?: string;
          stripe_payment_intent_id?: string | null;
          stripe_session_id?: string | null;
          paid_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      user_stats: {
        Row: {
          id: string;
          email: string;
          username: string | null;
          credits: number;
          total_images: number;
          total_credits_used: number;
          images_last_30_days: number;
          joined_at: string;
        };
      };
      user_statistics: {
        Row: {
          user_id: string;
          total_generations: number;
          total_credits_used: number;
          current_month_generations: number;
          current_month_credits_used: number;
        };
      };
      monthly_user_statistics: {
        Row: {
          user_id: string;
          month: string;
          generations: number;
          credits_used: number;
          text2img_count: number;
          img2img_count: number;
          style_transfer_count: number;
        };
      };
      daily_credits_analysis: {
        Row: {
          user_id: string;
          date: string;
          usage_amount: number;
          purchase_amount: number;
          bonus_amount: number;
        };
      };
      generation_type_distribution: {
        Row: {
          user_id: string;
          type: string | null;
          count: number;
          percentage: number;
        };
      };
    };
    Functions: {
      consume_user_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_related_id?: string;
          p_description?: string;
        };
        Returns: boolean;
      };
      update_user_credits: {
        Args: {
          p_user_id: string;
          p_amount: number;
          p_type: string;
          p_description: string;
          p_related_id?: string;
        };
        Returns: boolean;
      };
    };
  };
}
