// this file is necessary because the normal twit upload code is extremely broken
const fs = require("fs");

const upload = (filePath, client) => {
  return new Promise((resolve, reject) => {
    fs.stat(filePath, (error, stats) => {
      if (error) reject(error);
      client.post("media/upload", {
        "command": "INIT",
        "media_type": "video/mp4",
        "total_bytes": stats.size
      }, (error, bodyObj) => {
        if (error) reject(error);
        const mediaIdStr = bodyObj.media_id_string;

        let isStreamingFile = true;
        let isUploading = false;
        let segmentIndex = 0;
        const fStream = fs.createReadStream(filePath, {
          highWaterMark: 5 * 1024 * 1024
        });

        const _finalizeMedia = function(mediaIdStr, cb) {
          client.post("media/upload", {
            "command": "FINALIZE",
            "media_id": mediaIdStr
          }, cb);
        };

        const _checkFinalizeResp = function(err, bodyObj, resp) {
          checkUploadMedia(err, bodyObj, resp);
          resolve({ data: bodyObj, response: resp });
        };

        const checkUploadMedia = function(err, bodyObj) {
          if (err) reject(err);

          if (!bodyObj) reject("Error with initial upload");
          if (!bodyObj.media_id) reject("Error with finalized upload");
          if (!bodyObj.media_id_string) reject("Error with finalized upload");
          if (!bodyObj.size) reject("Error with finalized upload");
        };

        fStream.on("data", function(buff) {
          isUploading = true;

          client.post("media/upload", {
            "command": "APPEND",
            "media_id": mediaIdStr,
            "segment_index": segmentIndex,
            "media": buff.toString("base64"),
          }, function(error, bodyObj, resp) { // eslint-disable-line no-unused-vars
            if (error) reject();
            segmentIndex += 1;
            if (!isStreamingFile) {
              _finalizeMedia(mediaIdStr, _checkFinalizeResp);
            }
          });
        });

        fStream.on("end", function() {
          isStreamingFile = false;

          if (!isUploading) {
            _finalizeMedia(mediaIdStr, _checkFinalizeResp);
          }
        });
      });
    });
  });
};

module.exports = upload;