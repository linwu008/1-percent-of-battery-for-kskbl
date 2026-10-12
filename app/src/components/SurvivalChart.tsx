export interface Series {
  name: string;
  values: number[];
  color: string;
  dashed?: boolean;
  width?: number;
}

const W = 640;
const H = 240;
const PAD_L = 44;
const PAD_R = 16;
const PAD_T = 16;
const PAD_B = 34;

function xAt(i: number, n: number): number {
  if (n <= 1) return PAD_L;
  return PAD_L + ((W - PAD_L - PAD_R) * i) / (n - 1);
}

function yAt(v: number): number {
  const p = Math.min(1, Math.max(0, v));
  return PAD_T + (H - PAD_T - PAD_B) * (1 - p);
}

/**
 * 存活概率曲线。三条线：事后最优参考线、你、Ghost。
 * 纵轴是「按当时手上的东西算，能活下来的概率」，横轴是第几步。
 * 两条线之间的落差，就是那一步的选择造成的偏差。
 */
export default function SurvivalChart({ series }: { series: Series[] }) {
  const n = Math.max(...series.map((s) => s.values.length), 2);
  const ticks = [0, 0.25, 0.5, 0.75, 1];

  return (
    <svg
      className="survival-chart"
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="img"
      aria-label="每一步的存活概率：事后最优参考线、你、Ghost"
    >
      {ticks.map((t) => (
        <g key={t}>
          <line
            x1={PAD_L}
            x2={W - PAD_R}
            y1={yAt(t)}
            y2={yAt(t)}
            stroke="rgba(255,255,255,0.09)"
            strokeWidth="0.5"
          />
          <text
            x={PAD_L - 8}
            y={yAt(t)}
            textAnchor="end"
            dominantBaseline="central"
            fontSize="11"
            fill="#94a29a"
          >
            {Math.round(t * 100)}%
          </text>
        </g>
      ))}

      {Array.from({ length: n }, (_, i) => (
        <text
          key={i}
          x={xAt(i, n)}
          y={H - PAD_B + 16}
          textAnchor="middle"
          fontSize="11"
            fill="#94a29a"
          >
            {i === 0 ? "开局" : `第${i}步`}
        </text>
      ))}

      {series.map((s) => {
        const pts = s.values
          .map((v, i) => `${xAt(i, n)},${yAt(v)}`)
          .join(" ");
        return (
          <g key={s.name}>
            <polyline
              points={pts}
              fill="none"
              stroke={s.color}
              strokeWidth={s.width ?? 2}
              strokeDasharray={s.dashed ? "6 4" : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {s.values.map((v, i) => (
              <circle
                key={i}
                cx={xAt(i, n)}
                cy={yAt(v)}
                r={s.dashed ? 2 : 3}
                fill={s.color}
              />
            ))}
          </g>
        );
      })}

      <line
        x1={PAD_L}
        x2={W - PAD_R}
        y1={H - PAD_B}
        y2={H - PAD_B}
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="0.5"
      />
    </svg>
  );
}
