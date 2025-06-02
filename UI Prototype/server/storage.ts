import { candidates, type Candidate, type InsertCandidate } from "@shared/schema";

export interface IStorage {
  getAllCandidates(): Promise<Candidate[]>;
  getCandidateById(id: number): Promise<Candidate | undefined>;
  createCandidate(candidate: InsertCandidate): Promise<Candidate>;
  updateCandidate(id: number, updates: Partial<Candidate>): Promise<Candidate | undefined>;
  deleteCandidateById(id: number): Promise<boolean>;
  getCandidatesByStatus(status: string): Promise<Candidate[]>;
}

export class MemStorage implements IStorage {
  private candidates: Map<number, Candidate>;
  private currentId: number;

  constructor() {
    this.candidates = new Map();
    this.currentId = 1;
    
    // Initialize with sample data
    this.initializeData();
  }

  private initializeData() {
    const sampleCandidates: InsertCandidate[] = [
      {
        name: 'Lee Chong Wai',
        email: 'cw.lee@email.com',
        score: '92',
        status: 'qualified',
        remark: 'Strong match: React, Node.js, 9+ years experience. Top 3 in 6 international hackathon.',
        jobTitle: 'Senior Software Engineer',
        flags: [],
        scoreBreakdown: { skills: 55, collaboration: 14, problemSolving: 13, culturalFit: 10 }
      },
      {
        name: 'Tung bin Sahur',
        email: 'tttsahur.perfect@email.com',
        score: '100',
        status: 'attention',
        remark: 'Perfect score anomaly. Resume language patterns suggest AI generation. LinkedIn verification pending.',
        jobTitle: 'Frontend Developer',
        flags: ['AI Generated'],
        scoreBreakdown: { skills: 60, collaboration: 15, problemSolving: 15, culturalFit: 10 }
      },
      {
        name: 'Alex Sander',
        email: 'alex.sander.apply@email.com',
        score: '23',
        status: 'attention',
        remark: 'Generic template detected. Skills mismatch: PHP/WordPress for React position. High application volume pattern.',
        jobTitle: 'Product Manager',
        flags: ['Spam'],
        scoreBreakdown: { skills: 10, collaboration: 5, problemSolving: 5, culturalFit: 3 }
      },
      {
        name: 'May Lee',
        email: 'maylee.beautiful@email.com',
        score: '78',
        status: 'attention',
        remark: 'LinkedIn profile mismatch: Different company history. Education verification failed. Strong technical skills otherwise.',
        jobTitle: 'UX Designer',
        flags: ['Fraud Risk'],
        scoreBreakdown: { skills: 45, collaboration: 12, problemSolving: 12, culturalFit: 9 }
      }
    ];

    sampleCandidates.forEach(candidate => {
      this.createCandidate(candidate);
    });
  }

  async getAllCandidates(): Promise<Candidate[]> {
    return Array.from(this.candidates.values());
  }

  async getCandidateById(id: number): Promise<Candidate | undefined> {
    return this.candidates.get(id);
  }

  async createCandidate(insertCandidate: InsertCandidate): Promise<Candidate> {
    const id = this.currentId++;
    const candidate: Candidate = { 
      id,
      name: insertCandidate.name,
      email: insertCandidate.email,
      score: insertCandidate.score,
      status: insertCandidate.status,
      remark: insertCandidate.remark,
      jobTitle: insertCandidate.jobTitle || "Software Developer",
      flags: Array.isArray(insertCandidate.flags) ? insertCandidate.flags : null,
      scoreBreakdown: insertCandidate.scoreBreakdown,
      rawText: insertCandidate.rawText || null
    };
    this.candidates.set(id, candidate);
    return candidate;
  }

  async updateCandidate(id: number, updates: Partial<Candidate>): Promise<Candidate | undefined> {
    const candidate = this.candidates.get(id);
    if (!candidate) return undefined;

    const updatedCandidate = { ...candidate, ...updates };
    this.candidates.set(id, updatedCandidate);
    return updatedCandidate;
  }

  async deleteCandidateById(id: number): Promise<boolean> {
    return this.candidates.delete(id);
  }

  async getCandidatesByStatus(status: string): Promise<Candidate[]> {
    return Array.from(this.candidates.values()).filter(c => c.status === status);
  }
}

export const storage = new MemStorage();
