import React, { useState, useEffect } from 'react';
import './MessagesPage.css';
import { database } from '../utilities/firebase';
import { ref, push, onValue } from 'firebase/database';
import { Button, Form, ListGroup, Container, Row, Col } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';

const MessagingApp = ({ user }) => {
    const { conversationId } = useParams();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [conversationExists, setConversationExists] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const usersRef = ref(database, 'users');
        onValue(usersRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setUsers(Object.entries(data).map(([uid, userInfo]) => ({ uid, ...userInfo })));
            }
            setLoading(false);
        });
    }, []);

    useEffect(() => {
        const conversationsRef = ref(database, 'messages');
        onValue(conversationsRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                const userConversations = Object.entries(data).filter(([id, messages]) =>
                    Object.values(messages).some(
                        (msg) => msg.senderId === user.uid || msg.receiverId === user.uid
                    )
                );
                setConversations(userConversations);
            }
        });
    }, [user.uid]);

    useEffect(() => {
        if (conversationId) {
            const messagesRef = ref(database, `messages/${conversationId}`);
            onValue(messagesRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setMessages(Object.values(data));
                    setConversationExists(true);
                } else {
                    setMessages([]);
                    setConversationExists(false);
                }
            });
        }
    }, [conversationId]);

    const sendMessage = async () => {
      if (!newMessage.trim() || !conversationId) return;
  
      // Extract the other participant's ID from the conversationId
      const [id1, id2] = conversationId.split('_');
      const receiverId = id1 === user.uid ? id2 : id1;
  
      const messagesRef = ref(database, `messages/${conversationId}`);
      const message = {
          senderId: user.uid,
          receiverId, // Add the receiverId
          content: newMessage,
          timestamp: new Date().toISOString(),
      };
      await push(messagesRef, message);
      setNewMessage('');
  };
  

    const renderView = () => {
        if (loading) {
            return <p>Loading...</p>;
        }

        if (!conversationId) {
      
          return (
              <Container>
                  <h2>Your Conversations</h2>
                  <ListGroup>
                      {conversations.map(([id, messages]) => {
                          const lastMessage = Object.values(messages || {}).pop() || {};
      
                          const otherParticipantId =
                              lastMessage?.receiverId === user.uid
                                  ? lastMessage.senderId
                                  : lastMessage?.receiverId;
      
                          const otherParticipant = users.find((u) => u.uid === otherParticipantId);
      
                          const otherDisplayName = otherParticipant
                              ? otherParticipant.displayName
                              : users.length
                              ? 'Unknown'
                              : 'Loading...';
      
                          return (
                              <ListGroup.Item
                                  key={id}
                                  action
                                  onClick={() => navigate(`/messages/${id}`)}
                              >
                                  <Row>
                                      <Col>
                                          Conversation with {otherDisplayName}
                                          <br />
                                          <small>Last Message: {lastMessage.content || 'No messages yet'}</small>
                                      </Col>
                                  </Row>
                              </ListGroup.Item>
                          );
                      })}
                  </ListGroup>
                  <Button variant="secondary" className="mt-3" onClick={() => navigate('/found')}>
                      Start New Conversation
                  </Button>
              </Container>
          );
      }
      
      

        return (
            <Container className="messages-page">
                <div className="messages-list">
                    {messages.length > 0 ? (
                        messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`message ${msg.senderId === user.uid ? 'sent' : 'received'}`}
                            >
                                <p>{msg.content}</p>
                                <small>{new Date(msg.timestamp).toLocaleString()}</small>
                            </div>
                        ))
                    ) : (
                        <p className="no-messages">
                            {conversationExists
                                ? 'No messages in this conversation yet.'
                                : 'Start a new conversation by sending a message.'}
                        </p>
                    )}
                </div>
                <Form
                    className="message-input mt-3"
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                    }}
                >
                    <Row>
                        <Col>
                            <Form.Control
                                type="text"
                                placeholder="Type your message"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                        </Col>
                        <Col xs="auto">
                            <Button type="submit" variant="primary">
                                Send
                            </Button>
                        </Col>
                    </Row>
                </Form>
                <Button variant="secondary" className="mt-3" onClick={() => navigate('/messages')}>
                    Back to Conversations
                </Button>
            </Container>
        );
    };

    return <div>{renderView()}</div>;
};

export default MessagingApp;
