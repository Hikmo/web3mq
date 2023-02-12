import React, { useEffect, useMemo, useState } from "react";
import { Client, KeyPairsType, WalletType } from "@web3mq/client";
import { AppTypeEnum, LoginModal } from "@web3mq/react-components";
import "@web3mq/react-components/dist/css/index.css";

const to = "0xf7cd8Bd5D38251D38F7105341b89F87Fc2256330";

// Root components
const App: React.FC = () => {
    const hasKeys = useMemo(() => {
        const PrivateKey = localStorage.getItem("PRIVATE_KEY") || "";
        const PublicKey = localStorage.getItem("PUBLIC_KEY") || "";
        const userid = localStorage.getItem("userid") || "";
        if (PrivateKey && PublicKey && userid) {
            return { PrivateKey, PublicKey, userid };
        }
        return null;
    }, []);
    const [keys, setKeys] = useState<KeyPairsType | null>(hasKeys);
    const [fastestUrl, setFastUrl] = useState<string | null>(null);
    const [groupMsg, setGroupMsg] = useState("");
    const [groupChatMsgList, setGroupChatMsgList] = useState([]);
    const [chatRoomName, setChatRoomName] = useState("");

    const init = async () => {
        const tempPubkey = localStorage.getItem("PUBLIC_KEY") || "";
        const didKey = localStorage.getItem("DID_KEY") || "";
        const fastUrl = await Client.init({
            connectUrl: localStorage.getItem("FAST_URL"),
            app_key: "vAUJTFXbBZRkEDRE",
            env: "dev",
            didKey,
            tempPubkey,
        });
        localStorage.setItem("FAST_URL", fastUrl);
        setFastUrl(fastUrl);
    };
    const handleLoginEvent = (eventData: any) => {
        if (eventData.data) {
            if (eventData.type === "login") {
                const {
                    privateKey,
                    publicKey,
                    tempPrivateKey,
                    tempPublicKey,
                    didKey,
                    userid,
                    address,
                    pubkeyExpiredTimestamp,
                } = eventData.data;
                localStorage.setItem("userid", userid);
                localStorage.setItem("PRIVATE_KEY", tempPrivateKey);
                localStorage.setItem("PUBLIC_KEY", tempPublicKey);
                localStorage.setItem("WALLET_ADDRESS", address);
                localStorage.setItem(`MAIN_PRIVATE_KEY`, privateKey);
                localStorage.setItem(`MAIN_PUBLIC_KEY`, publicKey);
                localStorage.setItem(`DID_KEY`, didKey);
                localStorage.setItem(
                    "PUBKEY_EXPIRED_TIMESTAMP",
                    String(pubkeyExpiredTimestamp)
                );
                setKeys({
                    PrivateKey: tempPrivateKey,
                    PublicKey: tempPublicKey,
                    userid,
                });
            }
            if (eventData.type === "register") {
                const { privateKey, publicKey, address } = eventData.data;
                localStorage.setItem("WALLET_ADDRESS", address);
                localStorage.setItem(`MAIN_PRIVATE_KEY`, privateKey);
                localStorage.setItem(`MAIN_PUBLIC_KEY`, publicKey);
            }
        }
    };

    useEffect(() => {
        init();
        document
            .getElementsByTagName("body")[0]
            .setAttribute("data-theme", "light");
    }, []);

    const client = useMemo(() => {
        if (keys && fastestUrl) {
            return Client.getInstance(keys);
        }
        return null;
    }, [fastestUrl, keys]);

    useEffect(() => {
        if (client) {
            // Set all the event listeners
            client.on("channel.activeChange", handleEvent);
            client.on("channel.created", handleEvent);
            client.on("message.delivered", handleEvent);
            client.on("channel.getList", handleEvent);
            client.on("channel.updated", handleEvent);
            client.on("message.send", (evt: any) => {
                handleEvent(evt);
                console.log("Message sent");
            });
            client.on("message.delivered", (evt: any) => {
                handleEvent(evt);
                console.log("Message delivered");
            });
            client.on("notification.messageNew", (evt: any) => {
                handleEvent(evt);
                console.log("New Message");
            });
            client.on("notification.getList", (evt: any) => {
                handleEvent(evt);
                console.log("get list notification");
            });
        }
    }, [client]);

    if (!keys) {
        let mainKeys = null;
        const mainPrivateKey = localStorage.getItem(`MAIN_PRIVATE_KEY`);
        const mainPublicKey = localStorage.getItem(`MAIN_PUBLIC_KEY`);
        const address = localStorage.getItem("WALLET_ADDRESS");
        if (mainPublicKey && mainPrivateKey && address) {
            mainKeys = {
                publicKey: mainPublicKey,
                privateKey: mainPrivateKey,
                walletAddress: address,
            };
        }
        return (
            <LoginModal
                keys={mainKeys || undefined}
                handleLoginEvent={handleLoginEvent}
                appType={AppTypeEnum.pc}
                containerId={""}
                loginBtnNode={<button className="sign_btn">MetaMask</button>}
            />
        );
    }

    if (!fastestUrl) {
        return null;
    }
    const handleEvent = (event: any) => {
        console.log(event, "event");
    };

    const createRoom = async () => {
        if (client) {
            await client.channel.createRoom({
                groupName: chatRoomName || "default room",
            });
            await client.channel.queryChannels({
                page: 1,
                size: 20,
            });
            if (client.channel.channelList) {
                await client.channel.setActiveChannel(
                    client.channel.channelList[0]
                );
            }
        }
    };

    const sendMsg = async () => {
        if (client) {
            if (!groupMsg) {
                alert("message required");
            }
            console.log("here");
            await client.message.sendMessage(groupMsg);
        }
    };

    const sendDm = async () => {
        if (client) {
            console.log(keys);
            console.log(client);

            const msg = "SAMPLE MESSAGE";
            await client.message.sendMessage(msg, to);
        } else {
            alert("Client null");
        }
    };

    const inviteFriendToCurrentChannel = async () => {
        if (client) {
            console.log(client.channel.channelList);
			await client.channel.setActiveChannel(client.channel.channelList![0])
            const userId = "654184fec2edae4882419fe2f8ee8514753c6fedbb0e3909c8ffc2bf";
            const ids = [userId];
            await client.channel.inviteGroupMember(ids);
        }
    };

    const queryChannels = async () => {
        if (client) {
            await client.channel.queryChannels({
                page: 1,
                size: 20,
            });
        }
    };

    return (
        <div>
            <div>
                <h1>chat</h1>
                <div>
                    Chat room name :
                    <input
                        type="text"
                        value={chatRoomName}
                        onChange={(e) => setChatRoomName(e.target.value)}
                    />
                </div>
                <button onClick={createRoom}>createRoom</button>
                <div>
                    msg :
                    <input
                        type="text"
                        value={groupMsg}
                        onChange={(e) => setGroupMsg(e.target.value)}
                    />
                </div>
                <button onClick={sendMsg}>send</button>
                <div>
                    <ul>
                        {groupChatMsgList.map((item: any, index) => {
                            return <li>{item.content}</li>;
                        })}
                    </ul>
                </div>
                <div>
                    <button onClick={sendDm}>Send Message</button>
                    <button onClick={inviteFriendToCurrentChannel}>
                        Invite friend to current channel
                    </button>
					<button onClick={queryChannels}>Query Channels</button>
                </div>
            </div>
        </div>
    );
};

export default App;
