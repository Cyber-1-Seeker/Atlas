import {useState} from 'react';
import {NodeResizer, type NodeProps} from '@xyflow/react';
import {AllHandles} from './Handles.tsx';

export interface TableRow {
    id: string;
    cells: string[];
}

export interface TableData {
    title: string;
    headers: string[];
    rows: TableRow[];
    color: string;
    sortCol: number | null;
    sortDir: 'asc' | 'desc';
}

let cellId = 0;
const newRow = (cols: number): TableRow => ({
    id: `r${Date.now()}${cellId++}`,
    cells: Array(cols).fill(''),
});

export function TableNode({data, selected}: NodeProps) {
    const d = data as unknown as TableData;

    // Локальный state
    const [title, setTitle] = useState(d.title ?? 'Таблица');
    const [headers, setHeaders] = useState(d.headers ?? ['Столбец 1', 'Столбец 2']);
    const [rows, setRows] = useState(d.rows ?? [newRow(2)]);
    const [sortCol, setSortCol] = useState<number | null>(d.sortCol ?? null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>(d.sortDir ?? 'asc');
    const [color, setColor] = useState(d.color ?? '#667eea');

    // Обновление header
    const updateHeader = (i: number, val: string) => {
        const h = [...headers];
        h[i] = val;
        setHeaders(h);
        // Здесь можно вызвать callback наружу: updateNodeData({ ...d, headers: h });
    };

    // Обновление ячейки
    const updateCell = (ri: number, ci: number, val: string) => {
        const r = rows.map((row, idx) =>
            idx === ri ? {...row, cells: row.cells.map((c, j) => (j === ci ? val : c))} : row
        );
        setRows(r);
    };

    // Добавление/удаление строк
    const addRow = () => setRows([...rows, newRow(headers.length)]);
    const removeRow = (i: number) => setRows(rows.filter((_, idx) => idx !== i));

    // Добавление/удаление столбцов
    const addCol = () => {
        const h = [...headers, `Столбец ${headers.length + 1}`];
        const r = rows.map(row => ({...row, cells: [...row.cells, '']}));
        setHeaders(h);
        setRows(r);
    };
    const removeCol = (i: number) => {
        const h = headers.filter((_, j) => j !== i);
        const r = rows.map(row => ({...row, cells: row.cells.filter((_, j) => j !== i)}));
        setHeaders(h);
        setRows(r);
    };

    // Сортировка
    const handleSort = (i: number) => {
        const dir = sortCol === i && sortDir === 'asc' ? 'desc' : 'asc';
        setSortCol(i);
        setSortDir(dir);

        const r = [...rows].sort((a, b) => {
            const av = a.cells[i] ?? '';
            const bv = b.cells[i] ?? '';
            const n = (v: string) => parseFloat(v);
            const aNum = !isNaN(n(av));
            const bNum = !isNaN(n(bv));
            let cmp = aNum && bNum ? n(av) - n(bv) : av.localeCompare(bv);
            return dir === 'desc' ? -cmp : cmp;
        });
        setRows(r);
    };

    const sortedRows = rows; // уже сортированы на клик

    const cellStyle: React.CSSProperties = {
        padding: '5px 8px',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        fontSize: 12,
        width: '100%',
        fontFamily: 'inherit',
        color: '#1a1a1a',
    };

    return (
        <>
            <NodeResizer
                minWidth={240}
                minHeight={120}
                isVisible={selected}
                lineStyle={{border: '1.5px solid #667eea'}}
                handleStyle={{
                    width: 8,
                    height: 8,
                    background: '#667eea',
                    border: '2px solid white',
                    borderRadius: '50%',
                }}
            />
            <AllHandles/>

            <div
                style={{
                    width: '100%',
                    height: '100%',
                    overflow: 'auto',
                    background: 'white',
                    borderRadius: 10,
                    border: selected ? `2px solid #667eea` : `1.5px solid #e8e8e8`,
                    boxShadow: selected ? '0 0 0 3px rgba(102,126,234,0.15)' : '0 4px 12px rgba(0,0,0,0.07)',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    fontSize: 12,
                }}
            >
                {/* Заголовок таблицы */}
                <div
                    style={{
                        background: color,
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexShrink: 0,
                        borderRadius: '8px 8px 0 0',
                    }}
                >
                    <input
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: 12,
                            fontFamily: 'inherit',
                            width: '70%',
                        }}
                    />
                    <div style={{display: 'flex', gap: 4}}>
                        <button
                            onClick={addCol}
                            style={{
                                background: 'rgba(255,255,255,0.25)',
                                border: 'none',
                                borderRadius: 4,
                                padding: '2px 6px',
                                cursor: 'pointer',
                                color: 'white',
                                fontSize: 10,
                            }}
                        >
                            +Col
                        </button>
                        <button
                            onClick={addRow}
                            style={{
                                background: 'rgba(255,255,255,0.25)',
                                border: 'none',
                                borderRadius: 4,
                                padding: '2px 6px',
                                cursor: 'pointer',
                                color: 'white',
                                fontSize: 10,
                            }}
                        >
                            +Row
                        </button>
                    </div>
                </div>

                {/* Таблица */}
                <div style={{overflowX: 'auto', flex: 1}}>
                    <table style={{borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed'}}>
                        <thead>
                        <tr style={{background: '#fafafa'}}>
                            {headers.map((h, i) => (
                                <th
                                    key={i}
                                    style={{
                                        borderBottom: `2px solid ${color}40`,
                                        padding: 0,
                                        position: 'relative',
                                        minWidth: 80,
                                    }}
                                >
                                    <div style={{display: 'flex', alignItems: 'center'}}>
                                        <input
                                            value={h}
                                            onChange={e => updateHeader(i, e.target.value)}
                                            style={{
                                                ...cellStyle,
                                                fontWeight: 700,
                                                color,
                                                cursor: 'text',
                                                paddingRight: 4
                                            }}
                                        />
                                        <span
                                            onClick={() => handleSort(i)}
                                            style={{
                                                cursor: 'pointer',
                                                fontSize: 10,
                                                color,
                                                paddingRight: 4,
                                                flexShrink: 0,
                                            }}
                                        >
                        {sortCol === i ? (sortDir === 'asc' ? '↑' : '↓') : '⇅'}
                      </span>
                                        {headers.length > 1 && (
                                            <span
                                                onClick={() => removeCol(i)}
                                                style={{
                                                    cursor: 'pointer',
                                                    fontSize: 10,
                                                    color: '#f5222d',
                                                    paddingRight: 4,
                                                    flexShrink: 0,
                                                }}
                                            >
                          ✕
                        </span>
                                        )}
                                    </div>
                                </th>
                            ))}
                            <th style={{width: 24}}/>
                        </tr>
                        </thead>
                        <tbody>
                        {sortedRows.map((row, ri) => (
                            <tr
                                key={row.id}
                                style={{
                                    background: ri % 2 === 0 ? 'white' : '#fafafe',
                                }}
                            >
                                {row.cells.map((cell, ci) => (
                                    <td key={ci} style={{borderBottom: '1px solid #f0f0f0', padding: 0}}>
                                        <input value={cell} onChange={e => updateCell(ri, ci, e.target.value)}
                                               style={cellStyle}/>
                                    </td>
                                ))}
                                <td style={{textAlign: 'center', width: 24, borderBottom: '1px solid #f0f0f0'}}>
                    <span onClick={() => removeRow(ri)} style={{cursor: 'pointer', fontSize: 10, color: '#bbb'}}>
                      ✕
                    </span>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
}