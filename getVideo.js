const extractVideoLink = async (tweetObject, client) => {

  const get = (object, path) => {
    let lookup = Object.assign({}, object);
    const keys = path.split(".");
    for (const key of keys) {
      if (lookup[key]) {
        lookup = lookup[key];
      } else {
        return null;
      }
    }
    return lookup;
  };

  const fetchTweet = (tweetId) => {
    return client.get("statuses/show", {
      id: tweetId,
      tweet_mode: "extended",
    }).then(r => r.data)
      .catch(error => {
        if (error) console.error;
      });
  };

  if (tweetObject.extended_entities) {
    const variants = tweetObject.extended_entities.media[0].video_info
      .variants.filter(variant => variant.content_type === "video/mp4");
    const min = Math.min(...variants.map(v => v["bitrate"]));
    return variants.find(item => item["bitrate"] == min).url;
  } else if (get(tweetObject, "entities.media")) {
    const expandedUrl = tweetObject.entities.media[0].expanded_url.split("/");
    const tweetId = expandedUrl[expandedUrl.length - 3];
    if (tweetId !== tweetObject.id_str) {
      return await fetchTweet(tweetId)
        .then(t => extractVideoLink(t, client));
    }
  }
};

module.exports = extractVideoLink;