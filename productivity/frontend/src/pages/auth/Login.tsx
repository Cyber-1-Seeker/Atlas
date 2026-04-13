import {useState} from 'react';
import {Button, Form, Input, Typography, Alert, Flex} from 'antd';
import {UserOutlined, LockOutlined} from '@ant-design/icons';
import {useAuthStore} from '../../store/auth/authStore.ts';
import {useBreakpoint} from '../../hooks/useBreakpoint.ts';

const {Title, Text} = Typography;
const GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

interface Props { onGoRegister: () => void; }

export function Login({onGoRegister}: Props) {
    const {login, isLoading} = useAuthStore();
    const {isMobile} = useBreakpoint();
    const [error, setError] = useState('');

    const onFinish = async (vals: {username: string; password: string}) => {
        setError('');
        try { await login(vals.username, vals.password); }
        catch (e: unknown) {
            const err = e as {response?: {data?: {detail?: string}}};
            setError(err?.response?.data?.detail ?? 'Неверные данные');
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: GRADIENT,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isMobile ? '24px 20px' : '40px 24px',
        }}>
            {/* Логотип */}
            <div style={{textAlign: 'center', marginBottom: isMobile ? 32 : 40}}>
                <div style={{
                    width: isMobile ? 56 : 72,
                    height: isMobile ? 56 : 72,
                    borderRadius: isMobile ? 18 : 22,
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 16px',
                    fontSize: isMobile ? 28 : 36,
                }}>✓</div>
                <Title level={isMobile ? 3 : 2} style={{margin: 0, color: 'white'}}>
                    True Productivity
                </Title>
                <Text style={{color: 'rgba(255,255,255,0.75)', fontSize: isMobile ? 13 : 15}}>
                    Войдите в свой аккаунт
                </Text>
            </div>

            {/* Форма */}
            <div style={{
                width: '100%',
                maxWidth: isMobile ? '100%' : 420,
                background: 'white',
                borderRadius: isMobile ? 20 : 24,
                padding: isMobile ? '24px 20px' : '36px 32px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}>
                {error && (
                    <Alert type="error" message={error}
                           style={{marginBottom: 16, borderRadius: 10}} showIcon/>
                )}

                <Form layout="vertical" onFinish={onFinish} size={isMobile ? 'large' : 'large'}>
                    <Form.Item name="username" label={<Text strong>Имя пользователя</Text>}
                               rules={[{required: true, message: 'Введите имя пользователя'}]}>
                        <Input
                            prefix={<UserOutlined style={{color: '#bbb'}}/>}
                            placeholder="your_username"
                            style={{borderRadius: 10, height: 48}}
                        />
                    </Form.Item>
                    <Form.Item name="password" label={<Text strong>Пароль</Text>}
                               rules={[{required: true, message: 'Введите пароль'}]}>
                        <Input.Password
                            prefix={<LockOutlined style={{color: '#bbb'}}/>}
                            placeholder="Ваш пароль"
                            style={{borderRadius: 10, height: 48}}
                        />
                    </Form.Item>
                    <Button
                        type="primary" htmlType="submit" block loading={isLoading}
                        style={{
                            background: GRADIENT, border: 'none',
                            height: 50, borderRadius: 12,
                            fontSize: 16, fontWeight: 600,
                            marginTop: 8,
                        }}
                    >
                        Войти
                    </Button>
                </Form>

                <Flex justify="center" align="center" style={{marginTop: 20}} gap={4}>
                    <Text type="secondary" style={{fontSize: 14}}>Нет аккаунта?</Text>
                    <Button type="link" onClick={onGoRegister}
                            style={{padding: '0 4px', fontSize: 14, fontWeight: 600}}>
                        Зарегистрироваться
                    </Button>
                </Flex>
            </div>
        </div>
    );
}
