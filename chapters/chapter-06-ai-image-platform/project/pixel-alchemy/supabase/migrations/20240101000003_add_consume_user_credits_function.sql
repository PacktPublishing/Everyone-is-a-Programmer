CREATE OR REPLACE FUNCTION consume_user_credits(
  p_user_id UUID,
  p_amount INTEGER,
  p_related_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT 'Image generation credit consumption'
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN update_user_credits(
    p_user_id,
    -ABS(p_amount),
    'consumption',
    p_description,
    p_related_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
