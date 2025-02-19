import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { videos } from "../../services/videos";
import "./VideoTranscriptPlayer.scss";

function parseSRT(data) {
  const subtitleBlocks = data.trim().split(/\n\s*\n/);
  const subtitles = subtitleBlocks.map((subtitleBlock) => {
    const lines = subtitleBlock.split("\n");
    const timeString = lines[1];
    const textLines = lines.slice(2);
    const [startTimeString, endTimeString] = timeString.split(" --> ");
    const text = textLines
      .join(" ")
      .replace(/<[^>]*>/g, "")
      .replace(/\{.*?\}/g, "");

    return {
      startTime: parseSRTTime(startTimeString),
      endTime: parseSRTTime(endTimeString),
      text,
    };
  });
  return subtitles;
}

const parseSRTTime = (timeString) => {
  const [hours, minutes, seconds] = timeString.split(":");
  const [secs, millis] = seconds.split(",");

  return (
    parseInt(hours) * 3600 +
    parseInt(minutes) * 60 +
    parseFloat(`${secs}.${millis}`)
  );
};

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
};

export function VideoTranscriptPlayer() {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [currentVideo, setCurrentVideo] = useState(videos[activeVideoIndex]);
  const [captions, setCaptions] = useState([]);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchCaptions = async () => {
      try {
        const response = await axios.get(currentVideo.captionsSrc);
        const parsedCaptions = parseSRT(response.data);
        console.log(response.data)
        setCaptions(parsedCaptions);
      } catch (error) {
        console.error("Error fetching captions:", error);
      }
    };

    fetchCaptions();
  }, [currentVideo]);

  useEffect(() => {
    if (videoRef.current) {
      const updateTime = () => {
        setCurrentTime(videoRef.current.currentTime);
      };
      videoRef.current.addEventListener("timeupdate", updateTime);
      return () => {
        if (videoRef.current) {
          // eslint-disable-next-line
          videoRef.current.removeEventListener("timeupdate", updateTime);
        }
      };
    }
  }, [currentTime]);

  const handleCaptionClick = (startTime) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
    }
  };

  const setActiveVideo = (index) => {
    setActiveVideoIndex(index);
    setCurrentVideo(videos[index]);
  };

  return (
    <div className="video-transcrription-player">
      <div className="content">
        <div className="video-container">
          <div className="video-player_content">
            <video
              key={currentVideo.id}
              preload="auto"
              ref={videoRef}
              className="video-player"
              controls
            >
              <source src={currentVideo.videoSrc} type="video/mp4" />
              <track
                label="English"
                kind="subtitles"
                srcLang="en"
                src={currentVideo.captionsVtt}
                default
              />
            </video>
          </div>
          

          <div className="button-container">
          {videos.map((video, index) => (
              <button
                key={video.id}
                onClick={() => setActiveVideo(index)}
                className={`btn ${index === activeVideoIndex ? "active" : ""}`}
              >
                {video.title}
              </button>
            ))}
          </div>
        </div>

        <div className="transcript">
          <div className="transcript-content">
            <h2 className="transcript-title">Transkript</h2>
            {captions.map((caption, index) => (
              <div
                key={index}
                className={`transcript-line ${
                  currentTime >= caption.startTime && currentTime <= caption.endTime
                    ? "active"
                    : ""
                }`}
                onClick={() => handleCaptionClick(caption.startTime)}
              >
                <div className="transcript-captions">
                  <span>{formatTime(caption.startTime)}</span>&nbsp;&nbsp;
                  <span className="captions-text">{caption.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
