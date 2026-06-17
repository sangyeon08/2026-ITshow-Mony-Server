import express from 'express';
import { supabase } from '../utils/supabase.js';

const router = express.Router();

async function syncBucketDoneStatus(bucket, probability) {
    if (probability !== 100) return;

    const { data: doneRow } = await supabase
        .from('bucket_do')
        .select('id')
        .eq('done_mony', bucket.title)
        .maybeSingle();

    if (doneRow) return;

    const { data: doingRow } = await supabase
        .from('bucket_do')
        .select('*')
        .eq('doing_mony', bucket.title)
        .maybeSingle();

    if (doingRow) {
        await supabase
            .from('bucket_do')
            .update({ done_mony: bucket.title, doing_mony: null })
            .eq('id', doingRow.id);
    } else {
        await supabase
            .from('bucket_do')
            .insert([{ done_mony: bucket.title, doing_mony: null }]);
    }
}

/**
 * @swagger
 * tags:
 *   name: Buckets
 *   description: 버킷리스트 API
 */

/**
 * @swagger
 * /api/buckets:
 *   post:
 *     summary: 버킷리스트 생성
 *     tags: [Buckets]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: 제주도 여행
 *               category:
 *                 type: string
 *                 enum: [여행, 취미, 자기계발]
 *                 example: 여행
 *               one:
 *                 type: string
 *                 example: 항공권 예매
 *               two:
 *                 type: string
 *                 example: 숙소 예약
 *               three:
 *                 type: string
 *                 example: 여행 출발
 *               one_mony:
 *                 type: integer
 *                 example: 100000
 *               two_mony:
 *                 type: integer
 *                 example: 200000
 *               three_mony:
 *                 type: integer
 *                 example: 500000
 *               mony_ing:
 *                 type: integer
 *                 example: 500000
 *               img:
 *                 type: string
 *                 example: https://example.com/image.jpg
 *               day:
 *                 type: string
 *                 example: 2026-12-25
 *     responses:
 *       201:
 *         description: 생성 성공
 *       400:
 *         description: 생성 실패
 */
router.post('/', async (req, res, next) => {
    try {
        const { title, category, one, two, three, one_mony, two_mony, three_mony, mony_ing, img, day } = req.body;

        // category 유효성 검사
        const validCategories = ['여행', '취미', '자기계발'];
        if (category && !validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'category는 여행, 취미, 자기계발 중 하나여야 합니다'
            });
        }

        const { data, error } = await supabase
            .from('bucket_list')
            .insert([{
                title,
                category,
                one,
                two,
                three,
                one_mony,
                two_mony,
                three_mony,
                mony_ing: mony_ing || 0,
                mony_finish: 0,  // 처음엔 0원
                probability: 0,  // 처음엔 0%
                img,
                day,
            }])
            .select()
            .single();

        if (error) {
            return res.status(400).json({
                success: false,
                message: '버킷리스트 생성 실패',
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: '버킷리스트가 생성되었습니다',
            data
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/buckets:
 *   get:
 *     summary: 버킷리스트 전체 조회
 *     tags: [Buckets]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [여행, 취미, 자기계발]
 *         description: 카테고리 필터
 *     responses:
 *       200:
 *         description: 조회 성공
 *       400:
 *         description: 조회 실패
 */
router.get('/', async (req, res, next) => {
    try {
        const { category } = req.query;

        let query = supabase
            .from('bucket_list')
            .select('*')
            .order('created_at', { ascending: false });

        // 카테고리 필터
        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) {
            return res.status(400).json({
                success: false,
                message: '버킷리스트 조회 실패',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: `${data.length}개의 버킷리스트를 조회했습니다`,
            data,
            count: data.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/buckets/status/all:
 *   get:
 *     summary: 완료/진행중 목록 조회
 *     tags: [Buckets]
 *     responses:
 *       200:
 *         description: 조회 성공
 *       400:
 *         description: 조회 실패
 */
router.get('/status/all', async (req, res, next) => {
    try {
        const { data, error } = await supabase
            .from('bucket_do')
            .select('*')
            .order('id', { ascending: false });

        if (error) {
            return res.status(400).json({
                success: false,
                message: 'bucket_do 조회 실패',
                error: error.message
            });
        }

        const done = data.filter(d => d.done_mony !== null);
        const doing = data.filter(d => d.doing_mony !== null);

        res.json({
            success: true,
            done,
            doing,
            doneCount: done.length,
            doingCount: doing.length
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/buckets/{id}:
 *   get:
 *     summary: 버킷 단일 조회
 *     tags: [Buckets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 조회 성공
 *       404:
 *         description: 버킷 없음
 */
router.get('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('bucket_list')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !data) {
            return res.status(404).json({
                success: false,
                message: '버킷을 찾을 수 없습니다'
            });
        }

        res.json({
            success: true,
            data
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/buckets/{id}/money:
 *   patch:
 *     summary: 버킷 현재 금액 업데이트 (자동으로 퍼센트 계산)
 *     tags: [Buckets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mony_finish:
 *                 type: integer
 *                 example: 250000
 *     responses:
 *       200:
 *         description: 업데이트 성공
 *       400:
 *         description: 업데이트 실패
 */
router.patch('/:id/deposit', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ success: false, message: '유효한 금액을 입력해주세요' });
        }

        const { data: bucket, error: fetchError } = await supabase
            .from('bucket_list')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !bucket) {
            return res.status(404).json({ success: false, message: '버킷을 찾을 수 없습니다' });
        }

        const mony_finish = (bucket.mony_finish || 0) + amount;
        const probability = bucket.mony_ing > 0
            ? Math.min(Math.round((mony_finish / bucket.mony_ing) * 100), 100)
            : 0;

        const { data: updated, error: updateError } = await supabase
            .from('bucket_list')
            .update({ mony_finish, probability })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            return res.status(400).json({ success: false, message: '저축 실패', error: updateError.message });
        }

        if (probability === 100) {
            const { data: doingRow } = await supabase
                .from('bucket_do')
                .select('*')
                .eq('doing_mony', bucket.title)
                .maybeSingle();

            if (doingRow) {
                await supabase.from('bucket_do').update({ done_mony: bucket.title, doing_mony: null }).eq('id', doingRow.id);
            } else {
                await supabase.from('bucket_do').insert([{ done_mony: bucket.title, doing_mony: null }]);
            }
        }

        res.json({ success: true, data: updated, probability });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id/money', async (req, res, next) => {
    try {
        const { id } = req.params;
        const mony_finish = Number(req.body.mony_finish);

        if (!Number.isFinite(mony_finish) || mony_finish < 0) {
            return res.status(400).json({
                success: false,
                message: 'mony_finish는 0 이상의 숫자여야 합니다'
            });
        }

        // 현재 버킷 조회
        const { data: bucket, error: fetchError } = await supabase
            .from('bucket_list')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !bucket) {
            return res.status(404).json({
                success: false,
                message: '버킷을 찾을 수 없습니다'
            });
        }

        // 퍼센트 자동 계산
        const nextMonyFinish = bucket.mony_ing > 0
            ? Math.min(mony_finish, bucket.mony_ing)
            : mony_finish;

        const probability = bucket.mony_ing > 0
            ? Math.min(Math.round((nextMonyFinish / bucket.mony_ing) * 100), 100)
            : 0;

        const { data: updated, error: updateError } = await supabase
            .from('bucket_list')
            .update({ mony_finish: nextMonyFinish, probability })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            return res.status(400).json({
                success: false,
                message: '금액 업데이트 실패',
                error: updateError.message
            });
        }

        // 100%면 done_mony로 자동 이동
        if (probability === 100) {
            await syncBucketDoneStatus(bucket, probability);

            return res.json({
                success: true,
                message: '🎉 목표 금액 달성! 버킷이 완료되었습니다',
                data: updated,
                probability
            });
        }

        res.json({
            success: true,
            message: `현재 ${nextMonyFinish}원 / 목표 ${bucket.mony_ing}원 (${probability}%)`,
            data: updated,
            probability
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/buckets/{id}/deposit:
 *   patch:
 *     summary: 버킷리스트 저금통 적립
 *     tags: [Buckets]
 */
router.patch('/:id/deposit', async (req, res, next) => {
    try {
        const { id } = req.params;
        const amount = Number(req.body.amount);

        if (!Number.isFinite(amount) || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'amount는 0보다 큰 숫자여야 합니다'
            });
        }

        const { data: bucket, error: fetchError } = await supabase
            .from('bucket_list')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !bucket) {
            return res.status(404).json({
                success: false,
                message: '버킷을 찾을 수 없습니다'
            });
        }

        const currentMonyFinish = Number(bucket.mony_finish) || 0;
        const targetAmount = Number(bucket.mony_ing) || 0;
        const nextMonyFinish = targetAmount > 0
            ? Math.min(currentMonyFinish + amount, targetAmount)
            : currentMonyFinish + amount;
        const depositedAmount = nextMonyFinish - currentMonyFinish;
        const probability = targetAmount > 0
            ? Math.min(Math.round((nextMonyFinish / targetAmount) * 100), 100)
            : 0;

        const { data: updated, error: updateError } = await supabase
            .from('bucket_list')
            .update({ mony_finish: nextMonyFinish, probability })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            return res.status(400).json({
                success: false,
                message: '저금통 적립 실패',
                error: updateError.message
            });
        }

        await syncBucketDoneStatus(bucket, probability);

        res.json({
            success: true,
            message: probability === 100
                ? '🎉 목표 금액 달성! 버킷이 완료되었습니다'
                : `${depositedAmount}원이 버킷리스트 저금통에 적립되었습니다`,
            data: updated,
            depositedAmount,
            probability
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/buckets/{id}/doing:
 *   post:
 *     summary: 버킷 진행중 등록
 *     tags: [Buckets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       201:
 *         description: 진행중 등록 성공
 *       400:
 *         description: 등록 실패
 *       404:
 *         description: 버킷 없음
 */
router.post('/:id/doing', async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: bucket, error: bucketError } = await supabase
            .from('bucket_list')
            .select('title, probability')
            .eq('id', id)
            .single();

        if (bucketError || !bucket) {
            return res.status(404).json({
                success: false,
                message: '버킷을 찾을 수 없습니다'
            });
        }

        if (bucket.probability === 100) {
            return res.status(400).json({
                success: false,
                message: '이미 완료된 버킷입니다'
            });
        }

        const { data: existing } = await supabase
            .from('bucket_do')
            .select('*')
            .eq('doing_mony', bucket.title)
            .maybeSingle();

        if (existing) {
            return res.status(400).json({
                success: false,
                message: '이미 진행중인 버킷입니다'
            });
        }

        const { data, error } = await supabase
            .from('bucket_do')
            .insert([{ doing_mony: bucket.title, done_mony: null }])
            .select()
            .single();

        if (error) {
            return res.status(400).json({
                success: false,
                message: '진행중 등록 실패',
                error: error.message
            });
        }

        res.status(201).json({
            success: true,
            message: '버킷이 진행중으로 등록되었습니다',
            data
        });
    } catch (error) {
        next(error);
    }
});

/**
 * @swagger
 * /api/buckets/{id}:
 *   delete:
 *     summary: 버킷 삭제
 *     tags: [Buckets]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: 삭제 성공
 *       404:
 *         description: 버킷 없음
 */
router.delete('/:id', async (req, res, next) => {
    try {
        const { id } = req.params;

        const { data: bucket, error: checkError } = await supabase
            .from('bucket_list')
            .select('id')
            .eq('id', id)
            .single();

        if (checkError || !bucket) {
            return res.status(404).json({
                success: false,
                message: '버킷을 찾을 수 없습니다'
            });
        }

        const { error } = await supabase
            .from('bucket_list')
            .delete()
            .eq('id', id);

        if (error) {
            return res.status(400).json({
                success: false,
                message: '버킷 삭제 실패',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: '버킷이 삭제되었습니다'
        });
    } catch (error) {
        next(error);
    }
});

// 추억 저장 (img, created_at, day 업데이트)
router.patch('/:id/memory', async (req, res, next) => {
    try {
        const { id } = req.params;
        const { img, day } = req.body; // created_at 제거, day만 사용

        const { data, error } = await supabase
            .from('bucket_list')
            .update({ img, day })  // day에 날짜 + 메모 저장
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return res.status(400).json({
                success: false,
                message: '추억 저장 실패',
                error: error.message
            });
        }

        res.json({
            success: true,
            message: '추억이 저장되었습니다',
            data
        });
    } catch (error) {
        next(error);
    }
});

export default router;
