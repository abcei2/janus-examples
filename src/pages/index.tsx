
import { useRouter } from "next/router";
import SimpleAudioBroadcastClient from "@/components/SimpleAudioBroadcastClient";

const page = () => {
  const router = useRouter();
  const {sender} = router.query;
  return (
    <SimpleAudioBroadcastClient
      room="1234"
      server="ws://localhost:8188"
      token="1234"
      sender={sender as string}
    />
  );
};

export default page;

