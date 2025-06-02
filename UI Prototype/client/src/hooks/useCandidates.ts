import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Candidate } from "@shared/schema";

export function useCandidates() {
  const { toast } = useToast();

  const { data: candidates = [], isLoading } = useQuery<Candidate[]>({
    queryKey: ['/api/candidates'],
  });

  const stats = {
    qualified: candidates.filter(c => c.status === 'qualified').length,
    attention: candidates.filter(c => c.status === 'attention').length,
    disqualified: candidates.filter(c => c.status === 'disqualified').length,
    processing: candidates.filter(c => c.status === 'processing').length,
  };

  const approveCandidate = useMutation({
    mutationFn: async (candidateId: number) => {
      const response = await apiRequest('PATCH', `/api/candidates/${candidateId}`, {
        status: 'qualified'
      });
      return response.json();
    },
    onSuccess: (updatedCandidate) => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      toast({
        title: "Candidate Approved",
        description: `${updatedCandidate.name} has been moved to qualified candidates.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve candidate",
        variant: "destructive",
      });
    }
  });

  const rejectCandidate = useMutation({
    mutationFn: async (candidateId: number) => {
      const response = await apiRequest('PATCH', `/api/candidates/${candidateId}`, {
        status: 'disqualified'
      });
      return response.json();
    },
    onSuccess: (updatedCandidate) => {
      queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
      toast({
        title: "Candidate Rejected",
        description: `${updatedCandidate.name} has been moved to disqualified candidates.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reject candidate",
        variant: "destructive",
      });
    }
  });

  const refreshCandidates = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/candidates'] });
  };

  return {
    candidates,
    stats,
    isLoading,
    approveCandidate,
    rejectCandidate,
    refreshCandidates
  };
}
