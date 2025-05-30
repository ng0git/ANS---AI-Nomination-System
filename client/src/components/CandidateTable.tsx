import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Eye } from "lucide-react";
import type { Candidate } from "@shared/schema";

interface CandidateTableProps {
  candidates: Candidate[];
  onViewCandidate: (candidate: Candidate) => void;
  onApproveCandidate?: (candidateId: number) => void;
  onRejectCandidate?: (candidateId: number) => void;
  showActions?: boolean;
}

export default function CandidateTable({ 
  candidates, 
  onViewCandidate, 
  onApproveCandidate, 
  onRejectCandidate,
  showActions = true 
}: CandidateTableProps) {
  
  const getScoreBadgeColor = (score: string) => {
    if (score === "?") return "bg-muted text-muted-foreground";
    const numScore = parseInt(score);
    if (numScore >= 80) return "bg-[hsl(var(--chart-1))] text-white";
    if (numScore >= 50) return "bg-[hsl(var(--chart-2))] text-white";
    return "bg-[hsl(var(--destructive))] text-white";
  };

  const getFlagBadgeColor = (flag: string) => {
    switch (flag) {
      case "AI Generated":
        return "bg-[hsl(var(--chart-4))] text-white";
      case "Spam":
        return "bg-[hsl(var(--destructive))] text-white";
      case "Fraud Risk":
        return "bg-orange-500 text-white";
      case "Not Scored Yet":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Candidate</th>
            <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Score</th>
            <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Flags</th>
            <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Status</th>
            <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Remark</th>
            <th className="px-4 py-3 text-left text-muted-foreground font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => (
            <tr key={candidate.id} className="border-b border-muted hover:bg-muted/10 transition-all duration-200">
              <td className="px-4 py-4">
                <div>
                  <div className="font-semibold text-card-foreground">{candidate.name}</div>
                  <div className="text-sm text-muted-foreground">{candidate.email}</div>
                </div>
              </td>
              <td className="px-4 py-4">
                <Badge className={`px-4 py-2 rounded-full font-bold cursor-default ${getScoreBadgeColor(candidate.score)}`}>
                  {candidate.score}
                </Badge>
              </td>
              <td className="px-4 py-4">
                {candidate.flags && candidate.flags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {candidate.flags.map((flag, index) => (
                      <Badge key={index} className={`px-3 py-1 rounded-full text-sm font-bold cursor-default ${getFlagBadgeColor(flag)}`}>
                        {flag}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </td>
              <td className="px-4 py-4 font-medium text-card-foreground capitalize">
                {candidate.status === "attention" ? "⚠️ Attention" : candidate.status}
              </td>
              <td className="px-4 py-4 text-sm text-accent max-w-xs">
                {candidate.remark}
              </td>
              <td className="px-4 py-4">
                <div className="flex gap-2 flex-wrap">
                  {showActions && candidate.status === "attention" && onApproveCandidate && (
                    <Button
                      size="sm"
                      onClick={() => onApproveCandidate(candidate.id)}
                      className="bg-[hsl(var(--chart-1))] text-white hover:bg-[hsl(var(--chart-1))]/80"
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Approve
                    </Button>
                  )}
                  {showActions && candidate.status === "attention" && onRejectCandidate && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onRejectCandidate(candidate.id)}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Reject
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewCandidate(candidate)}
                    className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  >
                    <Eye className="mr-1 h-3 w-3" />
                    View
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
