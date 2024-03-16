import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);
function smsService(toNumber, message) {
  client.messages
    .create({
      body: message,
      from: "+15126077902",
      to: toNumber,
    })
    .then((message) => console.log(message.sid))
    .catch((error) => console.error(error))
    .done();
}

export { smsService };
