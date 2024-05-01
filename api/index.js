import dotenv from "dotenv";
import connectDB from "../src/db/index.js";
import { app } from "../src/app.js";
import { PORT } from "../src/constants.js";

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
