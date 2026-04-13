import type {WheelSegment} from "../../types/lifeWheel/lifeWheel.ts";

// ================================================================
// КОНСТАНТЫ ГЕОМЕТРИИ
// ================================================================

const CX = 240;           // Центр X
const CY = 240;           // Центр Y
const R_OUTER = 190;      // Внешний радиус (максимальный, score=10)
const R_INNER = 45;       // Внутренний радиус (белый круг в центре)
const GAP_DEG = 2;        // Зазор между сегментами в градусах
const LABEL_RADIUS = 220; // Радиус подписей снаружи круга

// ================================================================
// SVG УТИЛИТЫ
// ================================================================

/**
 * Конвертирует полярные координаты в декартовы.
 * Угол 0 = верх (−90° в стандартной системе SVG).
 */
const polar = (r: number, angleDeg: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return {
        x: CX + r * Math.cos(rad),
        y: CY + r * Math.sin(rad),
    };
};

/**
 * Строит SVG path для одного кольцевого сегмента.
 *
 * @param r1 - внутренний радиус
 * @param r2 - внешний радиус (определяет заполненность по баллу)
 * @param startAngle - начальный угол (с учётом зазора)
 * @param endAngle - конечный угол (с учётом зазора)
 */
const arcPath = (r1: number, r2: number, startAngle: number, endAngle: number): string => {
    const s1 = polar(r1, startAngle);
    const s2 = polar(r2, startAngle);
    const e2 = polar(r2, endAngle);
    const e1 = polar(r1, endAngle);
    const large = endAngle - startAngle > 180 ? 1 : 0;

    return [
        `M ${s1.x} ${s1.y}`,
        `L ${s2.x} ${s2.y}`,
        `A ${r2} ${r2} 0 ${large} 1 ${e2.x} ${e2.y}`,
        `L ${e1.x} ${e1.y}`,
        `A ${r1} ${r1} 0 ${large} 0 ${s1.x} ${s1.y}`,
        'Z',
    ].join(' ');
};

// ================================================================
// ПРОПСЫ
// ================================================================

type LifeWheelChartProps = {
    segments: WheelSegment[];
    selectedId: string | null;
    onSelect: (id: string) => void;
};

// ================================================================
// КОМПОНЕНТ
// ================================================================

export function LifeWheelChart({segments, selectedId, onSelect}: LifeWheelChartProps) {
    const n = segments.length;
    // Угол каждого сегмента в градусах
    const anglePerSegment = 360 / n;

    return (
        <svg viewBox="-60 -40 600 560" style={{width: '100%', display: 'block'}}>
            {/* Тихий фон */}
            <circle cx={CX} cy={CY} r={R_OUTER + 30} fill="#f0f2f5"/>

            {segments.map((seg, i) => {
                const startAngle = i * anglePerSegment + GAP_DEG / 2;
                const endAngle = (i + 1) * anglePerSegment - GAP_DEG / 2;
                const midAngle = (startAngle + endAngle) / 2;

                // Заполненный радиус пропорционален баллу (0–10)
                // Минимум R_INNER + 4px чтобы сегмент был виден даже при 0
                const filledR = R_INNER + 4 + (seg.score / 10) * (R_OUTER - R_INNER - 4);

                const isSelected = seg.id === selectedId;

                // Позиция подписи снаружи круга
                const labelPos = polar(LABEL_RADIUS, midAngle);

                // Якорь текста зависит от стороны: левая/правая половина
                const isRight = midAngle > 20 && midAngle < 160;
                const isLeft = midAngle > 200 && midAngle < 340;
                const textAnchor = isRight ? 'start' : isLeft ? 'end' : 'middle';

                return (
                    <g
                        key={seg.id}
                        onClick={() => onSelect(seg.id)}
                        style={{cursor: 'pointer'}}
                    >
                        {/* Серый фон сегмента — полный радиус */}
                        <path
                            d={arcPath(R_INNER, R_OUTER, startAngle, endAngle)}
                            fill={isSelected ? '#d9d9d9' : '#e8e8e8'}
                            style={{transition: 'fill 0.2s'}}
                        />

                        {/* Цветная заливка по баллу */}
                        {seg.score > 0 && (
                            <path
                                d={arcPath(R_INNER, filledR, startAngle, endAngle)}
                                fill={seg.color}
                                opacity={isSelected ? 1 : 0.85}
                                style={{transition: 'all 0.4s ease'}}
                            />
                        )}

                        {/* Обводка выбранного сегмента */}
                        {isSelected && (
                            <path
                                d={arcPath(R_INNER, R_OUTER, startAngle, endAngle)}
                                fill="none"
                                stroke={seg.color}
                                strokeWidth={3}
                                style={{transition: 'all 0.2s'}}
                            />
                        )}

                        {/* Подпись снаружи */}
                        <text
                            x={labelPos.x}
                            y={labelPos.y}
                            textAnchor={textAnchor}
                            dominantBaseline="middle"
                            fontSize={11}
                            fontWeight={isSelected ? 700 : 500}
                            fill={isSelected ? seg.color : '#595959'}
                            style={{transition: 'fill 0.2s', userSelect: 'none'}}
                        >
                            {seg.name}
                        </text>

                        {/* Балл внутри сегмента — только если score > 0 */}
                        {seg.score > 0 && (() => {
                            // Размещаем балл на середине заполненного радиуса
                            const scorePos = polar((R_INNER + filledR) / 2, midAngle);
                            return (
                                <text
                                    x={scorePos.x}
                                    y={scorePos.y}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fontSize={10}
                                    fontWeight={700}
                                    fill="white"
                                    style={{userSelect: 'none'}}
                                >
                                    {seg.score}
                                </text>
                            );
                        })()}
                    </g>
                );
            })}

            {/* Белый круг в центре */}
            <circle cx={CX} cy={CY} r={R_INNER - 2} fill="white"/>

            {/* Текст в центре — общий средний балл */}
            <text
                x={CX} y={CY - 8}
                textAnchor="middle"
                fontSize={18}
                fontWeight={700}
                fill="#434343"
            >
                {n > 0
                    ? (segments.reduce((s, seg) => s + seg.score, 0) / n).toFixed(1)
                    : '0'}
            </text>
            <text
                x={CX} y={CY + 10}
                textAnchor="middle"
                fontSize={9}
                fill="#8c8c8c"
            >
                среднее
            </text>
        </svg>
    );
}