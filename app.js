const Twit = require("twit");
const config = require("./config.json");
const getVideoURL = require("./getVideo.js");
const generateVideo = require("./generateVideo.js");
const upload = require("./upload.js");
const fetch = require("node-fetch");
const fs = require("fs-extra");
const keyv = require("keyv");
const client = new Twit({
  consumer_key: config.consumerKey,
  consumer_secret: config.consumerSecret,
  access_token: config.accessToken,
  access_token_secret: config.accessSecret
});
const db = new keyv("sqlite://tweets.sqlite");

db.on("error", err => console.error("Keyv connection error:", err));

const setup = async () => {
  const tweets = await db.get("oldTweets");
  if (!Array.isArray(tweets)) {
    await db.set("oldTweets", []);
  }
  await db.set("cooldown", []);
  fs.access("./cache/").catch(error => {
    if (error) fs.mkdir("./cache/");
  });
};

setup();

const stream = client.stream("statuses/filter", {
  track: "@this_vid2"
});

stream.on("tweet", async (tweet) => {
  if (tweet.in_reply_to_status_id !== null) {
    try {
      const originalTweet = await client.get("statuses/show", {
        id: tweet.in_reply_to_status_id_str
      });
      if (originalTweet.data.possibly_sensitive !== true) {
        if (!originalTweet.data.text.includes("@this_vid2") && originalTweet.data.user.screen_name !== "this_vid2") {
          const tweetsArray = await db.get("oldTweets");
          const tweets = tweetsArray !== undefined ? tweetsArray : [];
          const cooldownArray = await db.get("cooldown");
          const cooldown = cooldownArray !== undefined ? cooldownArray : [];
          if (!tweets.includes(originalTweet.data.id_str) && !cooldown.includes(tweet.user.id_str)) {
            const url = await getVideoURL(originalTweet.data, client);
            if (url !== undefined) {
              const videoData = await fetch(url);
              const randomFilename = Math.random().toString(36).substring(2, 15);
              const fileName = `./cache/${tweet.user.screen_name}-${randomFilename}.mp4`;
              const dest = fs.createWriteStream(fileName);
              videoData.body.pipe(dest);
              const outputPath = await generateVideo(fileName, originalTweet.data.user.screen_name);
              const uploadData = await upload(outputPath, client);
              console.log(`Successfully uploaded video with media ID ${uploadData.data.media_id_string}`);
              console.log(`Response: ${uploadData.response.statusCode} ${uploadData.response.statusMessage}`);

              await fs.remove(fileName);
              await fs.remove(outputPath);

              tweets.push(originalTweet.data.id_str);
              cooldown.push(tweet.user.id_str);
              await db.set("oldTweets", tweets);
              await db.set("cooldown", cooldown);
              setTimeout(async () => {
                cooldown.filter((value) => {
                  return value !== tweet.user.id_str;
                });
                await db.set("cooldown", cooldown);
              }, 600000);

              const messages = [
                "Downloaded!",
                "Here's your video!",
                "TAke a look, y'all:",
                "Check it out:",
                "Done!",
                "Download complete!",
                "Uploaded!",
                "Sorted. 👍",
                "I got it!",
                `Your video has been downloaded, @${tweet.user.screen_name}!`,
                "Finished!"
              ];
              const tweetContent = `@${tweet.user.screen_name} ${messages[Math.floor(Math.random() * messages.length)]}`;
              const payload = {
                status: tweetContent,
                in_reply_to_status_id: tweet.id_str,
                media_ids: [uploadData.data.media_id_string]
              };
              const finalTweet = await client.post("statuses/update", payload);
              console.log(`Reply with id ${finalTweet.data.id_str} has been posted with status code ${finalTweet.response.statusCode} ${finalTweet.response.statusMessage}!`);
            } else {
              console.log("Video not found");
            }
          } else {
            console.log("Already processed this tweet or user is on cooldown, skip");
          }
        } else {
          console.log("Not replying to self");
        }
      } else {
        console.log("Might contain NSFW content, skip");
      }
    } catch (e) {
      const error = JSON.stringify(e);
      if (error.includes("Sorry, you are not authorized to see this status.")) {
        console.log("Private account or original poster blocked, skip");
      } else if (error.includes("Segments do not add up to provided total file size.")) {
        console.log("Video failed to upload, skip");
      } else if (error.includes("You have been blocked from the author of this tweet.")) {
        console.log("Blocked by original poster, skip");
      } else {
        console.error;
      }
    }
  } else {
    console.log("Tweet not replying to anything, skip");
  }
});