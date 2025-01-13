import React, { useState } from 'react';
import { database as db, storage } from '../utilities/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './PostItemPage.css'; // Import CSS here

const PostItemPage = () => {
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);  // Added for better UX feedback

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Prevent double submission
        if (loading) return;

        if (!image || !description.trim()) {
            alert('Please provide both an image and description.');
            return;
        }

        setLoading(true);  // Show loading state while submitting

        try {
            // Upload image to Firebase Storage
            const imageRef = ref(storage, `images/${Date.now()}_${image.name}`);
            await uploadBytes(imageRef, image);
            const imageUrl = await getDownloadURL(imageRef);

            // Store data in Firestore
            await addDoc(collection(db, 'items'), {
                description,
                imageUrl,
                timestamp: serverTimestamp() // Firebase server timestamp for consistency
            });

            alert('Item posted successfully!');
            setDescription('');
            setImage(null);
        } catch (error) {
            console.error('Error posting item:', error);
            alert('Failed to post item. Please try again.');
        } finally {
            setLoading(false);  // Reset loading state
        }
    };

    return (
        <div className="post-item-page">
            <h2>Post a Lost/Found Item</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Enter item description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <input type="file" accept="image/*" onChange={handleImageChange} />
                
                {/* Disable button during upload for better UX */}
                <button type="submit" disabled={loading}>
                    {loading ? "Posting..." : "Post Item"}
                </button>
            </form>
        </div>
    );
};

export default PostItemPage;
