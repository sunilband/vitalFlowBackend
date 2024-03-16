const DB_NAME = "VitalFlow";
const PORT = process.env.PORT || 8000;

const cookieOptions = {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "development" ? false : true,
  // sameSite: 'None',
};

// rate limiting
const maxRequests = 2;
const timeWindow = 10;

export { DB_NAME, PORT, cookieOptions, maxRequests, timeWindow };
