const DB_NAME = "VitalFlow";
const PORT = process.env.PORT || 8000;

const cookieOptions = {
  httpOnly: true,
  secure: true,
};

// rate limiting
const maxRequests = 2;
const timeWindow = 10;

export { DB_NAME, PORT, cookieOptions, maxRequests, timeWindow };
