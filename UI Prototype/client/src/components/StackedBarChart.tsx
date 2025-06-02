import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import type { Candidate } from "@shared/schema";

// Import Chart.js
declare global {
  interface Window {
    Chart: any;
  }
}

interface StackedBarChartProps {
  candidates: Candidate[];
  scoreFilter: string;
  flagFilter: string;
  jobTitleFilter?: string; // Added optional job title filter
}

export default function StackedBarChart({ 
  candidates, 
  scoreFilter, 
  flagFilter, 
  jobTitleFilter = "all" 
}: StackedBarChartProps) {
  const [, setLocation] = useLocation();
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    // Always destroy previous chart instance first
    if (chartInstance.current) {
      chartInstance.current.destroy();
      chartInstance.current = null;
    }

    // Load Chart.js if not already loaded
    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = () => {
        setTimeout(() => {
          createChart();
        }, 100);
      };
      document.head.appendChild(script);
    } else {
      setTimeout(() => {
        createChart();
      }, 50);
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [candidates, scoreFilter, flagFilter, jobTitleFilter]); // Added jobTitleFilter to dependencies

  const createChart = () => {
    if (!window.Chart || !chartRef.current) return;

    // Filter candidates based on current filters
    let filteredCandidates = candidates.filter(candidate => {
      // Score filter
      let matchesScore = true;
      if (scoreFilter !== "all") {
        const score = parseInt(candidate.score);
        if (!isNaN(score)) {
          switch (scoreFilter) {
            case "high":
              matchesScore = score >= 80;
              break;
            case "medium":
              matchesScore = score >= 50 && score < 80;
              break;
            case "low":
              matchesScore = score < 50;
              break;
          }
        } else {
          matchesScore = false;
        }
      }

      // Flag filter
      const matchesFlag = flagFilter === "all" || (candidate.flags && candidate.flags.includes(flagFilter));

      // Job title filter - Added this logic
      const candidateJobTitle = candidate.jobTitle || candidate.position || "Other";
      const matchesJobTitle = jobTitleFilter === "all" || candidateJobTitle === jobTitleFilter;

      return matchesScore && matchesFlag && matchesJobTitle && candidate.score !== "?";
    });

    // Sort by total score and take top 10
    const topCandidates = filteredCandidates
      .sort((a, b) => parseInt(b.score) - parseInt(a.score))
      .slice(0, 10);

    // Create fixed arrays of 10 items with data starting from left
    const createFixedArray = (candidates: any[], getValue: (c: any) => number) => {
      const result = new Array(10).fill(0);
      candidates.forEach((candidate, index) => {
        if (index < 10) {
          result[index] = getValue(candidate);
        }
      });
      return result;
    };

    const createLabelsArray = (candidates: any[]) => {
      const result = new Array(10).fill('');
      candidates.forEach((candidate, index) => {
        if (index < 10) {
          result[index] = candidate.name;
        }
      });
      return result;
    };

    const ctx = chartRef.current.getContext('2d');
    
    chartInstance.current = new window.Chart(ctx, {
      type: 'bar',
      data: {
        labels: createLabelsArray(topCandidates),
        datasets: [
          {
            label: 'Skills & Experience',
            data: createFixedArray(topCandidates, c => c.scoreBreakdown?.skills || 0),
            backgroundColor: '#678D58',
            borderColor: '#678D58',
            borderWidth: 1,
            stack: 'stack1'
          },
          {
            label: 'Collaboration',
            data: createFixedArray(topCandidates, c => c.scoreBreakdown?.collaboration || 0),
            backgroundColor: '#C9A76D',
            borderColor: '#C9A76D',
            borderWidth: 1,
            stack: 'stack1'
          },
          {
            label: 'Problem Solving',
            data: createFixedArray(topCandidates, c => c.scoreBreakdown?.problemSolving || 0),
            backgroundColor: '#948979',
            borderColor: '#948979',
            borderWidth: 1,
            stack: 'stack1'
          },
          {
            label: 'Cultural Fit',
            data: createFixedArray(topCandidates, c => c.scoreBreakdown?.culturalFit || 0),
            backgroundColor: '#7E5E9C',
            borderColor: '#7E5E9C',
            borderWidth: 1,
            stack: 'stack1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (event: any, elements: any) => {
          if (elements.length > 0) {
            const candidateIndex = elements[0].index;
            const candidate = topCandidates[candidateIndex];
            setLocation(`/compare/${candidate.id}`);
          }
        },
        plugins: {
          legend: {
            position: 'bottom' as const,
            labels: {
              font: {
                family: 'Times New Roman',
                size: 12
              },
              color: '#222831',
              padding: 15
            }
          },
          tooltip: {
            callbacks: {
              title: function(context: any) {
                const candidateIndex = context[0].dataIndex;
                // Only show tooltip if there's actual data for this position
                if (candidateIndex < topCandidates.length) {
                  const candidate = topCandidates[candidateIndex];
                  const jobTitle = candidate.jobTitle || candidate.position || "N/A";
                  return `${candidate.name} - ${jobTitle} (Total: ${candidate.score})`;
                }
                return null; // Don't show tooltip for empty bars
              },
              label: function(context: any) {
                const candidateIndex = context.dataIndex;
                // Only show label if there's actual data for this position
                if (candidateIndex < topCandidates.length && context.parsed.y > 0) {
                  return `${context.dataset.label}: ${context.parsed.y} points`;
                }
                return null;
              },
              footer: function(context: any) {
                const candidateIndex = context[0].dataIndex;
                if (candidateIndex < topCandidates.length) {
                  return 'Click to compare with other candidates';
                }
                return null;
              },
              // Only show tooltip if there's actual data
              filter: function(tooltipItem: any) {
                return tooltipItem.dataIndex < topCandidates.length && tooltipItem.parsed.y > 0;
              }
            },
            backgroundColor: 'rgba(34, 40, 49, 0.9)',
            titleColor: '#DFD0B8',
            bodyColor: '#DFD0B8',
            footerColor: '#C9A76D',
            borderColor: '#948979',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12,
            titleFont: {
              family: 'Times New Roman',
              size: 13,
              weight: 'bold'
            },
            bodyFont: {
              family: 'Times New Roman',
              size: 11
            },
            footerFont: {
              family: 'Times New Roman',
              size: 10,
              style: 'italic'
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              display: false
            },
            ticks: {
              font: {
                family: 'Times New Roman',
                size: 10
              },
              color: '#222831',
              maxRotation: 45
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            max: 100,
            grid: {
              color: 'rgba(148, 137, 121, 0.2)'
            },
            ticks: {
              font: {
                family: 'Times New Roman',
                size: 11
              },
              color: '#222831'
            }
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

  return (
    <div className="h-80 w-full">
      <canvas ref={chartRef}></canvas>
    </div>
  );
}