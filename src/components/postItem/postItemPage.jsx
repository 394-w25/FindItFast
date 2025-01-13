import React, { useState } from 'react';
import { db, storage } from "../../firebase";
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './PostItemPage.css';

const PostItemPage = () => {
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false); // New success message state

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
            const imageRef = ref(storage, `images/${Date.now()}_${image.name}`);
            await uploadBytes(imageRef, image);
            const imageUrl = await getDownloadURL(imageRef);

            await addDoc(collection(db, 'items'), {
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
            <h2>Post a Lost Item</h2>
            <form onSubmit={handleSubmit}>
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
                    {loading ? "Posting..." : "Post Item"}
                </button>
            </form>

            {success && <p className="success-message">Item successfully posted!</p>}
        </div>
    );
};

export default PostItemPage;
