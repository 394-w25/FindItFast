import React, { useState } from 'react';
import { database, storage, useAuthState, uploadImage } from '../utilities/firebase';
import { ref, set } from 'firebase/database';
import './PostItemPage.css';

const GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const GEOCODING_API_KEY = 'AIzaSyB-d-ZlP2wvYgNwH7aTBNr3TKkx3J7UDBg';

const PostItemPage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [itemType, setItemType] = useState('lost'); // Dropdown for lost or found
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [zip, setZip] = useState('');
    const [loading, setLoading] = useState(false);
    const [user] = useAuthState();
    const [successMessage, setSuccessMessage] = useState(''); // New success message state

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
        }
    };

    const fetchCoordinates = async (address) => {
        const response = await fetch(`${GEOCODING_API_URL}?address=${encodeURIComponent(address)}&key=${GEOCODING_API_KEY}`);
        const data = await response.json();
        if (data.status === 'OK' && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            return { latitude: lat, longitude: lng };
        } else {
            throw new Error('Failed to fetch coordinates. Please check the address.');
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

        try {
            const fullAddress = `${street}, ${city}, ${state}, ${zip}`;
            const imageUrl = await uploadImage(image);
            const coordinates = await fetchCoordinates(fullAddress);
            const itemId = Date.now().toString();
            // Focusing only on found items for now
            // const itemPath = itemType === 'lost' ? 'lostItems' : 'foundItems';
            const itemPath = 'foundItems';

            await set(ref(database, `${itemPath}/${itemId}`), {
                title,
                description,
                imageUrl,
                postedBy: user.uid,
                timestamp: new Date().toISOString(),
                location: fullAddress,
                ...coordinates,
            });

            setSuccessMessage(`✅ Successfully posted a ${itemType} item!`);
            setTitle('');
            setDescription('');
            setImage(null);
            setStreet('');
            setCity('');
            setState('');
            setZip('');
        } catch (error) {
            console.error('Error posting item:', error);
            alert('Failed to post item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="post-item-page">
            <h2>Post a Found Item</h2>
            {successMessage && <p className="success-message">{successMessage}</p>} {/* Success message display */}
            <form onSubmit={handleSubmit}>
                {/* <select value={itemType} onChange={(e) => setItemType(e.target.value)}>
                    <option value="lost">Lost Item</option>
                    <option value="found">Found Item</option>
                </select> */}
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
                <div className="address-group">
                    <input type="text" placeholder="Street Address" value={street} onChange={(e) => setStreet(e.target.value)} required />
                    <input type="text" placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} required />
                    <input type="text" placeholder="State" value={state} onChange={(e) => setState(e.target.value)} required />
                    <input type="text" placeholder="Zip Code" value={zip} onChange={(e) => setZip(e.target.value)} required />
                </div>
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
