const ffmpeg = require("fluent-ffmpeg");

module.exports = (filename, handle) => {
  return new Promise((resolve, reject) => {
    const outputFilename = `./cache/${Math.random().toString(36).substring(2, 15)}-output.mp4`;
    ffmpeg.ffprobe(filename, (error, metadata) => {
      if (error) reject(error);
      const duration = parseInt(metadata.format.duration) >= 15 ? 15 : metadata.format.duration;
      const inputWidth = metadata.streams[0].width;
      const inputHeight = metadata.streams[0].height;
      const outputFontSize = Math.sqrt(Math.pow(inputWidth, 2) + Math.pow(inputHeight, 2)) / 1468.6 * 72;
      const filters = [{
        filter: "volume",
        options: {
          enable: `between(t,0,${duration}/2)`,
          volume: "0.25"
        },
        inputs: metadata.streams.length >= 2 ? "0:a" : "1:a",
        outputs: "audio1"
      }, {
        filter: "volume",
        options: {
          enable: `between(t,${duration}/2, ${duration})`,
          volume: "5"
        },
        inputs: "audio1",
        outputs: "audio2"
      }, {
        filter: "atrim",
        options: {
          duration: duration
        },
        inputs: "audio2",
        outputs: "audioFinal"
      }, {
        filter: "drawtext",
        options: {
          fontfile: "'./assets/DejaVuSans.ttf'",
          text: "@this_vid2",
          fontcolor: "white",
          fontsize: outputFontSize.toString(),
          box: "1",
          boxcolor: "black@0.5",
          boxborderw: "5",
          x: "(w-text_w)",
          y: "0"
        },
        inputs: "0:v",
        outputs: "video1"
      }, {
        filter: "drawtext",
        options: {
          fontfile: "'./assets/DejaVuSans.ttf'",
          text: `@${handle}`,
          fontcolor: "white",
          fontsize: outputFontSize.toString(),
          box: "1",
          boxcolor: "black@0.5",
          boxborderw: "5",
          x: "0",
          y: "0"
        },
        inputs: "video1",
        outputs: "video2"
      }, {
        filter: "drawtext",
        options: {
          fontfile: "'./assets/DejaVuSans-Bold.ttf'",
          text: "Downloaded using @this_vid2",
          fontcolor: "white@0.3",
          fontsize: outputFontSize.toString(),
          shadowcolor: "black",
          shadowx: "2",
          shadowy: "2",
          x: "(w-text_w)/2",
          y: "(h-text_h)/2"
        },
        inputs: "video2",
        outputs: "video3"
      }, {
        filter: "drawtext",
        options: {
          fontfile: "'./assets/Topaz.ttf'",
          text: "This video was downloaded using @this_vid2. Any unauthorized usage or reupload of this video is disallowed by @this_vid2 Enterprises. Visit https//twitter.com/this_vid2 for more information.",
          fontcolor: "white",
          fontsize: outputFontSize.toString(),
          y: "h-line_h-10",
          x: "w-mod(max(t-4.5\\,0)*(w+tw)/7.5\\,(w+tw))"
        },
        inputs: "video3",
        outputs: "video4"
      }, {
        filter: "scale",
        options: {
          h: "240",
          w: "320"
        },
        inputs: "video4",
        outputs: "video5"
      }, {
        filter: "trim",
        options: {
          duration: duration
        },
        inputs: "video5",
        outputs: "videoFinal"
      }, {
        filter: "concat",
        options: {
          n: 2,
          v: 1,
          a: 1
        },
        inputs: ["videoFinal", "audioFinal", metadata.streams.length >= 2 ? "1:v" : "2:v", metadata.streams.length >= 2 ? "1:a" : "2:a"],
        outputs: ["v", "a"]
      }];
      if (metadata.streams.length >= 2) {
        ffmpeg(filename).input("./assets/outro.mp4").duration(duration + 5).videoBitrate(150).fps(5).audioChannels(1).audioBitrate(8).complexFilter(filters, ["v", "a"]).on("end", () => {
          resolve(outputFilename);
        }).save(outputFilename);
      } else {
        ffmpeg(filename).input("./assets/silence.mp3").input("./assets/outro.mp4").duration(duration + 5).videoBitrate(150).fps(5).audioChannels(1).audioBitrate(8).complexFilter(filters, ["v", "a"]).on("end", () => {
          resolve(outputFilename);
        }).save(outputFilename);
      }
    });
  });
};

