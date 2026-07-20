import "dotenv/config";
import express from "express";

const app = express();
app.get("/health", (_request, response) => response.json({ status: "ok" }));
const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`HaqSetu listening on http://localhost:${port}`));
