# AI Image generation platform - User statistics function implementation plan

## 1. Function overview

The user statistics function provides users with comprehensive usage data analysis, including:
- Generate quantity statistics and trend analysis
- Points consumption record and analysis
- Generate type distribution
- Detailed build history
- Visual chart display

## 2. Front-end implementation

### 2.1 Page structure

```
/profile/statistics
├── StatisticsOverview (Statistical Overview)
├── MonthlyTrendChart (Monthly trend chart)
├── CreditsAnalysisChart (Points consumption analysis)
├── GenerationTypeDistribution (Generate type distribution)
└── GenerationHistoryTable (Generate historical table)
```

### 2.2 Core component implementation

#### StatisticsOverview components

```typescript
// components/profile/statistics/StatisticsOverview.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Image, CreditCard, Clock } from 'lucide-react';

interface StatisticsOverviewProps {
  data: {
    totalGenerations: number;
    monthlyGenerations: number;
    totalCreditsUsed: number;
    timeSaved: number;
  };
}

export const StatisticsOverview: React.FC<StatisticsOverviewProps> = ({ data }) => {
  const stats = [
    {
      title: 'Total number of generations',
      value: data.totalGenerations,
      icon: Image,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Generated this month',
      value: data.monthlyGenerations,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Points consumption',
      value: data.totalCreditsUsed,
      icon: CreditCard,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'save time',
      value: `${data.timeSaved}h`,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
```

#### MonthlyTrendChart components

```typescript
// components/profile/statistics/MonthlyTrendChart.tsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface MonthlyTrendChartProps {
  data: Array<{
    month: string;
    generations: number;
    creditsUsed: number;
  }>;
  timeRange: '3months' | '6months' | '1year';
  onTimeRangeChange: (range: '3months' | '6months' | '1year') => void;
}

export const MonthlyTrendChart: React.FC<MonthlyTrendChartProps> = ({
  data,
  timeRange,
  onTimeRangeChange
}) => {
  const formatMonth = (month: string) => {
    const date = new Date(month);
    return date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'short' });
  };

  const chartData = data.map(item => ({
    ...item,
    month: formatMonth(item.month)
  }));

  return (
    <Card className="mb-8">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Monthly generated trends</CardTitle>
        <Select value={timeRange} onValueChange={onTimeRangeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3months">last 3 months</SelectItem>
            <SelectItem value="6months">last 6 months</SelectItem>
            <SelectItem value="1year">nearly 1 year</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="generations"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Generate quantity"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="creditsUsed"
              stroke="#8b5cf6"
              strokeWidth={2}
              name="Points consumption"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
```

#### GenerationTypeDistribution components

```typescript
// components/profile/statistics/GenerationTypeDistribution.tsx
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface GenerationTypeDistributionProps {
  data: Array<{
    type: 'text2img' | 'img2img' | 'style_transfer';
    count: number;
    percentage: number;
  }>;
  onTypeClick: (type: string) => void;
}

const COLORS = {
  text2img: '#3b82f6',
  img2img: '#10b981',
  style_transfer: '#f59e0b'
};

const TYPE_LABELS = {
  text2img: 'Vincentian picture',
  img2img: 'Tu Sheng Tu',
  style_transfer: 'style transfer'
};

export const GenerationTypeDistribution: React.FC<GenerationTypeDistributionProps> = ({
  data,
  onTypeClick
}) => {
  const chartData = data.map(item => ({
    ...item,
    name: TYPE_LABELS[item.type],
    fill: COLORS[item.type]
  }));

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate type distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderCustomizedLabel}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
              onClick={(data) => onTypeClick(data.type)}
              className="cursor-pointer"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, name]} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {data.map((item) => (
            <div
              key={item.type}
              className="text-center p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100"
              onClick={() => onTypeClick(item.type)}
            >
              <div className="text-lg font-bold text-gray-900">{item.count}</div>
              <div className="text-sm text-gray-600">{TYPE_LABELS[item.type]}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

#### GenerationHistoryTable components

```typescript
// components/profile/statistics/GenerationHistoryTable.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Eye } from 'lucide-react';

interface GenerationHistoryTableProps {
  data: GenerationRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  filters: GenerationFilters;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: GenerationFilters) => void;
  onRecordClick: (record: GenerationRecord) => void;
}

interface GenerationRecord {
  id: string;
  createdAt: string;
  type: string;
  prompt: string;
  creditsUsed: number;
  status: 'completed' | 'failed' | 'processing';
  imageUrl?: string;
}

interface GenerationFilters {
  type?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export const GenerationHistoryTable: React.FC<GenerationHistoryTableProps> = ({
  data,
  pagination,
  filters,
  onPageChange,
  onFilterChange,
  onRecordClick
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key: keyof GenerationFilters, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      processing: 'bg-yellow-100 text-yellow-800'
    };
    
    const labels = {
      completed: 'Completed',
      failed: 'fail',
      processing: 'Processing'
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncatePrompt = (prompt: string, maxLength: number = 50) => {
    return prompt.length > maxLength ? `${prompt.slice(0, maxLength)}...` : prompt;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Generate history
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search prompt words..."
                value={localFilters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Select
              value={localFilters.type || 'all'}
              onValueChange={(value) => handleFilterChange('type', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="text2img">Vincentian picture</SelectItem>
                <SelectItem value="img2img">Tu Sheng Tu</SelectItem>
                <SelectItem value="style_transfer">style transfer</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={localFilters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">fail</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4">time</th>
                <th className="text-left py-3 px-4">type</th>
                <th className="text-left py-3 px-4">prompt word</th>
                <th className="text-left py-3 px-4">integral</th>
                <th className="text-left py-3 px-4">state</th>
                <th className="text-left py-3 px-4">operate</th>
              </tr>
            </thead>
            <tbody>
              {data.map((record) => (
                <tr key={record.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {formatDate(record.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant="outline">
                      {record.type === 'text2img' ? 'Vincentian picture' :
                       record.type === 'img2img' ? 'Tu Sheng Tu' : 'style transfer'}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-sm">
                    <span title={record.prompt}>
                      {truncatePrompt(record.prompt)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">
                    {record.creditsUsed}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(record.status)}
                  </td>
                  <td className="py-3 px-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRecordClick(record)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination component */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            show {(pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, pagination.total)} Article,
            total {pagination.total} records
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              Previous page
            </Button>
            <span className="text-sm">
              No. {pagination.page} Pages, total {pagination.totalPages} Page
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next page
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### 2.3 Main statistics page component

```typescript
// pages/profile/statistics.tsx
import React, { useEffect, useState } from 'react';
import { useStatisticsStore } from '@/stores/statisticsStore';
import { StatisticsOverview } from '@/components/profile/statistics/StatisticsOverview';
import { MonthlyTrendChart } from '@/components/profile/statistics/MonthlyTrendChart';
import { CreditsAnalysisChart } from '@/components/profile/statistics/CreditsAnalysisChart';
import { GenerationTypeDistribution } from '@/components/profile/statistics/GenerationTypeDistribution';
import { GenerationHistoryTable } from '@/components/profile/statistics/GenerationHistoryTable';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';

export const StatisticsPage: React.FC = () => {
  const {
    data,
    loading,
    error,
    timeRange,
    setTimeRange,
    setLoading,
    setData,
    setError
  } = useStatisticsStore();
  
  const [historyData, setHistoryData] = useState([]);
  const [historyPagination, setHistoryPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });
  const [historyFilters, setHistoryFilters] = useState({});
  
  const { toast } = useToast();

  // Get statistics
  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/statistics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to get statistics');
      
      const result = await response.json();
      setData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get statistics');
      toast({
        title: 'mistake',
        description: 'Failed to obtain statistics, please try again later',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Get build history
  const fetchGenerationHistory = async (page = 1, filters = {}) => {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: historyPagination.limit.toString(),
        ...filters
      });
      
      const response = await fetch(`/api/users/generation-history?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to get build history');
      
      const result = await response.json();
      setHistoryData(result.data.records);
      setHistoryPagination(result.data.pagination);
    } catch (err) {
      toast({
        title: 'mistake',
        description: 'Failed to obtain build history, please try again later.',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [timeRange]);

  useEffect(() => {
    fetchGenerationHistory(1, historyFilters);
  }, [historyFilters]);

  const handleTimeRangeChange = (range: '3months' | '6months' | '1year') => {
    setTimeRange(range);
  };

  const handleTypeClick = (type: string) => {
    setHistoryFilters({ ...historyFilters, type });
  };

  const handlePageChange = (page: number) => {
    fetchGenerationHistory(page, historyFilters);
  };

  const handleFilterChange = (filters: any) => {
    setHistoryFilters(filters);
  };

  const handleRecordClick = (record: any) => {
    // Open record details modal box
    console.log('View record details:', record);
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchStatistics}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* Statistical overview */}
      <StatisticsOverview data={data.overview} />
      
      {/* Monthly Trend Chart */}
      <MonthlyTrendChart
        data={data.monthlyTrend}
        timeRange={timeRange}
        onTimeRangeChange={handleTimeRangeChange}
      />
      
      {/* Integral analysis and type distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <CreditsAnalysisChart data={data.creditsAnalysis} />
        <GenerationTypeDistribution
          data={data.typeDistribution}
          onTypeClick={handleTypeClick}
        />
      </div>
      
      {/* Generate history table */}
      <GenerationHistoryTable
        data={historyData}
        pagination={historyPagination}
        filters={historyFilters}
        onPageChange={handlePageChange}
        onFilterChange={handleFilterChange}
        onRecordClick={handleRecordClick}
      />
    </div>
  );
};
```

## 3. rear end API accomplish

### 3.1 Statistics API

```typescript
// pages/api/users/statistics.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { timeRange = '6months' } = req.query;
    const userId = user.id;

    // Calculation time range
    const now = new Date();
    const monthsBack = timeRange === '3months' ? 3 : timeRange === '6months' ? 6 : 12;
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);

    // Get overview data
    const { data: overviewData } = await supabase
      .from('user_statistics')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Get monthly trend data
    const { data: monthlyTrendData } = await supabase
      .from('monthly_user_statistics')
      .select('*')
      .eq('user_id', userId)
      .gte('month', startDate.toISOString())
      .order('month', { ascending: true });

    // Obtain points consumption analysis data
    const { data: creditsAnalysisData } = await supabase
      .from('daily_credits_analysis')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    // Get generation type distribution data
    const { data: typeDistributionData } = await supabase
      .from('generation_type_distribution')
      .select('*')
      .eq('user_id', userId);

    // Calculate time savings (assume 30 minutes saved per build)
    const timeSaved = Math.round((overviewData?.total_generations || 0) * 0.5);

    const result = {
      overview: {
        totalGenerations: overviewData?.total_generations || 0,
        monthlyGenerations: overviewData?.current_month_generations || 0,
        totalCreditsUsed: overviewData?.total_credits_used || 0,
        timeSaved
      },
      monthlyTrend: monthlyTrendData?.map(item => ({
        month: item.month,
        generations: item.generations,
        creditsUsed: item.credits_used
      })) || [],
      creditsAnalysis: creditsAnalysisData?.map(item => ({
        date: item.date,
        amount: item.usage_amount + item.purchase_amount + item.bonus_amount,
        type: item.usage_amount > 0 ? 'usage' : 
              item.purchase_amount > 0 ? 'purchase' : 'bonus'
      })) || [],
      typeDistribution: typeDistributionData?.map(item => ({
        type: item.type,
        count: item.count,
        percentage: item.percentage
      })) || []
    };

    res.status(200).json({
      code: 200,
      message: 'success',
      data: result
    });
  } catch (error) {
    console.error('Failed to get statistics:', error);
    res.status(500).json({
      code: 500,
      message: 'Server internal error'
    });
  }
}
```

### 3.2 Build history API

```typescript
// pages/api/users/generation-history.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { verifyToken } from '@/lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const user = await verifyToken(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const {
      page = '1',
      limit = '20',
      type,
      status,
      dateFrom,
      dateTo,
      search
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = Math.min(parseInt(limit as string), 100);
    const offset = (pageNum - 1) * limitNum;

    // Build query conditions
    let query = supabase
      .from('images')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id);

    if (type) {
      query = query.eq('generation_type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', dateTo);
    }

    if (search) {
      query = query.ilike('prompt', `%${search}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (error) {
      throw error;
    }

    const totalPages = Math.ceil((count || 0) / limitNum);

    const records = data?.map(item => ({
      id: item.id,
      createdAt: item.created_at,
      type: item.generation_type,
      prompt: item.prompt,
      creditsUsed: item.credits_used,
      status: item.status,
      imageUrl: item.image_url,
      settings: item.settings
    })) || [];

    res.status(200).json({
      code: 200,
      message: 'success',
      data: {
        records,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: count || 0,
          totalPages
        }
      }
    });
  } catch (error) {
    console.error('Failed to get build history:', error);
    res.status(500).json({
      code: 500,
      message: 'Server internal error'
    });
  }
}
```

## 4. Database optimization

### 4.1 Index optimization

```sql
-- Add composite index for statistical queries
CREATE INDEX idx_images_user_created_status ON images(user_id, created_at, status);
CREATE INDEX idx_images_user_type_status ON images(user_id, generation_type, status);
CREATE INDEX idx_credit_transactions_user_date ON credit_transactions(user_id, created_at);
CREATE INDEX idx_images_prompt_gin ON images USING gin(to_tsvector('english', prompt));
```

### 4.2 caching strategy

```typescript
// lib/cache.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export class StatisticsCache {
  private static getKey(userId: string, type: string, params?: any): string {
    const paramStr = params ? JSON.stringify(params) : '';
    return `stats:${userId}:${type}:${paramStr}`;
  }

  static async get(userId: string, type: string, params?: any) {
    const key = this.getKey(userId, type, params);
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  static async set(userId: string, type: string, data: any, params?: any, ttl = 300) {
    const key = this.getKey(userId, type, params);
    await redis.setex(key, ttl, JSON.stringify(data));
  }

  static async invalidate(userId: string, type?: string) {
    const pattern = type ? `stats:${userId}:${type}:*` : `stats:${userId}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}
```

## 5. Performance optimization

### 5.1 Front-end optimization

1. **Lazy loading of components**
```typescript
const MonthlyTrendChart = lazy(() => import('./MonthlyTrendChart'));
const GenerationHistoryTable = lazy(() => import('./GenerationHistoryTable'));
```

2. **Data cache**
```typescript
// use React Query cache data
const { data, isLoading } = useQuery(
  ['statistics', userId, timeRange],
  () => fetchStatistics(timeRange),
  {
    staleTime: 5 * 60 * 1000, // 5minute
    cacheTime: 10 * 60 * 1000, // 10minute
  }
);
```

3. **Chart optimization**
```typescript
// use useMemo Optimize chart data processing
const chartData = useMemo(() => {
  return data?.monthlyTrend.map(formatChartData) || [];
}, [data?.monthlyTrend]);
```

### 5.2 Backend optimization

1. **Database query optimization**
2. **Redis cache**
3. **Pagination optimization**
4. **Concurrent query**

## 6. testing strategy

### 6.1 Unit testing

```typescript
// __tests__/components/StatisticsOverview.test.tsx
import { render, screen } from '@testing-library/react';
import { StatisticsOverview } from '@/components/profile/statistics/StatisticsOverview';

const mockData = {
  totalGenerations: 156,
  monthlyGenerations: 23,
  totalCreditsUsed: 2340,
  timeSaved: 78
};

describe('StatisticsOverview', () => {
  it('renders statistics correctly', () => {
    render(<StatisticsOverview data={mockData} />);
    
    expect(screen.getByText('156')).toBeInTheDocument();
    expect(screen.getByText('23')).toBeInTheDocument();
    expect(screen.getByText('2340')).toBeInTheDocument();
    expect(screen.getByText('78h')).toBeInTheDocument();
  });
});
```

### 6.2 Integration testing

```typescript
// __tests__/api/statistics.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/users/statistics';

describe('/api/users/statistics', () => {
  it('returns user statistics', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      query: { timeRange: '6months' },
      headers: { authorization: 'Bearer valid-token' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.code).toBe(200);
    expect(data.data).toHaveProperty('overview');
    expect(data.data).toHaveProperty('monthlyTrend');
  });
});
```

## 7. Deploy and monitor

### 7.1 Performance monitoring

```typescript
// lib/monitoring.ts
export const trackStatisticsPageLoad = (loadTime: number) => {
  // Send performance data to monitoring service
  analytics.track('statistics_page_load', {
    loadTime,
    timestamp: Date.now()
  });
};

export const trackChartRender = (chartType: string, renderTime: number) => {
  analytics.track('chart_render', {
    chartType,
    renderTime,
    timestamp: Date.now()
  });
};
```

### 7.2 Error monitoring

```typescript
// lib/error-tracking.ts
export const trackStatisticsError = (error: Error, context: any) => {
  Sentry.captureException(error, {
    tags: {
      component: 'statistics',
      action: context.action
    },
    extra: context
  });
};
```

This statistical function implementation provides complete user data analysis capabilities, including visual charts, detailed history records, and high-performance data processing. Through reasonable caching strategies and database optimization, good user experience and system performance are ensured.