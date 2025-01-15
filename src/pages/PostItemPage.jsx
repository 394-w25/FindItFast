import React, { useState } from 'react';
import { database as db, storage } from '../utilities/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './PostItemPage.css'; // Import CSS here

const PostItemPage = () => {
    const [title, setTitle] = useState(''); // Added state for title
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false); // Added for better UX feedback

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (loading) return;

        if (!image || !description.trim() || !title.trim()) {
            alert('Please provide a title, description, and image.');
            return;
        }

        setLoading(true); 

        try {
            const imageRef = ref(storage, `images/${Date.now()}_${image.name}`);
            await uploadBytes(imageRef, image);
            const imageUrl = await getDownloadURL(imageRef);

            await addDoc(collection(db, 'items'), {
                title,
                description,
                imageUrl,
                timestamp: serverTimestamp() 
            });

            alert('Item posted successfully!');
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
            <form onSubmit={handleSubmit}>
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
                    {loading ? "Posting..." : "Post Item"}
                </button>
            </form>
        </div>
    );
};

export default PostItemPage;
