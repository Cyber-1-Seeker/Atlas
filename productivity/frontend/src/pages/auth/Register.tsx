import {useState} from 'react';
import {Button, Form, Input, Typography, Alert, Flex} from 'antd';
import {UserOutlined, LockOutlined, MailOutlined} from '@ant-design/icons';
import {useAuthStore} from '../../store/auth/authStore.ts';
import {useBreakpoint} from '../../hooks/useBreakpoint.ts';

const {Title, Text} = Typography;
const GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

interface Props { onGoLogin: () => void; }

export function Register({onGoLogin}: Props) {
    const {register, isLoading} = useAuthStore();
    const {isMobile} = useBreakpoint();
    const [error, setError] = useState('');

    const onFinish = async (vals: {username: string; email?: string; password: string; password2: string}) => {
        setError('');
        try { await register(vals.username, vals.password, vals.password2, vals.email); }
        catch (e: unknown) {
            const err = e as {response?: {data?: Record<string, string[]>}};
            const data = err?.response?.data ?? {};
            setError(Object.values(data).flat()[0] ?? 'Ошибка регистрации');
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
            padding: isMobile ? '20px 20px' : '40px 24px',
            overflowY: 'auto',
        }}>
            <div style={{textAlign: 'center', marginBottom: isMobile ? 24 : 36}}>
                <div style={{
                    width: 56, height: 56, borderRadius: 18,
                    background: 'rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 14px', fontSize: 28,
                }}>✓</div>
                <Title level={isMobile ? 3 : 2} style={{margin: 0, color: 'white'}}>
                    Создать аккаунт
                </Title>
                <Text style={{color: 'rgba(255,255,255,0.75)', fontSize: 14}}>
                    True Productivity
                </Text>
            </div>

            <div style={{
                width: '100%',
                maxWidth: isMobile ? '100%' : 440,
                background: 'white',
                borderRadius: 20,
                padding: isMobile ? '24px 20px' : '36px 32px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            }}>
                {error && (
                    <Alert type="error" message={error}
                           style={{marginBottom: 14, borderRadius: 10}} showIcon/>
                )}

                <Form layout="vertical" onFinish={onFinish} size="large">
                    <Form.Item name="username" label={<Text strong style={{fontSize: 13}}>Имя пользователя</Text>}
                               rules={[{required: true}, {min: 3, message: 'Минимум 3 символа'}]}>
                        <Input prefix={<UserOutlined style={{color: '#bbb'}}/>}
                               placeholder="your_username"
                               style={{borderRadius: 10, height: 46}}/>
                    </Form.Item>
                    <Form.Item name="email" label={<Text strong style={{fontSize: 13}}>Email (необязательно)</Text>}>
                        <Input prefix={<MailOutlined style={{color: '#bbb'}}/>}
                               placeholder="email@example.com"
                               style={{borderRadius: 10, height: 46}}/>
                    </Form.Item>
                    <Form.Item name="password" label={<Text strong style={{fontSize: 13}}>Пароль</Text>}
                               rules={[{required: true}, {min: 8, message: 'Минимум 8 символов'}]}>
                        <Input.Password prefix={<LockOutlined style={{color: '#bbb'}}/>}
                                        placeholder="Минимум 8 символов"
                                        style={{borderRadius: 10, height: 46}}/>
                    </Form.Item>
                    <Form.Item name="password2" label={<Text strong style={{fontSize: 13}}>Повторите пароль</Text>}
                               rules={[
                                   {required: true},
                                   ({getFieldValue}) => ({
                                       validator(_, value) {
                                           if (!value || getFieldValue('password') === value)
                                               return Promise.resolve();
                                           return Promise.reject('Пароли не совпадают');
                                       },
                                   }),
                               ]}>
                        <Input.Password prefix={<LockOutlined style={{color: '#bbb'}}/>}
                                        placeholder="Повторите пароль"
                                        style={{borderRadius: 10, height: 46}}/>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block loading={isLoading}
                            style={{
                                background: GRADIENT, border: 'none',
                                height: 50, borderRadius: 12,
                                fontSize: 15, fontWeight: 600, marginTop: 4,
                            }}>
                        Создать аккаунт
                    </Button>
                </Form>

                <Flex justify="center" align="center" style={{marginTop: 16}} gap={4}>
                    <Text type="secondary" style={{fontSize: 14}}>Уже есть аккаунт?</Text>
                    <Button type="link" onClick={onGoLogin}
                            style={{padding: '0 4px', fontSize: 14, fontWeight: 600}}>
                        Войти
                    </Button>
                </Flex>
            </div>
        </div>
    );
}
