import express from "express";
import { config } from "dotenv";
import auth from "./views/auth.js"
import product from "./views/product.js"
import cookieParser from "cookie-parser";

const app = express();
const PORT = 3000;
config({
  path: "./.env",
});

app.use(cookieParser());
app.use(express.json());

app.use("/api/auth", auth);
app.use("/api/product", product);


app.listen(PORT, () => {
  console.log(`Your app is running on http://localhost:${PORT}`);
});
