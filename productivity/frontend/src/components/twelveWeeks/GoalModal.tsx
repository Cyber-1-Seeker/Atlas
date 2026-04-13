import { Modal, Input, Form } from 'antd';
import { useState, useEffect } from 'react';

type GoalModalProps = {
  // Открыто ли модальное окно
  open: boolean;

  // Функция закрытия окна
  onClose: () => void;

  // Функция сохранения цели
  onSave: (text: string) => void;

  // Если передан initialValue, то редактируем существующую цель
  initialValue?: string;

  // Заголовок модального окна
  title?: string;
};

export function GoalModal({
  open,
  onClose,
  onSave,
  initialValue = '',
  title = 'Добавить цель'
}: GoalModalProps) {
  const [value, setValue] = useState(initialValue);

  // Обновляем значение при изменении initialValue
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Обработка сохранения
  const handleOk = () => {
    if (value.trim()) {
      onSave(value.trim());
      setValue('');
      onClose();
    }
  };

  // Обработка отмены
  const handleCancel = () => {
    setValue('');
    onClose();
  };

  return (
    <Modal
      title={title}
      open={open}
      onOk={handleOk}
      onCancel={handleCancel}
      okText="Сохранить"
      cancelText="Отмена"
      okButtonProps={{
        disabled: !value.trim(),
        style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          border: 'none'
        }
      }}
    >
      <Form layout="vertical" style={{ marginTop: '20px' }}>
        <Form.Item label="Название цели">
          <Input
            placeholder="Например: Выучить TypeScript"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onPressEnter={handleOk}
            size="large"
            autoFocus
            maxLength={100}
            showCount
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}