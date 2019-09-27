# this_vid2
The objectively best Twitter video downloader bot.

## Usage
Requires Node.js, FFmpeg, and SQLite3:

```shell
sudo apt install nodejs ffmpeg sqlite3
```

Once they're installed, install the required modules using npm:
```shell
npm install
```

Then, create the database using sqlite3:
```shell
sqlite3 tweets.sqlite

sqlite> .exit
```

Finally, put your consumer key/secret and access token/secret obtained from the [Twitter apps page](https://developer.twitter.com/apps) inside `config.json` and run `app.js`.

## Disclaimer
This is a parody of video downloader bots and does not actually send users download links. If you need an actual Twitter video downloader, I recommend [youtube-dl](http://ytdl-org.github.io/youtube-dl/).

**I AM NOT RESPONSIBLE FOR ANYTHING THAT HAPPENS TO YOUR ACCOUNT AS A RESULT OF HOSTING THIS.**