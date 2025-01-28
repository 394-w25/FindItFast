import React, { useState, useEffect } from 'react';
import './MessagesPage.css';
import { database } from '../utilities/firebase';
import { ref, push, onValue, update, get } from 'firebase/database';
import { Button, Form, ListGroup, Container, Row, Col, Card } from 'react-bootstrap';
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
    const [items, setItems] = useState([]); // Store the found items in the conversation
    const [claimedItems, setClaimedItems] = useState({}); // Store claimed item statuses

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
        if (conversationId) {
            const messagesRef = ref(database, `messages/${conversationId}`);
            onValue(messagesRef, (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    setMessages(Object.values(data.messages || {})); // Fetch only messages
                    setClaimedItems(data.claimedItems || {}); // Fetch claimed items
                    setConversationExists(true);
                    
                    // Fetch items associated with this conversation
                    if (data.itemIds) {
                        fetchItems(data.itemIds);
                    }
                } else {
                    setMessages([]);
                    setConversationExists(false);
                }
            });
        }
    }, [conversationId]);

    // Fetch item details from 'foundItems' using item IDs stored in the conversation
    const fetchItems = async (itemIds) => {
        const fetchedItems = [];
        for (const itemId of itemIds) {
            const itemRef = ref(database, `foundItems/${itemId}`);
            const snapshot = await get(itemRef);
            if (snapshot.exists()) {
                fetchedItems.push({ id: itemId, ...snapshot.val() });
            }
        }
        setItems(fetchedItems);
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !conversationId) return;

        const [id1, id2] = conversationId.split('_');
        const receiverId = id1 === user.uid ? id2 : id1;

        const messagesRef = ref(database, `messages/${conversationId}/messages`);
        const message = {
            senderId: user.uid,
            receiverId,
            content: newMessage,
            timestamp: new Date().toISOString(),
        };
        await push(messagesRef, message);
        setNewMessage('');
    };

    // Function to mark an item as claimed
    const markAsClaimed = async (itemId, posterId) => {
        if (posterId !== user.uid) {
            alert("Only the person who posted this item can mark it as claimed.");
            return;
        }

        try {
            const conversationRef = ref(database, `messages/${conversationId}`);
            const itemRef = ref(database, `foundItems/${itemId}`);

            // Update claimedItems in the conversation
            await update(conversationRef, {
                [`claimedItems/${itemId}`]: {
                    claimedBy: user.uid,
                    claimedAt: new Date().toISOString()
                }
            });

            // Update the found item itself to reflect it’s claimed
            await update(itemRef, {
                isClaimed: true,
                claimedBy: user.uid,
                claimedAt: new Date().toISOString()
            });

            // Update local state
            setClaimedItems((prev) => ({
                ...prev,
                [itemId]: { claimedBy: user.uid, claimedAt: new Date().toISOString() }
            }));

            alert("Item successfully marked as claimed!");
        } catch (error) {
            console.error("Error marking item as claimed:", error);
        }
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
                                : 'Unknown';

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
                <h3>Items in This Conversation</h3>
                {items.length > 0 ? (
                    items.map((item) => (
                        <Card key={item.id} className="mb-3">
                            <Card.Body>
                                <Card.Title>{item.title}</Card.Title>
                                <Card.Text>{item.description}</Card.Text>
                                {claimedItems[item.id] ? (
                                    <Button variant="success" disabled>
                                        Claimed by {users[claimedItems[item.id].claimedBy]?.displayName || "Unknown"}
                                    </Button>
                                ) : (
                                    user.uid === item.postedBy && (
                                        <Button variant="primary" onClick={() => markAsClaimed(item.id, item.postedBy)}>
                                            Mark as Claimed
                                        </Button>
                                    )
                                )}
                            </Card.Body>
                        </Card>
                    ))
                ) : (
                    <p>No items linked to this conversation.</p>
                )}

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
            </Container>
        );
    };

    return <div>{renderView()}</div>;
};

export default MessagingApp;
