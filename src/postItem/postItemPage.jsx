import React, { useState } from 'react';
import { db, storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import './PostItemPage.css'; // Import CSS here


const PostItemPage = () => {
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!image || !description) {
            alert('Please provide an image and description.');
            return;
        }

        try {
            // Upload image to Firebase Storage
            const imageRef = ref(storage, `images/${image.name}`);
            await uploadBytes(imageRef, image);
            const imageUrl = await getDownloadURL(imageRef);

            // Store data in Firestore
            await addDoc(collection(db, 'items'), {
                description: description,
                imageUrl: imageUrl,
                timestamp: new Date()
            });

            alert('Item posted successfully!');
            setDescription('');
            setImage(null);
        } catch (error) {
            console.error('Error posting item:', error);
            alert('Failed to post item.');
        }
    };

    return (
        <div>
            <h2>Post a Lost/Found Item</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Enter item description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <input type="file" onChange={handleImageChange} />
                <button type="submit">Post Item</button>
            </form>
        </div>
    );
};

export default PostItemPage;
