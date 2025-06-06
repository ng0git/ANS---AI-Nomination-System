import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useCandidates } from "@/hooks/useCandidates";
import StatCard from "@/components/StatCard";
import CandidateTable from "@/components/CandidateTable";
import CandidateModal from "@/components/CandidateModal";
import UploadModal from "@/components/UploadModal";
import StackedBarChart from "@/components/StackedBarChart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import type { Candidate } from "@shared/schema";

interface DashboardProps {
  activeSection?: string;
}

export default function Dashboard({ activeSection = "dashboard" }: DashboardProps) {
  const [, setLocation] = useLocation();
  const [currentPage, setCurrentPage] = useState(activeSection);
  const [searchTerm, setSearchTerm] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [flagFilter, setFlagFilter] = useState("all");
  const [jobTitleFilter, setJobTitleFilter] = useState("all");
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { 
    candidates, 
    stats, 
    isLoading, 
    approveCandidate, 
    rejectCandidate,
    refreshCandidates 
  } = useCandidates();

  useEffect(() => {
    setCurrentPage(activeSection);
  }, [activeSection]);

  const navigateToSection = (section: string) => {
    setCurrentPage(section);
    setLocation(`/${section}`);
  };

  // Get unique job titles for the filter dropdown
  const uniqueJobTitles = Array.from(new Set(
    candidates
      .map(candidate => candidate.jobTitle || candidate.position || "Other")
      .filter(Boolean)
  )).sort();

  const filteredCandidates = candidates.filter(candidate => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      candidate.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      candidate.remark?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (candidate.jobTitle && candidate.jobTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (candidate.position && candidate.position.toLowerCase().includes(searchTerm.toLowerCase()));

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

    // Job title filter
    const candidateJobTitle = candidate.jobTitle || candidate.position || "Other";
    const matchesJobTitle = jobTitleFilter === "all" || candidateJobTitle === jobTitleFilter;

    return matchesSearch && matchesScore && matchesFlag && matchesJobTitle;
  });

  const getPageCandidates = () => {
    switch (currentPage) {
      case "qualified":
        return filteredCandidates.filter(c => c.status === "qualified");
      case "attention":
        return filteredCandidates.filter(c => c.status === "attention");
      case "disqualified":
        return filteredCandidates.filter(c => c.status === "disqualified");
      default:
        return filteredCandidates;
    }
  };

  const handleApprove = async (candidateId: number) => {
    try {
      await approveCandidate.mutateAsync(candidateId);
    } catch (error) {
      console.error('Error approving candidate:', error);
    }
  };

  const handleReject = async (candidateId: number) => {
    try {
      await rejectCandidate.mutateAsync(candidateId);
    } catch (error) {
      console.error('Error rejecting candidate:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background serif">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-8 py-4 shadow-lg">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          <div className="text-2xl font-bold text-secondary">AI Nomination System</div>
          <nav className="flex gap-8">
            {[
              { key: "dashboard", label: "Dashboard" },
              { key: "qualified", label: "Qualified" },
              { key: "attention", label: "⚠️ Attention" },
              { key: "disqualified", label: "Disqualified" }
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => navigateToSection(key)}
                className={`px-4 py-2 rounded-lg cursor-pointer transition-all duration-300 ${
                  currentPage === key 
                    ? "bg-secondary text-secondary-foreground" 
                    : "text-primary-foreground hover:text-secondary"
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        {/* Dashboard Stats and Chart - Only show on dashboard page */}
        {currentPage === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            {/* Left sidebar with compact stats */}
            <div className="lg:col-span-1 space-y-4">
              <div 
                className="bg-card p-4 rounded-lg shadow-md border-l-4 border-l-[hsl(var(--chart-1))] cursor-pointer hover:shadow-lg transition-all duration-300"
                onClick={() => navigateToSection("qualified")}
              >
                <div className="text-2xl font-bold text-accent">{stats?.qualified || 0}</div>
                <div className="text-card-foreground text-sm">Qualified</div>
              </div>
              
              <div 
                className="bg-card p-4 rounded-lg shadow-md border-l-4 border-l-[hsl(var(--chart-2))] cursor-pointer hover:shadow-lg transition-all duration-300"
                onClick={() => navigateToSection("attention")}
              >
                <div className="text-2xl font-bold text-accent">{stats?.attention || 0}</div>
                <div className="text-card-foreground text-sm">Attention</div>
              </div>
              
              <div 
                className="bg-card p-4 rounded-lg shadow-md border-l-4 border-l-[hsl(var(--destructive))] cursor-pointer hover:shadow-lg transition-all duration-300"
                onClick={() => navigateToSection("disqualified")}
              >
                <div className="text-2xl font-bold text-accent">{stats?.disqualified || 0}</div>
                <div className="text-card-foreground text-sm">Disqualified</div>
              </div>
            
            </div>

            {/* Right main area with stacked bar chart */}
            <div className="lg:col-span-4 bg-card rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-card-foreground">Top 10 Candidates Overview</h2>
                  <p className="text-sm text-muted-foreground">Click on any bar to compare candidates</p>
                </div>
              </div>
              
              {/* Filters for the chart */}
              <div className="flex gap-4 items-center mb-6 flex-wrap">
                <Select value={scoreFilter} onValueChange={setScoreFilter}>
                  <SelectTrigger className="w-48 bg-card border-border">
                    <SelectValue placeholder="All Scores" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Scores</SelectItem>
                    <SelectItem value="high">High (80+)</SelectItem>
                    <SelectItem value="medium">Medium (50-79)</SelectItem>
                    <SelectItem value="low">Low (&lt;50)</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={flagFilter} onValueChange={setFlagFilter}>
                  <SelectTrigger className="w-48 bg-card border-border">
                    <SelectValue placeholder="All Flags" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Flags</SelectItem>
                    <SelectItem value="AI Generated">AI Generated</SelectItem>
                    <SelectItem value="Spam">Spam Detected</SelectItem>
                    <SelectItem value="Fraud Risk">Fraud Risk</SelectItem>
                    <SelectItem value="Not Scored Yet">Not Scored Yet</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={jobTitleFilter} onValueChange={setJobTitleFilter}>
                  <SelectTrigger className="w-48 bg-card border-border">
                    <SelectValue placeholder="All Job Titles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Job Titles</SelectItem>
                    {uniqueJobTitles.map((title) => (
                      <SelectItem key={title} value={title}>
                        {title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <StackedBarChart 
                candidates={candidates} 
                scoreFilter={scoreFilter} 
                flagFilter={flagFilter}
                jobTitleFilter={jobTitleFilter}
              />
            </div>
          </div>
        )}

        {/* Directory of Pages */}
        <div className="bg-card rounded-xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b-2 border-muted flex justify-between items-center">
            <h2 className="text-xl font-semibold text-card-foreground">
              {currentPage === "dashboard" && "Recent Applications"}
              {currentPage === "qualified" && `Qualified Candidates (${stats?.qualified || 0})`}
              {currentPage === "attention" && `⚠️ Candidates Requiring HR Attention (${stats?.attention || 0})`}
              {currentPage === "disqualified" && `Disqualified Candidates (${stats?.disqualified || 0})`}
            </h2>
            {/* Upload Candidate Resumes */}
            {currentPage === "dashboard" && (
              <Button 
                onClick={() => setIsUploadModalOpen(true)}
                className="bg-accent text-accent-foreground hover:bg-primary"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Resumes
              </Button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="px-6 py-4 bg-muted border-b-2 border-border flex flex-wrap gap-4 items-center">
            <Input
              placeholder="Search candidates by name, email, job title, or skills..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-64 bg-card border-border"
            />
            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="w-48 bg-card border-border">
                <SelectValue placeholder="All Scores" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Scores</SelectItem>
                <SelectItem value="high">High (80+)</SelectItem>
                <SelectItem value="medium">Medium (50-79)</SelectItem>
                <SelectItem value="low">Low (&lt;50)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={flagFilter} onValueChange={setFlagFilter}>
              <SelectTrigger className="w-48 bg-card border-border">
                <SelectValue placeholder="All Flags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Flags</SelectItem>
                <SelectItem value="AI Generated">AI Generated</SelectItem>
                <SelectItem value="Spam">Spam Detected</SelectItem>
                <SelectItem value="Fraud Risk">Fraud Risk</SelectItem>
                <SelectItem value="Not Scored Yet">Not Scored Yet</SelectItem>
              </SelectContent>
            </Select>
            <Select value={jobTitleFilter} onValueChange={setJobTitleFilter}>
              <SelectTrigger className="w-48 bg-card border-border">
                <SelectValue placeholder="All Job Titles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Job Titles</SelectItem>
                {uniqueJobTitles.map((title) => (
                  <SelectItem key={title} value={title}>
                    {title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Candidates Table */}
          <CandidateTable
            candidates={getPageCandidates()}
            onViewCandidate={setSelectedCandidate}
            onApproveCandidate={handleApprove}
            onRejectCandidate={handleReject}
            showActions={currentPage === "dashboard" || currentPage === "attention"}
          />
        </div>
      </main>

      {/* Modals */}
      {selectedCandidate && (
        <CandidateModal
          candidate={selectedCandidate}
          isOpen={!!selectedCandidate}
          onClose={() => setSelectedCandidate(null)}
        />
      )}

      <UploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadComplete={refreshCandidates}
      />
    </div>
  );
}
