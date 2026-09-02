import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import documentRoutes from "./routes/documentRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5713" }));
app.use(express.json());

// Mount document and RAG routes
app.use("/api/documents", documentRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'Axiom API Gateway' });
});

app.get('/', (_req, res) => {
    res.status(200).send('Axiom API Gateway Live & Running');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});