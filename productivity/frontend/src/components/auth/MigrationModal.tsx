/**
 * MigrationModal — показывается после первого входа если в localStorage есть данные.
 *
 * ВАЖНО: hasLocalDataToMigrate вынесена в отдельный файл migrationUtils.ts
 * чтобы не ломать Vite Fast Refresh (нельзя экспортировать функцию + компонент из одного файла).
 */
import {useState} from 'react';
import {Modal, Button, Typography, List, Alert, Flex, Progress} from 'antd';
import {CloudUploadOutlined, DeleteOutlined} from '@ant-design/icons';
import {twelveWeeksApi} from '../../api/twelveWeeks.ts';
import {progressApi} from '../../api/progress.ts';
import {lifeWheelApi} from '../../api/lifeWheel.ts';

const {Text, Title} = Typography;
const GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
const MIGRATION_DONE_KEY = 'migration-done';

const detectLocalData = () => {
    const items: string[] = [];
    try {
        const tasks = JSON.parse(localStorage.getItem('productivity') ?? '[]');
        const goals = JSON.parse(localStorage.getItem('productivity-goals') ?? '[]');
        const trackers = JSON.parse(localStorage.getItem('progress-trackers') ?? '[]');
        const wheel = JSON.parse(localStorage.getItem('life-wheel') ?? '[]');
        if (goals.length) items.push(`${goals.length} целей на 12 недель`);
        if (tasks.length) items.push(`${tasks.length} задач`);
        if (trackers.length) items.push(`${trackers.length} трекеров прогресса`);
        if (wheel.length) items.push(`${wheel.length} сегментов жизненного круга`);
    } catch {/* ignore */
    }
    return items;
};

const clearLocalAppData = () => {
    ['productivity', 'productivity-goals', 'progress-trackers', 'progress-categories', 'life-wheel']
        .forEach(k => localStorage.removeItem(k));
    localStorage.setItem(MIGRATION_DONE_KEY, '1');
};

interface Props {
    open: boolean;
    onFinish: () => void;
}

export function MigrationModal({open, onFinish}: Props) {
    const [migrating, setMigrating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const localData = detectLocalData();

    const handleMigrate = async () => {
        setMigrating(true);
        setError('');
        try {
            setProgress(10);
            const goals = JSON.parse(localStorage.getItem('productivity-goals') ?? '[]');
            if (goals.length) {
                await twelveWeeksApi.bulkGoals(
                    goals.map((g: { text: string; done: boolean }) => ({text: g.text, done: g.done}))
                );
            }
            setProgress(30);
            const tasks = JSON.parse(localStorage.getItem('productivity') ?? '[]');
            if (tasks.length) await twelveWeeksApi.bulkTasks(tasks);

            setProgress(55);
            const trackers = JSON.parse(localStorage.getItem('progress-trackers') ?? '[]');
            if (trackers.length) await progressApi.bulkImport(trackers);

            setProgress(80);
            const wheel = JSON.parse(localStorage.getItem('life-wheel') ?? '[]');
            if (wheel.length) await lifeWheelApi.bulkImport(wheel);

            setProgress(100);
            clearLocalAppData();
            setTimeout(() => onFinish(), 600);
        } catch (e: unknown) {
            const err = e as { message?: string };
            setError(err?.message ?? 'Ошибка при импорте данных');
        } finally {
            setMigrating(false);
        }
    };

    const handleSkip = () => {
        clearLocalAppData();
        onFinish();
    };

    return (
        <Modal open={open} footer={null} closable={false} width={480} centered>
            <div style={{textAlign: 'center', marginBottom: 24}}>
                <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    margin: '0 auto 12px',
                    background: GRADIENT,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24
                }}>☁️
                </div>
                <Title level={4} style={{margin: 0}}>Обнаружены локальные данные</Title>
                <Text type="secondary">Хотите перенести их в аккаунт?</Text>
            </div>

            {localData.length > 0 && (
                <div style={{
                    background: '#f8f9ff',
                    borderRadius: 12,
                    padding: '12px 16px',
                    marginBottom: 20,
                    border: '1px solid #e8e8ff'
                }}>
                    <Text strong style={{fontSize: 13, display: 'block', marginBottom: 8}}>Будет перенесено:</Text>
                    <List size="small" dataSource={localData}
                          renderItem={item => (
                              <List.Item style={{padding: '4px 0', border: 'none'}}>
                                  <Text style={{fontSize: 13}}>✓ {item}</Text>
                              </List.Item>
                          )}/>
                </div>
            )}

            {migrating && <Progress percent={progress} strokeColor={GRADIENT} style={{marginBottom: 16}}/>}
            {error && <Alert type="error" message={error} style={{marginBottom: 16}} showIcon/>}

            <Flex gap={12} justify="center">
                <Button type="primary" size="large" icon={<CloudUploadOutlined/>}
                        loading={migrating} onClick={handleMigrate}
                        style={{background: GRADIENT, border: 'none', flex: 1}}>
                    Перенести данные
                </Button>
                <Button size="large" danger icon={<DeleteOutlined/>}
                        disabled={migrating} onClick={handleSkip} style={{flex: 1}}>
                    Начать заново
                </Button>
            </Flex>
        </Modal>
    );
}