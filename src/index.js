import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { PORT } from "./constants.js";

dotenv.config({
  path: "./.env",
});

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} `);
    });
  })
  .catch((error) => {
    console.log("Custom Error : MongoDB connection failed !", error);
  });
