import cors from "cors";
import express from "express";
import { config } from "dotenv";
import auth from "./views/auth.js";
import product from "./views/product.js";
import cookieParser from "cookie-parser";
import category from "./views/category.js";
import order from "./views/order.js";

const app = express();
const PORT = 5000;
config({
  path: "./.env",
});
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:4041",
  "https://e-commerce-frontend-xi-seven.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", auth);
app.use("/api/product", product);
app.use("/api/category", category);
app.use("/api/order", order)
app.get("/", (req, res) => {
  res.json({ woring: true });
});

app.listen(PORT, () => {
  console.log(`Your app is running on http://localhost:${PORT}`);
});
