const functions = require("firebase-functions");

exports.getStory = functions.https.onRequest((request, response) => {
  functions.logger.info("Story requested!", {structuredData: true});
  response.send("Once upon a time, in a quiet forest, lived a gentle bear who loved to watch the stars.");
});
