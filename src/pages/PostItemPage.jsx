import React, { useState } from 'react';
import { database, storage, useAuthState, uploadImage } from '../utilities/firebase';
import { ref, set } from 'firebase/database';
import './PostItemPage.css';

const PostItemPage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [itemType, setItemType] = useState('lost'); // Dropdown for lost or found
    const [loading, setLoading] = useState(false);
    const [user] = useAuthState(); 
    const [successMessage, setSuccessMessage] = useState(''); // New success message state

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert("You need to be logged in to post an item.");
            return;
        }

        if (!title.trim() || !image || !description.trim()) {
            alert('Please provide a title, description, and an image.');
            return;
        }

        setLoading(true);
        setSuccessMessage(''); // Clear previous success message

        try {
            const imageUrl = await uploadImage(image);
            const itemId = Date.now().toString();
            const itemPath = itemType === 'lost' ? 'lostItems' : 'foundItems';

            await set(ref(database, `${itemPath}/${itemId}`), {
                title,
                description,
                imageUrl,
                postedBy: user.email,
                timestamp: new Date().toISOString()
            });

            setSuccessMessage(`✅ Successfully posted a ${itemType} item!`);
            setTitle('');
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
            {successMessage && <p className="success-message">{successMessage}</p>} {/* Success message display */}
            <form onSubmit={handleSubmit}>
                <select value={itemType} onChange={(e) => setItemType(e.target.value)}>
                    <option value="lost">Lost Item</option>
                    <option value="found">Found Item</option>
                </select>
                <input
                    type="text"
                    placeholder="Enter item title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Enter item description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange} 
                    required 
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Posting..." : `Post ${itemType} Item`}
                </button>
            </form>
        </div>
    );
};

export default PostItemPage;
