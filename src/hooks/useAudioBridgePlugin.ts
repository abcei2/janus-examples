import { use, useEffect, useState } from "react";
import adapter from "webrtc-adapter";

export default function useAudioBridgePlugin({
  audioRef,
  room = 1234,
  display = "1234",
  muted = false,
  speaker = false,
}: {
  audioRef: React.RefObject<HTMLAudioElement>;
  room?: number;
  display?: string;
  feed?: number;
  muted?: boolean;
  record?: boolean;
  speaker?: boolean;
}) {
  const [pluginHandle, setPluginHandle] = useState<any>(null);
  const [answer, setAnswer] = useState<any>(null);
  const [janus, setJanus] = useState<any>(null);
  const [isSpeaker, setIsSpeaker] = useState<boolean>(speaker??false);
  const [joined, setJoined] = useState<boolean>(false);
  const [attached, setAttached] = useState<boolean>(false);


  useEffect(() => {
    if (!audioRef.current) return;
    loadJanus();
  }, [audioRef.current]);

  useEffect(() => {
    if (!pluginHandle) return;
    if (!answer) return;
    createAnswer(pluginHandle, answer);
  }, [pluginHandle, answer]);

  useEffect(() => {   
    joinRoom();
    createOffer();
  }, [pluginHandle]);

  const loadJanus = async () => {
    const Janus = (await import("janus-gateway")).default;
    Janus.init({
      debug: "all",
      dependencies: Janus.useDefaultDependencies({ adapter: adapter }),
      callback: function () {
        const janus = new Janus({
          server: process.env.NEXT_PUBLIC_JANUS_HOST ?? "ws://localhost:8188",
          success: function () {},
        });
        setJanus(janus);
      },
    });
  };

  const attachPlugin = (janus: any) => {
    janus.attach({
      plugin: "janus.plugin.audiobridge",
      success: function (pluginHandle: any) {
        setPluginHandle(pluginHandle);
        setAttached(true);
      },
      error: function (error: any) {
        console.log(error);
      },
      onremotetrack: function (track: MediaStreamTrack, on: any) {
        if (track.kind === "audio") {
          audioRef.current!.srcObject = new MediaStream([track.clone()]);
        }
      },
      consentDialog: function (on: any) {
        console.log(on);
      },
      mediaState: function (medium: any, on: any) {
        console.log(medium, on);
      },
      webrtcState: function (on: any) {
        console.log(on);
      },
      onmessage: function (msg: any, jsep: any) {
        setAnswer(jsep);
      },
      oncleanup: function () {
        console.log("oncleanup");
      },
    });
  };

  const leaveRoom = () => {
    if(pluginHandle==null) return;

    pluginHandle.send({
      message: {
        request: "leave",
      },
      success: function (data: any) {
        console.log("LEAVE RESPONSE", data);
        pluginHandle.detach();
        audioRef.current!.srcObject = null;
        setPluginHandle(null);
        setAttached(false);
        setJoined(false);
        setAnswer(null);
      },
      error: function (error: any) {
        console.log(error);
      },
    });
  };

  const joinRoom = () => {
    if(pluginHandle==null) return;
    pluginHandle.send({
      message: {
        request: "join",
        room,
        display,
        muted,
      },
      success: function (data: any) {
        console.log("JOIN RESPONSE", data);
      },
      error: function (error: any) {
        console.log(error);
      },
    });
  };

  const createOffer = () => {
    if(pluginHandle==null) return;
    pluginHandle.createOffer({ 
      tracks: [
        { type: "audio", capture: isSpeaker, recv: true },
        { type: "video", capture: false, recv: false },
      ],
      success: function (jsep: any) {
        pluginHandle.send({
          message: {
            request: "configure",
            muted: false,
            record: false,
          },
          jsep: jsep,
        });
      },
    });
  };

  const createAnswer = (pluginHandle: any, answerJsep: any) => {
    pluginHandle.createAnswer({
      jsep: answerJsep,
      tracks: [{ type: "data" }],
      success: function (ourjsep: any) {
        var body = { request: "start" };
        pluginHandle.send({ message: body, jsep: ourjsep });
      },
    });
  };

  const joinAuction = (speaker=false) => {
    setIsSpeaker(speaker);
    if (!janus) return;
    attachPlugin(janus);
    joinRoom();
  };

  const leaveAuction = () => {
    if (!janus) return;
    leaveRoom();
  };

  return {
    joinAuction,
    leaveAuction,
    attached
  };
}
