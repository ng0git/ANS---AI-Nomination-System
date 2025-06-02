import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Candidate } from "@shared/schema";

// Import Chart.js
declare global {
  interface Window {
    Chart: any;
  }
}

interface CandidateModalProps {
  candidate: Candidate;
  isOpen: boolean;
  onClose: () => void;
}

export default function CandidateModal({ candidate, isOpen, onClose }: CandidateModalProps) {
  const [, setLocation] = useLocation();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    // Always destroy previous chart instance first
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    // Only create chart when modal is open and we have a candidate
    if (!isOpen || !candidate) return;

    // Load Chart.js if not already loaded
    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = () => {
        // Add a small delay to ensure DOM is ready
        setTimeout(() => {
          if (isOpen && chartRef.current && candidate) {
            createChart();
          }
        }, 100);
      };
      document.head.appendChild(script);
    } else {
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        if (isOpen && chartRef.current && candidate) {
          createChart();
        }
      }, 50);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [isOpen, candidate.id]); // Use candidate.id instead of entire candidate object

  const createChart = () => {
    if (!window.Chart || !chartRef.current) return;

    // Destroy existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    
    // Calculate maximum possible scores and current scores
    const maxSkills = 60;
    const maxCollaboration = 15;
    const maxProblemSolving = 15;
    const maxCulturalFit = 10;
    
    const currentSkills = candidate.scoreBreakdown.skills;
    const currentCollaboration = candidate.scoreBreakdown.collaboration;
    const currentProblemSolving = candidate.scoreBreakdown.problemSolving;
    const currentCulturalFit = candidate.scoreBreakdown.culturalFit;
    
    // Calculate empty sections (remaining capacity)
    const emptySkills = Math.max(0, maxSkills - currentSkills);
    const emptyCollaboration = Math.max(0, maxCollaboration - currentCollaboration);
    const emptyProblemSolving = Math.max(0, maxProblemSolving - currentProblemSolving);
    const emptyCulturalFit = Math.max(0, maxCulturalFit - currentCulturalFit);
    
    // Generate short analysis for each score
    const generateInsight = (category: string, current: number, max: number) => {
      const percentage = Math.round((current / max) * 100);
      
      switch (category) {
        case 'Skills & Experience':
          if (percentage >= 90) return `Exceptional technical expertise`;
          if (percentage >= 75) return `Strong technical foundation`;
          if (percentage >= 50) return `Good skills, room for growth`;
          return `Needs skill development`;
          
        case 'Collaboration':
          if (percentage >= 90) return `Outstanding teamwork abilities`;
          if (percentage >= 75) return `Good collaborative skills`;
          if (percentage >= 50) return `Adequate team skills`;
          return `Needs collaboration improvement`;
          
        case 'Problem Solving':
          if (percentage >= 90) return `Exceptional analytical thinking`;
          if (percentage >= 75) return `Strong problem-solving`;
          if (percentage >= 50) return `Good analytical skills`;
          return `Needs analytical development`;
          
        case 'Cultural Fit':
          if (percentage >= 90) return `Perfect cultural alignment`;
          if (percentage >= 75) return `Good cultural fit`;
          if (percentage >= 50) return `Reasonable fit`;
          return `Cultural alignment needed`;
          
        default:
          return `${percentage}% performance level`;
      }
    };
    
    chartInstance.current = new window.Chart(ctx, {
      type: 'pie',
      data: {
        labels: [
          'Skills & Experience',
          'Skills Gap',
          'Collaboration',
          'Collaboration Gap', 
          'Problem Solving',
          'Problem Solving Gap',
          'Cultural Fit',
          'Cultural Fit Gap'
        ],
        datasets: [{
          data: [
            currentSkills,
            emptySkills,
            currentCollaboration,
            emptyCollaboration,
            currentProblemSolving,
            emptyProblemSolving,
            currentCulturalFit,
            emptyCulturalFit
          ],
          backgroundColor: [
            '#678D58', // Skills - sage green
            '#678D5833', // Skills gap - translucent sage
            '#C9A76D', // Collaboration - amber warm  
            '#C9A76D33', // Collaboration gap - translucent amber
            '#948979', // Problem solving - taupe
            '#94897933', // Problem solving gap - translucent taupe
            '#7E5E9C', // Cultural fit - purple soft
            '#7E5E9C33'  // Cultural fit gap - translucent purple
          ],
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverBorderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom' as const,
            labels: {
              padding: 15,
              font: {
                family: 'Times New Roman',
                size: 11
              },
              filter: function(legendItem: any, chartData: any) {
                // Hide gap labels from legend
                return !legendItem.text.includes('Gap');
              },
              generateLabels: function(chart: any) {
                const data = chart.data;
                return [
                  { text: `Skills & Experience (${currentSkills}/${maxSkills})`, fillStyle: '#678D58' },
                  { text: `Collaboration (${currentCollaboration}/${maxCollaboration})`, fillStyle: '#C9A76D' },
                  { text: `Problem Solving (${currentProblemSolving}/${maxProblemSolving})`, fillStyle: '#948979' },
                  { text: `Cultural Fit (${currentCulturalFit}/${maxCulturalFit})`, fillStyle: '#7E5E9C' }
                ];
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context: any) {
                const label = context.label;
                const value = context.parsed;
                
                // Skip gap sections in tooltip
                if (label.includes('Gap')) {
                  return null;
                }
                
                // Get max value for this category
                let maxValue;
                switch (label) {
                  case 'Skills & Experience': maxValue = maxSkills; break;
                  case 'Collaboration': maxValue = maxCollaboration; break;
                  case 'Problem Solving': maxValue = maxProblemSolving; break;
                  case 'Cultural Fit': maxValue = maxCulturalFit; break;
                  default: maxValue = 100;
                }
                
                const insight = generateInsight(label, value, maxValue);
                return [`${label}: ${value}/${maxValue} points`, insight];
              },
              filter: function(tooltipItem: any) {
                // Hide gap sections from tooltip
                return !tooltipItem.label.includes('Gap');
              }
            },
            titleFont: {
              family: 'Times New Roman',
              size: 13,
              weight: 'bold'
            },
            bodyFont: {
              family: 'Times New Roman',
              size: 11
            },
            maxWidth: 350,
            displayColors: false,
            backgroundColor: 'rgba(34, 40, 49, 0.9)',
            titleColor: '#DFD0B8',
            bodyColor: '#DFD0B8',
            borderColor: '#948979',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            xAlign: 'center',
            yAlign: 'bottom'
          }
        },
        onHover: (event: any, activeElements: any) => {
          if (chartRef.current) {
            chartRef.current.style.cursor = activeElements.length > 0 ? 'pointer' : 'default';
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto bg-card">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-card-foreground">
            {candidate.name} - Candidate Details
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Detailed score breakdown and assessment analysis
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">
          <div>
            <h4 className="text-lg font-semibold text-card-foreground mb-4">Score Breakdown</h4>
            <div className="w-80 h-80 mx-auto">
              <canvas ref={chartRef} width="300" height="300"></canvas>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-card-foreground mb-4">Candidate Information</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Email</label>
                <div className="text-card-foreground">{candidate.email}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Overall Score</label>
                <div className="mt-1">
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`text-2xl font-bold px-4 py-2 h-auto hover:scale-105 transition-transform ${getScoreBadgeColor(candidate.score)}`}
                        onClick={() => {
                          onClose();
                          setLocation(`/compare/${candidate.id}`);
                        }}
                        disabled={candidate.score === "?"}
                      >
                        {candidate.score}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="bg-[rgba(34,40,49,0.9)] text-[#DFD0B8] border-[#948979] font-serif">
                      <p>Compare with top candidates</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Status</label>
                <div className="text-card-foreground capitalize">
                  {candidate.status === "attention" ? "⚠️ Attention" : candidate.status}
                </div>
              </div>
              
              {candidate.flags && candidate.flags.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Flags</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {candidate.flags.map((flag, index) => (
                      <Badge key={index} variant="secondary" className="cursor-default">{flag}</Badge>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Assessment Notes</label>
                <div className="text-sm text-accent mt-1">{candidate.remark}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-muted-foreground">Score Details</label>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
                  <div>Skills: <span className="font-semibold">{candidate.scoreBreakdown.skills}</span></div>
                  <div>Collaboration: <span className="font-semibold">{candidate.scoreBreakdown.collaboration}</span></div>
                  <div>Problem Solving: <span className="font-semibold">{candidate.scoreBreakdown.problemSolving}</span></div>
                  <div>Cultural Fit: <span className="font-semibold">{candidate.scoreBreakdown.culturalFit}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
