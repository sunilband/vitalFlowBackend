import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
// CORS settings
app.use(
  cors({
    origin:
      process.env.NODE_ENV == "developement"
        ? process.env.CORS_ORIGIN_DEV
        : process.env.CORS_ORIGIN_PROD,
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

// ------------all routes---------------

// SUPERADMIN
import superAdminRouter from "./routes/superadmin.routes.js";
app.use("/api/v1/superadmin/", superAdminRouter);

// DONOR
import donerRouter from "./routes/doner.routes.js";
app.use("/api/v1/donor/", donerRouter);

// BLOODBANK
import bloodBankRouter from "./routes/bloodbank.routes.js";
app.use("/api/v1/bloodbank/", bloodBankRouter);

// CAMP
import campRouter from "./routes/camp.routes.js";
app.use("/api/v1/camp/", campRouter);

// CHAT
import chatRouter from "./routes/chat.routes.js";
app.use("/api/v1/chat/", chatRouter);

export { app };
