import { supabase } from './supabaseClient';

// 공통: 계좌 ID 가져오기
async function getAccountIds(userId) {
    const { data, error } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', userId);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    return data.map(a => a.id);
}

// 공통: 날짜 범위 생성 (안전 버전)
function getDateRange(periodDetail) {
    const [year, month] = periodDetail.split('-');

    const start = `${year}-${month}-01`;

    const endDate = new Date(Number(year), Number(month), 0);
    endDate.setHours(23, 59, 59, 999);

    const end = endDate.toISOString().split('T')[0];

    return { start, end };
}

// 목표 vs 카테고리 소비 비교
export async function getGoalWithCategory(userId, periodDetail) {
    let progress;
    try {
        progress = await progressGoal(userId, periodDetail);
    } catch (e) {
        throw new Error('progress 계산 실패');
    }

    const accountIds = await getAccountIds(userId);
    if (accountIds.length === 0) {
        return { ...progress, categories: [] };
    }

    const { start, end } = getDateRange(periodDetail);

    const { data, error } = await supabase
        .from('transactions')
        .select('category, amount')
        .in('account_id', accountIds)
        .gte('transaction_date', start)
        .lte('transaction_date', end);

    if (error) throw error;

    const map = {};
    for (const row of data) {
        const key = row.category || '미분류';
        map[key] = (map[key] || 0) + row.amount;
    }

    return {
        ...progress,
        categories: Object.entries(map).map(([k, v]) => ({
            category: k,
            total: v,
        })),
    };
}

// 카테고리별 소비
export async function getCategoryConsumption(userId, periodDetail) {
    const accountIds = await getAccountIds(userId);
    if (accountIds.length === 0) return [];

    const { start, end } = getDateRange(periodDetail);

    const { data, error } = await supabase
        .from('transactions')
        .select('category, amount')
        .in('account_id', accountIds)
        .gte('transaction_date', start)
        .lte('transaction_date', end);

    if (error) throw error;

    const map = {};
    for (const row of data) {
        const key = row.category || '미분류';
        map[key] = (map[key] || 0) + row.amount;
    }

    return Object.entries(map).map(([k, v]) => ({
        category: k,
        total: v,
    }));
}

// 총 지출 요약
export async function getSpendingSummary(userId, periodDetail) {
    const accountIds = await getAccountIds(userId);
    if (accountIds.length === 0) {
        return { total: 0, fixed: 0, variable: 0 };
    }

    const { start, end } = getDateRange(periodDetail);

    const { data, error } = await supabase
        .from('transactions')
        .select('amount, is_fixed')
        .in('account_id', accountIds)
        .gte('transaction_date', start)
        .lte('transaction_date', end);

    if (error) throw error;

    const total = data.reduce((s, r) => s + r.amount, 0);
    const fixed = data
        .filter(r => r.is_fixed)
        .reduce((s, r) => s + r.amount, 0);

    return {
        total,
        fixed,
        variable: total - fixed,
    };
}

// 일별 누적 소비
export async function getDailySpending(userId, periodDetail) {
    const accountIds = await getAccountIds(userId);
    if (accountIds.length === 0) return [];

    const { start, end } = getDateRange(periodDetail);

    const { data, error } = await supabase
        .from('transactions')
        .select('transaction_date, amount')
        .in('account_id', accountIds)
        .gte('transaction_date', start)
        .lte('transaction_date', end)
        .order('transaction_date', { ascending: true });

    if (error) throw error;

    const map = {};
    for (const row of data) {
        map[row.transaction_date] =
            (map[row.transaction_date] || 0) + row.amount;
    }

    let cumulative = 0;

    return Object.entries(map)
        .sort(([a], [b]) => new Date(a) - new Date(b))
        .map(([date, amount]) => {
            cumulative += amount;
            return {
                date,
                daily: amount,
                cumulative,
            };
        });
}

// 미분류 소비
export async function getUncategorizedTransactions(userId, periodDetail) {
    const accountIds = await getAccountIds(userId);
    if (accountIds.length === 0) return [];

    const { start, end } = getDateRange(periodDetail);

    const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .in('account_id', accountIds)
        .or('category.is.null,category.eq.미분류')
        .gte('transaction_date', start)
        .lte('transaction_date', end);

    if (error) throw error;

    return data;
}