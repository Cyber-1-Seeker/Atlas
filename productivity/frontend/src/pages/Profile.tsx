import {useState} from 'react';
import {Button, Input, Form, Avatar, Tag, Divider, Alert, Typography, Flex, Row, Col, Modal, Upload, List} from 'antd';
import {EditOutlined, SaveOutlined, LogoutOutlined, LockOutlined} from '@ant-design/icons';
import {useAuthStore} from '../store/auth/authStore.ts';
import {authApi} from '../api/auth.ts';

const {Title, Text} = Typography;
const GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

export function Profile() {
    const {user, logout, setUser} = useAuthStore();
    const [editName, setEditName]   = useState(false);
    const [newName,  setNewName]    = useState(user?.username ?? '');
    const [pwForm,   setPwForm]     = useState(false);
    const [pwError,  setPwError]    = useState('');
    const [pwOk,     setPwOk]       = useState(false);
    const [saving,   setSaving]     = useState(false);
    const [dataBusy, setDataBusy]   = useState(false);
    const [importResult, setImportResult] = useState<Awaited<ReturnType<typeof authApi.importData>>['data'] | null>(null);
    const [importOpen, setImportOpen] = useState(false);

    if (!user) return null;

    const joinDate = new Date(user.date_joined).toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
    const initials = user.username.slice(0,2).toUpperCase();

    const handleSaveName = async () => {
        if (!newName.trim()||newName===user.username){setEditName(false);return;}
        setSaving(true);
        try{const{data}=await authApi.updateProfile({username:newName.trim()});setUser(data);setEditName(false);}
        catch{}finally{setSaving(false);}
    };
    const handlePw = async(v:{old_password:string;new_password:string;confirm:string})=>{
        if(v.new_password!==v.confirm){setPwError('Пароли не совпадают');return;}
        setPwError('');setSaving(true);
        try{await authApi.changePassword(v.old_password,v.new_password);setPwOk(true);setPwForm(false);setTimeout(()=>setPwOk(false),3000);}
        catch{setPwError('Неверный текущий пароль');}finally{setSaving(false);}
    };

    const downloadJson = (obj: unknown, filename: string) => {
        const blob = new Blob([JSON.stringify(obj, null, 2)], {type: 'application/json;charset=utf-8'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const handleExport = async () => {
        setDataBusy(true);
        try {
            const {data} = await authApi.exportData();
            const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
            downloadJson(data, `productivityMax-export-${user.username}-${ts}.json`);
        } finally {
            setDataBusy(false);
        }
    };

    const handleImportFile = async (file: File) => {
        setDataBusy(true);
        try {
            const text = await file.text();
            const parsed = JSON.parse(text) as Record<string, unknown>;
            const {data} = await authApi.importData(parsed);
            setImportResult(data);
            setImportOpen(true);
        } catch (e: unknown) {
            setImportResult(null);
            setImportOpen(true);
        } finally {
            setDataBusy(false);
        }
        return false; // prevent Upload from auto uploading
    };

    const pwFormEl = (
        <div>
            {pwError&&<Alert type="error" message={pwError} showIcon style={{marginBottom:12,borderRadius:10}}/>}
            <Form layout="vertical" onFinish={handlePw} size="large">
                <Form.Item name="old_password" label="Текущий пароль" rules={[{required:true}]}>
                    <Input.Password style={{borderRadius:10}}/>
                </Form.Item>
                <Form.Item name="new_password" label="Новый пароль" rules={[{required:true},{min:8}]}>
                    <Input.Password style={{borderRadius:10}}/>
                </Form.Item>
                <Form.Item name="confirm" label="Повторите пароль" rules={[{required:true}]}>
                    <Input.Password style={{borderRadius:10}}/>
                </Form.Item>
                <Button type="primary" htmlType="submit" block loading={saving}
                        style={{background:GRADIENT,border:'none',height:48,borderRadius:12}}>
                    Сохранить пароль
                </Button>
            </Form>
        </div>
    );

    return (
        <>
            {/* ═══ MOBILE ════════════════════════════════════════ */}
            <div className="mobile-only" style={{minHeight:'100vh',background:'#f0f2f5'}}>
                {/* Градиентная шапка */}
                <div style={{background:GRADIENT,padding:'44px 20px 56px',textAlign:'center'}}>
                    <Avatar size={76} style={{background:user.avatar_color,fontSize:26,fontWeight:700,border:'3px solid rgba(255,255,255,0.4)'}}>{initials}</Avatar>
                    <div style={{marginTop:10}}>
                        {editName?(
                            <Flex justify="center" gap={8} align="center">
                                <Input value={newName} onChange={e=>setNewName(e.target.value)}
                                       style={{width:160,textAlign:'center',fontSize:17,fontWeight:700,borderRadius:10}}
                                       autoFocus onPressEnter={handleSaveName}/>
                                <Button icon={<SaveOutlined/>} type="primary" loading={saving} onClick={handleSaveName}
                                        style={{background:'rgba(255,255,255,0.25)',border:'none'}}/>
                            </Flex>
                        ):(
                            <Flex justify="center" align="center" gap={8}>
                                <Title level={4} style={{margin:0,color:'white'}}>{user.username}</Title>
                                <Button type="text" size="small" icon={<EditOutlined/>}
                                        onClick={()=>{setNewName(user.username);setEditName(true);}}
                                        style={{color:'rgba(255,255,255,0.8)'}}/>
                            </Flex>
                        )}
                        <Text style={{color:'rgba(255,255,255,0.7)',fontSize:12,display:'block',marginTop:3}}>
                            {user.email??'Email не указан'}
                        </Text>
                        <Tag style={{marginTop:8,background:'rgba(255,255,255,0.15)',border:'none',color:'white',fontSize:11}}>
                            С нами с {joinDate}
                        </Tag>
                    </div>
                </div>

                {/* Плавающая карточка */}
                <div style={{margin:'-28px 12px 0',background:'white',borderRadius:20,padding:'20px 16px',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
                    {pwOk&&<Alert type="success" message="Пароль изменён" showIcon style={{marginBottom:12,borderRadius:10}}/>}
                    <Flex gap={10} style={{marginBottom:pwForm?16:0}}>
                        <Button icon={<LockOutlined/>} block onClick={()=>setPwForm(f=>!f)} size="large"
                                style={{borderRadius:12,height:46}}>
                            {pwForm?'Отмена':'Изменить пароль'}
                        </Button>
                        <Button icon={<LogoutOutlined/>} danger block onClick={logout} size="large"
                                style={{borderRadius:12,height:46}}>
                            Выйти
                        </Button>
                    </Flex>
                    {pwForm&&pwFormEl}
                    {!pwForm&&<Divider style={{margin:'16px 0'}}/>}
                    {!pwForm&&(
                        <div>
                            <Text strong style={{display:'block',marginBottom:12,fontSize:13}}>О приложении</Text>
                            {[
                                {icon:'📅',title:'12 недель',desc:'Цели и задачи по неделям'},
                                {icon:'📈',title:'Прогресс',desc:'Трекеры любых показателей'},
                                {icon:'⭕',title:'Жизн. круг',desc:'Баланс по направлениям'},
                            ].map(item=>(
                                <Flex key={item.title} align="center" gap={12}
                                      style={{padding:'10px 0',borderBottom:'1px solid #f5f5f5'}}>
                                    <div style={{fontSize:22,width:36,textAlign:'center'}}>{item.icon}</div>
                                    <div>
                                        <Text strong style={{display:'block',fontSize:13}}>{item.title}</Text>
                                        <Text type="secondary" style={{fontSize:11}}>{item.desc}</Text>
                                    </div>
                                </Flex>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ═══ DESKTOP ═══════════════════════════════════════ */}
            <div className="desktop-only" style={{maxWidth:760,margin:'0 auto'}}>
                <div style={{marginBottom:28}}>
                    <Title level={2} style={{margin:0,color:'#434343'}}>Профиль</Title>
                    <Text type="secondary" style={{fontSize:15}}>Управление аккаунтом и настройки</Text>
                </div>
                <div style={{background:'white',borderRadius:20,boxShadow:'0 4px 20px rgba(0,0,0,0.08)',marginBottom:20,overflow:'hidden'}}>
                    <div style={{background:GRADIENT,height:100}}/>
                    <div style={{marginTop:-48,textAlign:'center',padding:'0 24px 24px'}}>
                        <Avatar size={96} style={{background:user.avatar_color,fontSize:32,fontWeight:700,border:'4px solid white',boxShadow:'0 4px 12px rgba(0,0,0,0.15)'}}>{initials}</Avatar>
                        <div style={{marginTop:12}}>
                            {editName?(
                                <Flex justify="center" gap={8} align="center">
                                    <Input value={newName} onChange={e=>setNewName(e.target.value)} size="large" style={{width:220,textAlign:'center',fontSize:18,fontWeight:700}} autoFocus onPressEnter={handleSaveName}/>
                                    <Button icon={<SaveOutlined/>} type="primary" loading={saving} onClick={handleSaveName} style={{background:GRADIENT,border:'none'}}/>
                                </Flex>
                            ):(
                                <Flex justify="center" align="center" gap={8}>
                                    <Title level={3} style={{margin:0}}>{user.username}</Title>
                                    <Button type="text" size="small" icon={<EditOutlined/>} onClick={()=>{setNewName(user.username);setEditName(true);}} style={{color:'#8c8c8c'}}/>
                                </Flex>
                            )}
                            <Text type="secondary">{user.email??'Email не указан'}</Text>
                            <div style={{marginTop:8}}><Tag color="blue">Зарегистрирован {joinDate}</Tag></div>
                        </div>
                        <Divider/>
                        <Flex gap={12} justify="center" wrap="wrap">
                            <Button icon={<LockOutlined/>} onClick={()=>setPwForm(f=>!f)}>{pwForm?'Отмена':'Изменить пароль'}</Button>
                            <Button icon={<LogoutOutlined/>} danger onClick={logout}>Выйти</Button>
                        </Flex>
                        {pwForm&&<div style={{maxWidth:360,margin:'20px auto 0'}}>{pwFormEl}</div>}
                    </div>
                </div>
                <div style={{background:'white',borderRadius:16,boxShadow:'0 2px 8px rgba(0,0,0,0.06)',padding:24}}>
                    <Title level={5} style={{marginTop:0}}>О приложении</Title>
                    <Row gutter={24}>
                        {[{title:'12 недель',desc:'Ставьте цели и задачи'},{title:'Прогресс',desc:'Любые показатели'},{title:'Жизн. круг',desc:'Баланс направлений'}].map(item=>(
                            <Col span={8} key={item.title} style={{textAlign:'center',padding:12}}>
                                <Text strong style={{display:'block',marginBottom:4}}>{item.title}</Text>
                                <Text type="secondary" style={{fontSize:11}}>{item.desc}</Text>
                            </Col>
                        ))}
                    </Row>
                    <Divider/>
                    <Title level={5} style={{marginTop:0}}>Импорт / экспорт данных</Title>
                    <Text type="secondary" style={{display:'block',marginBottom:12}}>
                        Экспортирует и импортирует данные текущего пользователя (12 недель, дневник достижений, прогресс, жизненный круг и доски).
                    </Text>
                    <Flex gap={12} wrap="wrap">
                        <Button type="primary" onClick={handleExport} loading={dataBusy}
                                style={{background:GRADIENT,border:'none'}}>
                            Экспортировать в JSON
                        </Button>
                        <Upload
                            accept="application/json"
                            beforeUpload={handleImportFile}
                            showUploadList={false}
                            disabled={dataBusy}
                        >
                            <Button loading={dataBusy}>Импортировать из JSON</Button>
                        </Upload>
                    </Flex>
                </div>
            </div>

            <Modal
                open={importOpen}
                onCancel={() => setImportOpen(false)}
                footer={<Button onClick={() => setImportOpen(false)}>Закрыть</Button>}
                title="Результат импорта"
                width={720}
            >
                {!importResult ? (
                    <Alert
                        type="error"
                        showIcon
                        message="Не удалось импортировать"
                        description="Проверьте, что файл — JSON экспорта из этого приложения."
                    />
                ) : (
                    <div>
                        <Alert
                            type={importResult.conflicts.tasks.length ? 'warning' : 'success'}
                            showIcon
                            message={importResult.conflicts.tasks.length
                                ? 'Импорт выполнен частично (есть конфликты времени)'
                                : 'Импорт выполнен успешно'}
                            description={
                                <div>
                                    <div>Создано: {Object.entries(importResult.created).map(([k,v]) => `${k}=${v}`).join(', ')}</div>
                                    {importResult.conflicts.tasks.length > 0 && (
                                        <div style={{marginTop: 8}}>
                                            Конфликтные задачи не были импортированы.
                                        </div>
                                    )}
                                </div>
                            }
                        />

                        {importResult.conflicts.tasks.length > 0 && (
                            <div style={{marginTop: 16}}>
                                <Title level={5} style={{marginTop: 0}}>Конфликты по времени (12 недель)</Title>
                                <List
                                    dataSource={importResult.conflicts.tasks}
                                    renderItem={(c) => (
                                        <List.Item>
                                            <div>
                                                <Text strong>Импорт:</Text>{' '}
                                                <Text>
                                                    {c.import_task.text} — нед. {c.import_task.week}, день {c.import_task.day_of_week},{' '}
                                                    {String(c.import_task.start_hour).padStart(2,'0')}:{String(c.import_task.start_minute).padStart(2,'0')}
                                                    {'–'}
                                                    {String(c.import_task.end_hour).padStart(2,'0')}:{String(c.import_task.end_minute).padStart(2,'0')}
                                                </Text>
                                                <br/>
                                                <Text strong>Занято:</Text>{' '}
                                                <Text type="secondary">
                                                    {c.occupied_by.text} — нед. {c.occupied_by.week}, день {c.occupied_by.day_of_week},{' '}
                                                    {String(c.occupied_by.start_hour).padStart(2,'0')}:{String(c.occupied_by.start_minute).padStart(2,'0')}
                                                    {'–'}
                                                    {String(c.occupied_by.end_hour).padStart(2,'0')}:{String(c.occupied_by.end_minute).padStart(2,'0')}
                                                </Text>
                                            </div>
                                        </List.Item>
                                    )}
                                />
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </>
    );
}
