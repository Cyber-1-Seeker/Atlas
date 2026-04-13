import {useEffect, useState} from 'react';
import {
    Button,
    Tabs,
    Input,
    Select,
    InputNumber,
    Form,
    Typography,
    Popconfirm,
    Flex,
    Tag,
    Divider,
    Modal,
    Upload,
    message,
    Switch,
    Alert
} from 'antd';
import {PlusOutlined, DeleteOutlined, EditOutlined, UploadOutlined} from '@ant-design/icons';
import {fitnessApi} from '../../api/fitness.ts';
import {useFitnessStore} from '../../store/fitness/fitnessStore.ts';
import {parseApiError} from '../../utils/parseApiError.ts';
import type {Exercise, MuscleGroup} from '../../api/fitness.ts';
import {MEASUREMENT_TYPE_LABELS} from '../../types/progress/progress.ts';


const {Text} = Typography;
const {TextArea} = Input;
const GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
const INTENSITY_OPTS = [{value: 1, label: '1 — Немного'}, {value: 2, label: '2 — Средне'}, {
    value: 3,
    label: '3 — Сильно'
}, {value: 4, label: '4 — Очень сильно'}];
const CATEGORIES = [{value: 'chest', label: 'Грудь'}, {value: 'back', label: 'Спина'}, {
    value: 'shoulders',
    label: 'Плечи'
}, {value: 'arms', label: 'Руки'}, {value: 'legs', label: 'Ноги'}, {
    value: 'core',
    label: 'Пресс/Кор'
}, {value: 'cardio', label: 'Кардио'}, {value: 'other', label: 'Другое'}];
const EQUIPMENT = [{value: 'barbell', label: 'Штанга'}, {value: 'dumbbell', label: 'Гантели'}, {
    value: 'machine',
    label: 'Тренажёр'
}, {value: 'cable', label: 'Блок'}, {value: 'bodyweight', label: 'Без оборудования'}, {
    value: 'other',
    label: 'Другое'
}];
const REGIONS = [{value: 'chest', label: 'Грудь'}, {value: 'back', label: 'Спина'}, {
    value: 'shoulders',
    label: 'Плечи'
}, {value: 'arms', label: 'Руки'}, {value: 'legs', label: 'Ноги'}, {value: 'core', label: 'Пресс/Кор'}, {
    value: 'other',
    label: 'Другое'
}];

function ImgPreview({src}: { src: string | null }) {
    if (!src) return null;
    return <img src={src} style={{
        height: 60,
        borderRadius: 8,
        objectFit: 'cover',
        marginTop: 8,
        border: '1px solid #f0f0f0',
        maxWidth: 120
    }}/>;
}

function ExerciseForm({initial, muscles, onSave, onCancel}: {
    initial?: Exercise;
    muscles: MuscleGroup[];
    onSave: () => void;
    onCancel: () => void;
}) {
    const [form] = [Form.useForm()][0];
    const [imgFile, setImgFile] = useState<File | null>(null);
    const [imgPrev, setImgPrev] = useState<string | null>(initial?.image_url ?? null);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');
    const [exMuscles, setExMuscles] = useState<{ muscleId: number; intensity: number }[]>(
        initial?.muscles.map(m => ({muscleId: m.muscle.id, intensity: m.intensity})) ?? []
    );
    const [addMId, setAddMId] = useState<number | null>(null);
    const [addInt, setAddInt] = useState(2);

    const handleSave = async () => {
        setErr('');
        let vals: Record<string, unknown>;
        try {
            vals = await form.validateFields();
        } catch {
            return;
        }
        setSaving(true);
        try {
            const fd = new FormData();
            Object.entries(vals).forEach(([k, v]) => {
                if (v !== undefined && v !== null) fd.append(k, String(v));
            });
            if (imgFile) fd.append('image', imgFile);
            let ex: Exercise;
            if (initial) {
                const {data} = await fitnessApi.updateExercise(initial.id, fd);
                ex = data;
            } else {
                const {data} = await fitnessApi.createExercise(fd);
                ex = data;
            }
            for (const em of exMuscles) await fitnessApi.addMuscleToEx(ex.id, em.muscleId, em.intensity);
            message.success(initial ? 'Обновлено' : 'Создано');
            onSave();
        } catch (e) {
            setErr(parseApiError(e));
        } finally {
            setSaving(false);
        }
    };


    return (
        <div style={{maxHeight: '75vh', overflowY: 'auto', paddingRight: 8}}>
            {err && <Alert type="error" message={err} showIcon closable onClose={() => setErr('')}
                           style={{marginBottom: 12, borderRadius: 10, whiteSpace: 'pre-wrap'}}/>}
            <Alert type="info" showIcon style={{marginBottom: 12, borderRadius: 10}} message={
                <Text style={{fontSize: 12}}>Обязательно: <b>Название</b> и <b>Slug</b> (уникальны). Slug — латиница
                    через дефис: <code>bench-press</code></Text>
            }/>
            <Form form={form} layout="vertical"
                  initialValues={initial ? {
                      name: initial.name,
                      slug: initial.slug,
                      category: initial.category,
                      equipment: initial.equipment,
                      emoji: initial.emoji || '🏋️',
                      description: initial.description,
                      how_to: initial.how_to,
                      benefits: initial.benefits,
                      tips: initial.tips,
                      common_mistakes: initial.common_mistakes,
                      video_url: initial.video_url,
                      is_published: initial.is_published
                  } : {emoji: '🏋️', is_published: true, category: 'other', equipment: 'other'}}>
                <Flex gap={10}>
                    <Form.Item name="emoji" label="Эмодзи" style={{width: 80}}><Input maxLength={4} style={{
                        textAlign: 'center',
                        fontSize: 18
                    }}/></Form.Item>
                    <Form.Item name="name" label="Название *" rules={[{required: true, message: 'Введите название'}]}
                               style={{flex: 1}}><Input placeholder="Жим лёжа"/></Form.Item>
                    <Form.Item name="slug" label="Slug *" rules={[{required: true, message: 'Введите slug'}, {
                        pattern: /^[a-z0-9-]+$/,
                        message: 'Только a-z, 0-9, дефис'
                    }]} style={{width: 170}}><Input placeholder="bench-press"/></Form.Item>
                </Flex>
                <Flex gap={10}>
                    <Form.Item name="category" label="Группа мышц" style={{flex: 1}}><Select
                        options={CATEGORIES}/></Form.Item>
                    <Form.Item name="equipment" label="Оборудование" style={{flex: 1}}><Select
                        options={EQUIPMENT}/></Form.Item>
                    <Form.Item name="is_published" label="Опубл." valuePropName="checked"><Switch checkedChildren="Да"
                                                                                                  unCheckedChildren="Нет"/></Form.Item>
                </Flex>
                <Form.Item label="📷 Изображение" tooltip="JPG/PNG/GIF. Без фото показывается эмодзи">
                    <Upload beforeUpload={f => {
                        setImgFile(f);
                        setImgPrev(URL.createObjectURL(f));
                        return false;
                    }} showUploadList={false} accept="image/*,.gif">
                        <Button icon={<UploadOutlined/>}>{imgFile ? `✓ ${imgFile.name}` : 'Выбрать файл'}</Button>
                    </Upload>
                    <ImgPreview src={imgPrev}/>
                </Form.Item>
                <Form.Item name="video_url" label="🎬 Видео" rules={[{type: 'url', message: 'Некорректный URL'}]}><Input
                    placeholder="https://youtube.com/..."/></Form.Item>
                <Divider orientation="left" orientationMargin={0}>📝 Описание</Divider>
                <Form.Item name="description" label="Краткое описание"><TextArea rows={2}
                                                                                 placeholder="Базовое упражнение..."/></Form.Item>
                <Form.Item name="how_to" label="⚙️ Техника"><TextArea rows={4}
                                                                      placeholder="1. Лягте на скамью..."/></Form.Item>
                <Form.Item name="benefits" label="🏆 Польза"><TextArea rows={2}/></Form.Item>
                <Form.Item name="tips" label="💡 Советы"><TextArea rows={2}/></Form.Item>
                <Form.Item name="common_mistakes" label="⚠️ Ошибки"><TextArea rows={2}/></Form.Item>
                <Form.Item name="measurement_type" label="Тип записи результата">
                    <Select
                        options={Object.entries(MEASUREMENT_TYPE_LABELS).map(([v, l]) => ({value: v, label: l}))}
                        defaultValue="strength"
                    />
                </Form.Item>
                <Divider orientation="left" orientationMargin={0}>💪 Мышцы</Divider>
                <Alert type="info" showIcon style={{marginBottom: 10, borderRadius: 8, fontSize: 12}}
                       message="Добавьте мышцы и насколько сильно упражнение их нагружает"/>
                {exMuscles.map(em => {
                    const m = muscles.find(x => x.id === em.muscleId);
                    return m ? (
                        <Flex key={em.muscleId} align="center" gap={8} style={{marginBottom: 6}}>
                            <Text style={{minWidth: 120, fontSize: 12}}>{m.emoji} {m.name}</Text>
                            <Select size="small" value={em.intensity} style={{width: 140}} options={INTENSITY_OPTS}
                                    onChange={v => setExMuscles(p => p.map(x => x.muscleId === em.muscleId ? {
                                        ...x,
                                        intensity: v
                                    } : x))}/>
                            <Button type="text" size="small" danger icon={<DeleteOutlined/>}
                                    onClick={() => setExMuscles(p => p.filter(x => x.muscleId !== em.muscleId))}/>
                        </Flex>
                    ) : null;
                })}
                <Flex gap={8} style={{marginTop: 8}} wrap="wrap">
                    <Select placeholder="Выберите мышцу" value={addMId} onChange={setAddMId}
                            style={{flex: 1, minWidth: 150}}
                            options={muscles.map(m => ({value: m.id, label: `${m.emoji} ${m.name}`}))} showSearch
                            filterOption={(i, o) => o?.label?.toLowerCase().includes(i.toLowerCase()) ?? false}/>
                    <Select value={addInt} onChange={setAddInt} style={{width: 140}} options={INTENSITY_OPTS}/>
                    <Button icon={<PlusOutlined/>} onClick={() => {
                        if (!addMId) return;
                        setExMuscles(p => [...p.filter(m => m.muscleId !== addMId), {
                            muscleId: addMId,
                            intensity: addInt
                        }]);
                        setAddMId(null);
                        setAddInt(2);
                    }} disabled={!addMId}>Добавить</Button>
                </Flex>
            </Form>
            <Flex gap={10} justify="flex-end" style={{marginTop: 14, paddingTop: 12, borderTop: '1px solid #f0f0f0'}}>
                <Button onClick={onCancel}>Отмена</Button>
                <Button type="primary" loading={saving} onClick={handleSave}
                        style={{background: GRADIENT, border: 'none'}}>
                    {initial ? 'Сохранить' : 'Создать'}
                </Button>
            </Flex>
        </div>
    );
}

function MuscleForm({initial, onSave, onCancel}: { initial?: MuscleGroup; onSave: () => void; onCancel: () => void; }) {
    const [form] = Form.useForm();
    const [imgFile, setImgFile] = useState<File | null>(null);
    const [imgPrev, setImgPrev] = useState<string | null>(initial?.image_url ?? null);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState('');

    const handleSave = async () => {
        setErr('');
        let vals: Record<string, unknown>;
        try {
            vals = await form.validateFields();
        } catch {
            return;
        }
        setSaving(true);
        try {
            const fd = new FormData();
            Object.entries(vals).forEach(([k, v]) => {
                if (v !== undefined && v !== null) fd.append(k, String(v));
            });
            if (imgFile) fd.append('image', imgFile);
            if (initial) await fitnessApi.updateMuscle(initial.id, fd);
            else await fitnessApi.createMuscle(fd);
            message.success(initial ? 'Обновлено' : 'Создано');
            onSave();
        } catch (e) {
            setErr(parseApiError(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{maxHeight: '75vh', overflowY: 'auto', paddingRight: 8}}>
            {err && <Alert type="error" message={err} showIcon closable onClose={() => setErr('')}
                           style={{marginBottom: 12, borderRadius: 10, whiteSpace: 'pre-wrap'}}/>}
            <Alert type="info" showIcon style={{marginBottom: 12, borderRadius: 10}} message={
                <Text style={{fontSize: 12}}><b>Key</b> — уникальный ID: латиница + подчёркивания.
                    Пример: <code>upper_chest</code>, <code>bicep_long</code>. <b>Область тела</b> — для фильтрации в
                    библиотеке.</Text>
            }/>
            <Form form={form} layout="vertical" initialValues={initial ?? {emoji: '💪', order: 0}}>
                <Flex gap={10} wrap="wrap">
                    <Form.Item name="emoji" label="Эмодзи" style={{width: 80}}><Input maxLength={4} style={{
                        textAlign: 'center',
                        fontSize: 18
                    }}/></Form.Item>
                    <Form.Item name="name" label="Название (RU) *"
                               rules={[{required: true, message: 'Введите название'}]} style={{flex: 1, minWidth: 120}}><Input
                        placeholder="Верхняя грудь"/></Form.Item>
                    <Form.Item name="name_en" label="Название (EN)" style={{minWidth: 120}}><Input
                        placeholder="Upper Chest"/></Form.Item>
                    <Form.Item name="key" label="Key *" rules={[{required: true, message: 'Введите key'}, {
                        pattern: /^[a-z0-9_]+$/,
                        message: 'Только a-z, 0-9, _'
                    }]} style={{width: 160}}><Input placeholder="upper_chest"/></Form.Item>
                </Flex>
                <Flex gap={10}>
                    <Form.Item name="body_region" label="Область тела *"
                               rules={[{required: true, message: 'Выберите область'}]} style={{flex: 1}}><Select
                        options={REGIONS} placeholder="Выберите..."/></Form.Item>
                    <Form.Item name="order" label="Порядок" style={{width: 90}}><InputNumber min={0}
                                                                                             style={{width: '100%'}}/></Form.Item>
                </Flex>
                <Form.Item label="📷 Изображение">
                    <Upload beforeUpload={f => {
                        setImgFile(f);
                        setImgPrev(URL.createObjectURL(f));
                        return false;
                    }} showUploadList={false} accept="image/*">
                        <Button icon={<UploadOutlined/>}>{imgFile ? `✓ ${imgFile.name}` : 'Выбрать файл'}</Button>
                    </Upload>
                    <ImgPreview src={imgPrev}/>
                </Form.Item>
                <Divider orientation="left" orientationMargin={0}>Содержание</Divider>
                {[
                    {n: 'description', l: '📍 Что за мышца и где находится', ph: 'Большая грудная расположена...'},
                    {n: 'functions', l: '⚙️ Функции и движения', ph: 'Сводит руки перед телом...'},
                    {n: 'daily_life', l: '🏃 В повседневной жизни', ph: 'Толкание дверей, броски...'},
                    {n: 'benefits', l: '🏆 Зачем развивать', ph: 'Улучшает осанку...'},
                    {n: 'posture_role', l: '🧘 Роль в осанке', ph: 'При слабости тянет плечи вперёд...'},
                ].map(f => <Form.Item key={f.n} name={f.n} label={f.l}><TextArea rows={3}
                                                                                 placeholder={f.ph}/></Form.Item>)}
            </Form>
            <Flex gap={10} justify="flex-end" style={{marginTop: 14, paddingTop: 12, borderTop: '1px solid #f0f0f0'}}>
                <Button onClick={onCancel}>Отмена</Button>
                <Button type="primary" loading={saving} onClick={handleSave}
                        style={{background: GRADIENT, border: 'none'}}>
                    {initial ? 'Сохранить' : 'Создать'}
                </Button>
            </Flex>
        </div>
    );
}

export function FitnessAdmin() {
    const {exercises, muscles, fetchExercises, fetchMuscles} = useFitnessStore();
    const [exModal, setExModal] = useState<Exercise | true | null>(null);
    const [mModal, setMModal] = useState<MuscleGroup | true | null>(null);
    useEffect(() => {
        fetchExercises();
        fetchMuscles();
    }, []);


    const delEx = async (id: number) => {
        try {
            await fitnessApi.deleteExercise(id);
            fetchExercises();
            message.success('Удалено');
        } catch (e) {
            message.error(parseApiError(e));
        }
    };
    const delM = async (id: number) => {
        try {
            await fitnessApi.deleteMuscle(id);
            fetchMuscles();
            message.success('Удалено');
        } catch (e) {
            message.error(parseApiError(e));
        }
    };

    const handleEditEx = async (ex: Exercise) => {
        // Загрузить детальную версию с muscles
        const {data} = await fitnessApi.getExercise(ex.id);
        setExModal(data);
    };

    return (
        <div>
            <Tabs size="small" items={[
                {
                    key: 'ex', label: `🏋️ Упражнения (${exercises.length})`, children: (
                        <div>
                            <Flex justify="flex-end" style={{marginBottom: 10}}>
                                <Button type="primary" icon={<PlusOutlined/>} onClick={() => setExModal(true)}
                                        style={{background: GRADIENT, border: 'none'}}>Новое упражнение</Button>
                            </Flex>
                            {exercises.map(ex => (
                                <Flex key={ex.id} align="center" gap={10}
                                      style={{padding: '8px 0', borderBottom: '1px solid #f0f0f0'}}>
                                    {ex.image_url ? <img src={ex.image_url} style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 8,
                                            objectFit: 'cover',
                                            flexShrink: 0,
                                            border: '1px solid #f0f0f0'
                                        }}/>
                                        : <div style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 8,
                                            background: '#f0f2ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 20,
                                            flexShrink: 0
                                        }}>{ex.emoji || '🏋️'}</div>}
                                    <div style={{flex: 1, minWidth: 0}}>
                                        <Text strong style={{fontSize: 13}}>{ex.name}</Text>
                                        <Flex gap={4} style={{marginTop: 2}}>
                                            <Tag
                                                style={{fontSize: 10}}>{CATEGORIES.find(c => c.value === ex.category)?.label}</Tag>
                                            {!ex.is_published && <Tag color="red" style={{fontSize: 10}}>Скрыто</Tag>}
                                        </Flex>
                                    </div>
                                    <Button type="text" size="small" icon={<EditOutlined/>}
                                            onClick={() => handleEditEx(ex)} style={{color: '#667eea'}}/> <Popconfirm
                                    title="Удалить упражнение?" onConfirm={() => delEx(ex.id)} okText="Удалить"
                                    cancelText="Нет" okButtonProps={{danger: true}}>
                                    <Button type="text" size="small" icon={<DeleteOutlined/>} danger/>
                                </Popconfirm>
                                </Flex>
                            ))}
                        </div>
                    )
                },
                {
                    key: 'mu', label: `💪 Мышцы (${muscles.length})`, children: (
                        <div>
                            <Flex justify="flex-end" style={{marginBottom: 10}}>
                                <Button type="primary" icon={<PlusOutlined/>} onClick={() => setMModal(true)}
                                        style={{background: GRADIENT, border: 'none'}}>Новая мышца</Button>
                            </Flex>
                            {muscles.map(m => (
                                <Flex key={m.id} align="center" gap={10}
                                      style={{padding: '8px 0', borderBottom: '1px solid #f0f0f0'}}>
                                    {m.image_url ? <img src={m.image_url} style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 8,
                                            objectFit: 'cover',
                                            flexShrink: 0,
                                            border: '1px solid #f0f0f0'
                                        }}/>
                                        : <div style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 8,
                                            background: '#f0f2ff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 20,
                                            flexShrink: 0
                                        }}>{m.emoji || '💪'}</div>}
                                    <div style={{flex: 1}}>
                                        <Text strong style={{fontSize: 13}}>{m.name}</Text>
                                        <Tag style={{
                                            fontSize: 10,
                                            marginLeft: 6
                                        }}>{REGIONS.find(r => r.value === m.body_region)?.label || m.body_region}</Tag>
                                    </div>
                                    <Button type="text" size="small" icon={<EditOutlined/>} onClick={() => setMModal(m)}
                                            style={{color: '#667eea'}}/>
                                    <Popconfirm title="Удалить мышцу?" onConfirm={() => delM(m.id)} okText="Удалить"
                                                cancelText="Нет" okButtonProps={{danger: true}}>
                                        <Button type="text" size="small" icon={<DeleteOutlined/>} danger/>
                                    </Popconfirm>
                                </Flex>
                            ))}
                        </div>
                    )
                },
            ]}/>
            <Modal open={!!exModal} onCancel={() => setExModal(null)} footer={null} width={760}
                   title={exModal === true ? '➕ Новое упражнение' : '✏️ Редактировать упражнение'} destroyOnClose>
                <ExerciseForm initial={exModal !== true ? (exModal as Exercise) : undefined} muscles={muscles}
                              onSave={() => {
                                  setExModal(null);
                                  fetchExercises();
                              }} onCancel={() => setExModal(null)}/>
            </Modal>
            <Modal open={!!mModal} onCancel={() => setMModal(null)} footer={null} width={700}
                   title={mModal === true ? '➕ Новая мышца' : '✏️ Редактировать мышцу'} destroyOnClose>
                <MuscleForm initial={mModal !== true ? (mModal as MuscleGroup) : undefined}
                            onSave={() => {
                                setMModal(null);
                                fetchMuscles();
                            }} onCancel={() => setMModal(null)}/>
            </Modal>
        </div>
    );
}
