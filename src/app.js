import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
// CORS settings
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// parse JSON and limit Json size in options
app.use(
  express.json({
    limit: "20kb",
  })
);

// parse urlencoded data.Extended option is set to true to allow parsing of nested objects
app.use(
  express.urlencoded({
    extended: true,
    limit: "20kb",
  })
);

// static files
app.use(express.static("public"));

// Read and set user cookies
app.use(cookieParser());

// routes
import donerRouter from "./routes/doner.routes.js";
app.use("/api/v1/", donerRouter);

export { app };
