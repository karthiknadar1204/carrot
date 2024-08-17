"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Webcam from "react-webcam";
import { Separator } from "@/components/ui/separator";
import {
  Camera,
  FlipHorizontal,
  PersonStanding,
  Video,
  Volume2,
  Sun,
  Moon,
  Power,
} from "lucide-react";
import { ModeToggle } from "@/components/theme-toggle";
import { Rings } from "react-loader-spinner";
import { beep } from "@/utils/audio";
import { toast } from "sonner";
import { Slider } from "@/components/ui/slider";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import SocialMediaLinks from "@/components/social-links";

type Props = {};

const Page = (props: Props) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [mirrored, setMirrored] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [autoRecordEnabled, setAutoRecordEnabled] = useState<boolean>(false);
  const [volume, setVolume] = useState(0.8);
  const [loading, setLoading] = useState<boolean>(false);
  const [cameraOn, setCameraOn] = useState<boolean>(true);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  let stopTimeout: any = null;

  useEffect(() => {
    if (cameraOn && webcamRef.current) {
      const stream = (webcamRef.current.video as any).captureStream();
      if (stream) {
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            const recordedBlob = new Blob([e.data], { type: "video/webm" });
            const videoURL = URL.createObjectURL(recordedBlob);

            const a = document.createElement("a");
            a.href = videoURL;
            a.download = `${formatDate(new Date())}.webm`;
            a.click();
          }
        };
        mediaRecorderRef.current.onstart = () => {
          setIsRecording(true);
        };
        mediaRecorderRef.current.onstop = () => {
          setIsRecording(false);
        };
      }
    }

    return () => {
      // Clean up the media recorder and stream
      mediaRecorderRef.current?.stop();
      stopTimeout && clearTimeout(stopTimeout);
    };
  }, [cameraOn]);

  function formatDate(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
  }

  function userPromptScreenshot() {
    if (!cameraOn) {
      setCameraOn(true);
      setTimeout(() => captureScreenshot(), 500);
    } else {
      captureScreenshot();
    }
  }

  function captureScreenshot() {
    if (!webcamRef.current) {
      toast("Camera not found. Please refresh");
    } else {
      const imgSrc = webcamRef.current.getScreenshot();
      if (imgSrc) {
        const blob = base64toBlob(imgSrc.split(",")[1], "image/png");

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${formatDate(new Date())}.png`;
        a.click();
      }
    }
  }

  function userPromptRecord() {
    if (!cameraOn) {
      setCameraOn(true);
      setTimeout(() => startRecording(true), 500); // Delay to allow camera to turn on
    } else {
      if (!webcamRef.current) {
        toast("Camera not found. Please refresh.");
        return;
      }

      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.requestData();
        clearTimeout(stopTimeout);
        mediaRecorderRef.current.stop();
        toast("Recording saved to downloads");
      } else {
        startRecording(true);
      }
    }
  }

  function startRecording(doBeep: boolean) {
    if (webcamRef.current && mediaRecorderRef.current?.state !== "recording") {
      mediaRecorderRef.current?.start();
      doBeep && beep(volume);

      stopTimeout = setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.requestData();
          mediaRecorderRef.current.stop();
        }
      }, 30000);
    }
  }

  function toggleAutoRecord() {
    setAutoRecordEnabled((prev) => !prev);
    toast(`Autorecord ${!autoRecordEnabled ? "enabled" : "disabled"}`);
  }

  function base64toBlob(base64Data: string, contentType: string) {
    const byteCharacters = atob(base64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += 512) {
      const slice = byteCharacters.slice(offset, offset + 512);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  }

  return (
    <div className="flex h-screen">
      <div className="relative">
        <div className="relative h-screen w-full">
          {cameraOn && (
            <Webcam
              ref={webcamRef}
              mirrored={mirrored}
              className="h-full w-full object-contain p-2"
            />
          )}
          <canvas
            ref={canvasRef}
            className="absolute top-0 left-0 h-full w-full object-contain"
          ></canvas>
        </div>
      </div>

      <div className="flex flex-row flex-1">
        <div className="border-primary/5 border-2 max-w-xs flex flex-col gap-2 justify-between shadow-md rounded-md p-4">
          <div className="flex flex-col gap-2">
            <ModeToggle />
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={() => {
                setMirrored((prev) => !prev);
              }}
            >
              <FlipHorizontal />
            </Button>
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={() => setCameraOn((prev) => !prev)}
            >
              <Power />
            </Button>
            <Separator className="my-2" />
          </div>

          <div className="flex flex-col gap-2">
            <Separator className="my-2" />
            <Button
              variant={"outline"}
              size={"icon"}
              onClick={userPromptScreenshot}
            >
              <Camera />
            </Button>
            <Button
              variant={isRecording ? "destructive" : "outline"}
              size={"icon"}
              onClick={userPromptRecord}
            >
              <Video />
            </Button>
            <Separator className="my-2" />
            <Button
              variant={autoRecordEnabled ? "destructive" : "outline"}
              size={"icon"}
              onClick={toggleAutoRecord}
            >
              {autoRecordEnabled ? (
                <Rings color="white" height={45} />
              ) : (
                <PersonStanding />
              )}
            </Button>
          </div>

          <div className="flex flex-col gap-2">
            <Separator className="my-2" />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant={"outline"} size={"icon"}>
                  <Volume2 />
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Slider
                  max={1}
                  min={0}
                  step={0.2}
                  defaultValue={[volume]}
                  onValueCommit={(val) => {
                    setVolume(val[0]);
                    beep(val[0]);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="h-full flex-1 py-4 px-2 overflow-y-scroll">
          <RenderFeatureHighlightsSection
            isRecording={isRecording}
            autoRecordEnabled={autoRecordEnabled}
            setMirrored={setMirrored}
            userPromptScreenshot={userPromptScreenshot}
            userPromptRecord={userPromptRecord}
            toggleAutoRecord={toggleAutoRecord}
          />
        </div>
      </div>

      {loading && (
        <div className="z-50 absolute w-full h-full flex items-center justify-center bg-primary-foreground">
          Getting things ready . . . <Rings height={50} color="red" />
        </div>
      )}
    </div>
  );
};

const RenderFeatureHighlightsSection = ({
  isRecording,
  autoRecordEnabled,
  setMirrored,
  userPromptScreenshot,
  userPromptRecord,
  toggleAutoRecord,
}) => {
  return (
    <div className="text-xs text-muted-foreground">
      <ul className="space-y-4">
        <li>
          <strong>Dark Mode/Sys Theme 🌗</strong>
          <p>Toggle between dark mode and system theme.</p>
          <Button className="my-2 h-6 w-6" variant={"outline"} size={"icon"}>
            <Sun size={14} />
          </Button>{" "}
          /{" "}
          <Button className="my-2 h-6 w-6" variant={"outline"} size={"icon"}>
            <Moon size={14} />
          </Button>
        </li>
        <li>
          <strong>Horizontal Flip ↔️</strong>
          <p>Adjust horizontal orientation.</p>
          <Button
            className="h-6 w-6 my-2"
            variant={"outline"}
            size={"icon"}
            onClick={() => {
              setMirrored((prev) => !prev);
            }}
          >
            <FlipHorizontal size={14} />
          </Button>
        </li>
        <Separator />
        <li>
          <strong>Take Pictures 📸</strong>
          <p>Capture snapshots at any moment from the video feed.</p>
          <Button
            className="h-6 w-6 my-2"
            variant={"outline"}
            size={"icon"}
            onClick={userPromptScreenshot}
          >
            <Camera size={14} />
          </Button>
        </li>
        <li>
          <strong>Manual Video Recording 📽️</strong>
          <p>Manually record video clips as needed.</p>
          <Button
            className="h-6 w-6 my-2"
            variant={isRecording ? "destructive" : "outline"}
            size={"icon"}
            onClick={userPromptRecord}
          >
            <Video size={14} />
          </Button>
        </li>
        <Separator />
        <li>
          <strong>Enable/Disable Auto Record 🚫</strong>
          <p>
            Option to enable/disable automatic video recording whenever
            required.
          </p>
          <Button
            className="h-6 w-6 my-2"
            variant={autoRecordEnabled ? "destructive" : "outline"}
            size={"icon"}
            onClick={toggleAutoRecord}
          >
            {autoRecordEnabled ? (
              <Rings color="white" height={30} />
            ) : (
              <PersonStanding size={14} />
            )}
          </Button>
        </li>
        <li>
          <strong>Volume Slider 🔊</strong>
          <p>Adjust the volume level of the notifications.</p>
        </li>
        <li>
          <strong>Camera Feed Highlighting 🎨</strong>
          <p>
            Highlights persons in <span style={{ color: "#FF0F0F" }}>red</span>{" "}
            and other objects in <span style={{ color: "#00B612" }}>green</span>
            .
          </p>
        </li>
        <Separator />
        <li className="space-y-4">
          <strong>Share your thoughts 💬 </strong>
          <SocialMediaLinks />
          <br />
          <br />
          <br />
        </li>
      </ul>
    </div>
  );
};

export default Page;
