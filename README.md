# Mony: 스마트 생활비 관리 서비스

> **GPT 기반 대화형 코칭으로 완성하는 청년 1인 가구 맞춤형 소비 관리 솔루션**

Mony는 청년 1인 가구의 카드 및 계좌 지출 데이터를 자동 분석하고, GPT 기반 대화형 코치가 사용자의 소비 습관 개선을 돕는 웹 서비스입니다. 기존 가계부 서비스의 수동 입력 피로도와 경고 위주의 피드백을 개선하여, 사용자가 거부감 없이 계획적인 소비 습관을 형성하도록 지원합니다.

---

## 📸 Key Features

### 🎯 자동 지출 분석
카드/계좌 데이터를 연동하여 지출 내역을 자동 수집하고 카테고리를 분류합니다.
- 다중 계좌/카드 관리
- 카테고리별 자동 분류
- 고정/변동 지출 구분

### 💬 GPT 소비 코칭
"잔소리 없는" 질문형 피드백을 통해 사용자가 스스로 소비를 돌아보게 합니다.
```
예: "커피 지출이 평소보다 늘었는데 특별한 이유가 있으신가요?"
```

### 📊 대시보드 시각화
월별/카테고리별 소비 패턴과 목표 예산 대비 진행률을 직관적으로 제공합니다.
- 월별 소비 추이 그래프
- 카테고리별 비율 차트
- 목표 달성도 프로그레스 바

### 🔔 스마트 알림
예산의 80~90% 도달 시 즉각적인 알림과 함께 개선 방안을 제안합니다.
- 80% 도달 시 경고
- 90% 도달 시 긴급 알림
- 개인화된 개선 제안

---

## 🛠 Tech Stack

### Frontend
| 기술 | 설명 |
| :--- | :--- |
| **React** 18+ | UI 라이브러리 |
| **Vite** | 초고속 빌드 도구 |
| **JavaScript** | 메인 언어 |
| **Tailwind CSS** | 유틸리티 기반 스타일 |
| **Supabase Client** | 백엔드 연동 |

### Backend & Database
| 기술 | 설명 |
| :--- | :--- |
| **Node.js** | JavaScript 런타임 |
| **Express.js** | 웹 프레임워크 (향후 구현) |
| **PostgreSQL** | 관계형 데이터베이스 |
| **Supabase** | BaaS (Auth, DB, Storage) |
| **OpenAI API** | GPT 기반 AI 코칭 |

### Tools & DevOps
| 기술 | 설명 |
| :--- | :--- |
| **GitHub** | 버전 관리 |
| **VS Code** | 개발 에디터 |
| **ESLint** | 코드 품질 관리 |

---

## 📁 Project Structure

```
mony-server/
├── src/
│   ├── api/
│   │   ├── supabaseClient.js              # Supabase 클라이언트 초기화
│   │   ├── accounts.jsx                   # 계좌/카드 CRUD API 함수
│   │   ├── goal.jsx                       # 목표/예산 관리 API 함수
│   │   └── transactions.jsx               # 거래내역 조회 및 분석 API
│   ├── components/
│   │   └── AccountSettings.jsx            # 계좌/카드 설정 React 컴포넌트
│   ├── App.jsx                            # 메인 애플리케이션 컴포넌트
│   ├── main.jsx                           # React 진입점
│   ├── App.css                            # 애플리케이션 전역 스타일
│   └── index.css                          # 기본 스타일
├── public/                                # 정적 파일
├── node_modules/                          # 의존성 패키지
├── package.json                           # 프로젝트 메타데이터 및 의존성
├── vite.config.js                         # Vite 빌드 설정
├── eslint.config.js                       # ESLint 규칙 설정
└── README.md                              # 프로젝트 문서
```

---

## 🏗 System Architecture

### Database Schema (Supabase/PostgreSQL)

#### **accounts 테이블**
사용자의 계좌/카드 정보 저장
```sql
CREATE TABLE public.accounts (
  id BIGINT PRIMARY KEY DEFAULT nextval('accounts_id_seq'::regclass),
  user_id UUID NOT NULL,
  asset_type VARCHAR NOT NULL,           -- 'card', 'account', 'virtual'
  institution VARCHAR NOT NULL,          -- '신한', '삼성', '현대' 등
  asset_subtype VARCHAR,                 -- '신용카드', '체크카드', '저축통장' 등
  name VARCHAR NOT NULL,                 -- '내 신용카드', '월급통장' 등
  balance INTEGER DEFAULT 0,             -- 초기 잔액
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT accounts_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
```

#### **goal 테이블**
사용자의 월별 목표 및 예산 정보
```sql
CREATE TABLE public.goal (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL,
  goal_type VARCHAR NOT NULL,            -- '절약모드', '균형모드', '챌린지' 등
  period_type VARCHAR,                   -- '월간', '분기', '연간'
  period_detail VARCHAR,                 -- 'YYYY-MM' 형식
  salary_timing VARCHAR,                 -- 급여일 정보
  target_amount INTEGER NOT NULL,        -- 목표 예산
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT goal_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);
```

#### **transactions 테이블**
개별 거래 내역 기록
```sql
CREATE TABLE public.transactions (
  id BIGINT PRIMARY KEY DEFAULT nextval('transactions_id_seq'::regclass),
  account_id BIGINT NOT NULL,
  transaction_date DATE NOT NULL,
  shop VARCHAR NOT NULL,                 -- 거래처명
  amount INTEGER NOT NULL,               -- 거래액
  category VARCHAR NOT NULL,             -- '카페', '식비', '쇼핑' 등
  is_fixed BOOLEAN DEFAULT FALSE,        -- 고정 지출 여부
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT transactions_account_id_fkey 
    FOREIGN KEY (account_id) REFERENCES public.accounts(id)
);
```

#### **goal_categories 테이블**
목표에 포함된 카테고리 정보
```sql
CREATE TABLE public.goal_categories (
  id BIGINT PRIMARY KEY DEFAULT nextval('goal_categories_id_seq'::regclass),
  goal_id BIGINT NOT NULL,
  category_name VARCHAR NOT NULL,
  CONSTRAINT goal_categories_goal_id_fkey 
    FOREIGN KEY (goal_id) REFERENCES public.goal(id)
);
```

### API Layer Implementation

#### **Accounts API** (`src/api/accounts.jsx`)
계좌/카드 관련 모든 기능 처리

```javascript
// ✅ 계좌/카드 생성
createAccount(userId, accountData)
├─ Parameters: userId (UUID), accountData { asset_type, institution, asset_subtype, name, balance }
└─ Returns: { success: boolean, data: account | message: string }

// ✅ 사용자의 모든 계좌/카드 조회
findAccounts(userId)
├─ Parameters: userId (UUID)
└─ Returns: { success: boolean, data: accounts[] | message: string }

// ✅ 특정 계좌/카드 상세 정보 조회
findAccountById(accountId)
├─ Parameters: accountId (BIGINT)
└─ Returns: { success: boolean, data: account | message: string }

// ✅ 계좌/카드 정보 수정
updateAccount(accountId, updateData)
├─ Parameters: accountId (BIGINT), updateData { name?, balance?, ... }
└─ Returns: { success: boolean, data: account | message: string }

// ✅ 계좌/카드 삭제
deleteAccount(accountId)
├─ Parameters: accountId (BIGINT)
└─ Returns: { success: boolean, message: string }

// ✅ 거래 반영 현재 잔액 계산
getAccountBalance(accountId)
├─ Parameters: accountId (BIGINT)
└─ Returns: { success: boolean, initialBalance, spent, currentBalance }
```

#### **Goal API** (`src/api/goal.jsx`)
목표 및 예산 관리

```javascript
// ✅ 목표/예산 생성
createGoal(userId, goalData)
├─ Parameters: userId (UUID), goalData { goal_type, period_type, period_detail, ... }
└─ Returns: { success: boolean, data: goal | message: string }

// ✅ 사용자의 목표/예산 조회
findGoal(userId)
├─ Parameters: userId (UUID)
└─ Returns: { success: boolean, data: goals[] | message: string }

// ✅ 목표 진행률 계산
progressGoal(userId, periodDetail)
├─ Parameters: userId (UUID), periodDetail (string, 'YYYY-MM' 형식)
└─ Returns: {
│   success: boolean,
│   totalSpent: number,
│   targetAmount: number,
│   remaining: number,
│   progress: number (0~1),
│   progressPercent: number (0~100),
│   warningLevel: '80' | '90' | '초과' | null
│ }

// ✅ 목표 삭제
deleteGoal(id)
├─ Parameters: id (BIGINT)
└─ Returns: error 처리
```

#### **Transactions API** (`src/api/transactions.jsx`)
거래내역 조회 및 분석

```javascript
// ✅ 목표 vs 카테고리 소비 비교
getGoalWithCategory(userId, periodDetail)
├─ Parameters: userId (UUID), periodDetail ('YYYY-MM')
└─ Returns: {
│   ...progressGoal 결과,
│   categories: [{ category, total }, ...]
│ }

// ✅ 카테고리별 소비 조회
getCategoryConsumption(userId, periodDetail)
├─ Parameters: userId (UUID), periodDetail ('YYYY-MM')
└─ Returns: [{ category: string, total: number }, ...]

// ✅ 총 지출 요약 (고정/변동 구분)
getSpendingSummary(userId, periodDetail)
├─ Parameters: userId (UUID), periodDetail ('YYYY-MM')
└─ Returns: { total: number, fixed: number, variable: number }

// ✅ 일별 누적 소비
getDailySpending(userId, periodDetail)
├─ Parameters: userId (UUID), periodDetail ('YYYY-MM')
└─ Returns: [{ date, daily, cumulative }, ...]

// ✅ 미분류 거래 조회
getUncategorizedTransactions(userId, periodDetail)
├─ Parameters: userId (UUID), periodDetail ('YYYY-MM')
└─ Returns: [{ id, amount, shop, ... }, ...]
```

### Frontend Components

#### **AccountSettings** (`src/components/AccountSettings.jsx`)
계좌/카드 설정 UI 컴포넌트

```javascript
Props: None (독립적으로 동작)

State:
├─ accounts: Account[]           // 계좌 목록
├─ loading: boolean              // 로딩 상태
└─ userId: string | null         // 현재 사용자 ID

Functions:
├─ handleLoadAccounts()          // 계좌 목록 새로고침
├─ handleAddAccount()            // 새 계좌 추가
└─ handleDeleteAccount()         // 계좌 삭제

Features:
├─ Supabase 인증 연동
├─ 계좌 생성/삭제 기능
├─ 실시간 잔액 표시
└─ 에러 처리 및 로딩 상태 표시
```

---

## 📅 Development Roadmap

| Phase | 기간 | 주요 내용 | 상태 | 담당자 |
| :--- | :--- | :--- | :--- | :--- |
| **Phase 1: 기획 & 설계** | 3월 | 요구사항 정의, DB 설계, UI/UX 기획 | ✅ 완료 | 전체 |
| **Phase 2: 계좌 API** | 4월 1주 | Accounts CRUD, 계좌 관리 | ✅ 완료 | 이상연 |
| **Phase 3: 목표 API** | 4월 1-2주 | Goal/Budget 관리, 진행률 계산 | ✅ 완료 | 정예서 |
| **Phase 4: 거래 API** | 4월 2주 | Transactions 분석 엔진 | ✅ 완료 | 정예서 |
| **Phase 5: GPT 코칭** | 4월 3주 | OpenAI API 통합, 프롬프트 엔지니어링 | 🔄 진행중 | 장윤아 |
| **Phase 6: 대시보드** | 5월 1-2주 | 프론트엔드 시각화, 반응형 디자인 | 📋 예정 | 김이레 |
| **Phase 7: 테스트** | 5월 3주 | 기능 검증, 성능 최적화, 버그 수정 | 📋 예정 | 전체 |
| **Phase 8: 배포** | 6월 | IT쇼 최종 배포, 사용자 피드백 반영 | 📋 예정 | 전체 |

---

## 👥 Team

| 이름 | 학번 | 담당 역할 | 구현 상황 |
| :--- | :--- | :--- | :--- |
| **이상연** | 3310 | Frontend / Backend (계좌 시스템) | ✅ AccountSettings, Accounts API |
| **김이레** | 3103 | Frontend / UI Designer | 🔄 대시보드 작업 중 |
| **정예서** | 3413 | Backend / DB (데이터 분석) | ✅ Goal API, Transactions API |
| **장윤아** | 3614 | Backend / AI Prompt Engineer | 🔄 GPT 코칭 시스템 개발 중 |

---

## 🚀 Getting Started

### Prerequisites

```bash
- Node.js 18.0.0 이상
- npm 또는 yarn
- Git
- Supabase 계정 (https://supabase.com)
- OpenAI API 키 (https://platform.openai.com/api-keys)
```

### Installation

#### 1️⃣ 저장소 클론
```bash
git clone https://github.com/sangyeon08/2026-ITshow-Mony-Server.git
cd 2026-ITshow-Mony-Server
```

#### 2️⃣ 의존성 설치
```bash
npm install
# 또는
yarn install
```

#### 3️⃣ 환경 변수 설정

`.env.local` 파일 생성 (프로젝트 루트):
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

**환경 변수 얻는 방법:**
- Supabase: [https://app.supabase.com](https://app.supabase.com) → Settings → API
- OpenAI: [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)

#### 4️⃣ Supabase DB 테이블 생성

Supabase 대시보드 → SQL Editor에서 다음 쿼리 실행:

```sql
-- accounts 테이블
CREATE TABLE public.accounts (
  id bigint PRIMARY KEY DEFAULT nextval('accounts_id_seq'::regclass),
  user_id uuid NOT NULL,
  asset_type character varying NOT NULL,
  institution character varying NOT NULL,
  asset_subtype character varying,
  name character varying NOT NULL,
  balance integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT accounts_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- goal 테이블
CREATE TABLE public.goal (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid,
  goal_type character varying,
  period_type character varying,
  period_detail character varying,
  salary_timing character varying,
  target_amount integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT goal_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

-- transactions 테이블
CREATE TABLE public.transactions (
  id bigint PRIMARY KEY DEFAULT nextval('transactions_id_seq'::regclass),
  account_id bigint NOT NULL,
  transaction_date date NOT NULL,
  shop character varying NOT NULL,
  amount integer NOT NULL,
  category character varying NOT NULL,
  is_fixed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id)
);

-- goal_categories 테이블
CREATE TABLE public.goal_categories (
  id bigint PRIMARY KEY DEFAULT nextval('goal_categories_id_seq'::regclass),
  goal_id bigint NOT NULL,
  category_name character varying NOT NULL,
  CONSTRAINT goal_categories_goal_id_fkey FOREIGN KEY (goal_id) REFERENCES public.goal(id)
);

-- RLS 활성화 및 정책 설정
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own accounts" ON accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own accounts" ON accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own accounts" ON accounts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own accounts" ON accounts FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE goal ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own goals" ON goal FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their transactions" ON transactions FOR SELECT 
USING (account_id IN (SELECT id FROM accounts WHERE user_id = auth.uid()));
```

#### 5️⃣ 개발 서버 실행
```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

---

## 📦 Build & Deploy

### 프로덕션 빌드
```bash
npm run build
```

### 빌드 결과 미리보기
```bash
npm run preview
```

### Vercel에 배포 (예시)
```bash
npm install -g vercel
vercel
```

---

## 📊 API Usage Examples

### 1️⃣ 계좌 등록

```javascript
import { createAccount } from './api/accounts';

async function registerCard() {
  const userId = "user-uuid-here";
  
  const result = await createAccount(userId, {
    asset_type: "card",
    institution: "삼성",
    asset_subtype: "신용카드",
    name: "내 신용카드",
    balance: 5000000
  });

  if(result.success) {
    console.log("✅ 계좌 등록 완료:", result.data);
    // { id: 1, name: "내 신용카드", balance: 5000000, ... }
  } else {
    console.error("❌ 등록 실패:", result.message);
  }
}
```

### 2️⃣ 사용자 계좌 목록 조회

```javascript
import { findAccounts } from './api/accounts';

async function loadMyAccounts() {
  const userId = "user-uuid-here";
  
  const result = await findAccounts(userId);

  if(result.success) {
    console.log("📋 내 계좌 목록:");
    result.data.forEach(account => {
      console.log(`- ${account.name}: ₩${account.balance.toLocaleString()}`);
    });
  }
}
```

### 3️⃣ 목표 진행률 조회

```javascript
import { progressGoal } from './api/goal';

async function checkGoalProgress() {
  const userId = "user-uuid-here";
  
  const result = await progressGoal(userId, "2026-04");

  if(result.success) {
    console.log("🎯 4월 목표 진행 상황:");
    console.log(`목표 금액: ₩${result.targetAmount.toLocaleString()}`);
    console.log(`현재 지출: ₩${result.totalSpent.toLocaleString()}`);
    console.log(`남은 금액: ₩${result.remaining.toLocaleString()}`);
    console.log(`진행률: ${result.progressPercent}%`);
    
    if(result.warningLevel) {
      console.warn(`⚠️ 경고: ${result.warningLevel}`);
    }
  }
}
```

### 4️⃣ 월별 카테고리 소비 조회

```javascript
import { getCategoryConsumption } from './api/transactions';

async function analyzeCategorySpending() {
  const userId = "user-uuid-here";
  
  const result = await getCategoryConsumption(userId, "2026-04");

  if(result.success) {
    console.log("📊 4월 카테고리별 소비:");
    result.data.forEach(item => {
      console.log(`${item.category}: ₩${item.total.toLocaleString()}`);
    });
  }
}
```

### 5️⃣ 총 지출 요약

```javascript
import { getSpendingSummary } from './api/transactions';

async function getSummary() {
  const userId = "user-uuid-here";
  
  const result = await getSpendingSummary(userId, "2026-04");

  if(result.success) {
    console.log("💰 4월 지출 요약:");
    console.log(`총액: ₩${result.data.total.toLocaleString()}`);
    console.log(`고정 지출: ₩${result.data.fixed.toLocaleString()}`);
    console.log(`변동 지출: ₩${result.data.variable.toLocaleString()}`);
  }
}
```

### 6️⃣ React 컴포넌트에서 사용

```javascript
import { AccountSettings } from './components/AccountSettings';

function App() {
  return (
    <div>
      <h1>Mony 서비스</h1>
      <AccountSettings />
    </div>
  );
}

export default App;
```

---

## 📝 Development Notes

### Branch Strategy

```
main (프로덕션 브랜치)
│
├─ feature/api-account       ✅ 완료 - 이상연
│  └─ 계좌/카드 CRUD 기능
│
├─ feature/api-goal          ✅ 완료 - 정예서
│  └─ 목표/예산 관리 기능
│
├─ feature/api-transactions  ✅ 완료 - 정예서
│  └─ 거래내역 분석 기능
│
├─ feature/gpt-coaching      🔄 진행중 - 장윤아
│  └─ OpenAI API 연동, GPT 코칭
│
└─ feature/dashboard         📋 예정 - 김이레
   └─ 프론트엔드 대시보드 UI
```

### Git Workflow

```bash
# 1. feature 브랜치 생성
git checkout -b feature/your-feature-name

# 2. 코드 작성 및 커밋
git add .
git commit -m "[Feat] 기능 설명"

# 3. GitHub에 푸시
git push origin feature/your-feature-name

# 4. Pull Request 생성 (GitHub 웹사이트)

# 5. 코드 검토 후 병합
# 6. 로컬 main 업데이트
git checkout main
git pull origin main
```

### Supabase Setup Checklist

- [ ] Supabase 프로젝트 생성
- [ ] 테이블 생성 (SQL 실행)
- [ ] RLS (Row Level Security) 활성화
- [ ] Auth 설정 (Email/Password 활성화)
- [ ] API 키 발급
- [ ] .env.local에 환경 변수 설정
- [ ] 테스트 사용자 생성

### Environment Variables Reference

```env
# Required - Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional - OpenAI Configuration
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx...
```

---

## ⚠️ Challenges & Solutions

### 1. 데이터 확보
- **문제**: 실제 금융 API 연동의 제약 (은행 API 승인 프로세스 복잡)
- **해결**: 정교한 더미 데이터를 통해 서비스 로직을 검증하고, Supabase를 활용한 프로토타입 구현으로 실제 API 연동 시에도 쉽게 대체 가능하도록 설계

### 2. AI 일관성
- **문제**: GPT의 응답이 일관성이 없을 수 있으며, "잔소리"가 될 수 있음
- **해결**: GPT의 페르소나를 '잔소리 없는 따뜻한 코치'로 고정하고, 체계적인 프롬프트 엔지니어링을 통해 사용자 경험의 일관성 유지

### 3. 실시간 데이터 동기화
- **문제**: 여러 기기에서 접속 시 데이터 실시간 동기화 필요
- **해결**: Supabase의 Real-time 구독 기능 활용 (향후 구현 계획)

### 4. 보안 (RLS - Row Level Security)
- **문제**: 사용자는 자신의 데이터만 접근해야 하며, 데이터 유출 방지 필요
- **해결**: Supabase RLS 정책을 통해 user_id 기반 접근 제어 구현으로 데이터 보안 보장

### 5. 대역폭 최적화
- **문제**: 대량의 거래 데이터를 조회할 때 성능 저하
- **해결**: Supabase 쿼리 최적화, 필요한 칼럼만 선택 조회, 페이지네이션 구현 계획

---

## 🤝 Contributing

1. Feature 브랜치에서 작업 (`git checkout -b feature/your-feature`)
2. 커밋 (`git commit -m '[Feat] description'`)
3. 브랜치 푸시 (`git push origin feature/your-feature`)
4. Pull Request 생성

---

## 📄 License

MIT License - 자유롭게 사용, 수정, 배포 가능

---

## 📞 Contact & Resources

- **GitHub Repository**: [sangyeon08/2026-ITshow-Mony-Server](https://github.com/sangyeon08/2026-ITshow-Mony-Server)
- **Project Lead**: 이상연 (sanoni0115@gmail.com)
- **Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)
- **React Docs**: [https://react.dev](https://react.dev)
- **OpenAI API Docs**: [https://platform.openai.com/docs](https://platform.openai.com/docs)

---

**Last Updated**: 2026-04-21  
**Status**: 🔄 개발 진행 중  
**Next Milestone**: Phase 5 - GPT 코칭 시스템 (예정일: 2026-04-30)
