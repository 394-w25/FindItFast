import React, { useState } from 'react';
import { db, storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './PostItemPage.css';

const PostItemPage = () => {
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [itemType, setItemType] = useState('lost'); // Added state for item type

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (loading) return; 
    
        if (!image || !description.trim()) {
            alert('Please provide both an image and a description.');
            return;
        }
    
        setLoading(true); 
        setSuccess(false);
    
        try {
            // Upload image to Firebase Storage
            const imageRef = ref(storage, `images/${Date.now()}_${image.name}`);
            await uploadBytes(imageRef, image);
            const imageUrl = await getDownloadURL(imageRef);
    
            // Determine collection based on item type
            const collectionName = itemType === 'lost' ? 'lostItems' : 'foundItems';
    
            // ✅ Console logs to verify the collection and data
            console.log("Saving to collection:", collectionName);
            console.log("Data being uploaded:", {
                description,
                imageUrl,
                timestamp: new Date().toISOString()
            });
    
            // Save to Firestore
            await addDoc(collection(db, collectionName), {
                description,
                imageUrl,
                timestamp: serverTimestamp()
            });
    
            setSuccess(true);
            setDescription('');
            setImage(null);
        } catch (error) {
            console.error('Error posting item:', error);
            alert('Failed to post item. Please try again.');
        } finally {
            setLoading(false);
        }
    };
    

    return (
        <div className="post-item-page">
            <h2>Post a Lost/Found Item</h2>
            <form onSubmit={handleSubmit}>
                {/* New Dropdown for Selecting Lost or Found */}
                <label>Item Type:</label>
                <select 
                    value={itemType} 
                    onChange={(e) => setItemType(e.target.value)}
                >
                    <option value="lost">Lost Item</option>
                    <option value="found">Found Item</option>
                </select>

                <input
                    type="text"
                    placeholder="Enter item description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />

                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                />
                
                <button type="submit" disabled={loading}>
                    {loading ? "Posting..." : `Post ${itemType === 'lost' ? "Lost" : "Found"} Item`}
                </button>
            </form>

            {success && <p className="success-message">Item successfully posted!</p>}
        </div>
    );
};

export default PostItemPage;
