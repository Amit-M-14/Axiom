import { Request, Response } from "express";
import { spawn } from "child_process";
import path from "path";
import 'multer'
import fs from "fs";

const ENGINE_DIR = path.resolve(process.cwd(), "../engine");
const PYTHON_BIN = process.env.PYTHON_PATH || "python";

// Upload & Ingest PDF documents

export const uploadandIngest = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const filePath = path.resolve(req.file.path);
    const ingestScript = path.join(ENGINE_DIR, "ingest.py");

    console.log(`[BACKEND]: Triggering ingestion for ${filePath}`);

    // Spawn Python ingest.py process

    const pythonProcess = spawn(PYTHON_BIN, ["-u", ingestScript, filePath], {
      cwd: ENGINE_DIR,
      env: { ...process.env },
    });

    let stdoutData = "";
    let stderrData = "";

    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
      console.log(`[PYTHON INGEST]: ${data.toString().trim()}`);
    });

    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
      console.error(`[PYTHON INGEST ERROR]: ${data.toString().trim()}`);
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        return res.status(200).json({
          success: true,
          message:
            "Filing successfully chunked and indexed in vector database.",
          filename: req.file?.originalname,
          storedPath: req.file?.filename,
          logs: stdoutData.split("\n").filter(Boolean),
        });
      } else {
        return res.status(500).json({
          success: false,
          error: "Vector ingestion pipeline failed.",
          details: stderrData || stdoutData,
        });
      }
    });
  } catch (error: any) {
    console.error("[SERVER ERROR]:", error);
    res
      .status(500)
      .json({ error: error.message || "Internal server error during upload." });
  }
};
//  Query Audited Financial Filing RAG Pipeline

export const queryDocument = async (req: Request, res: Response) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "A valid text query is required." });
    }

    const ragScript = path.join(ENGINE_DIR, "rag_pipeline.py");

    // Spawn Python rag_pipeline.py process
    const pythonProcess = spawn(PYTHON_BIN, ["-u", ragScript, query], {
      cwd: ENGINE_DIR,
      env: { ...process.env },
    });

    let stdoutData = "";
    let stderrData = "";

    pythonProcess.stdout.on("data", (data) => {
      stdoutData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      stderrData += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        // Parse structured sections from Python script output
        const answerMatch = stdoutData.match(
          /--- AXIOM AUDITED ANSWER ---\s*([\s\S]*?)\s*--- RETRIEVED SOURCES ---/,
        );
        const citationsMatch = stdoutData.match(
          /--- RETRIEVED SOURCES ---\s*([\s\S]*)$/,
        );

        const answer = answerMatch ? answerMatch[1].trim() : stdoutData.trim();
        let citations = [];

        if (citationsMatch) {
          try {
            citations = JSON.parse(citationsMatch[1].trim());
          } catch (e) {
            console.warn("[BACKEND]: Failed to parse citations JSON string");
          }
        }

        return res.status(200).json({
          success: true,
          query,
          answer,
          citations,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: "RAG retrieval pipeline failed.",
          details: stderrData || stdoutData,
        });
      }
    });
  } catch (error: any) {
    console.error("[SERVER ERROR]:", error);
    res
      .status(500)
      .json({ error: error.message || "Internal server error during query." });
  }
};
