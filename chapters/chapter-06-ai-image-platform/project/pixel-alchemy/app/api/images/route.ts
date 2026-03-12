import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    // Verify user identity
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    let query = supabase
      .from('user_images')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    // Apply filters
    if (type) {
      query = query.eq('generation_type', type);
    }

    if (search) {
      query = query.or(`prompt.ilike.%${search}%,title.ilike.%${search}%`);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    // Apply sorting and paging
    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range((page - 1) * limit, page * limit - 1);

    const { data: images, error, count } = await query;

    if (error) {
      console.error('Failed to fetch images:', error);
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 });
    }

    const totalPages = count ? Math.ceil(count / limit) : 0;

    return NextResponse.json({
      images: images.map(image => ({
        id: image.id,
        title: image.title,
        prompt: image.prompt,
        imageUrl: image.image_url,
        thumbnailUrl: image.thumbnail_url,
        width: image.width,
        height: image.height,
        generationType: image.generation_type,
        creditsUsed: image.credits_used,
        isPublic: image.is_public,
        createdAt: image.created_at
      })),
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages
      }
    });

  } catch (error) {
    console.error('Get images error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify user identity
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createServerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { action, imageIds, data } = body;

    if (action === 'delete') {
      // Delete pictures in batches
      const { error: deleteError } = await supabase
        .from('user_images')
        .delete()
        .in('id', imageIds)
        .eq('user_id', user.id);

      if (deleteError) {
        return NextResponse.json({ error: 'Failed to delete images' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Images deleted successfully' });

    } else if (action === 'updateVisibility') {
      // Batch update visibility
      const { error: updateError } = await supabase
        .from('user_images')
        .update({ is_public: data.isPublic })
        .in('id', imageIds)
        .eq('user_id', user.id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update images' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Images updated successfully' });

    } else if (action === 'addTags') {
      // Add tags in batches
      const { error: updateError } = await supabase
        .from('user_images')
        .update({ tags: data.tags })
        .in('id', imageIds)
        .eq('user_id', user.id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update images' }, { status: 500 });
      }

      return NextResponse.json({ message: 'Tags added successfully' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    console.error('Batch operation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
