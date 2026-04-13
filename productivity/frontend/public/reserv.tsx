import {Checkbox, Input, List, Select, Tabs} from "antd";

<div style={{maxWidth: 400}}>
         <Input
            //текст подсказка
            placeholder="Новая задача"
            // значение инпут связано с состоянием value
            value={value}

            // обновить value при вводе
            onChange={(e) => setValue(e.target.value)}

            // при нажатии на enter
            onPressEnter={() => {
                if (value.trim()) {
                    addTask(value, taskTypeValue);
                    setValue('');
                }
            }}
        />

        <Select
            style={{marginTop: 10}}
            value={taskTypeValue}
            onChange={setTaskTypeValue}
        >
            <Select.Option value="simple">Легкий</Select.Option>
            <Select.Option value="important">Важный</Select.Option>
            <Select.Option value="delayed">Отложенный</Select.Option>
        </Select>

        {/* Вкладки для фильтра задач */}
        <Tabs
            activeKey={filter}
            onChange={(key) => setFilter(key)}
            style={{marginTop: 16}}
        >
            <TabPane tab="Все" key="all"/>
            <TabPane tab="Активные" key="active"/>
            <TabPane tab="Выполненные" key="completed"/>
        </Tabs>

        <Select
            style={{marginTop: 10}}
            value={selectType}
            onChange={setSelectType}
            size='small'
        >
            <Select.Option value="all">Все типы задач</Select.Option>
            <Select.Option value="simple">Легкие</Select.Option>
            <Select.Option value="important">Важные</Select.Option>
            <Select.Option value="delayed">Отложенные</Select.Option>
        </Select>
        <List
            // Источник данных для спика - уже готовые
            dataSource={filteredTasks(selectType)}

            // Как рисовать каждый элемент списка
            renderItem={(task) => (
                <List.Item>
                    <Checkbox
                        checked={task.done}
                        onChange={() => toggleTask(task.id)}
                    >
                        <Text delete={task.done}>
                            {task.text}
                        </Text>
                    </Checkbox>
                </List.Item>
            )}
        />

        {/*Счетчик выполненных задач*/}
        <div style={{marginTop: 12}}>
            Выполнено: {completed} / {tasks.length}
        </div>
    </div>
)
}