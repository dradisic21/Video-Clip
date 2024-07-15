import React, { useEffect, useState } from "react";
import Plyr from "plyr-react";
import "plyr-react/plyr.css";
import { videos } from "../../services/videos";
import "./VideoTranscriptPlayer.scss";

export function VideoTranscriptPlayer() {
  const [currentVideo, setCurrentVideo] = useState(videos[0]);
  const [captions, setCaptions] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const fetchCaptions = async () => {
      try {
        const response = await fetch(currentVideo.captionsSrc);
        const data = await response.text();
        setCaptions(parseSRT(data));
      } catch (error) {
        console.error("Error fetching captions:", error);
      }
    };

    fetchCaptions();
  }, [currentVideo]);


  const parseSRT = (data) => {
    const entries = [];
    const regex =
      /(\d+)\n(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})\n(.+?)(?=\n{2}|\n*$)/gs;

    let match;

    while ((match = regex.exec(data)) !== null) {
      entries.push({
        start: parseSRTTime(match[2]),
        end: parseSRTTime(match[3]),
        text: match[4].trim().replace(/\n/g, " "),
      });
    }
    return entries;
  };

  const parseSRTTime = (time) => {
    const [hours, minutes, seconds] = time.split(":");
    const [secs, ms] = seconds.split(",");
    return (
      parseInt(hours) * 3600 +
      parseInt(minutes) * 60 +
      parseInt(secs) +
      parseInt(ms) / 1000
    );
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleTimeUpdate = (event) => {
    setCurrentTime(event.target.currentTime);
  };

  return (
    <div className="video-transcrription-player">
      <div className="content">
        <div className="video-container">
          <Plyr
            source={{
              type: "video",
              sources: [
                {
                  src: currentVideo.videoSrc,
                  type: "video/mp4",
                },
              ],
              track: [
                {
                  kind: "captions",
                  src: currentVideo.captionsSrc,
                  srcLang: "en",
                  label: "English",
                  default: true,
                },
              ],
            }}
            options={{
              controls: [
                "play",
                "progress",
                "current-time",
                "mute",
                "volume",
                "captions",
                "fullscreen",
                "settings",
              ],
              captions: { active: true, update: true, language: "en" },
            }}
            onProgress={handleTimeUpdate}
          />

          <div className="button-container">
            <button onClick={() => setCurrentVideo(videos[0])} className="btn">
              Clip 1
            </button>
            <button onClick={() => setCurrentVideo(videos[1])} className="btn">
              Clip 2
            </button>
          </div>
        </div>

        <div className="transcript">
          <div className="transcript-content">
            <h2 className="transcript-title">Transkript</h2>
            {captions.map((caption, index) => (
              <div
                key={index}
                className={`transcript-line ${
                  currentTime >= caption.start && currentTime <= caption.end
                    ? "active"
                    : ""
                }`}
                onClick={() => setCurrentTime(caption.start)}
              >
                <span>
                  {formatTime(caption.start)} - {formatTime(caption.end)}
                </span>
                <span>{caption.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
