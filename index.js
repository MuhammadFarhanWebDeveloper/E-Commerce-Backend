import cors from "cors";
import express from "express";
import { config } from "dotenv";
import auth from "./views/auth.js";
import product from "./views/product.js";
import cookieParser from "cookie-parser";

const app = express();
const PORT = 5000;
config({
  path: "./.env",
});
const allowedOrigins = ["http://localhost:3000"];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps or Postman) or check against allowed origins
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", auth);
app.use("/api/product", product);

app.get("/", (req, res) => {
  res.json({ woring: true });
});

app.listen(PORT, () => {
  console.log(`Your app is running on http://localhost:${PORT}`);
});
