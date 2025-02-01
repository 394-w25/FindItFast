import React, { useState, useEffect } from 'react';
import './MessagesPage.css';
import { database } from '../utilities/firebase';
import { ref, push, onValue, update, get } from 'firebase/database';
import { Button, Form, ListGroup, Container, Row, Col, Card } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { Toast, ToastContainer } from 'react-bootstrap';



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
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

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
        if (!user || !user.uid) return; // Ensure user is defined

        const conversationsRef = ref(database, 'messages');
        onValue(conversationsRef, (snapshot) => {
            const data = snapshot.val();

            if (data) {
                const userConversations = Object.entries(data).filter(([id, conversation]) =>
                    conversation.messages && Object.values(conversation.messages).some(
                        (msg) => msg.senderId === user.uid || msg.receiverIds?.includes(user.uid)
                    )
                );

                setConversations(userConversations);
            } else {
                setConversations([]);
            }
        });
    }, [user]); // Make sure to include `user` in dependencies


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

        let id1, id2, id3, senderId, receiverId, posterId, claimerId = null;

        const disputeRef = ref(database, `messages/${conversationId}/isDispute`);
        const disputeSnapshot = await get(disputeRef);
        if (disputeSnapshot.exists() && disputeSnapshot.val()) {
            // In the case of a dispute, split the conversationId into 3 parts
            [id1, id2, id3] = conversationId.split('_');
            // Role assignments for dispute context:
            senderId = (id1 === user.uid) ? id1 : (id2 === user.uid) ? id2 : id3;
        } else {
            // No dispute, split the conversationId into 2 parts
            [id1, id2] = conversationId.split('_');
            // Role assignments for non-dispute context:
            receiverId = id1 === user.uid ? id2 : id1;
            senderId = id1 === user.uid ? id1 : id2;
        }
        const messagesRef = ref(database, `messages/${conversationId}/messages`);
        const message = {
            senderId: senderId,
            receiverIds: disputeSnapshot.val() ? [id1, id2, id3].filter(id => id !== user.uid) : [receiverId],
            content: newMessage,
            timestamp: new Date().toISOString(),
        };
        await push(messagesRef, message);
        setNewMessage('');
    };


    // Function to mark an item as claimed
    const markAsClaimed = async (itemId) => {
        if (!conversationId) {
            console.error("No conversation ID found.");
            return;
        }

        try {
            let id1, id2, id3, claimerId;

            const disputeRef = ref(database, `messages/${conversationId}/isDispute`);
            const disputeSnapshot = await get(disputeRef);
            if (disputeSnapshot.exists() && disputeSnapshot.val()) {
                // In the case of a dispute, split the conversationId into 3 parts
                [id1, id2, id3] = conversationId.split('_');
                // Role assignments for dispute context:

                // senderId = (id1 === user.uid) ? id1 : (id2 === user.uid) ? id2 : id3;
                // posterId = (id1 === item.postedBy) ? id1 : (id2 === item.postedBy) ? id2 : id3;
                claimerId = (id1 === user.uid) ? id1 : (id2 === user.uid) ? id2 : id3;
            } else {
                // No dispute, split the conversationId into 2 parts
                [id1, id2] = conversationId.split('_');
                // Role assignments for non-dispute context:
                // receiverId = id1 !== user.uid ? id1 : id2;
                claimerId = id1 === user.uid ? id2 : id1;
            }

            if (!claimerId) {
                console.error("Could not determine claimer.");
                return;
            }

            console.log(`Marking item ${itemId} as claimed by ${claimerId}`);

            const conversationRef = ref(database, `messages/${conversationId}`);
            const itemRef = ref(database, `foundItems/${itemId}`);
            const claimerUserRef = ref(database, `users/${claimerId}/claimedItems`);

            // Update claimedItems in the conversation
            await update(conversationRef, {
                [`claimedItems/${itemId}`]: {
                    claimedBy: claimerId,
                    claimedAt: new Date().toISOString()
                }
            });

            // Update the found item itself to reflect it’s claimed
            await update(itemRef, {
                isClaimed: true,
                claimedBy: claimerId,
                claimedAt: new Date().toISOString()
            });

            // Add the item ID to the claimer's claimedItems list
            const claimerSnapshot = await get(claimerUserRef);
            const currentClaimedItems = claimerSnapshot.exists() ? claimerSnapshot.val() : [];
            await update(claimerUserRef, [...currentClaimedItems, itemId]);

            // Update local state
            setClaimedItems((prev) => ({
                ...prev,
                [itemId]: { claimedBy: claimerId, claimedAt: new Date().toISOString() }
            }));

            // ✅ Set toast message and show toast
            setToastMessage("✅ Item successfully marked as claimed!");
            setShowToast(true);

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
                <Container className="messages-page">
                    <h2>Your Conversations</h2>
                    <ListGroup>
                        {conversations.map(([id, conversation]) => {
                            const messageList = conversation.messages ? Object.values(conversation.messages) : [];
                            const lastMessage = messageList.length > 0 ? messageList[messageList.length - 1] : null;

                            let otherParticipants = [];

                            if (lastMessage) {
                                otherParticipants = lastMessage.receiverIds.filter(id => id !== user.uid)
                            }
                            console.log('otherParticipants:', otherParticipants);
                            console.log('lastMessage:', lastMessage);
                            console.log('conversation:', conversation);

                            return (
                                <ListGroup.Item key={id} action onClick={() => navigate(`/messages/${id}`)}>
                                    <Row>
                                        <Col>
                                            <div style={{ fontWeight: 'bold' }}>{otherParticipants
                                                .map(participantId => users.find(user => user.uid === participantId)?.displayName || "Unknown User")
                                                .join(', ')}</div>
                                            <small>Last Message: {lastMessage?.content || "No messages yet"}</small>
                                        </Col>
                                    </Row>
                                </ListGroup.Item>
                            );
                        })}
                    </ListGroup>


                    <Button variant="secondary" className="mt-3" onClick={() => navigate('/')}>
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
                                    (() => {
                                        const claimedById = claimedItems[item.id]?.claimedBy;
                                        const claimedByUser = users.find((u) => u.uid === claimedById);

                                        return (
                                            <Button variant="success" disabled>
                                                Claimed by {claimedByUser ? claimedByUser.displayName : "Unknown"}
                                            </Button>
                                        );
                                    })()
                                ) : (
                                    (() => {
                                        // Determine if the conversation is a dispute
                                        const isDispute = conversationId.split('_').length === 3;
                                        let id1, id2, id3, senderId, receiverId, posterId, claimerId = null;
                                        
                                        console.log(item);
                                        if (isDispute) {
                                            const [id1, id2, id3] = conversationId.split('_');
                                            // In a dispute, determine poster and claimer correctly
                                            senderId = (id1 === user.uid) ? id1 : (id2 === user.uid) ? id2 : id3;
                                            posterId = (id1 === item.postedBy) ? id1 : (id2 === item.postedBy) ? id2 : id3;
                                            claimerId = (id1 === item.claimedBy) ? id1 : (id2 === item.claimedBy) ? id2 : id3;
                                        } else {
                                            const [id1, id2] = conversationId.split('_');

                                            // In a regular conversation, determine receiver correctly
                                            receiverId = id1 === user.uid ? id2 : id1;
                                            posterId = id1 === item.postedBy ? id1 : id2;
                                        }

                                        // Allow only the poster to mark as claimed
                                        return user.uid === posterId ? (
                                            <Button
                                                variant="primary"
                                                onClick={() => markAsClaimed(item.id)}
                                            >
                                                Mark as Claimed
                                            </Button>
                                        ) : null;
                                    })()
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

                {/* Message Input Form */}
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

                {/* Toast Notification */}
                <ToastContainer position="top-end" className="p-3">
                    <Toast
                        onClose={() => setShowToast(false)}
                        show={showToast}
                        delay={3000}
                        autohide
                        bg="success"
                    >
                        <Toast.Body>{toastMessage}</Toast.Body>
                    </Toast>
                </ToastContainer>

                {/* Back to Conversations Button */}
                <Button variant="secondary" className="mt-3" onClick={() => navigate('/messages')}>
                    Back to Conversations
                </Button>
            </Container>
        );
    };


    return <div>{renderView()}</div>;
};


export default MessagingApp;



