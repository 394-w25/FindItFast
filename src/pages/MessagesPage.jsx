import React, { useState, useEffect, useRef } from 'react';
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
   const messagesEndRef = useRef(null);



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
                    (msg) => msg.senderId === user.uid || msg.receiverId === user.uid
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

   useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
}, [messages]); // Runs every time messages update


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
   const markAsClaimed = async (itemId) => {
    if (!conversationId) {
        console.error("No conversation ID found.");
        return;
    }

    try {
        // Determine the other participant in the conversation
        const [id1, id2] = conversationId.split('_');
        const claimerId = id1 === user.uid ? id2 : id1; // The other participant

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
               <Container>
                   <h2>Your Conversations</h2>
                   <ListGroup>
    {conversations.map(([id, conversation]) => {
        // Extract messages correctly
        const messageList = conversation.messages ? Object.values(conversation.messages) : [];
        const lastMessage = messageList.length > 0 ? messageList[messageList.length - 1] : null;


        // Ensure `otherParticipantId` is computed correctly
        let otherParticipantId = null;
        if (lastMessage) {
            if (lastMessage.receiverId === user.uid) {
                otherParticipantId = lastMessage.senderId;
            } else if (lastMessage.senderId === user.uid) {
                otherParticipantId = lastMessage.receiverId;
            }
        }


        // Ensure we correctly find the other participant
        const otherParticipant = users.find((u) => u.uid === otherParticipantId);
        const otherDisplayName = otherParticipant ? otherParticipant.displayName : "Unknown";


        return (
            <ListGroup.Item key={id} action onClick={() => navigate(`/messages/${id}`)}>
                <Row>
                    <Col>
                        Conversation with {otherDisplayName}
                        <br />
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
            
            {/* Items Section - Limited Height */}
            <div className="items-container">
    <div className="items-header">Items in This Conversation</div>
    {items.length > 0 ? (
        items.map((item) => (
            <div key={item.id} className="item-card">
                <div className="item-title">{item.title}</div>
                <div className="item-description">{item.description}</div>
                {claimedItems[item.id] ? (
                    (() => {
                        const claimedById = claimedItems[item.id]?.claimedBy;
                        const claimedByUser = users.find((u) => u.uid === claimedById);
                        return (
                            <button className="item-button" disabled>
                                Claimed by {claimedByUser ? claimedByUser.displayName : "Unknown"}
                            </button>
                        );
                    })()
                ) : (
                    user.uid === item.postedBy && (
                        <button className="item-button" onClick={() => markAsClaimed(item.id)}>
                            Mark as Claimed
                        </button>
                    )
                )}
            </div>
        ))
    ) : (
        <p className="items-header">No items linked to this conversation.</p>
    )}
</div>


            {/* Messages and Chat Input */}
            <div className="messages-container">
    <div className="messages-list">
        {messages.length > 0 ? (
            messages.map((msg, index) => (
                <div key={index} className={`message ${msg.senderId === user.uid ? 'sent' : 'received'}`}>
                    <p>{msg.content}</p>
                    <small>{new Date(msg.timestamp).toLocaleString()}</small>
                </div>
            ))
        ) : (
            <p className="no-messages">
                {conversationExists ? 'No messages in this conversation yet.' : 'Start a new conversation by sending a message.'}
            </p>
        )}
        {/* Invisible div to auto-scroll */}
        <div ref={messagesEndRef} />
        {/* Spacer to prevent messages from being hidden behind input */}
        <div className="message-spacing"></div>
    </div>

    {/* Sticky Input Box */}
    <Form className="message-input" onSubmit={(e) => {
        e.preventDefault();
        sendMessage();
    }}>
        <Row className="w-100">
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
</div>

    
            {/* Toast Notification */}
            <ToastContainer position="top-end" className="p-3">
                <Toast onClose={() => setShowToast(false)} show={showToast} delay={3000} autohide bg="success">
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



