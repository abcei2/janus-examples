import useAudioBridgePlugin from "@/hooks/useAudioBridgePlugin";
import { useRef } from "react";

const SimpleAudioBroadcastClient = (props: any) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const { leaveAuction, joinAuction, attached } = useAudioBridgePlugin({
    audioRef,
    speaker: props.sender == "offer",
  });
  console.log(attached);
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-400 gap-2">
      <audio ref={audioRef} controls></audio>
      {!attached ? (
        <div className="flex gap-2">
          <button className="p-1 rounded bg-gray-800 text-white"
          onClick={() => joinAuction(true)}>Join as speaker</button>
          <button className="p-1 rounded bg-gray-800 text-white"
          onClick={() => joinAuction(false)}>Join as listener</button>
        </div>
      ) : (        
        <button className="p-1 rounded bg-gray-800 text-white" onClick={leaveAuction}>Leave</button>
      )}
    </div>
  );
};

export default SimpleAudioBroadcastClient;
