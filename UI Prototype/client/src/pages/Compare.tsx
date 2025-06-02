import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import type { Candidate } from "@shared/schema";

// Import Chart.js
declare global {
  interface Window {
    Chart: any;
  }
}

interface CompareProps {
  candidateId?: string;
}

export default function Compare({ candidateId }: CompareProps) {
  const [, setLocation] = useLocation();
  const [selectedCompareId, setSelectedCompareId] = useState<string>("");
  const leftChartRef = useRef<HTMLCanvasElement>(null);
  const rightChartRef = useRef<HTMLCanvasElement>(null);
  const leftChartInstance = useRef<any>(null);
  const rightChartInstance = useRef<any>(null);

  const { data: candidates = [] } = useQuery<Candidate[]>({
    queryKey: ['/api/candidates'],
  });

  const currentCandidate = candidates.find(c => c.id.toString() === candidateId);
  const topCandidate = candidates
    .filter(c => c.score !== "?" && c.id.toString() !== candidateId)
    .sort((a, b) => parseInt(b.score) - parseInt(a.score))[0];
  
  const compareCandidate = selectedCompareId 
    ? candidates.find(c => c.id.toString() === selectedCompareId)
    : topCandidate;

  useEffect(() => {
    if (!selectedCompareId && topCandidate) {
      setSelectedCompareId(topCandidate.id.toString());
    }
  }, [topCandidate, selectedCompareId]);

  useEffect(() => {
    // Load Chart.js if not already loaded
    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = () => {
        setTimeout(() => {
          if (currentCandidate) createChart(leftChartRef, leftChartInstance, currentCandidate, 'left');
          if (compareCandidate) createChart(rightChartRef, rightChartInstance, compareCandidate, 'right');
        }, 100);
      };
      document.head.appendChild(script);
    } else {
      setTimeout(() => {
        if (currentCandidate) createChart(leftChartRef, leftChartInstance, currentCandidate, 'left');
        if (compareCandidate) createChart(rightChartRef, rightChartInstance, compareCandidate, 'right');
      }, 50);
    }

    return () => {
      if (leftChartInstance.current) {
        leftChartInstance.current.destroy();
        leftChartInstance.current = null;
      }
      if (rightChartInstance.current) {
        rightChartInstance.current.destroy();
        rightChartInstance.current = null;
      }
    };
  }, [currentCandidate, compareCandidate]);

  const createChart = (chartRef: React.RefObject<HTMLCanvasElement>, chartInstance: React.MutableRefObject<any>, candidate: Candidate, side: 'left' | 'right') => {
    if (!window.Chart || !chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    chartInstance.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Skills & Experience', 'Collaboration', 'Problem Solving', 'Cultural Fit'],
        datasets: [{
          label: 'Score',
          data: [
            candidate.scoreBreakdown.skills,
            candidate.scoreBreakdown.collaboration,
            candidate.scoreBreakdown.problemSolving,
            candidate.scoreBreakdown.culturalFit
          ],
          backgroundColor: [
            '#678D58', // Skills - sage green
            '#C9A76D', // Collaboration - amber warm  
            '#948979', // Problem solving - taupe
            '#7E5E9C'  // Cultural fit - purple soft
          ],
          borderColor: [
            '#678D58',
            '#C9A76D',
            '#948979',
            '#7E5E9C'
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const maxValues = [60, 15, 15, 10];
                const maxValue = maxValues[context.dataIndex];
                return `${context.parsed.y}/${maxValue} points`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 60,
            grid: {
              color: 'rgba(148, 137, 121, 0.2)'
            },
            ticks: {
              font: {
                family: 'Times New Roman'
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                family: 'Times New Roman',
                size: 11
              },
              maxRotation: 45
            }
          }
        }
      }
    });
  };

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

  if (!currentCandidate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center serif">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-card-foreground mb-4">Candidate Not Found</h2>
          <Button onClick={() => setLocation("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background serif">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-8 py-4 shadow-lg">
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="text-primary-foreground hover:bg-secondary hover:text-secondary-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
          <div className="text-2xl font-bold text-secondary">Candidate Comparison</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side - Current Candidate */}
          <div className="bg-card rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-card-foreground">Selected Candidate</h2>
				<Badge className={`px-4 py-2 rounded-full font-bold cursor-default ${getScoreBadgeColor(currentCandidate.score)}`}>
				  {currentCandidate.score}
				</Badge>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="font-bold text-lg text-card-foreground">{currentCandidate.name}</h3>
                <p className="text-muted-foreground">{currentCandidate.email}</p>
              </div>
              
              <div>
                <span className="text-sm font-medium text-muted-foreground">Status:</span>
                <span className="ml-2 text-card-foreground capitalize">
                  {currentCandidate.status === "attention" ? "⚠️ Attention" : currentCandidate.status}
                </span>
              </div>
              
              {currentCandidate.flags && currentCandidate.flags.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-muted-foreground">Flags:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {currentCandidate.flags.map((flag, index) => (
                      <Badge key={index} className={`px-3 py-1 rounded-full text-sm font-bold cursor-default ${getFlagBadgeColor(flag)}`}>
                        {flag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <span className="text-sm font-medium text-muted-foreground">Assessment:</span>
                <p className="text-sm text-accent mt-1">{currentCandidate.remark}</p>
              </div>
            </div>

            <div className="h-80">
              <canvas ref={leftChartRef}></canvas>
            </div>
          </div>

          {/* Right Side - Comparison Candidate */}
          <div className="bg-card rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-card-foreground">Compare With</h2>
              <div className="flex items-center gap-4">
                <Select value={selectedCompareId} onValueChange={setSelectedCompareId}>
                  <SelectTrigger className="w-64 bg-card border-border">
                    <SelectValue placeholder="Select candidate" />
                  </SelectTrigger>
                  <SelectContent>
                    {candidates
                      .filter(c => c.id.toString() !== candidateId && c.score !== "?")
                      .sort((a, b) => parseInt(b.score) - parseInt(a.score))
                      .map(candidate => (
                        <SelectItem key={candidate.id} value={candidate.id.toString()}>
                          {candidate.name} ({candidate.score})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {compareCandidate && (
                  <Badge className={`px-4 py-2 rounded-full font-bold cursor-default ${getScoreBadgeColor(compareCandidate.score)}`}>
                    {compareCandidate.score}
                  </Badge>
                )}
              </div>
            </div>

            {compareCandidate ? (
              <>
                <div className="space-y-4 mb-6">
                  <div>
                    <h3 className="font-bold text-lg text-card-foreground">{compareCandidate.name}</h3>
                    <p className="text-muted-foreground">{compareCandidate.email}</p>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Status:</span>
                    <span className="ml-2 text-card-foreground capitalize">
                      {compareCandidate.status === "attention" ? "⚠️ Attention" : compareCandidate.status}
                    </span>
                  </div>
                  
                  {compareCandidate.flags && compareCandidate.flags.length > 0 && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Flags:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {compareCandidate.flags.map((flag, index) => (
                          <Badge key={index} className={`px-3 py-1 rounded-full text-sm font-bold cursor-default ${getFlagBadgeColor(flag)}`}>
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Assessment:</span>
                    <p className="text-sm text-accent mt-1">{compareCandidate.remark}</p>
                  </div>
                </div>

                <div className="h-80">
                  <canvas ref={rightChartRef}></canvas>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-80 text-muted-foreground">
                No candidates available for comparison
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}