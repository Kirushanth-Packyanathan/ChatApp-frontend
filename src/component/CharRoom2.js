import React, { useState } from "react";
import { over } from "stompjs";
import SockJS from "sockjs-client";

const ChatRoom = () => {
  const [userData, setUserData] = useState({
    username: "",
    receivername: "",
    connected: false,
    message: "",
  });

  const [publicChats, setPublicChats] = useState([]);
  const [tab, setTab] = useState("CHATROOM");
  const [privateChats, setPrivateChats] = useState(new Map()); //using map data structures key:username value:message

  const registerUser = () => {
    let Sock = new SockJS("http://localhost:8080/ws"); //create a new connection to the a websocket located at above link
    stompClient = over(Sock); //using the STOMP protocol "stompClient" over the websocket connection established above
    stompClient.connect({}, onConnected, onError); //connect to STOMP protocol if successfull call onConnected else call onError
  };

  const onConnected = () => {
    setUserData({ ...userData, connected: true });
    stompClient.subscribe("/chatroom/public", onPublicMessageReceived); //subscribing stomp client to the destination "/chatroom/public" if message is received in this end point then function onPublicMessageReceived will be called
    stompClient.subscribe(
      "/user/" + userData.username + "/private",
      onPrivateMessageReceived
    ); //subscribing stomp client to the destination "/user/" + userData.username + "/private" if message is received in this end point then function onPrivateMessageReceived will be called
  };

  const onPublicMessageReceived = (payload) => {
    //takes one parameter, payload, which represents the message received from the server
    let payloadData = JSON.parse(payload.body); //parses the message body assuming it contains JSON-formatted data. It converts the JSON string into a JavaScript object.
    switch (payloadData.status) {
      case "JOIN":
        if (!privateChats.get(payloadData.senderName)) {
          //This condition checks if there is not an existing chat history for the sender.
          privateChats.set(payload.senderName, []); //creates a new entry in the privateChats map, where the key is the sender's name and the value is the list array containing the received message.
          setPrivateChats(new Map(privateChats));
        }
        break;
      case "MESSAGE":
        publicChats.push(payloadData); //it adds the received message data "payloadData" to "publicChats"
        setPublicChats([...publicChats]); //This presumably triggers a re-render in the UI to display the new message in the public chat.
        break;
    }
  };

  const onPrivateMessageReceived = (payload) => {
    let payloadData = JSON.parse(payload.body); //parses the message body assuming it contains JSON-formatted data. It converts the JSON string into a JavaScript object.
    if (privateChats.get(payloadData.senderName)) {
      //This condition checks if there is an existing chat history for the sender.
      privateChats.get(payload.senderName).push(payloadData); // pushes the received message (payloadData) into the existing chat history array.
      setPrivateChats(new Map(privateChats)); //updates the privateChats state variable with the updated chat history.
    } else {
      let list = []; //This array will store the chat messages for the sender.
      list.push(payloadData); //It pushes the received message (payloadData) into the list array.
      privateChats.set(payload.senderName, list); //creates a new entry in the privateChats map, where the key is the sender's name and the value is the list array containing the received message.
      setPrivateChats(new Map(privateChats)); //updates the privateChats state variable with the updated map
    }
  };

  const handleUserName = (event) => {
    const { value } = event.target; //set the target of the event and retrieve the value in the field
    setUserData({ ...userData, username: value }); //keep userdata as it is and update only username as value in the field
  };

  return (
    <div className="container">
      {userData.connected ? (
        <div className="chat-box">
          <div className="member-list">
            <ul>
              <li
                onClick={() => {
                  setTab("CHATROOM");
                }}
                className={`member ${tab === "CHATROOM" && "active"}`}
                //This expression combines the string "member" with the result of the conditional expression. If tab is "CHATROOM", the result will be "member active", and if tab is anything else, the result will be just "member".
              >
                Chatroom
              </li>
              {[...privateChats.keys()].map((name, index) => (
                <li
                  onClick={() => {
                    setTab("CHATROOM");
                  }}
                  className={`member ${tab === name && "active"}`}
                  key={index}
                >
                  {name}
                </li> // generates a list of sender names from the privateChats map, with each name rendered as a list item.
              ))}
            </ul>
          </div>
          {tab === "CHATROOM" && (
            <div className="chat-content">
              <ul className="chat-messages">
                {[...privateChats.get(tab)].map((chat, index) => (
                  <li className="message" key={index}>
                    {chat.senderName !== userData.username && (
                      <div className="avatar">{chat.senderName}</div>
                    )}
                    <div className="message-data">{chat.message}</div>
                    {chat.senderName === userData.username && (
                      <div className="avatar-selg">{chat.senderName}</div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab !== "CHATROOM" && (
            <div className="chat-content">
              {publicChats.map((chat, index) => (
                <li className="message" key={index}>
                  {chat.senderName !== userData.username && (
                    <div className="avatar">{chat.senderName}</div>
                  )}
                  <div className="message-data">{chat.message}</div>
                  {chat.senderName === userData.username && (
                    <div className="avatar-selg">{chat.senderName}</div>
                  )}
                </li>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="register">
          <input
            id="user-name"
            placeholder="Enter user name"
            value={userData.username}
            onChange={handleUserName}
          />
          <button type="button" onClick={registerUser}>
            connect
          </button>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
