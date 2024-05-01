const DB_NAME = "VitalFlow";
const PORT = process.env.PORT || 8000;

const cookieOptions =
  process.env.NODE_ENV == "development"
    ? {
        path: "/",
        httpOnly: true,
        secure: false,
      }
    : {
        path: "/",
        httpOnly: true,
        secure: true,
        sameSite: "none",
      };

// rate limiting
const maxRequests = 2;
const timeWindow = 10;

// sms service

export { DB_NAME, PORT, cookieOptions, maxRequests, timeWindow };
