/**
 * useAppData — загружает все данные с сервера при входе в аккаунт.
 * Вызывается один раз из App.tsx когда user !== null.
 */
import {useEffect, useRef} from 'react';
import {useGoalStore} from '../store/twelveWeeks/goalStore.ts';
import {useTaskStore} from '../store/twelveWeeks/taskStore.ts';
import {useProgressStore} from '../store/progress/progressStore.ts';
import {useWheelStore} from '../store/lifeWheel/lifeWheelStore.ts';
import {useFitnessStore} from '../store/fitness/fitnessStore.ts';

export const useAppData = (userId: number | undefined) => {
    const loaded    = useRef(false);
    // Инициализируем current, чтобы TS не ругался при сборке.
    const prevId    = useRef<number | undefined>(undefined);

    const fetchGoals    = useGoalStore(s => s.fetchGoals);
    const fetchTasks    = useTaskStore(s => s.fetchTasks);
    const fetchProgress = useProgressStore(s => s.fetchAll);
    const fetchWheel    = useWheelStore(s => s.fetchSegments);
    const fetchFitness = useFitnessStore(s => s.fetchPrograms);

    useEffect(() => {
        if (!userId) {
            // При выходе — сбрасываем данные
            loaded.current = false;
            prevId.current = undefined;
            return;
        }
        // Загружаем один раз при входе или смене пользователя
        if (loaded.current && prevId.current === userId) return;

        loaded.current = true;
        prevId.current = userId;

        Promise.all([
            fetchGoals(),
            fetchTasks(),
            fetchProgress(),
            fetchWheel(),
            fetchFitness(),
        ]).catch(console.error);
    }, [userId]);
};
