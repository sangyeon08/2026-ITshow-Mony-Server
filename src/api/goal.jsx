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
        return {success: false, message: error.message}
    }else{
        return {success: true, data};
    }
    
}

//목표 진행률 계산
export async function progressGoal(params) {
    
}
//export {supabase}