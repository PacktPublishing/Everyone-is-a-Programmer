-- User statistics view
CREATE VIEW user_stats AS
SELECT 
  u.id,
  u.email,
  up.username,
  up.credits,
  COUNT(ui.id) as total_images,
  COALESCE(SUM(ui.credits_used), 0) as total_credits_used,
  COUNT(CASE WHEN ui.created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as images_last_30_days,
  u.created_at as joined_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
LEFT JOIN user_images ui ON u.id = ui.user_id
GROUP BY u.id, u.email, up.username, up.credits, u.created_at;

-- User detailed statistics view
CREATE VIEW user_statistics AS
SELECT 
  u.id as user_id,
  COUNT(ui.id) as total_generations,
  COALESCE(SUM(ui.credits_used), 0) as total_credits_used,
  COUNT(CASE WHEN ui.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN 1 END) as current_month_generations,
  COALESCE(SUM(CASE WHEN ui.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN ui.credits_used ELSE 0 END), 0) as current_month_credits_used
FROM auth.users u
LEFT JOIN user_images ui ON u.id = ui.user_id
GROUP BY u.id;

-- monthly statistics view
CREATE VIEW monthly_user_statistics AS
SELECT 
  u.id as user_id,
  DATE_TRUNC('month', ui.created_at) as month,
  COUNT(ui.id) as generations,
  COALESCE(SUM(ui.credits_used), 0) as credits_used,
  COUNT(CASE WHEN ui.generation_type = 'text_to_image' THEN 1 END) as text2img_count,
  COUNT(CASE WHEN ui.generation_type = 'image_edit' THEN 1 END) as img2img_count,
  COUNT(CASE WHEN ui.generation_type = 'image_fusion' THEN 1 END) as style_transfer_count
FROM auth.users u
LEFT JOIN user_images ui ON u.id = ui.user_id
WHERE ui.created_at IS NOT NULL
GROUP BY u.id, DATE_TRUNC('month', ui.created_at)
ORDER BY u.id, month DESC;

-- Points consumption analysis view
CREATE VIEW daily_credits_analysis AS
SELECT 
  user_id,
  DATE(created_at) as date,
  SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as usage_amount,
  SUM(CASE WHEN amount > 0 AND transaction_type = 'purchase' THEN amount ELSE 0 END) as purchase_amount,
  SUM(CASE WHEN amount > 0 AND transaction_type = 'bonus' THEN amount ELSE 0 END) as bonus_amount
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
FROM user_images
GROUP BY user_id, generation_type;

-- Points balance update function
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
    IF (SELECT credits FROM user_profiles WHERE id = p_user_id) < ABS(p_amount) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Update user points
  UPDATE user_profiles 
  SET credits = credits + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- record transaction
  INSERT INTO credit_transactions (
    user_id, amount, transaction_type, description, related_id
  ) VALUES (
    p_user_id, p_amount, p_type, p_description, p_related_id
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Automatically create user-configured functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, username, credits)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    50  -- New users receive 50 points
  );
  
  -- Record the transaction of gift points
  INSERT INTO credit_transactions (
    user_id, amount, transaction_type, description
  ) VALUES (
    NEW.id, 50, 'bonus', 'New user registration bonus'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Update time for updating user configuration
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update time triggers for related tables
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_generation_tasks_updated_at
  BEFORE UPDATE ON generation_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_images_updated_at
  BEFORE UPDATE ON user_images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stripe_subscriptions_updated_at
  BEFORE UPDATE ON stripe_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
