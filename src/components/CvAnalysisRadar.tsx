import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

type CvAnalysisRadarProps = {
  data: Array<{
    nom: string;
    score: number;
  }>;
};

const CvAnalysisRadar = ({ data }: CvAnalysisRadarProps) => {
  const safeData = Array.isArray(data)
    ? data
        .filter((item): item is { nom: string; score: number } => !!item && typeof item === "object")
        .map((item) => ({
          nom: String(item.nom ?? "").trim(),
          score: Number.isFinite(Number(item.score)) ? Math.max(0, Math.min(100, Number(item.score))) : 0,
        }))
        .filter((item) => item.nom.length > 0)
    : [];

  if (!safeData.length) return null;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <RadarChart data={safeData}>
        <PolarGrid stroke="#333" />
        <PolarAngleAxis dataKey="nom" tick={{ fontSize: 11, fill: "#888" }} />
        <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.3} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  );
};

export default CvAnalysisRadar;
