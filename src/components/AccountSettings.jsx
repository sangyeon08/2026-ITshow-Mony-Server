import { useState, useEffect } from 'react';
import { createAccount, findAccounts, updateAccount, deleteAccount } from '../api/accounts';
import { supabase } from '../api/supabaseClient';

export function AccountSettings() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);
    
    // 현재 로그인된 사용자 ID 가져오기
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if(data.user) {
                setUserId(data.user.id);
            }
        });
    }, []);
    
    // 계좌 목록 불러오기
    const handleLoadAccounts = async () => {
        if(!userId) return;
        
        setLoading(true);
        const result = await findAccounts(userId);
        if(result.success) {
            setAccounts(result.data);
            console.log("내 계좌들:", result.data);
        } else {
            console.log("실패:", result.message);
        }
        setLoading(false);
    };
    
    // 새 계좌 추가
    const handleAddAccount = async () => {
        if(!userId) return;
        
        const result = await createAccount(userId, {
            asset_type: "card",              // 변경됨
            institution: "삼성",             // 새 필드
            asset_subtype: "신용카드",       // 새 필드
            name: "내 신용카드",             // 변경됨
            balance: 5000000
        });
        
        if(result.success) {
            console.log("계좌 추가 성공!", result.data);
            handleLoadAccounts(); // 목록 새로고침
        } else {
            console.log("실패:", result.message);
        }
    };
    
    // 계좌 삭제
    const handleDeleteAccount = async (accountId) => {
        const result = await deleteAccount(accountId);
        if(result.success) {
            handleLoadAccounts(); // 목록 새로고침
        }
    };
    
    // 페이지 로드 시 계좌 목록 불러오기
    useEffect(() => {
        handleLoadAccounts();
    }, [userId]);
    
    return (
        <div>
            <h1>계좌/카드 설정</h1>
            
            <button onClick={handleAddAccount}>
                + 계좌 추가
            </button>
            
            {loading ? (
                <p>로딩중...</p>
            ) : (
                <ul>
                    {accounts.map(account => (
                        <li key={account.id}>
                            <div>
                                <strong>{account.name}</strong>
                                <p>{account.institution} - {account.asset_type}</p>
                                <p>잔액: ₩{account.balance.toLocaleString()}</p>
                            </div>
                            <button onClick={() => handleDeleteAccount(account.id)}>
                                삭제
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}