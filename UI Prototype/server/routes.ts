import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCandidateSchema } from "@shared/schema";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all candidates
  app.get("/api/candidates", async (req, res) => {
    try {
      const candidates = await storage.getAllCandidates();
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch candidates" });
    }
  });

  // Get candidates by status
  app.get("/api/candidates/status/:status", async (req, res) => {
    try {
      const { status } = req.params;
      const candidates = await storage.getCandidatesByStatus(status);
      res.json(candidates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch candidates by status" });
    }
  });

  // Get candidate by ID
  app.get("/api/candidates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const candidate = await storage.getCandidateById(id);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      res.json(candidate);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch candidate" });
    }
  });

  // Create new candidate
  app.post("/api/candidates", async (req, res) => {
    try {
      const validatedData = insertCandidateSchema.parse(req.body);
      const candidate = await storage.createCandidate(validatedData);
      res.status(201).json(candidate);
    } catch (error) {
      res.status(400).json({ message: "Invalid candidate data" });
    }
  });

  // Update candidate
  app.patch("/api/candidates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const candidate = await storage.updateCandidate(id, updates);
      if (!candidate) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      res.json(candidate);
    } catch (error) {
      res.status(500).json({ message: "Failed to update candidate" });
    }
  });

  // Delete candidate
  app.delete("/api/candidates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCandidateById(id);
      if (!deleted) {
        return res.status(404).json({ message: "Candidate not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete candidate" });
    }
  });

  // Upload PDF resumes
  app.post("/api/upload-resumes", upload.array('resumes'), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ message: "No files uploaded" });
      }

      const results = [];
      for (const file of files) {
        if (file.mimetype !== 'application/pdf') {
          results.push({
            filename: file.originalname,
            success: false,
            error: 'Not a PDF file'
          });
          continue;
        }

        // For now, we'll create a placeholder candidate
        // In a real implementation, you'd use a PDF parsing library here
        const candidate = await storage.createCandidate({
          name: file.originalname.replace('.pdf', ''),
          email: 'extracted@email.com',
          score: '?',
          status: 'attention',
          remark: `Uploaded resume: ${file.originalname}. Requires manual scoring.`,
          flags: ['Not Scored Yet'],
          scoreBreakdown: { skills: 0, collaboration: 0, problemSolving: 0, culturalFit: 0 },
          rawText: 'PDF content would be extracted here'
        });

        results.push({
          filename: file.originalname,
          success: true,
          candidateId: candidate.id
        });
      }

      res.json({ results });
    } catch (error) {
      res.status(500).json({ message: "Failed to process uploads" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
