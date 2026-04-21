//goal 관련된 db소스
import { createClient } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'

//필요한 것 목표부분 목표 저장(생성), 목표 진행률 저장?
//목표 초과 혹은 임박했을 때 (80% 90%)되면 message 보내기
//목표 예산, 목표, 계좌 잔액과 비교 조회?
//목표 템플릿 <카테고리 db연동>? 100만원 챌린지 or 절약모드 or 균형모드
//설정 요소? 예산은(필수) 월급(선택) 저축 목표(선택)


//진행률 계산
//목표 수정(필수)
//목표 초과 체크

//db안쪽?에 목표 템플릿 넣기.

//목표 생성(저장)
export async function createGoal(userId, goalData) {
    const { goal_type, period_type, period_detail, salary_timing, target_amount } = goalData;

    const { data, error} = await supabase
        .from('goal')
        .insert([{
            user_id: userId,
            goal_type,
            period_type,
            period_detail,
            salary_timing,
            target_amount,
        },]).select().single();
    if(error){
        console.log('목표 생성 실패: ',error);
        return {success: false,message: error.message}
    }else{
        return { success:true, data};
    }
}



//목표 조회
export async function findGoal(userId) {
    const {data,error} = await supabase
        .from('goal')
        .select('*')
        .eq('user_id',userId);
    if(error){
        console.error('목표 조회 실해 : ',error);
        return {success: false, message: error.message}
    }else{
        return {success: true, data};
    }
    
}



//목표 진행률 계산
export async function progressGoal(userId, periodDetail) {
    // 목표 가져오기
    const { data: goal, error: goalError } = await supabase
        .from('goal')
        .select('target_amount')
        .eq('user_id', userId)
        .eq('period_detail', periodDetail)
        .single();
    if(goalError){
        console.log('목표 조회 실패: ',goalError);
        return { success: false, message: goalError.message};
    }
    //날짜 범위 계산
    const [year,month] = periodDetail.split('-');
    const startDate = `${year}-${month}-01`;
    const endDate = new Date(year, month,0).toISOString().split('T')[0]; //말일 자동 계산

    const { data: accounts, error: accError } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', userId);

    if (accError || !accounts.length) {
        return { success: false, message: '연결된 계좌/카드가 없어요.' };
    }
    const accountIds = accounts.map(a => a.id);

    /*gte : 해당 값보다 크거나 같은 경우
    lte: 해당 값보다 작거나 같은 경우 */
    const {data: tr, error: trError} = await supabase
        .from('transactions')
        .select('amount')
        .in('account_id',accountIds)
        .gte('transaction_date',startDate)
        .lte('transaction_date',endDate);
    if(trError){
        console.error('지출 조회 실패: ',trError);
        return {success: false, message: trError.message};
    }
    //총 지출 계산
    const totalSpent = tr.reduce((sum,t) => sum + t.amount, 0);

    //진행률 계산
    const progress = totalSpent / goal.target_amount;

    //경고 레벨 판단
    let warningLevel = null;
    if(progress >= 1.0) warningLevel = '초과'; //초과
    else if(progress >= 0.9) warningLevel = '90'; //90%
    else if(progress >= 0.8) warningLevel = '80'; //80%

    return {
        success: true,
        totalSpent, targetAmount: goal.target_amount,
        remaining: goal.target_amount - totalSpent,
        progress, progressPercent: Math.round(progress * 100),
        warningLevel
    };
}

export async function deleteGoal(id) {
    const { error } = await supabase.from('goal').delete().eq('id', id);
    if (error) throw error;
}
//export {supabase}