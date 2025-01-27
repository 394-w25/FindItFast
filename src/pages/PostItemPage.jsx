import React, { useState, useRef, useEffect, useCallback } from 'react';
import { database, useAuthState, uploadImage } from '../utilities/firebase';
import { get, ref, set } from 'firebase/database';
import Webcam from 'react-webcam';
import { FaMapMarkerAlt, FaAddressCard, FaCamera, FaUpload, FaPaperPlane } from 'react-icons/fa';
import './PostItemPage.css';

const GEOCODING_API_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const GEOCODING_API_KEY = 'AIzaSyB-d-ZlP2wvYgNwH7aTBNr3TKkx3J7UDBg';

const PostItemPage = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null);
    const [itemType, setItemType] = useState('lost');
    const [useCurrentLocation, setUseCurrentLocation] = useState(true);
    const [locationStatus, setLocationStatus] = useState('');
    const [locationLoading, setLocationLoading] = useState(false);
    const [street, setStreet] = useState('');
    const [city, setCity] = useState('');
    const [stateAddr, setStateAddr] = useState('');
    const [zip, setZip] = useState('');
    const [loading, setLoading] = useState(false);
    const [user] = useAuthState();
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const [cameraPermission, setCameraPermission] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const webcamRef = useRef(null);
    const [cameraError, setCameraError] = useState('');

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setCapturedImage(null);
            // console.log("Imagen seleccionada:", file);
        }
    };



    const fetchCoordinates = async (address) => {
        // console.log("Obteniendo coordenadas para:", address);
        const response = await fetch(`${GEOCODING_API_URL}?address=${encodeURIComponent(address)}&key=${GEOCODING_API_KEY}`);
        const data = await response.json();
        // console.log("Respuesta de Geocoding:", data);
        if (data.status === 'OK' && data.results.length > 0) {
            const { lat, lng } = data.results[0].geometry.location;
            return { latitude: lat, longitude: lng };
        } else {
            throw new Error('Failed to fetch coordinates. Please check the address.');
        }
    };

    const getCurrentLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser.'));
                return;
            }
    
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    });
                },
                (error) => {
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            reject(new Error('Location permission denied.'));
                            break;
                        case error.POSITION_UNAVAILABLE:
                            reject(new Error('Location information unavailable.'));
                            break;
                        case error.TIMEOUT:
                            reject(new Error('Location request timed out.'));
                            break;
                        default:
                            reject(new Error('An unknown error occurred.'));
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user) {
            alert("You need to be logged in to post an item.");
            return;
        }

        if ((!image && !capturedImage) || !title.trim() || !description.trim()) {
            alert('Please provide a title, description, and an image.');
            return;
        }

        if (!useCurrentLocation) {
            if (!street.trim() || !city.trim() || !stateAddr.trim() || !zip.trim()) {
                alert('Please provide complete address information.');
                return;
            }
        }

        setLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            let coordinates = {};
            let fullAddress = '';

            if (useCurrentLocation) {
                coordinates = await getCurrentLocation();
                fullAddress = 'Current Location';
            } else {
                fullAddress = `${street}, ${city}, ${stateAddr}, ${zip}`;
                coordinates = await fetchCoordinates(fullAddress);
            }

            let imageUrl = '';
            if (capturedImage) {
                const blob = dataURLtoBlob(capturedImage);
                if (!blob) {
                    throw new Error('No se pudo convertir la imagen capturada a Blob.');
                }
               
                // Generate a unique file name using the current timestamp
                const uniqueFileName = `captured_image_${Date.now()}.jpg`;
                const file = new File([blob], uniqueFileName, { type: blob.type });

                imageUrl = await uploadImage(file);
            } else if (image) {
                imageUrl = await uploadImage(image);
            }

            const itemId = Date.now().toString();
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

            // Update the user's foundItems list
            const userRef = ref(database, `users/${user.uid}/foundItems`);
            const userSnapshot = await get(userRef);
            const currentFoundItems = userSnapshot.val() || [];

            await set(userRef, [...currentFoundItems, itemId]);

            setSuccessMessage(`✅ Successfully posted a ${itemType} item!`);
            // console.log("Ítem publicado exitosamente:", itemId);
            // Reinicia los campos del formulario
            setTitle('');
            setDescription('');
            setImage(null);
            setCapturedImage(null);
            setStreet('');
            setCity('');
            setStateAddr('');
            setZip('');
            setUseCurrentLocation(true);
        } catch (error) {
            // console.error('Error posting item:', error);
            setErrorMessage(error.message || 'Failed to post item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    function dataURLtoBlob(dataurl) {
        if (!dataurl) {
            throw new Error("La Data URL está vacía o es null.");
        }
        // console.log("data url ->", dataurl);

        const arr = dataurl.split(',');
        if (arr.length !== 2) {
            throw new Error("Formato de Data URL inválido.");
        }

        // console.log("arr ->", arr);
        const mimeMatch = arr[0].match(/:(.*?);/);
        if (!mimeMatch) {
            throw new Error("No se pudo determinar el MIME type de la Data URL.");
        }

        const mime = mimeMatch[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    // Función para capturar la foto usando react-webcam
    const capturePhoto = useCallback(() => {
        if (webcamRef.current) {
            const dataUrl = webcamRef.current.getScreenshot();
            if (dataUrl) {
                // console.log("Data URL capturada:", dataUrl);
                setCapturedImage(dataUrl);
                setIsCameraOpen(false);
            } else {
                setCameraError('Failed to capture image.');
                // console.error('Failed to capture image.');
            }
        }
    }, [webcamRef]);

    const handleCameraOpen = async () => {
        try {
            const permission = await navigator.mediaDevices.getUserMedia({ video: true });
            setCameraPermission(true);
            setIsCameraOpen(true);
            setCameraError('');
        } catch (error) {
            setCameraError('Camera access denied. Please enable in browser settings.');
            setCameraPermission(false);
        }
    };

    return (
        <div className="post-item-page">
            <h2>Post a found item</h2>
            {successMessage && <p className="success-message">{successMessage}</p>} {/* Muestra mensaje de éxito */}
            {errorMessage && <p className="error-message">{errorMessage}</p>} {/* Muestra mensaje de error */}
            <form onSubmit={handleSubmit}>
                {/* Opciones de ubicación */}
                <div className="location-mode-buttons">
                <button
                    type="button"
                    className={`location-button ${useCurrentLocation ? 'active' : ''}`}
                    onClick={async () => {
                        setUseCurrentLocation(true);
                        try {
                            setLocationLoading(true);
                            // Check permission first
                            const permission = await navigator.permissions.query({ name: 'geolocation' });
                            if (permission.state === 'denied') {
                                setLocationLoading(false);
                                setLocationStatus('Location access denied. Please enable in browser settings.');
                                return;
                            }
                            // If permission granted or prompt, try to get location
                            const coords = await getCurrentLocation();
                            setLocationLoading(false);
                            setLocationStatus(`Location obtained: ${coords.latitude.toFixed(4)}, ${coords.longitude.toFixed(4)}`);
                        } catch (error) {
                            setLocationLoading(false);
                            setLocationStatus('Error getting location: ' + error.message);
                        }
                    }}
                >
                    <FaMapMarkerAlt className={`icon ${locationLoading ? 'spinning' : ''}`} />
                    {locationLoading ? 'Getting Location...' : 'Use Current Location'}
                </button>
                    <button
                        type="button"
                        className={`location-button ${!useCurrentLocation ? 'active' : ''}`}
                        onClick={() => setUseCurrentLocation(false)}
                    >
                        <FaAddressCard className="icon" /> Enter Address Manually
                    </button>
                </div>
                {useCurrentLocation && locationStatus && (
                    <div className={`location-status ${locationStatus.includes('Error') ? 'error' : 'success'}`}>
                        {locationStatus}
                    </div>
                )}

                {/* Campos de dirección manual */}
                {!useCurrentLocation && (
                    <div className="address-group">
                        <input
                            type="text"
                            placeholder="Street Address"
                            value={street}
                            onChange={(e) => setStreet(e.target.value)}
                            className="input-field"
                            required={!useCurrentLocation}
                        />
                        <input
                            type="text"
                            placeholder="City"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="input-field"
                            required={!useCurrentLocation}
                        />
                        <input
                            type="text"
                            placeholder="State"
                            value={stateAddr}
                            onChange={(e) => setStateAddr(e.target.value)}
                            className="input-field"
                            required={!useCurrentLocation}
                        />
                        <input
                            type="text"
                            placeholder="Zip Code"
                            value={zip}
                            onChange={(e) => setZip(e.target.value)}
                            className="input-field"
                            required={!useCurrentLocation}
                        />
                    </div>
                )}

                {/* Opciones de imagen */}
                <div className="image-input-options">
                    <div className="image-mode-buttons">
                        <button
                            type="button"
                            onClick={handleCameraOpen}
                            className="image-button"
                        >
                            <FaCamera className="icon" /> Take Photo
                        </button>
                        <label className="image-button upload-label">
                            <FaUpload className="icon" /> Upload from Device
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>
                    {cameraError && <div className="location-status error">{cameraError}</div>}
                    {/* Muestra el componente react-webcam si la cámara está abierta */}
                    {isCameraOpen && (
                        <div className="camera-container">
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={{
                                    facingMode: 'environment',
                                }}
                                className="video-stream"
                                onUserMediaError={(err) => {
                                    setCameraError('Camera access denied. Please enable in browser settings.');
                                    setCameraPermission(false);
                                }}
                            />
                            <div className="camera-buttons">
                                <button
                                    type="button"
                                    onClick={capturePhoto}
                                    className="capture-button"
                                >
                                    Capture Photo
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsCameraOpen(false);
                                        setCameraError('');
                                    }}
                                    className="close-camera-button"
                                >
                                    Cancel
                                </button>
                            </div>
                            {cameraError && <div className="location-status error">{cameraError}</div>}
                        </div>
                    )}
                    {capturedImage && (
                        <div className="image-preview">
                            <img src={capturedImage} alt="Captured" />
                            <button type="button" onClick={() => setCapturedImage(null)} className="remove-image-button">
                                Remove
                            </button>
                        </div>
                    )}

                    {image && !capturedImage && (
                        <div className="image-preview">
                            <img src={URL.createObjectURL(image)} alt="Uploaded" />
                            <button type="button" onClick={() => setImage(null)} className="remove-image-button">
                                Remove
                            </button>
                        </div>
                    )}
                </div>

                <input
                    type="text"
                    placeholder="Enter item title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="input-field"
                    required
                />
                <textarea
                    placeholder="Enter item description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="textarea-field"
                    required
                />

                <button type="submit" className="submit-button" disabled={loading}>
                    <FaPaperPlane className="icon" /> {loading ? "Posting..." : `Post ${itemType} Item`}
                </button>
            </form>
        </div>
    );

};

export default PostItemPage;
