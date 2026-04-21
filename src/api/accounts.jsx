import { supabase } from './supabaseClient';

// 새 계좌/카드 생성
export async function createAccount(userId, accountData) {
    const { 
        asset_type,      // "card", "account", "virtual" 등
        institution,     // "신한", "삼성", "현대" 등 은행/카드사명
        asset_subtype,   // 추가 분류 (선택사항)
        name,            // "내 신용카드", "통장" 같은 이름
        balance = 0      // 초기 잔액
    } = accountData;
    
    const { data, error } = await supabase
        .from('accounts')
        .insert([{
            user_id: userId,
            asset_type,
            institution,
            asset_subtype,
            name,
            balance,
        }])
        .select()
        .single();
    
    if(error) {
        console.log('계좌 생성 실패: ', error);
        return {success: false, message: error.message}
    } else {
        return {success: true, data};
    }
}

// 사용자의 모든 계좌/카드 조회
export async function findAccounts(userId) {
    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId);
    
    if(error) {
        console.error('계좌 조회 실패: ', error);
        return {success: false, message: error.message}
    } else {
        return {success: true, data};
    }
}

// 특정 계좌/카드 상세 정보
export async function findAccountById(accountId) {
    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('id', accountId)
        .single();
    
    if(error) {
        console.error('계좌 상세 조회 실패: ', error);
        return {success: false, message: error.message}
    } else {
        return {success: true, data};
    }
}

// 계좌/카드 정보 업데이트
export async function updateAccount(accountId, updateData) {
    const { data, error } = await supabase
        .from('accounts')
        .update(updateData)
        .eq('id', accountId)
        .select()
        .single();
    
    if(error) {
        console.log('계좌 수정 실패: ', error);
        return {success: false, message: error.message}
    } else {
        return {success: true, data};
    }
}

// 계좌/카드 삭제
export async function deleteAccount(accountId) {
    const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);
    
    if(error) {
        console.log('계좌 삭제 실패: ', error);
        return {success: false, message: error.message}
    } else {
        return {success: true, message: '계좌가 삭제되었습니다'};
    }
}

// 거래를 반영한 현재 잔액 계산
export async function getAccountBalance(accountId) {
    const { data: account, error: accError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', accountId)
        .single();
    
    if(accError) {
        console.error('계좌 조회 실패: ', accError);
        return {success: false, message: accError.message}
    }
    
    const { data: transactions, error: trError } = await supabase
        .from('transactions')
        .select('amount')
        .eq('account_id', accountId);
    
    if(trError) {
        console.error('거래 조회 실패: ', trError);
        return {success: false, message: trError.message}
    }
    
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const currentBalance = account.balance - totalSpent;
    
    return {
        success: true,
        initialBalance: account.balance,
        spent: totalSpent,
        currentBalance
    };
}